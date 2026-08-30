import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MapsService } from './maps.service';
import {
  GeocodeQueryDto,
  ReverseGeocodeQueryDto,
  ComputeRouteDto,
  DistanceMatrixDto,
} from './dto/maps.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators';

@ApiTags('Maps API')
@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Check Maps API operational mode (GraphHopper vs Local GIS Engine)' })
  @ApiResponse({ status: 200, description: 'Maps service status' })
  getStatus() {
    return {
      graphHopperActive: this.mapsService.isGraphHopperActive,
      activeProvider: this.mapsService.currentProviderName,
      supportedFeatures: [
        'Geocoding (Address to Coordinates)',
        'Reverse Geocoding (Coordinates to Address)',
        'Turn-by-Turn Route Computation',
        'Multi-Origin Distance & Duration Matrix',
        'Hazard-Aware Cost Graph Rerouting',
      ],
    };
  }

  @Post('geocode')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Geocode address to geographic coordinates' })
  @ApiResponse({ status: 200, description: 'Geocoded coordinates' })
  async geocode(@Body() dto: GeocodeQueryDto) {
    return this.mapsService.geocode(dto.address);
  }

  @Get('reverse-geocode')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reverse geocode latitude and longitude to address' })
  @ApiQuery({ name: 'lat', required: true, example: 37.7749 })
  @ApiQuery({ name: 'lon', required: true, example: -122.4194 })
  @ApiResponse({ status: 200, description: 'Address matching coordinates' })
  async reverseGeocode(@Query('lat') lat: number, @Query('lon') lon: number) {
    return this.mapsService.reverseGeocode(Number(lat), Number(lon));
  }

  @Post('compute-route')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Compute route geometry and duration via Maps API' })
  @ApiResponse({ status: 200, description: 'Calculated route information' })
  async computeRoute(@Body() dto: ComputeRouteDto) {
    return this.mapsService.computeRoute(
      dto.origin,
      dto.destination,
      dto.intermediates,
    );
  }

  @Post('route-matrix')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Compute distance & travel duration matrix across multiple origins/destinations' })
  @ApiResponse({ status: 200, description: 'Distance matrix elements' })
  async computeDistanceMatrix(@Body() dto: DistanceMatrixDto) {
    return this.mapsService.computeDistanceMatrix(dto.origins, dto.destinations);
  }
}
