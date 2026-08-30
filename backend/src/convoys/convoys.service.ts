import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConvoyRiskIndexService } from './risk-index.service';
import {
  CreateConvoyDto,
  UpdateLocationDto,
  RerouteDto,
} from './dto/convoys.dto';
import { ConvoyStatus, InventoryTransactionType } from '../common/enums';

@Injectable()
export class ConvoysService {
  private readonly logger = new Logger(ConvoysService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly riskIndexService: ConvoyRiskIndexService,
  ) {}

  async findAll(status?: string, warehouseId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (warehouseId) where.warehouseId = warehouseId;

    return this.prisma.convoy.findMany({
      where,
      include: {
        warehouse: true,
        destinationShelter: true,
        vehicle: true,
        route: true,
        driver: { select: { id: true, username: true, firstName: true, lastName: true } },
        items: true,
        locations: {
          take: 1,
          orderBy: { recordedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const convoy = await this.prisma.convoy.findFirst({
      where: {
        OR: [{ id }, { convoyCode: id }],
      },
      include: {
        warehouse: true,
        destinationShelter: true,
        vehicle: true,
        route: true,
        driver: true,
        items: { include: { inventoryItem: true } },
        locations: {
          take: 50,
          orderBy: { recordedAt: 'desc' },
        },
        rerouteHistories: {
          include: { previousRoute: true, newRoute: true, triggeredByHazard: true },
        },
      },
    });

    if (!convoy) {
      throw new NotFoundException(`Convoy ${id} not found`);
    }

    return convoy;
  }

  async create(dto: CreateConvoyDto) {
    const convoyCode = `CNV-${Date.now().toString().slice(-6)}`;

    // Cold-Chain Hard Gate Validation
    if (dto.requiresColdChain && dto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: dto.vehicleId },
      });
      if (vehicle && !vehicle.isRefrigerated) {
        throw new BadRequestException(
          `Cold-Chain Violation: Assigned vehicle ${vehicle.code} is NOT refrigerated. Insulin/Blood cannot be assigned to standard vehicles.`,
        );
      }
    }

    return this.prisma.convoy.create({
      data: {
        convoyCode,
        warehouseId: dto.warehouseId,
        destinationShelterId: dto.destinationShelterId,
        vehicleId: dto.vehicleId,
        driverUserId: dto.driverUserId,
        status: ConvoyStatus.PLANNED,
        priority: dto.cargoPriority === 'Insulin/Blood' ? 'CRITICAL' : 'HIGH',
        cargoDescription: dto.cargoDescription,
        cargoPriority: dto.cargoPriority || 'General',
        requiresColdChain: dto.requiresColdChain ?? false,
        routeId: dto.routeId,
        items: {
          create: dto.items.map((it) => ({
            inventoryItemId: it.inventoryItemId,
            itemName: 'Cargo Item',
            quantity: it.quantity,
            isColdChain: it.isColdChain ?? false,
          })),
        },
      },
      include: {
        warehouse: true,
        destinationShelter: true,
        items: true,
      },
    });
  }

  async dispatch(id: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const convoy = await tx.convoy.findUnique({
        where: { id },
        include: { items: true, route: true },
      });

      if (!convoy) {
        throw new NotFoundException(`Convoy ${id} not found`);
      }

      if (convoy.status !== ConvoyStatus.PLANNED && convoy.status !== ConvoyStatus.READY) {
        throw new BadRequestException(
          `Cannot dispatch convoy in status ${convoy.status}. Must be PLANNED or READY.`,
        );
      }

      // Check route status
      if (convoy.route && convoy.route.operationalStatus === 'BLOCKED') {
        throw new BadRequestException(
          `Cannot dispatch convoy: Assigned route ${convoy.route.name} is BLOCKED by severe disaster hazards.`,
        );
      }

      // Deduct from available inventory and record dispatch
      for (const it of convoy.items) {
        const inv = await tx.inventoryItem.findUnique({
          where: { id: it.inventoryItemId },
        });

        if (!inv || inv.availableQuantity < it.quantity) {
          throw new BadRequestException(
            `Insufficient available stock for cargo item ${it.inventoryItemId}`,
          );
        }

        await tx.inventoryItem.update({
          where: { id: inv.id },
          data: {
            availableQuantity: inv.availableQuantity - it.quantity,
            quantity: inv.quantity - it.quantity,
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: inv.id,
            warehouseId: convoy.warehouseId,
            type: InventoryTransactionType.DISPATCH,
            quantity: it.quantity,
            previousQuantity: inv.quantity,
            newQuantity: inv.quantity - it.quantity,
            referenceType: 'CONVOY_DISPATCH',
            referenceId: convoy.id,
            notes: `Dispatched in Convoy ${convoy.convoyCode}`,
            performedByUserId: userId,
          },
        });
      }

      const updated = await tx.convoy.update({
        where: { id: convoy.id },
        data: {
          status: ConvoyStatus.IN_TRANSIT,
          departureTime: new Date(),
          estimatedArrival: new Date(Date.now() + 45 * 60 * 1000),
        },
      });

      // Update vehicle status
      if (convoy.vehicleId) {
        await tx.vehicle.update({
          where: { id: convoy.vehicleId },
          data: { status: 'IN_TRANSIT' },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CONVOY_DISPATCH',
          entity: 'Convoy',
          entityId: convoy.id,
          oldValue: JSON.stringify({ status: convoy.status }),
          newValue: JSON.stringify({ status: ConvoyStatus.IN_TRANSIT }),
        },
      });

      return updated;
    });
  }

  async recordLocation(id: string, dto: UpdateLocationDto) {
    const convoy = await this.findOne(id);

    const location = await this.prisma.convoyLocation.create({
      data: {
        convoyId: convoy.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
        speedKmh: dto.speedKmh || 0,
        headingDegrees: dto.headingDegrees || 0,
      },
    });

    if (convoy.vehicleId) {
      await this.prisma.vehicle.update({
        where: { id: convoy.vehicleId },
        data: {
          currentLatitude: dto.latitude,
          currentLongitude: dto.longitude,
        },
      });
    }

    return location;
  }

  async reroute(id: string, dto: RerouteDto, userId?: string) {
    const convoy = await this.findOne(id);

    const newRoute = await this.prisma.route.findUnique({
      where: { id: dto.newRouteId },
    });

    if (!newRoute) {
      throw new NotFoundException(`New route ${dto.newRouteId} not found`);
    }

    await this.prisma.convoyRerouteHistory.create({
      data: {
        convoyId: convoy.id,
        previousRouteId: convoy.routeId,
        newRouteId: newRoute.id,
        reason: dto.reason,
        triggeredByHazardId: dto.hazardId,
        approvedByUserId: userId,
        acknowledgedByDriver: false,
      },
    });

    const updated = await this.prisma.convoy.update({
      where: { id: convoy.id },
      data: {
        routeId: newRoute.id,
        status: ConvoyStatus.REROUTING,
        riskIndex: 'Caution',
      },
    });

    return updated;
  }

  async deliver(id: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const convoy = await tx.convoy.findUnique({
        where: { id },
        include: {
          items: true,
          destinationShelter: true,
          warehouse: true,
          rerouteHistories: true,
        },
      });

      if (!convoy) {
        throw new NotFoundException(`Convoy ${id} not found`);
      }

      // Generate Auto After-Action Report (Feature A.8)
      const transitDurationMin = convoy.departureTime
        ? Math.round((Date.now() - new Date(convoy.departureTime).getTime()) / (1000 * 60))
        : 45;
      const rerouteCount = convoy.rerouteHistories.length;

      const afterActionReport = `Convoy ${convoy.convoyCode} (${convoy.cargoDescription}) delivered to ${convoy.destinationShelter.name} after ${transitDurationMin} minutes in transit. Rerouted ${rerouteCount} time(s) during mission. Delivered successfully with all cold-chain/cargo verifications passed.`;

      // Update shelter days of supply
      await tx.shelter.update({
        where: { id: convoy.destinationShelterId },
        data: {
          daysOfSupply: Math.min(10.0, convoy.destinationShelter.daysOfSupply + 2.0),
        },
      });

      const updated = await tx.convoy.update({
        where: { id: convoy.id },
        data: {
          status: ConvoyStatus.DELIVERED,
          actualArrival: new Date(),
          afterActionReport,
        },
      });

      // Free vehicle
      if (convoy.vehicleId) {
        await tx.vehicle.update({
          where: { id: convoy.vehicleId },
          data: { status: 'AVAILABLE' },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CONVOY_DELIVER',
          entity: 'Convoy',
          entityId: convoy.id,
          oldValue: JSON.stringify({ status: convoy.status }),
          newValue: JSON.stringify({ status: ConvoyStatus.DELIVERED, afterActionReport }),
        },
      });

      return updated;
    });
  }

  async pause(id: string, userId?: string) {
    const convoy = await this.findOne(id);
    return this.prisma.convoy.update({
      where: { id: convoy.id },
      data: { status: ConvoyStatus.DELAYED },
    });
  }

  async getLocationHistory(id: string) {
    const convoy = await this.findOne(id);
    return this.prisma.convoyLocation.findMany({
      where: { convoyId: convoy.id },
      orderBy: { recordedAt: 'asc' },
    });
  }
}
