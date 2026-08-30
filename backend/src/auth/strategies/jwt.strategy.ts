import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'disaster_relief_jwt_secret_default_key_2026',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or account is deactivated');
    }

    const permissions = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        permissions.add(rp.permission.action);
      });
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      district: user.district,
      permissions: Array.from(permissions),
    };
  }
}
