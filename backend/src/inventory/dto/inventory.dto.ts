import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class ReserveInventoryDto {
  @ApiProperty({ description: 'Inventory Item ID' })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ example: 50, description: 'Quantity to reserve' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ example: 'SWAP', description: 'Reference type (e.g. SWAP, CONVOY)' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Reference ID (e.g. Swap ID or Convoy ID)' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Reason or notes for reservation' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReleaseInventoryDto {
  @ApiProperty({ description: 'Inventory Item ID' })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ example: 50, description: 'Quantity to release from reservation' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ description: 'Reason for releasing reservation' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AdjustInventoryDto {
  @ApiProperty({ description: 'Inventory Item ID' })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ example: 100, description: 'New total on-hand quantity' })
  @IsNumber()
  @Min(0)
  newQuantity: number;

  @ApiProperty({ example: 'Post-delivery stock reconciliation', description: 'Reason for adjustment' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class TransferInventoryDto {
  @ApiProperty({ description: 'Source Inventory Item ID' })
  @IsString()
  @IsNotEmpty()
  sourceItemId: string;

  @ApiProperty({ description: 'Target Warehouse ID' })
  @IsString()
  @IsNotEmpty()
  targetWarehouseId: string;

  @ApiProperty({ example: 40, description: 'Quantity to transfer' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ description: 'Convoy or swap reference' })
  @IsOptional()
  @IsString()
  referenceId?: string;
}
