import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateVehicleDto } from './dto/vehicles.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(availableOnly?: boolean, refrigeratedOnly?: boolean) {
    const where: any = {};
    if (availableOnly) where.status = 'AVAILABLE';
    if (refrigeratedOnly) where.isRefrigerated = true;

    return this.prisma.vehicle.findMany({
      where,
      include: {
        convoys: {
          where: { status: { in: ['IN_TRANSIT', 'DISPATCHED', 'REROUTING'] } },
        },
      },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: { convoys: true },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }

    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: dto,
    });
  }
}
