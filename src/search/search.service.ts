import { Injectable, Logger } from "@nestjs/common"
import type { ElasticsearchService } from "@nestjs/elasticsearch"
import type { Product } from "../products/entities/product.entity"

@Injectable()
export class SearchService {
  private readonly index = "products"
  private readonly logger = new Logger(SearchService.name)

  constructor(private readonly elasticsearchService: ElasticsearchService) {
    this.createIndex()
  }

  private async createIndex() {
    try {
      const indexExists = await this.elasticsearchService.indices.exists({
        index: this.index,
      })

      if (!indexExists) {
        await this.elasticsearchService.indices.create({
          index: this.index,
          body: {
            mappings: {
              properties: {
                id: { type: "keyword" },
                name: { type: "text" },
                description: { type: "text" },
                price: { type: "float" },
                category: { type: "keyword" },
                attributes: { type: "object" },
                isActive: { type: "boolean" },
              },
            },
          },
        })
        this.logger.log(`Created index: ${this.index}`)
      }
    } catch (error) {
      this.logger.error(`Error creating index: ${error.message}`)
    }
  }

  async indexProduct(product: Product) {
    try {
      const payload = this.buildProductDocument(product)

      await this.elasticsearchService.index({
        index: this.index,
        id: product.id,
        body: payload,
      })

      this.logger.log(`Indexed product: ${product.id}`)
    } catch (error) {
      this.logger.error(`Error indexing product: ${error.message}`)
    }
  }

  async updateProduct(product: Product) {
    try {
      const payload = this.buildProductDocument(product)

      await this.elasticsearchService.update({
        index: this.index,
        id: product.id,
        body: {
          doc: payload,
        },
      })

      this.logger.log(`Updated product in index: ${product.id}`)
    } catch (error) {
      this.logger.error(`Error updating product in index: ${error.message}`)
    }
  }

  async removeProduct(productId: string) {
    try {
      await this.elasticsearchService.delete({
        index: this.index,
        id: productId,
      })

      this.logger.log(`Removed product from index: ${productId}`)
    } catch (error) {
      this.logger.error(`Error removing product from index: ${error.message}`)
    }
  }

  async search(query: string, options: any = {}) {
    const { from = 0, size = 10, minPrice, maxPrice, category } = options

    const must = [
      {
        multi_match: {
          query,
          fields: ["name^3", "description"],
          fuzziness: "AUTO",
        },
      },
      {
        term: {
          isActive: true,
        },
      },
    ]

    if (category) {
      must.push({
        term: {
          "category.keyword": category,
        },
      })
    }

    const filter = []

    if (minPrice || maxPrice) {
      const range: any = {}

      if (minPrice) {
        range.gte = minPrice
      }

      if (maxPrice) {
        range.lte = maxPrice
      }

      filter.push({
        range: {
          price: range,
        },
      })
    }

    const { body } = await this.elasticsearchService.search({
      index: this.index,
      body: {
        from,
        size,
        query: {
          bool: {
            must,
            filter,
          },
        },
        sort: [{ _score: { order: "desc" } }, { price: { order: "asc" } }],
      },
    })

    const hits = body.hits.hits
    const total = body.hits.total.value

    return {
      hits: hits.map((item) => ({
        id: item._id,
        ...item._source,
        score: item._score,
      })),
      total,
    }
  }

  private buildProductDocument(product: Product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category?.name,
      categoryId: product.category?.id,
      attributes: product.attributes,
      isActive: product.isActive,
      stock: product.stock,
      sku: product.sku,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }
  }
}
