import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(entity?: string, action?: string) {
    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, username: true, role: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async logAction(data: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
        newValue: data.newValue ? JSON.stringify(data.newValue) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        requestId: data.requestId,
      },
    });
  }
}
