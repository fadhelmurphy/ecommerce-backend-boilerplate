import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ProductsController } from "./products.controller"
import { ProductsService } from "./products.service"
import { Product } from "./entities/product.entity"
import { Category } from "./entities/category.entity"
import { SearchModule } from "../search/search.module"

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category]), SearchModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
