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
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/alerts.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { RoleType } from '../common/enums';

@ApiTags('Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'List all operational disaster alerts' })
  @ApiQuery({ name: 'unacknowledgedOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'severity', required: false })
  @ApiResponse({ status: 200, description: 'List of alerts' })
  async findAll(
    @Query('unacknowledgedOnly') unacknowledgedOnly?: boolean,
    @Query('severity') severity?: string,
  ) {
    return this.alertsService.findAll(unacknowledgedOnly, severity);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unacknowledged alerts' })
  @ApiResponse({ status: 200, description: 'List of unread alerts' })
  async findUnread() {
    return this.alertsService.findUnread();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert details' })
  @ApiResponse({ status: 200, description: 'Alert details' })
  async findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @Post()
  @Roles(RoleType.CONTROL_ROOM, RoleType.DISTRICT_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Create a new manual alert' })
  @ApiResponse({ status: 201, description: 'Alert created' })
  async create(@Body() dto: CreateAlertDto) {
    return this.alertsService.create(dto);
  }

  @Post(':id/acknowledge')
  @Roles(RoleType.WAREHOUSE_MANAGER, RoleType.CONTROL_ROOM, RoleType.DISTRICT_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Acknowledge an active alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged' })
  async acknowledge(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.alertsService.acknowledge(id, userId);
  }

  @Post(':id/resolve')
  @Roles(RoleType.CONTROL_ROOM, RoleType.DISTRICT_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Resolve and dismiss an alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved' })
  async resolve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.alertsService.resolve(id, userId);
  }
}
