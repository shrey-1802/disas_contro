import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateShelterRequirementDto {
  @ApiProperty({ example: 'Insulin (Human & Analog)' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty({ example: 'Medical' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 400 })
  @IsNumber()
  @IsPositive()
  requiredQuantity: number;

  @ApiProperty({ example: 'vials' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiPropertyOptional({ example: 'CRITICAL' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'critical' })
  @IsOptional()
  @IsString()
  urgencyTier?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isColdChain?: boolean;
}

export class UpdateShelterDto {
  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  population?: number;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'CAUTION' })
  @IsOptional()
  @IsString()
  accessibility?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isIsolated?: boolean;

  @ApiPropertyOptional({ example: 2.0 })
  @IsOptional()
  @IsNumber()
  daysOfSupply?: number;
}
