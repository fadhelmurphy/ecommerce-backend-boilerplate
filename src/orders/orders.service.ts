import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { Order } from "./entities/order.entity"
import { OrderItem } from "./entities/order-item.entity"
import type { CreateOrderDto } from "./dto/create-order.dto"
import type { UpdateOrderStatusDto } from "./dto/update-order-status.dto"
import type { ProductsService } from "../products/products.service"
import type { MessagingService } from "../messaging/messaging.service"
import type { PaymentService } from "../payment/payment.service"
import { OrderStatus } from "./enums/order-status.enum"
import { PaymentStatus } from "./enums/payment-status.enum"

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private productsService: ProductsService,
    private messagingService: MessagingService,
    private paymentService: PaymentService,
  ) {}

  async findAll(userId?: string): Promise<Order[]> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.items", "items")
      .leftJoinAndSelect("items.product", "product")

    if (userId) {
      queryBuilder.where("order.userId = :userId", { userId })
    }

    queryBuilder.orderBy("order.createdAt", "DESC")

    return queryBuilder.getMany()
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ["items", "items.product", "user"],
    })

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`)
    }

    return order
  }

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const { items, shippingAddress, billingAddress } = createOrderDto

    // Calculate order totals
    let subtotal = 0
    const orderItems: OrderItem[] = []
    const itemDetails = []

    for (const item of items) {
      const product = await this.productsService.findOne(item.productId)

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product: ${product.name}`)
      }

      const total = product.price * item.quantity
      subtotal += total

      const orderItem = this.orderItemRepository.create({
        product,
        quantity: item.quantity,
        price: product.price,
        total,
      })

      orderItems.push(orderItem)

      // Add item details for Midtrans
      itemDetails.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      })

      // Decrease product stock
      await this.productsService.decreaseStock(product.id, item.quantity)

      // Publish stock changed event
      await this.messagingService.publishProductStockChanged(product.id, product.stock - item.quantity)
    }

    // Calculate tax and shipping
    const tax = subtotal * 0.1 // 10% tax
    const shipping = subtotal > 100 ? 0 : 10 // Free shipping for orders over $100
    const total = subtotal + tax + shipping

    // Create order
    const order = this.orderRepository.create({
      user: { id: userId },
      items: orderItems,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
    })

    const savedOrder = await this.orderRepository.save(order)

    // Create payment intent with Midtrans
    const user = savedOrder.user
    const paymentIntent = await this.paymentService.createPaymentIntent({
      amount: Math.round(total),
      orderId: savedOrder.id,
      customerDetails: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        email: user.email,
        phone: shippingAddress.phone,
      },
      itemDetails,
      metadata: {
        userId,
      },
    })

    // Update order with payment information
    savedOrder.paymentIntentId = paymentIntent.transaction_id
    await this.orderRepository.save(savedOrder)

    // Publish order created event
    await this.messagingService.publishOrderCreated(savedOrder)

    // Send notification to user
    await this.messagingService.publishNotification(
      userId,
      `Your order #${savedOrder.id} has been placed successfully.`,
      "order_created",
    )

    return savedOrder
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id)

    order.status = updateOrderStatusDto.status

    if (updateOrderStatusDto.trackingNumber) {
      order.trackingNumber = updateOrderStatusDto.trackingNumber
    }

    const updatedOrder = await this.orderRepository.save(order)

    // Publish order status changed event
    await this.messagingService.publishOrderStatusChanged(id, updateOrderStatusDto.status)

    // Send notification to user
    await this.messagingService.publishNotification(
      order.user.id,
      `Your order #${order.id} status has been updated to ${updateOrderStatusDto.status}.`,
      "order_status_changed",
    )

    return updatedOrder
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order> {
    const order = await this.findOne(id)

    order.paymentStatus = paymentStatus

    if (paymentStatus === PaymentStatus.PAID) {
      order.status = OrderStatus.PROCESSING
    } else if (paymentStatus === PaymentStatus.REFUNDED) {
      order.status = OrderStatus.REFUNDED
    }

    const updatedOrder = await this.orderRepository.save(order)

    // Publish order status changed event
    await this.messagingService.publishOrderStatusChanged(id, order.status)

    // Send notification to user
    await this.messagingService.publishNotification(
      order.user.id,
      `Payment for your order #${order.id} has been ${paymentStatus}.`,
      "payment_status_changed",
    )

    return updatedOrder
  }

  async cancel(id: string): Promise<Order> {
    const order = await this.findOne(id)

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException(`Cannot cancel order with status: ${order.status}`)
    }

    order.status = OrderStatus.CANCELLED

    // Restore product stock
    for (const item of order.items) {
      await this.productsService.update(item.product.id, {
        stock: item.product.stock + item.quantity,
      })

      // Publish stock changed event
      await this.messagingService.publishProductStockChanged(item.product.id, item.product.stock + item.quantity)
    }

    // Cancel payment if not paid
    if (order.paymentStatus === PaymentStatus.PENDING) {
      await this.paymentService.cancelPayment(order.id)
      order.paymentStatus = PaymentStatus.FAILED
    }
    // Refund payment if paid
    else if (order.paymentStatus === PaymentStatus.PAID) {
      await this.paymentService.refundPayment(order.paymentIntentId)
      order.paymentStatus = PaymentStatus.REFUNDED
    }

    const cancelledOrder = await this.orderRepository.save(order)

    // Publish order status changed event
    await this.messagingService.publishOrderStatusChanged(id, OrderStatus.CANCELLED)

    // Send notification to user
    await this.messagingService.publishNotification(
      order.user.id,
      `Your order #${order.id} has been cancelled.`,
      "order_cancelled",
    )

    return cancelledOrder
  }
}
