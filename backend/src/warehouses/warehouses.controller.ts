import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators';
import { RoleType } from '../common/enums';

@ApiTags('Warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @ApiOperation({ summary: 'List all warehouses with stock metrics' })
  @ApiResponse({ status: 200, description: 'List of warehouses' })
  async findAll() {
    return this.warehousesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warehouse details by ID or code' })
  @ApiResponse({ status: 200, description: 'Warehouse details' })
  async findOne(@Param('id') id: string) {
    return this.warehousesService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleType.WAREHOUSE_MANAGER, RoleType.ADMIN)
  @ApiOperation({ summary: 'Update warehouse properties' })
  @ApiResponse({ status: 200, description: 'Warehouse updated' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateWarehouseDto) {
    return this.warehousesService.update(id, updateDto);
  }

  @Get(':id/inventory')
  @ApiOperation({ summary: 'Get warehouse inventory items' })
  @ApiResponse({ status: 200, description: 'List of items in warehouse' })
  async getInventory(@Param('id') id: string) {
    return this.warehousesService.getWarehouseInventory(id);
  }

  @Get(':id/convoys')
  @ApiOperation({ summary: 'Get convoys originating from warehouse' })
  @ApiResponse({ status: 200, description: 'List of convoys' })
  async getConvoys(@Param('id') id: string) {
    return this.warehousesService.getWarehouseConvoys(id);
  }
}
