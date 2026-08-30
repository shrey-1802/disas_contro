import { InventoryService } from './inventory.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn((callback) => callback(prisma)),
      inventoryItem: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      inventoryTransaction: {
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    } as any;

    service = new InventoryService(prisma);
  });

  it('should reserve stock successfully when requested quantity is available', async () => {
    (prisma.inventoryItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'item-100',
      warehouseId: 'wh-alpha',
      name: 'Potable Water',
      quantity: 1000,
      availableQuantity: 800,
      reservedQuantity: 200,
      unit: 'packs',
    });

    (prisma.inventoryItem.update as jest.Mock).mockResolvedValue({
      id: 'item-100',
      availableQuantity: 700,
      reservedQuantity: 300,
    });

    const result = await service.reserve({
      itemId: 'item-100',
      quantity: 100,
      referenceType: 'SWAP',
    });

    expect(prisma.inventoryItem.update).toHaveBeenCalledWith({
      where: { id: 'item-100' },
      data: {
        availableQuantity: 700,
        reservedQuantity: 300,
      },
    });

    expect(prisma.inventoryTransaction.create).toHaveBeenCalled();
  });

  it('should reject reservation with BadRequestException if requested stock exceeds available stock (preventing over-allocation)', async () => {
    (prisma.inventoryItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'item-100',
      warehouseId: 'wh-alpha',
      name: 'Potable Water',
      quantity: 100,
      availableQuantity: 40,
      reservedQuantity: 60,
      unit: 'packs',
    });

    await expect(
      service.reserve({
        itemId: 'item-100',
        quantity: 80, // Exceeds available 40
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
