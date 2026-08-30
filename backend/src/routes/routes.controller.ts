import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { CalculateRouteDto } from './dto/routes.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Routes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @ApiOperation({ summary: 'List all routes with hazard status' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'List of routes' })
  async findAll(@Query('status') status?: string) {
    return this.routesService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get route details and segment breakdown' })
  @ApiResponse({ status: 200, description: 'Route details' })
  async findOne(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate safest route through hazard cost graph' })
  @ApiResponse({ status: 200, description: 'Safest calculated path' })
  async calculateRoute(@Body() dto: CalculateRouteDto) {
    return this.routesService.calculateRoute(dto);
  }

  @Get(':id/risk')
  @ApiOperation({ summary: 'Get operational risk assessment for route' })
  @ApiResponse({ status: 200, description: 'Route risk assessment' })
  async getRisk(@Param('id') id: string) {
    return this.routesService.getRouteRisk(id);
  }
}
