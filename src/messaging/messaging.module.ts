import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { MessagingService } from "./messaging.service"
import { RabbitMQModule } from "@golevelup/nestjs-rabbitmq"

@Module({
  imports: [
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("rabbitmq.url"),
        exchanges: [
          {
            name: "ecommerce",
            type: "topic",
          },
        ],
        enableControllerDiscovery: true,
        connectionInitOptions: { wait: true },
      }),
    }),
  ],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
