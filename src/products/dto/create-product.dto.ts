import { IsNotEmpty, IsString, IsNumber, IsPositive, IsOptional, IsArray, IsUUID } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class CreateProductDto {
  @ApiProperty({ example: "Smartphone X" })
  @IsNotEmpty()
  @IsString()
  name: string

  @ApiProperty({ example: "Latest smartphone with amazing features" })
  @IsNotEmpty()
  @IsString()
  description: string

  @ApiProperty({ example: 999.99 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number

  @ApiProperty({ example: 100 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  stock: number

  @ApiProperty({ example: ["image1.jpg", "image2.jpg"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @ApiProperty({ example: { color: "black", size: "medium" } })
  @IsOptional()
  attributes?: Record<string, any>

  @ApiProperty({ example: 0.5 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number

  @ApiProperty({ example: "SKU-12345" })
  @IsOptional()
  @IsString()
  sku?: string

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string
}
