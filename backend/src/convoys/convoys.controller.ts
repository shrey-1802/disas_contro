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
import { ConvoysService } from './convoys.service';
import {
  CreateConvoyDto,
  UpdateLocationDto,
  RerouteDto,
} from './dto/convoys.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { RoleType } from '../common/enums';

@ApiTags('Convoys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('convoys')
export class ConvoysController {
  constructor(private readonly convoysService: ConvoysService) {}

  @Get()
  @ApiOperation({ summary: 'List all relief convoys with live risk index' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiResponse({ status: 200, description: 'List of convoys' })
  async findAll(
    @Query('status') status?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.convoysService.findAll(status, warehouseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get convoy details, cargo, and route' })
  @ApiResponse({ status: 200, description: 'Convoy details' })
  async findOne(@Param('id') id: string) {
    return this.convoysService.findOne(id);
  }

  @Post()
  @Roles(RoleType.WAREHOUSE_MANAGER, RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Plan and create a new relief convoy' })
  @ApiResponse({ status: 201, description: 'Convoy planned' })
  async create(@Body() dto: CreateConvoyDto) {
    return this.convoysService.create(dto);
  }

  @Post(':id/dispatch')
  @Roles(RoleType.WAREHOUSE_MANAGER, RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Dispatch convoy onto route with inventory deduction' })
  @ApiResponse({ status: 200, description: 'Convoy dispatched' })
  async dispatch(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.convoysService.dispatch(id, userId);
  }

  @Post(':id/location')
  @Roles(RoleType.FIELD_DRIVER, RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Record real-time breadcrumb GPS location update' })
  @ApiResponse({ status: 201, description: 'Location breadcrumb recorded' })
  async recordLocation(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.convoysService.recordLocation(id, dto);
  }

  @Post(':id/reroute')
  @Roles(RoleType.CONTROL_ROOM, RoleType.WAREHOUSE_MANAGER, RoleType.ADMIN)
  @ApiOperation({ summary: 'Reroute active convoy away from hazard zone' })
  @ApiResponse({ status: 200, description: 'Convoy rerouted' })
  async reroute(
    @Param('id') id: string,
    @Body() dto: RerouteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.convoysService.reroute(id, dto, userId);
  }

  @Post(':id/pause')
  @Roles(RoleType.CONTROL_ROOM, RoleType.WAREHOUSE_MANAGER, RoleType.ADMIN)
  @ApiOperation({ summary: 'Pause / delay convoy due to adverse conditions' })
  @ApiResponse({ status: 200, description: 'Convoy paused' })
  async pause(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.convoysService.pause(id, userId);
  }

  @Post(':id/deliver')
  @Roles(RoleType.WAREHOUSE_MANAGER, RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Mark convoy delivered and auto-generate after-action report' })
  @ApiResponse({ status: 200, description: 'Delivery finalized' })
  async deliver(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.convoysService.deliver(id, userId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get full GPS location breadcrumb trail history' })
  @ApiResponse({ status: 200, description: 'Location history trail' })
  async getLocationHistory(@Param('id') id: string) {
    return this.convoysService.getLocationHistory(id);
  }
}
