import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HazardsService } from './hazards.service';
import { CreateHazardDto, UpdateHazardDto } from './dto/hazards.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { RoleType } from '../common/enums';

@ApiTags('Hazards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hazards')
export class HazardsController {
  constructor(private readonly hazardsService: HazardsService) {}

  @Get()
  @ApiOperation({ summary: 'List all hazards with severity and confidence metrics' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiResponse({ status: 200, description: 'List of hazards' })
  async findAll(@Query('status') status?: string, @Query('type') type?: string) {
    return this.hazardsService.findAll(status, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hazard details by ID or code' })
  @ApiResponse({ status: 200, description: 'Hazard details' })
  async findOne(@Param('id') id: string) {
    return this.hazardsService.findOne(id);
  }

  @Post()
  @Roles(RoleType.FIELD_DRIVER, RoleType.CONTROL_ROOM, RoleType.WAREHOUSE_MANAGER, RoleType.ADMIN)
  @ApiOperation({ summary: 'Report new disaster hazard observation' })
  @ApiResponse({ status: 201, description: 'Hazard recorded' })
  async create(@Body() dto: CreateHazardDto, @CurrentUser('id') userId: string) {
    return this.hazardsService.create(dto, userId);
  }

  @Patch(':id')
  @Roles(RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Update hazard properties' })
  @ApiResponse({ status: 200, description: 'Hazard updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateHazardDto) {
    return this.hazardsService.update(id, dto);
  }

  @Post(':id/verify')
  @Roles(RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Verify hazard (HQ Control Room operation)' })
  @ApiResponse({ status: 200, description: 'Hazard verified' })
  async verify(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.hazardsService.verify(id, userId);
  }

  @Post(':id/resolve')
  @Roles(RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Mark hazard as resolved/cleared' })
  @ApiResponse({ status: 200, description: 'Hazard resolved' })
  async resolve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.hazardsService.resolve(id, userId);
  }
}
