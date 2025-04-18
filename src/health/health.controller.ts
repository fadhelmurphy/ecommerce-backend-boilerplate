import { Controller, Get } from "@nestjs/common"
import {
  type HealthCheckService,
  type TypeOrmHealthIndicator,
  HealthCheck,
  type MemoryHealthIndicator,
  type DiskHealthIndicator,
} from "@nestjs/terminus"
import { ApiTags, ApiOperation } from "@nestjs/swagger"

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Check service health" })
  check() {
    return this.health.check([
      () => this.db.pingCheck("database"),
      () => this.memory.checkHeap("memory_heap", 200 * 1024 * 1024),
      () => this.disk.checkStorage("disk", { thresholdPercent: 0.9, path: "/" }),
    ])
  }
}
