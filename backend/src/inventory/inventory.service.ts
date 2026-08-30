import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  ReserveInventoryDto,
  ReleaseInventoryDto,
  AdjustInventoryDto,
  TransferInventoryDto,
} from './dto/inventory.dto';
import { InventoryTransactionType } from '../common/enums';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(warehouseId?: string, category?: string) {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (category) where.category = category;

    return this.prisma.inventoryItem.findMany({
      where,
      include: {
        warehouse: {
          select: { id: true, name: true, code: true, sector: true },
        },
      },
      orderBy: [{ criticality: 'desc' }, { quantity: 'asc' }],
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        warehouse: true,
        transactions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            performedBy: {
              select: { id: true, username: true, role: true },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return item;
  }

  /**
   * ACID-Safe Inventory Reservation
   */
  async reserve(dto: ReserveInventoryDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: dto.itemId },
      });

      if (!item) {
        throw new NotFoundException(`Inventory item ${dto.itemId} not found`);
      }

      if (item.availableQuantity < dto.quantity) {
        throw new BadRequestException(
          `Insufficient available stock for ${item.name}. Available: ${item.availableQuantity} ${item.unit}, Requested: ${dto.quantity} ${item.unit}`,
        );
      }

      const updatedItem = await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          availableQuantity: item.availableQuantity - dto.quantity,
          reservedQuantity: item.reservedQuantity + dto.quantity,
        },
      });

      const txLog = await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          warehouseId: item.warehouseId,
          type: InventoryTransactionType.RESERVATION,
          quantity: dto.quantity,
          previousQuantity: item.quantity,
          newQuantity: item.quantity,
          referenceType: dto.referenceType || 'MANUAL_RESERVATION',
          referenceId: dto.referenceId,
          notes: dto.notes || `Reserved ${dto.quantity} ${item.unit}`,
          performedByUserId: userId,
        },
      });

      // Also create an audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'INVENTORY_RESERVE',
          entity: 'InventoryItem',
          entityId: item.id,
          oldValue: JSON.stringify({ available: item.availableQuantity, reserved: item.reservedQuantity }),
          newValue: JSON.stringify({ available: updatedItem.availableQuantity, reserved: updatedItem.reservedQuantity }),
        },
      });

      return {
        item: updatedItem,
        transaction: txLog,
      };
    });
  }

  /**
   * ACID-Safe Inventory Release
   */
  async release(dto: ReleaseInventoryDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: dto.itemId },
      });

      if (!item) {
        throw new NotFoundException(`Inventory item ${dto.itemId} not found`);
      }

      if (item.reservedQuantity < dto.quantity) {
        throw new BadRequestException(
          `Cannot release ${dto.quantity} ${item.unit}. Currently reserved: ${item.reservedQuantity} ${item.unit}`,
        );
      }

      const updatedItem = await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          availableQuantity: item.availableQuantity + dto.quantity,
          reservedQuantity: item.reservedQuantity - dto.quantity,
        },
      });

      const txLog = await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          warehouseId: item.warehouseId,
          type: InventoryTransactionType.RELEASE,
          quantity: dto.quantity,
          previousQuantity: item.quantity,
          newQuantity: item.quantity,
          referenceType: 'MANUAL_RELEASE',
          notes: dto.notes || `Released ${dto.quantity} ${item.unit} from reservation`,
          performedByUserId: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'INVENTORY_RELEASE',
          entity: 'InventoryItem',
          entityId: item.id,
          oldValue: JSON.stringify({ available: item.availableQuantity, reserved: item.reservedQuantity }),
          newValue: JSON.stringify({ available: updatedItem.availableQuantity, reserved: updatedItem.reservedQuantity }),
        },
      });

      return {
        item: updatedItem,
        transaction: txLog,
      };
    });
  }

  /**
   * ACID-Safe Stock Adjustment with Audit
   */
  async adjust(dto: AdjustInventoryDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: dto.itemId },
      });

      if (!item) {
        throw new NotFoundException(`Inventory item ${dto.itemId} not found`);
      }

      if (dto.newQuantity < item.reservedQuantity) {
        throw new BadRequestException(
          `New quantity (${dto.newQuantity}) cannot be lower than current reserved stock (${item.reservedQuantity})`,
        );
      }

      const newAvailable = dto.newQuantity - item.reservedQuantity;
      const difference = dto.newQuantity - item.quantity;

      const updatedItem = await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          quantity: dto.newQuantity,
          availableQuantity: newAvailable,
        },
      });

      const txLog = await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          warehouseId: item.warehouseId,
          type: InventoryTransactionType.ADJUSTMENT,
          quantity: Math.abs(difference),
          previousQuantity: item.quantity,
          newQuantity: dto.newQuantity,
          referenceType: 'STOCK_ADJUSTMENT',
          notes: dto.reason,
          performedByUserId: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'INVENTORY_ADJUSTMENT',
          entity: 'InventoryItem',
          entityId: item.id,
          oldValue: JSON.stringify({ quantity: item.quantity, available: item.availableQuantity }),
          newValue: JSON.stringify({ quantity: updatedItem.quantity, available: updatedItem.availableQuantity }),
        },
      });

      return {
        item: updatedItem,
        transaction: txLog,
      };
    });
  }

  /**
   * ACID-Safe Inter-Warehouse Transfer
   */
  async transfer(dto: TransferInventoryDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const sourceItem = await tx.inventoryItem.findUnique({
        where: { id: dto.sourceItemId },
      });

      if (!sourceItem) {
        throw new NotFoundException(`Source inventory item ${dto.sourceItemId} not found`);
      }

      if (sourceItem.availableQuantity < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock at source warehouse. Available: ${sourceItem.availableQuantity}, Requested: ${dto.quantity}`,
        );
      }

      const targetWarehouse = await tx.warehouse.findUnique({
        where: { id: dto.targetWarehouseId },
      });

      if (!targetWarehouse) {
        throw new NotFoundException(`Target warehouse ${dto.targetWarehouseId} not found`);
      }

      // Deduct from source
      const updatedSource = await tx.inventoryItem.update({
        where: { id: sourceItem.id },
        data: {
          quantity: sourceItem.quantity - dto.quantity,
          availableQuantity: sourceItem.availableQuantity - dto.quantity,
        },
      });

      // Add to or create target item
      const targetSku = `${sourceItem.sku}-${targetWarehouse.code}`;
      let targetItem = await tx.inventoryItem.findFirst({
        where: {
          warehouseId: targetWarehouse.id,
          name: sourceItem.name,
        },
      });

      if (targetItem) {
        targetItem = await tx.inventoryItem.update({
          where: { id: targetItem.id },
          data: {
            quantity: targetItem.quantity + dto.quantity,
            availableQuantity: targetItem.availableQuantity + dto.quantity,
          },
        });
      } else {
        targetItem = await tx.inventoryItem.create({
          data: {
            warehouseId: targetWarehouse.id,
            name: sourceItem.name,
            sku: targetSku,
            category: sourceItem.category,
            quantity: dto.quantity,
            availableQuantity: dto.quantity,
            reservedQuantity: 0,
            unit: sourceItem.unit,
            criticality: sourceItem.criticality,
            isColdChain: sourceItem.isColdChain,
            batchNumber: sourceItem.batchNumber,
          },
        });
      }

      // Log transactions for both sides
      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: sourceItem.id,
          warehouseId: sourceItem.warehouseId,
          type: InventoryTransactionType.TRANSFER,
          quantity: dto.quantity,
          previousQuantity: sourceItem.quantity,
          newQuantity: updatedSource.quantity,
          referenceType: 'TRANSFER_OUT',
          referenceId: dto.referenceId,
          notes: `Transferred to ${targetWarehouse.name}`,
          performedByUserId: userId,
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: targetItem.id,
          warehouseId: targetWarehouse.id,
          type: InventoryTransactionType.RECEIPT,
          quantity: dto.quantity,
          previousQuantity: targetItem.quantity - dto.quantity,
          newQuantity: targetItem.quantity,
          referenceType: 'TRANSFER_IN',
          referenceId: dto.referenceId,
          notes: `Received transfer from ${sourceItem.warehouseId}`,
          performedByUserId: userId,
        },
      });

      return {
        sourceItem: updatedSource,
        targetItem,
      };
    });
  }
}
