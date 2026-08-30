import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/settings.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile and settings preferences' })
  @ApiResponse({ status: 200, description: 'User settings' })
  async getSettings(@CurrentUser('id') userId: string) {
    return this.settingsService.getUserSettings(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update user settings and contact preferences' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateUserSettings(userId, dto);
  }
}
