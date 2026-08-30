import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MatchingEngineService } from './matching-engine.service';
import { CreateSupplySwapDto, RejectSupplySwapDto } from './dto/supply-swap.dto';
import { SupplySwapStatus, InventoryTransactionType } from '../common/enums';

@Injectable()
export class SupplySwapsService {
  private readonly logger = new Logger(SupplySwapsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingEngine: MatchingEngineService,
  ) {}

  async findAll(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.supplySwap.findMany({
      where,
      include: {
        sourceWarehouse: true,
        targetWarehouse: true,
        targetShelter: true,
        items: {
          include: { inventoryItem: true },
        },
        requestedBy: {
          select: { id: true, username: true, role: true },
        },
        approvedBy: {
          select: { id: true, username: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const swap = await this.prisma.supplySwap.findFirst({
      where: {
        OR: [{ id }, { swapCode: id }],
      },
      include: {
        sourceWarehouse: true,
        targetWarehouse: true,
        targetShelter: true,
        items: {
          include: { inventoryItem: true },
        },
        legs: true,
        requestedBy: true,
        approvedBy: true,
      },
    });

    if (!swap) {
      throw new NotFoundException(`Supply swap ${id} not found`);
    }

    return swap;
  }

  async create(dto: CreateSupplySwapDto, userId?: string) {
    const swapCode = `SWP-${Date.now().toString().slice(-6)}`;

    // Validate inventory availability at source warehouse
    for (const itemDto of dto.items) {
      const item = await this.prisma.inventoryItem.findUnique({
        where: { id: itemDto.inventoryItemId },
      });

      if (!item) {
        throw new NotFoundException(`Inventory item ${itemDto.inventoryItemId} not found`);
      }

      if (item.warehouseId !== dto.sourceWarehouseId) {
        throw new BadRequestException(
          `Item ${item.name} does not belong to source warehouse ${dto.sourceWarehouseId}`,
        );
      }

      if (item.availableQuantity < itemDto.quantity) {
        throw new BadRequestException(
          `Insufficient available stock for ${item.name}. Available: ${item.availableQuantity}, Requested: ${itemDto.quantity}`,
        );
      }
    }

    return this.prisma.supplySwap.create({
      data: {
        swapCode,
        sourceWarehouseId: dto.sourceWarehouseId,
        targetWarehouseId: dto.targetWarehouseId,
        targetShelterId: dto.targetShelterId,
        status: SupplySwapStatus.PROPOSED,
        matchScore: 85,
        reasons: JSON.stringify(['High urgency replenishment requested']),
        requestedByUserId: userId,
        items: {
          create: dto.items.map((it) => ({
            inventoryItemId: it.inventoryItemId,
            itemName: 'Relief Item',
            quantity: it.quantity,
            isColdChain: it.isColdChain ?? false,
          })),
        },
      },
      include: {
        items: true,
        sourceWarehouse: true,
      },
    });
  }

  /**
   * ACID-Safe Approval: Reserves source stock atomically and marks swap approved
   */
  async approve(id: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const swap = await tx.supplySwap.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!swap) {
        throw new NotFoundException(`Supply swap ${id} not found`);
      }

      if (swap.status !== SupplySwapStatus.PROPOSED && swap.status !== SupplySwapStatus.MATCHED) {
        throw new BadRequestException(
          `Cannot approve swap in state ${swap.status}. Only PROPOSED or MATCHED swaps can be approved.`,
        );
      }

      // Reserve stock for all items
      for (const item of swap.items) {
        const inv = await tx.inventoryItem.findUnique({
          where: { id: item.inventoryItemId },
        });

        if (!inv || inv.availableQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock during approval reservation for item ${item.inventoryItemId}`,
          );
        }

        await tx.inventoryItem.update({
          where: { id: inv.id },
          data: {
            availableQuantity: inv.availableQuantity - item.quantity,
            reservedQuantity: inv.reservedQuantity + item.quantity,
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: inv.id,
            warehouseId: swap.sourceWarehouseId,
            type: InventoryTransactionType.RESERVATION,
            quantity: item.quantity,
            previousQuantity: inv.quantity,
            newQuantity: inv.quantity,
            referenceType: 'SUPPLY_SWAP_APPROVAL',
            referenceId: swap.id,
            notes: `Auto-reserved upon Supply Swap ${swap.swapCode} approval`,
            performedByUserId: userId,
          },
        });
      }

      const updatedSwap = await tx.supplySwap.update({
        where: { id: swap.id },
        data: {
          status: SupplySwapStatus.APPROVED,
          approvedByUserId: userId,
        },
        include: {
          items: true,
          sourceWarehouse: true,
          targetWarehouse: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'SUPPLY_SWAP_APPROVE',
          entity: 'SupplySwap',
          entityId: swap.id,
          oldValue: JSON.stringify({ status: swap.status }),
          newValue: JSON.stringify({ status: SupplySwapStatus.APPROVED }),
        },
      });

      return updatedSwap;
    });
  }

  async reject(id: string, dto: RejectSupplySwapDto, userId?: string) {
    const swap = await this.findOne(id);

    if (swap.status === SupplySwapStatus.APPROVED || swap.status === SupplySwapStatus.COMPLETED) {
      throw new BadRequestException(`Cannot reject swap in state ${swap.status}`);
    }

    return this.prisma.supplySwap.update({
      where: { id: swap.id },
      data: {
        status: SupplySwapStatus.REJECTED,
        rejectionReason: dto.reason,
      },
    });
  }

  async cancel(id: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const swap = await tx.supplySwap.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!swap) {
        throw new NotFoundException(`Supply swap ${id} not found`);
      }

      // If already approved, release reservations
      if (swap.status === SupplySwapStatus.APPROVED) {
        for (const item of swap.items) {
          const inv = await tx.inventoryItem.findUnique({
            where: { id: item.inventoryItemId },
          });

          if (inv && inv.reservedQuantity >= item.quantity) {
            await tx.inventoryItem.update({
              where: { id: inv.id },
              data: {
                availableQuantity: inv.availableQuantity + item.quantity,
                reservedQuantity: inv.reservedQuantity - item.quantity,
              },
            });

            await tx.inventoryTransaction.create({
              data: {
                inventoryItemId: inv.id,
                warehouseId: swap.sourceWarehouseId,
                type: InventoryTransactionType.RELEASE,
                quantity: item.quantity,
                previousQuantity: inv.quantity,
                newQuantity: inv.quantity,
                referenceType: 'SUPPLY_SWAP_CANCELLATION',
                referenceId: swap.id,
                notes: `Released reservation due to Supply Swap ${swap.swapCode} cancellation`,
                performedByUserId: userId,
              },
            });
          }
        }
      }

      return tx.supplySwap.update({
        where: { id: swap.id },
        data: { status: SupplySwapStatus.CANCELLED },
      });
    });
  }

  async getRecommendations(
    itemName: string,
    quantity: number,
    targetShelterId?: string,
    targetWarehouseId?: string,
  ) {
    return this.matchingEngine.findRecommendations(
      itemName,
      quantity,
      targetShelterId,
      targetWarehouseId,
    );
  }
}
