import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'Marcus' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Vance' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+1 (555) 019-2834' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '{"email":true,"sms":true,"push":true}' })
  @IsOptional()
  @IsString()
  notificationPreferences?: string;

  @ApiPropertyOptional({ example: '{"defaultSector":"Sector 4"}' })
  @IsOptional()
  @IsString()
  dashboardPreferences?: string;

  @ApiPropertyOptional({ example: 'America/Los_Angeles' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
