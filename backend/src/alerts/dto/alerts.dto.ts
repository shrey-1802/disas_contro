import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AlertType, AlertSeverity } from '../../common/enums';

export class CreateAlertDto {
  @ApiProperty({ example: 'Isolated Shelter Detected: Shelter 19' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Shelter 19 is completely cut off from all access routes due to bridge collapse.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: AlertType, example: AlertType.ISOLATED_SHELTER })
  @IsEnum(AlertType)
  type: AlertType;

  @ApiProperty({ enum: AlertSeverity, example: AlertSeverity.CRITICAL })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiPropertyOptional({ example: 'SHELTER' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ example: 'shelter-19' })
  @IsOptional()
  @IsString()
  entityId?: string;
}
