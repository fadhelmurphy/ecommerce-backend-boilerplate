import { Module } from "@nestjs/common"
import { ElasticsearchModule } from "@nestjs/elasticsearch"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { SearchService } from "./search.service"
import { SearchController } from "./search.controller"

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        node: configService.get<string>("elasticsearch.node"),
      }),
    }),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
