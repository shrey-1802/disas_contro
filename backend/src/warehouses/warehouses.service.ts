import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const warehouses = await this.prisma.warehouse.findMany({
      include: {
        inventoryItems: {
          select: {
            id: true,
            name: true,
            quantity: true,
            availableQuantity: true,
            reservedQuantity: true,
            unit: true,
            criticality: true,
            isColdChain: true,
          },
        },
        _count: {
          select: {
            inventoryItems: true,
            convoys: true,
          },
        },
      },
    });

    // Transform to friendly overview format matching frontend expectations
    return warehouses.map((wh) => {
      const onHand = wh.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
      const reserved = wh.inventoryItems.reduce((sum, item) => sum + item.reservedQuantity, 0);
      const available = wh.inventoryItems.reduce((sum, item) => sum + item.availableQuantity, 0);

      return {
        ...wh,
        onHand,
        reserved,
        available,
        itemCount: wh._count.inventoryItems,
        activeConvoysCount: wh._count.convoys,
      };
    });
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
      include: {
        inventoryItems: true,
        convoys: {
          include: {
            destinationShelter: true,
            vehicle: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID or code ${id} not found`);
    }

    return warehouse;
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    const existing = await this.findOne(id);

    return this.prisma.warehouse.update({
      where: { id: existing.id },
      data: dto,
    });
  }

  async getWarehouseInventory(warehouseId: string) {
    const warehouse = await this.findOne(warehouseId);
    return this.prisma.inventoryItem.findMany({
      where: { warehouseId: warehouse.id },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getWarehouseConvoys(warehouseId: string) {
    const warehouse = await this.findOne(warehouseId);
    return this.prisma.convoy.findMany({
      where: { warehouseId: warehouse.id },
      include: {
        destinationShelter: true,
        vehicle: true,
        route: true,
      },
    });
  }
}
