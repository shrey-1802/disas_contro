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
import { InventoryService } from './inventory.service';
import {
  ReserveInventoryDto,
  ReleaseInventoryDto,
  AdjustInventoryDto,
  TransferInventoryDto,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { RoleType } from '../common/enums';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory items with optional warehouse or category filters' })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiResponse({ status: 200, description: 'List of inventory items' })
  async findAll(
    @Query('warehouseId') warehouseId?: string,
    @Query('category') category?: string,
  ) {
    return this.inventoryService.findAll(warehouseId, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single inventory item with transaction history' })
  @ApiResponse({ status: 200, description: 'Inventory item details' })
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Post('reserve')
  @Roles(RoleType.WAREHOUSE_MANAGER, RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Reserve inventory stock (ACID transaction-safe)' })
  @ApiResponse({ status: 200, description: 'Stock reserved successfully' })
  async reserve(@Body() dto: ReserveInventoryDto, @CurrentUser('id') userId: string) {
    return this.inventoryService.reserve(dto, userId);
  }

  @Post('release')
  @Roles(RoleType.WAREHOUSE_MANAGER, RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Release reserved inventory stock (ACID transaction-safe)' })
  @ApiResponse({ status: 200, description: 'Stock released from reservation' })
  async release(@Body() dto: ReleaseInventoryDto, @CurrentUser('id') userId: string) {
    return this.inventoryService.release(dto, userId);
  }

  @Post('adjust')
  @Roles(RoleType.WAREHOUSE_MANAGER, RoleType.ADMIN)
  @ApiOperation({ summary: 'Reconcile/adjust stock with audit log' })
  @ApiResponse({ status: 200, description: 'Inventory reconciled' })
  async adjust(@Body() dto: AdjustInventoryDto, @CurrentUser('id') userId: string) {
    return this.inventoryService.adjust(dto, userId);
  }

  @Post('transfer')
  @Roles(RoleType.WAREHOUSE_MANAGER, RoleType.ADMIN)
  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  @ApiResponse({ status: 200, description: 'Stock transferred' })
  async transfer(@Body() dto: TransferInventoryDto, @CurrentUser('id') userId: string) {
    return this.inventoryService.transfer(dto, userId);
  }
}
