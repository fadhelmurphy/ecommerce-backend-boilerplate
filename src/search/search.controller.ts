import { Controller, Get, Query } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import type { SearchService } from "./search.service"

@ApiTags("search")
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: "Search products" })
  @ApiResponse({ status: 200, description: "Return search results." })
  async search(
    @Query('q') query: string,
    @Query('from') from: number,
    @Query('size') size: number,
    @Query('minPrice') minPrice: number,
    @Query('maxPrice') maxPrice: number,
    @Query('category') category: string,
  ) {
    return this.searchService.search(query, {
      from,
      size,
      minPrice,
      maxPrice,
      category,
    })
  }
}
