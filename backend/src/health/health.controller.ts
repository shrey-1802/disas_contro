import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is operational' })
  async check() {
    let dbStatus = 'UP';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'DEGRADED';
    }

    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Disaster Relief Logistics Platform',
      version: '1.0.0',
      database: dbStatus,
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
