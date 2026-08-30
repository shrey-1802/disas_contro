import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LatLngDto {
  @ApiProperty({ example: 37.7749 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -122.4194 })
  @IsNumber()
  longitude: number;
}

export class GeocodeQueryDto {
  @ApiProperty({ example: '100 Central Logistics Pkwy, San Francisco, CA' })
  @IsString()
  @IsNotEmpty()
  address: string;
}

export class ReverseGeocodeQueryDto {
  @ApiProperty({ example: 37.7749 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -122.4194 })
  @IsNumber()
  longitude: number;
}

export class ComputeRouteDto {
  @ApiProperty({ type: LatLngDto })
  @ValidateNested()
  @Type(() => LatLngDto)
  origin: LatLngDto;

  @ApiProperty({ type: LatLngDto })
  @ValidateNested()
  @Type(() => LatLngDto)
  destination: LatLngDto;

  @ApiPropertyOptional({ type: [LatLngDto], description: 'Optional waypoints' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LatLngDto)
  intermediates?: LatLngDto[];
}

export class DistanceMatrixDto {
  @ApiProperty({ type: [LatLngDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LatLngDto)
  origins: LatLngDto[];

  @ApiProperty({ type: [LatLngDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LatLngDto)
  destinations: LatLngDto[];
}
