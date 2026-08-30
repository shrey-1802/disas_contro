import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CalculateRouteDto {
  @ApiProperty({ description: 'Origin Warehouse ID' })
  @IsString()
  @IsNotEmpty()
  originWarehouseId: string;

  @ApiProperty({ description: 'Destination Shelter ID' })
  @IsString()
  @IsNotEmpty()
  destinationShelterId: string;

  @ApiPropertyOptional({ example: 10.5, description: 'Convoy gross weight in tons' })
  @IsOptional()
  @IsNumber()
  vehicleWeightTons?: number;
}

export class RerouteConvoyDto {
  @ApiProperty({ description: 'Convoy ID' })
  @IsString()
  @IsNotEmpty()
  convoyId: string;

  @ApiPropertyOptional({ example: 'Avoid flooded highway Mile 12' })
  @IsOptional()
  @IsString()
  reason?: string;
}
