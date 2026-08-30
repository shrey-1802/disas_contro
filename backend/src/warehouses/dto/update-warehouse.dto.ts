import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateWarehouseDto {
  @ApiPropertyOptional({ example: 'Hub Alpha (Central Depot)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Sector 1' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ example: 37.7749 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -122.4194 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 60000 })
  @IsOptional()
  @IsNumber()
  totalCapacity?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isOperational?: boolean;
}
