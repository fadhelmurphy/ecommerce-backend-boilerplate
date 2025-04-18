import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"
import * as helmet from "helmet"
import * as compression from "compression"
import { ConfigService } from "@nestjs/config"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  // Security middleware
  app.use(helmet())

  // Compression
  app.use(compression())

  // CORS
  app.enableCors()

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("E-commerce API")
    .setDescription("E-commerce backend API documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api/docs", app, document)

  const port = configService.get<number>("PORT") || 3000
  await app.listen(port)
  console.log(`Application is running on: ${await app.getUrl()}`)
}
bootstrap()
