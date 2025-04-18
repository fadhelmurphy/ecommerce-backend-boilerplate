import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { Cart } from "./entities/cart.entity"
import { CartItem } from "./entities/cart-item.entity"
import type { AddToCartDto } from "./dto/add-to-cart.dto"
import type { UpdateCartItemDto } from "./dto/update-cart-item.dto"
import type { ProductsService } from "../products/products.service"

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private productsService: ProductsService,
  ) {}

  async getCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: ["items", "items.product"],
    })

    if (!cart) {
      // Create a new cart if none exists
      return this.cartRepository.save(
        this.cartRepository.create({
          user: { id: userId },
          items: [],
        }),
      )
    }

    return cart
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, quantity } = addToCartDto

    // Validate product
    const product = await this.productsService.findOne(productId)

    if (product.stock < quantity) {
      throw new BadRequestException(`Insufficient stock for product: ${product.name}`)
    }

    // Get or create cart
    const cart = await this.getCart(userId)

    // Check if product already in cart
    const existingItem = cart.items.find((item) => item.product.id === productId)

    if (existingItem) {
      // Update quantity if product already in cart
      existingItem.quantity += quantity
      await this.cartItemRepository.save(existingItem)
    } else {
      // Add new item to cart
      const cartItem = this.cartItemRepository.create({
        cart,
        product,
        quantity,
      })

      cart.items.push(await this.cartItemRepository.save(cartItem))
    }

    return this.cartRepository.save(cart)
  }

  async updateCartItem(userId: string, itemId: string, updateCartItemDto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getCart(userId)

    const cartItem = cart.items.find((item) => item.id === itemId)

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`)
    }

    if (updateCartItemDto.quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await this.cartItemRepository.remove(cartItem)
      cart.items = cart.items.filter((item) => item.id !== itemId)
    } else {
      // Validate stock
      const product = await this.productsService.findOne(cartItem.product.id)

      if (product.stock < updateCartItemDto.quantity) {
        throw new BadRequestException(`Insufficient stock for product: ${product.name}`)
      }

      // Update quantity
      cartItem.quantity = updateCartItemDto.quantity
      await this.cartItemRepository.save(cartItem)
    }

    return this.cartRepository.save(cart)
  }

  async removeCartItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId)

    const cartItem = cart.items.find((item) => item.id === itemId)

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`)
    }

    await this.cartItemRepository.remove(cartItem)

    cart.items = cart.items.filter((item) => item.id !== itemId)

    return this.cartRepository.save(cart)
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getCart(userId)

    await this.cartItemRepository.remove(cart.items)

    cart.items = []

    return this.cartRepository.save(cart)
  }
}
