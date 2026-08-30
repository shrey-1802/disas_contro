import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RouteGraphService } from './route-graph.service';
import { CalculateRouteDto } from './dto/routes.dto';

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly routeGraph: RouteGraphService,
  ) {}

  async findAll(status?: string) {
    const where: any = {};
    if (status) where.operationalStatus = status;

    return this.prisma.route.findMany({
      where,
      include: {
        originWarehouse: true,
        destinationShelter: true,
        segments: true,
        hazardImpacts: {
          include: { hazard: true },
        },
      },
      orderBy: { riskScore: 'desc' },
    });
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
      include: {
        originWarehouse: true,
        destinationShelter: true,
        segments: true,
        hazardImpacts: {
          include: { hazard: true },
        },
        convoys: true,
      },
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    return route;
  }

  async calculateRoute(dto: CalculateRouteDto) {
    const origin = await this.prisma.warehouse.findUnique({
      where: { id: dto.originWarehouseId },
    });

    if (!origin) {
      throw new NotFoundException(`Origin warehouse ${dto.originWarehouseId} not found`);
    }

    const destination = await this.prisma.shelter.findUnique({
      where: { id: dto.destinationShelterId },
    });

    if (!destination) {
      throw new NotFoundException(`Destination shelter ${dto.destinationShelterId} not found`);
    }

    const activeHazards = await this.prisma.hazard.findMany({
      where: { status: 'ACTIVE' },
    });

    const result = this.routeGraph.calculateSafePath(
      { lat: origin.latitude, lon: origin.longitude },
      { lat: destination.latitude, lon: destination.longitude },
      activeHazards.map((h) => ({
        lat: h.latitude,
        lon: h.longitude,
        severity: h.severity,
        radiusMeters: h.radiusMeters,
      })),
      dto.vehicleWeightTons || 5.0,
    );

    return {
      originWarehouse: origin.name,
      destinationShelter: destination.name,
      ...result,
    };
  }

  async getRouteRisk(id: string) {
    const route = await this.findOne(id);
    const activeHazardsCount = route.hazardImpacts.length;

    let recommendation = 'Proceed with standard convoy logistics.';
    if (route.operationalStatus === 'BLOCKED') {
      recommendation = 'DO NOT DISPATCH. Route blocked by severe structural damage or flood.';
    } else if (route.operationalStatus === 'RESTRICTED' || route.operationalStatus === 'CAUTION') {
      recommendation = 'Proceed with caution. Elevated risk index; driver acknowledgment required.';
    }

    return {
      routeId: route.id,
      routeName: route.name,
      operationalStatus: route.operationalStatus,
      riskScore: route.riskScore,
      activeHazardsCount,
      recommendation,
      impactedSegments: route.hazardImpacts.map((hi) => ({
        hazard: hi.hazard.title,
        severity: hi.hazard.severity,
        impactLevel: hi.impactLevel,
      })),
    };
  }

  /**
   * Recalculates all routes and flags shelters that have no remaining safe paths
   */
  async reevaluateIsolatedShelters() {
    const shelters = await this.prisma.shelter.findMany();
    const warehouses = await this.prisma.warehouse.findMany({ where: { isOperational: true } });
    const hazards = await this.prisma.hazard.findMany({ where: { status: 'ACTIVE', severity: 'IMPASSABLE' } });

    for (const shelter of shelters) {
      let hasAnySafePath = false;

      for (const wh of warehouses) {
        const path = this.routeGraph.calculateSafePath(
          { lat: wh.latitude, lon: wh.longitude },
          { lat: shelter.latitude, lon: shelter.longitude },
          hazards.map((h) => ({
            lat: h.latitude,
            lon: h.longitude,
            severity: h.severity,
            radiusMeters: h.radiusMeters,
          })),
        );

        if (path.operationalStatus !== 'BLOCKED') {
          hasAnySafePath = true;
          break;
        }
      }

      const isIsolated = !hasAnySafePath;
      if (shelter.isIsolated !== isIsolated) {
        await this.prisma.shelter.update({
          where: { id: shelter.id },
          data: { isIsolated },
        });

        if (isIsolated) {
          await this.prisma.alert.create({
            data: {
              title: `Isolated Shelter Detected: ${shelter.name}`,
              description: `No valid road path connects any warehouse to ${shelter.name}. Immediate air/boat relay required.`,
              type: 'ISOLATED_SHELTER',
              severity: 'CRITICAL',
              entityType: 'SHELTER',
              entityId: shelter.id,
            },
          });
        }
      }
    }
  }
}
