import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SupplyRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.supplyRequest.findMany({
      include: {
        shelter: true,
        requirement: true,
        offers: {
          include: { warehouse: true },
        },
      },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const req = await this.prisma.supplyRequest.findUnique({
      where: { id },
      include: {
        shelter: true,
        requirement: true,
        offers: {
          include: { warehouse: true },
        },
      },
    });

    if (!req) {
      throw new NotFoundException(`Supply request ${id} not found`);
    }

    return req;
  }

  async create(data: {
    shelterId: string;
    requirementId?: string;
    urgency?: string;
    notes?: string;
    userId?: string;
  }) {
    return this.prisma.supplyRequest.create({
      data: {
        shelterId: data.shelterId,
        requirementId: data.requirementId,
        urgency: data.urgency || 'HIGH',
        notes: data.notes,
        requestedByUserId: data.userId,
      },
    });
  }
}
