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
import { SupplySwapsService } from './supply-swaps.service';
import { CreateSupplySwapDto, RejectSupplySwapDto } from './dto/supply-swap.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { RoleType } from '../common/enums';

@ApiTags('Supply Swaps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('supply-swaps')
export class SupplySwapsController {
  constructor(private readonly supplySwapsService: SupplySwapsService) {}

  @Get()
  @ApiOperation({ summary: 'List all Supply Swaps' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'List of supply swaps' })
  async findAll(@Query('status') status?: string) {
    return this.supplySwapsService.findAll(status);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get explainable Supply Swap match recommendations' })
  @ApiQuery({ name: 'itemName', required: true, example: 'Insulin' })
  @ApiQuery({ name: 'quantity', required: true, example: 50 })
  @ApiQuery({ name: 'targetShelterId', required: false })
  @ApiQuery({ name: 'targetWarehouseId', required: false })
  @ApiResponse({ status: 200, description: 'Ranked list of explainable recommendations' })
  async getRecommendations(
    @Query('itemName') itemName: string,
    @Query('quantity') quantity: number,
    @Query('targetShelterId') targetShelterId?: string,
    @Query('targetWarehouseId') targetWarehouseId?: string,
  ) {
    return this.supplySwapsService.getRecommendations(
      itemName || 'Insulin',
      Number(quantity) || 50,
      targetShelterId,
      targetWarehouseId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Supply Swap details by ID or code' })
  @ApiResponse({ status: 200, description: 'Supply swap details' })
  async findOne(@Param('id') id: string) {
    return this.supplySwapsService.findOne(id);
  }

  @Post()
  @Roles(RoleType.WAREHOUSE_MANAGER, RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Create a new Supply Swap proposal' })
  @ApiResponse({ status: 201, description: 'Supply swap created' })
  async create(@Body() dto: CreateSupplySwapDto, @CurrentUser('id') userId: string) {
    return this.supplySwapsService.create(dto, userId);
  }

  @Post(':id/approve')
  @Roles(RoleType.WAREHOUSE_MANAGER, RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Approve Supply Swap and atomically reserve donor inventory' })
  @ApiResponse({ status: 200, description: 'Supply swap approved' })
  async approve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.supplySwapsService.approve(id, userId);
  }

  @Post(':id/reject')
  @Roles(RoleType.WAREHOUSE_MANAGER, RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Reject Supply Swap with reason' })
  @ApiResponse({ status: 200, description: 'Supply swap rejected' })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectSupplySwapDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.supplySwapsService.reject(id, dto, userId);
  }

  @Post(':id/cancel')
  @Roles(RoleType.WAREHOUSE_MANAGER, RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Cancel Supply Swap and release any reservations' })
  @ApiResponse({ status: 200, description: 'Supply swap cancelled' })
  async cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.supplySwapsService.cancel(id, userId);
  }
}
