import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HazardFusionService } from './hazard-fusion.service';
import { CreateHazardDto, UpdateHazardDto } from './dto/hazards.dto';
import { isPointWithinRadiusKm } from '../common/utils/geo.util';

@Injectable()
export class HazardsService {
  private readonly logger = new Logger(HazardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fusionService: HazardFusionService,
  ) {}

  async findAll(status?: string, type?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    return this.prisma.hazard.findMany({
      where,
      include: {
        reportedBy: { select: { id: true, username: true, role: true } },
        verifiedBy: { select: { id: true, username: true, role: true } },
        routeImpacts: { include: { route: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const hazard = await this.prisma.hazard.findFirst({
      where: {
        OR: [{ id }, { hazardCode: id }],
      },
      include: {
        reportedBy: true,
        verifiedBy: true,
        routeImpacts: { include: { route: true, segment: true } },
      },
    });

    if (!hazard) {
      throw new NotFoundException(`Hazard with ID ${id} not found`);
    }

    return hazard;
  }

  async create(dto: CreateHazardDto, userId?: string) {
    const hazardCode = `HAZ-${Date.now().toString().slice(-6)}`;
    const confidence = dto.confidence || 80;

    const hazard = await this.prisma.hazard.create({
      data: {
        hazardCode,
        type: dto.type,
        severity: dto.severity,
        title: dto.title,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusMeters: dto.radiusMeters || 500,
        confidence,
        source: dto.source || 'Field Observation',
        isConfirmed: false,
        status: 'ACTIVE',
        reportedByUserId: userId,
      },
    });

    // Evaluate proximity impact on existing routes and active convoys
    await this.evaluateRouteImpacts(hazard);

    return hazard;
  }

  async verify(id: string, userId?: string) {
    const hazard = await this.findOne(id);

    const updated = await this.prisma.hazard.update({
      where: { id: hazard.id },
      data: {
        isConfirmed: true,
        verifiedByUserId: userId,
        verifiedAt: new Date(),
        confidence: Math.max(90, hazard.confidence),
      },
    });

    await this.evaluateRouteImpacts(updated);

    // Create an alert for verified critical hazards
    if (updated.severity === 'HAZARDOUS' || updated.severity === 'IMPASSABLE') {
      await this.prisma.alert.create({
        data: {
          title: `Verified Critical Hazard: ${updated.title}`,
          description: `Confirmed ${updated.type} hazard at [${updated.latitude.toFixed(4)}, ${updated.longitude.toFixed(4)}]. Severity: ${updated.severity}`,
          type: 'NEW_HAZARD',
          severity: updated.severity === 'IMPASSABLE' ? 'CRITICAL' : 'HIGH',
          entityType: 'HAZARD',
          entityId: updated.id,
        },
      });
    }

    return updated;
  }

  async resolve(id: string, userId?: string) {
    const hazard = await this.findOne(id);

    const updated = await this.prisma.hazard.update({
      where: { id: hazard.id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    // Remove route impacts
    await this.prisma.hazardRouteImpact.deleteMany({
      where: { hazardId: hazard.id },
    });

    return updated;
  }

  async update(id: string, dto: UpdateHazardDto) {
    const hazard = await this.findOne(id);
    return this.prisma.hazard.update({
      where: { id: hazard.id },
      data: dto,
    });
  }

  /**
   * Evaluates hazard proximity to routes and convoys, applying operational safety status
   */
  private async evaluateRouteImpacts(hazard: any) {
    const routes = await this.prisma.route.findMany({
      include: {
        originWarehouse: true,
        destinationShelter: true,
      },
    });

    for (const route of routes) {
      // Check if hazard is within corridor between origin and destination (approx radius 5km)
      const nearOrigin = isPointWithinRadiusKm(route.originWarehouse.latitude, route.originWarehouse.longitude, hazard.latitude, hazard.longitude, 8);
      const nearDest = isPointWithinRadiusKm(route.destinationShelter.latitude, route.destinationShelter.longitude, hazard.latitude, hazard.longitude, 8);

      if (nearOrigin || nearDest) {
        let impactStatus = 'CAUTION';
        let routeOpStatus = 'CAUTION';
        let riskScore = 50;

        if (hazard.severity === 'IMPASSABLE') {
          impactStatus = 'BLOCKED';
          routeOpStatus = 'BLOCKED';
          riskScore = 95;
        } else if (hazard.severity === 'HAZARDOUS') {
          impactStatus = 'RESTRICTED';
          routeOpStatus = 'RESTRICTED';
          riskScore = 75;
        }

        await this.prisma.hazardRouteImpact.create({
          data: {
            hazardId: hazard.id,
            routeId: route.id,
            impactLevel: impactStatus,
            notes: `Auto-assigned based on ${hazard.title} (${hazard.severity})`,
          },
        });

        await this.prisma.route.update({
          where: { id: route.id },
          data: {
            operationalStatus: routeOpStatus,
            riskScore,
          },
        });

        // Escalate active convoys on this route
        const activeConvoys = await this.prisma.convoy.findMany({
          where: {
            routeId: route.id,
            status: { in: ['DISPATCHED', 'IN_TRANSIT', 'READY'] },
          },
        });

        for (const convoy of activeConvoys) {
          const newStatus = routeOpStatus === 'BLOCKED' ? 'STRANDED' : 'AT_RISK';
          await this.prisma.convoy.update({
            where: { id: convoy.id },
            data: {
              status: newStatus,
              riskIndex: routeOpStatus === 'BLOCKED' ? 'Blocked' : 'Caution',
              riskScore,
            },
          });

          await this.prisma.alert.create({
            data: {
              title: `Convoy ${convoy.convoyCode} ${newStatus === 'STRANDED' ? 'STRANDED' : 'AT RISK'}`,
              description: `Route ${route.name} impacted by ${hazard.title}. Convoy status changed to ${newStatus}. Reroute required.`,
              type: newStatus === 'STRANDED' ? 'CONVOY_STRANDED' : 'CONVOY_AT_RISK',
              severity: 'CRITICAL',
              entityType: 'CONVOY',
              entityId: convoy.id,
            },
          });
        }
      }
    }
  }
}
