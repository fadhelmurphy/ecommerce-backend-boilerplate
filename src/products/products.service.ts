import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { Product } from "./entities/product.entity"
import { Category } from "./entities/category.entity"
import type { CreateProductDto } from "./dto/create-product.dto"
import type { UpdateProductDto } from "./dto/update-product.dto"
import type { SearchService } from "../search/search.service"

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private searchService: SearchService,
  ) {}

  async findAll(query: any = {}): Promise<Product[]> {
    const { category, minPrice, maxPrice, sort, limit = 10, page = 1 } = query

    const queryBuilder = this.productRepository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.category", "category")
      .where("product.isActive = :isActive", { isActive: true })

    if (category) {
      queryBuilder.andWhere("category.id = :categoryId", { categoryId: category })
    }

    if (minPrice) {
      queryBuilder.andWhere("product.price >= :minPrice", { minPrice })
    }

    if (maxPrice) {
      queryBuilder.andWhere("product.price <= :maxPrice", { maxPrice })
    }

    if (sort) {
      const [field, order] = sort.split(":")
      queryBuilder.orderBy(`product.${field}`, order.toUpperCase())
    } else {
      queryBuilder.orderBy("product.createdAt", "DESC")
    }

    queryBuilder.skip((page - 1) * limit).take(limit)

    return queryBuilder.getMany()
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
      relations: ["category"],
    })

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`)
    }

    return product
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const category = await this.categoryRepository.findOne({
      where: { id: createProductDto.categoryId },
    })

    if (!category) {
      throw new NotFoundException(`Category with ID ${createProductDto.categoryId} not found`)
    }

    const product = this.productRepository.create({
      ...createProductDto,
      category,
    })

    const savedProduct = await this.productRepository.save(product)

    // Index product in Elasticsearch
    await this.searchService.indexProduct(savedProduct)

    return savedProduct
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id)

    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoryId },
      })

      if (!category) {
        throw new NotFoundException(`Category with ID ${updateProductDto.categoryId} not found`)
      }

      product.category = category
    }

    Object.assign(product, updateProductDto)

    const updatedProduct = await this.productRepository.save(product)

    // Update product in Elasticsearch
    await this.searchService.updateProduct(updatedProduct)

    return updatedProduct
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id)

    // Soft delete - just mark as inactive
    product.isActive = false
    await this.productRepository.save(product)

    // Remove from Elasticsearch
    await this.searchService.removeProduct(id)
  }

  async decreaseStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id)

    if (product.stock < quantity) {
      throw new Error("Insufficient stock")
    }

    product.stock -= quantity
    return this.productRepository.save(product)
  }
}
