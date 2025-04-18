import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ProductsModule } from "./products/products.module"
import { UsersModule } from "./users/users.module"
import { AuthModule } from "./auth/auth.module"
import { OrdersModule } from "./orders/orders.module"
import { CartModule } from "./cart/cart.module"
import { PaymentModule } from "./payment/payment.module"
import { SearchModule } from "./search/search.module"
import { MessagingModule } from "./messaging/messaging.module"
import { HealthModule } from "./health/health.module"
import configuration from "./config/configuration"

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("database.host"),
        port: configService.get<number>("database.port"),
        username: configService.get<string>("database.username"),
        password: configService.get<string>("database.password"),
        database: configService.get<string>("database.name"),
        entities: ["dist/**/*.entity{.ts,.js}"],
        synchronize: configService.get<boolean>("database.synchronize"),
        ssl: configService.get<boolean>("database.ssl"),
      }),
    }),

    // Feature modules
    ProductsModule,
    UsersModule,
    AuthModule,
    OrdersModule,
    CartModule,
    PaymentModule,
    SearchModule,
    MessagingModule,
    HealthModule,
  ],
})
export class AppModule {}
