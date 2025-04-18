import { Controller, Post, Body, Get, Param, Headers, HttpStatus, HttpCode } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import type { PaymentService } from "./payment.service"
import type { OrdersService } from "../orders/orders.service"
import { PaymentStatus } from "../orders/enums/payment-status.enum"

@ApiTags("payment")
@Controller("payment")
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Handle Midtrans webhook notifications" })
  @ApiResponse({ status: 200, description: "Webhook processed successfully." })
  async handleWebhook(@Body() payload: any, @Headers("x-signature") signature: string) {
    // Verify webhook signature
    const isValid = this.paymentService.verifyWebhookSignature(payload, null, signature)

    if (!isValid) {
      return { status: "error", message: "Invalid signature" }
    }

    const { order_id, transaction_status } = payload

    // Map Midtrans transaction status to our payment status
    let paymentStatus: PaymentStatus
    switch (transaction_status) {
      case "capture":
      case "settlement":
        paymentStatus = PaymentStatus.PAID
        break
      case "deny":
      case "expire":
      case "cancel":
        paymentStatus = PaymentStatus.FAILED
        break
      case "refund":
        paymentStatus = PaymentStatus.REFUNDED
        break
      default:
        paymentStatus = PaymentStatus.PENDING
    }

    // Update order payment status
    await this.ordersService.updatePaymentStatus(order_id, paymentStatus)

    return { status: "success" }
  }

  @Get("status/:orderId")
  @ApiOperation({ summary: "Get payment status" })
  @ApiResponse({ status: 200, description: "Return payment status." })
  async getPaymentStatus(@Param("orderId") orderId: string) {
    return this.paymentService.getPaymentStatus(orderId)
  }

  @Post("refund/:orderId")
  @ApiOperation({ summary: "Refund payment" })
  @ApiResponse({ status: 200, description: "Payment refunded successfully." })
  async refundPayment(@Param("orderId") orderId: string, @Body() body: { amount?: number }) {
    const result = await this.paymentService.refundPayment(orderId, body.amount)

    // Update order payment status
    await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.REFUNDED)

    return result
  }

  @Post("cancel/:orderId")
  @ApiOperation({ summary: "Cancel payment" })
  @ApiResponse({ status: 200, description: "Payment cancelled successfully." })
  async cancelPayment(@Param("orderId") orderId: string) {
    const result = await this.paymentService.cancelPayment(orderId)
    
    // Update order payment status
    await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.FAILED)
    
    return result
  }

  @Get("snap-token/:orderId")
  @ApiOperation({ summary: "Get Snap token for frontend integration" })
  @ApiResponse({ status: 200, description: "Return Snap token." })
  async getSnapToken(@Param("orderId") orderId: string) {
    return this.paymentService.getSnapToken(orderId)
  }
}
