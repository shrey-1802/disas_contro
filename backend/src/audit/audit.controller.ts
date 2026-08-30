import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators';
import { RoleType } from '../common/enums';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles(RoleType.CONTROL_ROOM, RoleType.DISTRICT_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'List immutable disaster logistics audit logs' })
  @ApiQuery({ name: 'entity', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiResponse({ status: 200, description: 'List of audit logs' })
  async findAll(
    @Query('entity') entity?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.findAll(entity, action);
  }
}
