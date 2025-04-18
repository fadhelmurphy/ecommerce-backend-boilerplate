import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { OrdersController } from "./orders.controller"
import { OrdersService } from "./orders.service"
import { Order } from "./entities/order.entity"
import { OrderItem } from "./entities/order-item.entity"
import { ProductsModule } from "../products/products.module"
import { MessagingModule } from "../messaging/messaging.module"
import { PaymentModule } from "../payment/payment.module"

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), ProductsModule, MessagingModule, PaymentModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
