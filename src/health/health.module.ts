import { Module } from "@nestjs/common"
import { TerminusModule } from "@nestjs/terminus"
import { HttpModule } from "@nestjs/common"
import { HealthController } from "./health.controller"

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
