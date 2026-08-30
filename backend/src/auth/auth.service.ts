import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { comparePassword, hashPassword } from '../common/utils/hash.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
      include: {
        settings: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.active) {
      throw new UnauthorizedException('Account is inactive');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      district: user.district,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.accessExpires') || '1h',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: this.configService.get('jwt.refreshExpires') || '7d' },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        district: user.district,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const newAccessToken = this.jwtService.sign(
        {
          sub: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          district: user.district,
        },
        { expiresIn: this.configService.get('jwt.accessExpires') || '1h' },
      );

      return {
        accessToken: newAccessToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getCurrentUser(userId: string) {
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
        active: true,
        createdAt: true,
        settings: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
