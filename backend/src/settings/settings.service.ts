import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        district: true,
        settings: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserSettings(userId: string, dto: UpdateSettingsDto) {
    // 1. Update user contact info
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
      include: { settings: true },
    });

    // 2. Update or upsert user settings
    if (dto.notificationPreferences || dto.dashboardPreferences || dto.timezone) {
      await this.prisma.userSettings.upsert({
        where: { userId },
        update: {
          notificationPreferences: dto.notificationPreferences,
          dashboardPreferences: dto.dashboardPreferences,
          timezone: dto.timezone,
        },
        create: {
          userId,
          notificationPreferences: dto.notificationPreferences || '{}',
          dashboardPreferences: dto.dashboardPreferences || '{}',
          timezone: dto.timezone || 'UTC',
        },
      });
    }

    return this.getUserSettings(userId);
  }
}
