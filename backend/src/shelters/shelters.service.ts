import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateShelterRequirementDto, UpdateShelterDto } from './dto/shelters.dto';

@Injectable()
export class SheltersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(sector?: string, isolatedOnly?: boolean) {
    const where: any = {};
    if (sector) where.sector = sector;
    if (isolatedOnly) where.isIsolated = true;

    const shelters = await this.prisma.shelter.findMany({
      where,
      include: {
        requirements: true,
        _count: {
          select: {
            requirements: true,
            convoys: true,
          },
        },
      },
      orderBy: [{ isIsolated: 'desc' }, { daysOfSupply: 'asc' }],
    });

    return shelters.map((sh) => {
      let urgencyTier = 'safe';
      if (sh.daysOfSupply <= 1.0 || sh.isIsolated) {
        urgencyTier = 'critical';
      } else if (sh.daysOfSupply <= 3.0) {
        urgencyTier = 'caution';
      }

      return {
        ...sh,
        urgencyTier,
        requirementsCount: sh._count.requirements,
        incomingConvoysCount: sh._count.convoys,
      };
    });
  }

  async findCritical() {
    return this.prisma.shelter.findMany({
      where: {
        OR: [{ daysOfSupply: { lte: 1.5 } }, { isIsolated: true }, { priority: 'CRITICAL' }],
      },
      include: {
        requirements: {
          where: { status: 'PENDING' },
        },
      },
      orderBy: [{ isIsolated: 'desc' }, { daysOfSupply: 'asc' }],
    });
  }

  async findOne(id: string) {
    const shelter = await this.prisma.shelter.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
      include: {
        requirements: true,
        supplyRequests: {
          include: {
            offers: {
              include: { warehouse: true },
            },
          },
        },
        convoys: {
          include: {
            warehouse: true,
            vehicle: true,
          },
        },
      },
    });

    if (!shelter) {
      throw new NotFoundException(`Shelter with ID or code ${id} not found`);
    }

    return shelter;
  }

  async update(id: string, dto: UpdateShelterDto) {
    const existing = await this.findOne(id);
    return this.prisma.shelter.update({
      where: { id: existing.id },
      data: dto,
    });
  }

  async getRequirements(shelterId: string) {
    const shelter = await this.findOne(shelterId);
    return this.prisma.shelterSupplyRequirement.findMany({
      where: { shelterId: shelter.id },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createRequirement(shelterId: string, dto: CreateShelterRequirementDto) {
    const shelter = await this.findOne(shelterId);

    return this.prisma.shelterSupplyRequirement.create({
      data: {
        shelterId: shelter.id,
        itemName: dto.itemName,
        category: dto.category,
        requiredQuantity: dto.requiredQuantity,
        unit: dto.unit,
        priority: dto.priority || 'HIGH',
        criticality: dto.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        urgencyTier: dto.urgencyTier || 'critical',
        isColdChain: dto.isColdChain ?? false,
      },
    });
  }
}
