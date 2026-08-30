import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { Public, CurrentUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user with username/password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT tokens' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token with refresh token' })
  @ApiResponse({ status: 200, description: 'New access token generated' })
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshDto);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout() {
    return { message: 'Successfully logged out' };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile details' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getCurrentUser(userId);
  }
}
