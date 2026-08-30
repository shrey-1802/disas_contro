import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/vehicles.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators';
import { RoleType } from '../common/enums';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'List fleet vehicles with status & refrigeration flags' })
  @ApiQuery({ name: 'availableOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'refrigeratedOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of vehicles' })
  async findAll(
    @Query('availableOnly') availableOnly?: boolean,
    @Query('refrigeratedOnly') refrigeratedOnly?: boolean,
  ) {
    return this.vehiclesService.findAll(availableOnly, refrigeratedOnly);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle details' })
  @ApiResponse({ status: 200, description: 'Vehicle details' })
  async findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  @Roles(RoleType.WAREHOUSE_MANAGER, RoleType.ADMIN)
  @ApiOperation({ summary: 'Register new fleet vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle registered' })
  async create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }
}
