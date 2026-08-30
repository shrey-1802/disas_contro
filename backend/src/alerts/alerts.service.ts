import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAlertDto } from './dto/alerts.dto';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(unacknowledgedOnly?: boolean, severity?: string) {
    const where: any = {};
    if (unacknowledgedOnly) where.isAcknowledged = false;
    if (severity) where.severity = severity;

    return this.prisma.alert.findMany({
      where,
      include: {
        acknowledgedBy: { select: { id: true, username: true, role: true } },
        resolvedBy: { select: { id: true, username: true, role: true } },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findUnread() {
    return this.prisma.alert.findMany({
      where: { isAcknowledged: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        acknowledgedBy: true,
        resolvedBy: true,
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert ${id} not found`);
    }

    return alert;
  }

  async create(dto: CreateAlertDto) {
    return this.prisma.alert.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        severity: dto.severity,
        entityType: dto.entityType,
        entityId: dto.entityId,
        isAcknowledged: false,
        isResolved: false,
      },
    });
  }

  async acknowledge(id: string, userId?: string) {
    const alert = await this.findOne(id);

    return this.prisma.alert.update({
      where: { id: alert.id },
      data: {
        isAcknowledged: true,
        acknowledgedByUserId: userId,
        acknowledgedAt: new Date(),
      },
    });
  }

  async resolve(id: string, userId?: string) {
    const alert = await this.findOne(id);

    return this.prisma.alert.update({
      where: { id: alert.id },
      data: {
        isResolved: true,
        resolvedByUserId: userId,
        resolvedAt: new Date(),
      },
    });
  }
}
