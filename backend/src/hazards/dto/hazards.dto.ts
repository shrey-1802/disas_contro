import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { HazardType, HazardSeverity } from '../../common/enums';

export class CreateHazardDto {
  @ApiProperty({ enum: HazardType, example: HazardType.FLOOD })
  @IsEnum(HazardType)
  type: HazardType;

  @ApiProperty({ enum: HazardSeverity, example: HazardSeverity.HAZARDOUS })
  @IsEnum(HazardSeverity)
  severity: HazardSeverity;

  @ApiProperty({ example: 'Flash Flood across Route 4 Mile 12' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Water rising rapidly over low culvert; impassable for light vehicles' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 37.7900 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -122.3100 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 500, description: 'Hazard radius in meters' })
  @IsOptional()
  @IsNumber()
  radiusMeters?: number;

  @ApiPropertyOptional({ example: 85, description: 'Confidence score (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence?: number;

  @ApiPropertyOptional({ example: 'Field Driver (Unit 4)' })
  @IsOptional()
  @IsString()
  source?: string;
}

export class UpdateHazardDto {
  @ApiPropertyOptional({ enum: HazardSeverity })
  @IsOptional()
  @IsEnum(HazardSeverity)
  severity?: HazardSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  radiusMeters?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  confidence?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
