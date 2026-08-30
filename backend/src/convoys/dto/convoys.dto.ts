import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConvoyItemDto {
  @ApiProperty({ description: 'Inventory Item ID' })
  @IsString()
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiProperty({ example: 200, description: 'Quantity to transport' })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isColdChain?: boolean;
}

export class CreateConvoyDto {
  @ApiProperty({ description: 'Origin Warehouse ID' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiProperty({ description: 'Destination Shelter ID' })
  @IsString()
  @IsNotEmpty()
  destinationShelterId: string;

  @ApiPropertyOptional({ description: 'Assigned Vehicle ID' })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Assigned Driver User ID' })
  @IsOptional()
  @IsString()
  driverUserId?: string;

  @ApiProperty({ example: 'Insulin & Blood Emergency Dispatch' })
  @IsString()
  @IsNotEmpty()
  cargoDescription: string;

  @ApiPropertyOptional({ example: 'Insulin/Blood' })
  @IsOptional()
  @IsString()
  cargoPriority?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requiresColdChain?: boolean;

  @ApiPropertyOptional({ description: 'Assigned Route ID' })
  @IsOptional()
  @IsString()
  routeId?: string;

  @ApiProperty({ type: [ConvoyItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConvoyItemDto)
  items: ConvoyItemDto[];
}

export class UpdateLocationDto {
  @ApiProperty({ example: 37.7912 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -122.3421 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 42.5 })
  @IsOptional()
  @IsNumber()
  speedKmh?: number;

  @ApiPropertyOptional({ example: 180.0 })
  @IsOptional()
  @IsNumber()
  headingDegrees?: number;
}

export class RerouteDto {
  @ApiProperty({ description: 'New Route ID' })
  @IsString()
  @IsNotEmpty()
  newRouteId: string;

  @ApiProperty({ example: 'Bridge B14 impassable' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Triggering Hazard ID' })
  @IsOptional()
  @IsString()
  hazardId?: string;
}
