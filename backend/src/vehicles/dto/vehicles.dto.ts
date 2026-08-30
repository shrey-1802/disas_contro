import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'VEH-RT-04' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'RLF-7740' })
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @ApiProperty({ example: 'HEAVY_TRUCK' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 8000 })
  @IsNumber()
  capacityKg: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isRefrigerated: boolean;
}
