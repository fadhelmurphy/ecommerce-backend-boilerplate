import { Injectable, Logger } from "@nestjs/common"
import type { AmqpConnection } from "@golevelup/nestjs-rabbitmq"
import type { ConfigService } from "@nestjs/config"

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name)
  private readonly exchange = "ecommerce"

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly configService: ConfigService,
  ) {}

  async publishOrderCreated(order: any) {
    try {
      await this.amqpConnection.publish(this.exchange, "orders.created", order)
      this.logger.log(`Published order created event: ${order.id}`)
    } catch (error) {
      this.logger.error(`Error publishing order created event: ${error.message}`)
    }
  }

  async publishOrderStatusChanged(orderId: string, status: string) {
    try {
      await this.amqpConnection.publish(this.exchange, "orders.status_changed", { orderId, status })
      this.logger.log(`Published order status changed event: ${orderId} -> ${status}`)
    } catch (error) {
      this.logger.error(`Error publishing order status changed event: ${error.message}`)
    }
  }

  async publishNotification(userId: string, message: string, type: string) {
    try {
      await this.amqpConnection.publish(this.exchange, "notifications.send", {
        userId,
        message,
        type,
        timestamp: new Date(),
      })
      this.logger.log(`Published notification for user: ${userId}`)
    } catch (error) {
      this.logger.error(`Error publishing notification: ${error.message}`)
    }
  }

  async publishProductStockChanged(productId: string, stock: number) {
    try {
      await this.amqpConnection.publish(this.exchange, "products.stock_changed", {
        productId,
        stock,
        timestamp: new Date(),
      })
      this.logger.log(`Published product stock changed event: ${productId} -> ${stock}`)
    } catch (error) {
      this.logger.error(`Error publishing product stock changed event: ${error.message}`)
    }
  }
}
