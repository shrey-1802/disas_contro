import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupplyRequestsService } from './supply-requests.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Supply Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('supply-requests')
export class SupplyRequestsController {
  constructor(private readonly supplyRequestsService: SupplyRequestsService) {}

  @Get()
  @ApiOperation({ summary: 'List all open supply requests' })
  @ApiResponse({ status: 200, description: 'List of supply requests' })
  async findAll() {
    return this.supplyRequestsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single supply request' })
  @ApiResponse({ status: 200, description: 'Supply request details' })
  async findOne(@Param('id') id: string) {
    return this.supplyRequestsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new supply request' })
  @ApiResponse({ status: 201, description: 'Supply request created' })
  async create(
    @Body() body: { shelterId: string; requirementId?: string; urgency?: string; notes?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.supplyRequestsService.create({ ...body, userId });
  }
}
