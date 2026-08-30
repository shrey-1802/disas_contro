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
import { SheltersService } from './shelters.service';
import { CreateShelterRequirementDto, UpdateShelterDto } from './dto/shelters.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators';
import { RoleType } from '../common/enums';

@ApiTags('Shelters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shelters')
export class SheltersController {
  constructor(private readonly sheltersService: SheltersService) {}

  @Get()
  @ApiOperation({ summary: 'List all shelters with days of supply & isolation metrics' })
  @ApiQuery({ name: 'sector', required: false })
  @ApiQuery({ name: 'isolatedOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of shelters' })
  async findAll(
    @Query('sector') sector?: string,
    @Query('isolatedOnly') isolatedOnly?: boolean,
  ) {
    return this.sheltersService.findAll(sector, isolatedOnly);
  }

  @Get('critical')
  @ApiOperation({ summary: 'Get shelters with critical shortages or isolation' })
  @ApiResponse({ status: 200, description: 'List of critical shelters' })
  async findCritical() {
    return this.sheltersService.findCritical();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shelter details by ID or code' })
  @ApiResponse({ status: 200, description: 'Shelter details' })
  async findOne(@Param('id') id: string) {
    return this.sheltersService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleType.DISTRICT_ADMIN, RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Update shelter status or population metrics' })
  @ApiResponse({ status: 200, description: 'Shelter updated' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateShelterDto) {
    return this.sheltersService.update(id, updateDto);
  }

  @Get(':id/requirements')
  @ApiOperation({ summary: 'Get supply requirements for shelter' })
  @ApiResponse({ status: 200, description: 'List of requirements' })
  async getRequirements(@Param('id') id: string) {
    return this.sheltersService.getRequirements(id);
  }

  @Post(':id/requirements')
  @Roles(RoleType.DISTRICT_ADMIN, RoleType.WAREHOUSE_MANAGER, RoleType.CONTROL_ROOM, RoleType.ADMIN)
  @ApiOperation({ summary: 'Create new supply requirement for shelter' })
  @ApiResponse({ status: 201, description: 'Requirement created' })
  async createRequirement(
    @Param('id') id: string,
    @Body() dto: CreateShelterRequirementDto,
  ) {
    return this.sheltersService.createRequirement(id, dto);
  }
}
