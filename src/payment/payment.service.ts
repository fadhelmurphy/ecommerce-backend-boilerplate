import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import * as crypto from "crypto"

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name)
  private readonly apiUrl: string
  private readonly serverKey: string
  private readonly clientKey: string
  private readonly isProduction: boolean

  constructor(private configService: ConfigService) {
    this.isProduction = this.configService.get<string>("NODE_ENV") === "production"
    this.apiUrl = this.isProduction ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com"
    this.serverKey = this.configService.get<string>("MIDTRANS_SERVER_KEY")
    this.clientKey = this.configService.get<string>("MIDTRANS_CLIENT_KEY")
  }

  async createPaymentIntent(data: {
    amount: number
    orderId: string
    customerDetails: {
      firstName: string
      lastName: string
      email: string
      phone: string
    }
    itemDetails: Array<{
      id: string
      name: string
      price: number
      quantity: number
    }>
    metadata?: Record<string, string>
  }) {
    try {
      const payload = {
        transaction_details: {
          order_id: data.orderId,
          gross_amount: data.amount,
        },
        customer_details: {
          first_name: data.customerDetails.firstName,
          last_name: data.customerDetails.lastName,
          email: data.customerDetails.email,
          phone: data.customerDetails.phone,
        },
        item_details: data.itemDetails,
        metadata: data.metadata,
      }

      const response = await fetch(`${this.apiUrl}/v2/charge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(`${this.serverKey}:`).toString("base64")}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${await response.text()}`)
      }

      const responseData = await response.json()
      this.logger.log(`Created payment intent for order: ${data.orderId}`)
      return responseData
    } catch (error) {
      this.logger.error(`Error creating payment intent: ${error.message}`)
      throw error
    }
  }

  async getPaymentStatus(orderId: string) {
    try {
      const response = await fetch(`${this.apiUrl}/v2/${orderId}/status`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(`${this.serverKey}:`).toString("base64")}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${await response.text()}`)
      }

      return response.json()
    } catch (error) {
      this.logger.error(`Error retrieving payment status: ${error.message}`)
      throw error
    }
  }

  async refundPayment(orderId: string, amount?: number) {
    try {
      const payload = {
        refund_key: `refund-${orderId}-${Date.now()}`,
        amount: amount,
        reason: "Customer requested refund",
      }

      const response = await fetch(`${this.apiUrl}/v2/${orderId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(`${this.serverKey}:`).toString("base64")}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${await response.text()}`)
      }

      const responseData = await response.json()
      this.logger.log(`Refunded payment for order: ${orderId}`)
      return responseData
    } catch (error) {
      this.logger.error(`Error refunding payment: ${error.message}`)
      throw error
    }
  }

  async cancelPayment(orderId: string) {
    try {
      const response = await fetch(`${this.apiUrl}/v2/${orderId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(`${this.serverKey}:`).toString("base64")}`,
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${await response.text()}`)
      }

      const responseData = await response.json()
      this.logger.log(`Cancelled payment for order: ${orderId}`)
      return responseData
    } catch (error) {
      this.logger.error(`Error cancelling payment: ${error.message}`)
      throw error
    }
  }

  verifyWebhookSignature(requestBody: any, signatureKey: string, signatureReceived: string): boolean {
    try {
      const stringToSign = `${requestBody.order_id}${requestBody.status_code}${requestBody.gross_amount}${this.serverKey}`
      const signature = crypto.createHash("sha512").update(stringToSign).digest("hex")

      return signature === signatureReceived
    } catch (error) {
      this.logger.error(`Error verifying webhook signature: ${error.message}`)
      return false
    }
  }

  getSnapToken(orderId: string) {
    return {
      token: this.clientKey,
      orderId,
      redirectUrl: `${this.apiUrl}/snap/v2/vtweb/${orderId}`,
    }
  }
}
