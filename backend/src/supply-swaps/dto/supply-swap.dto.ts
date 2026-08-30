import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SupplySwapItemDto {
  @ApiProperty({ description: 'Inventory Item ID' })
  @IsString()
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiProperty({ example: 40, description: 'Quantity to swap/transfer' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isColdChain?: boolean;
}

export class CreateSupplySwapDto {
  @ApiProperty({ description: 'Source Warehouse ID' })
  @IsString()
  @IsNotEmpty()
  sourceWarehouseId: string;

  @ApiPropertyOptional({ description: 'Target Warehouse ID (for inter-warehouse rebalance)' })
  @IsOptional()
  @IsString()
  targetWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Target Shelter ID (if directly fulfilling shelter need)' })
  @IsOptional()
  @IsString()
  targetShelterId?: string;

  @ApiProperty({ type: [SupplySwapItemDto], description: 'List of items to transfer' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplySwapItemDto)
  items: SupplySwapItemDto[];

  @ApiPropertyOptional({ description: 'Notes or transfer purpose' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectSupplySwapDto {
  @ApiProperty({ example: 'Insufficient buffer stock for anticipated local demand', description: 'Reason for rejection' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
