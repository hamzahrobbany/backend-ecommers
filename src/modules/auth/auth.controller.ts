import { Body, Controller, Post, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrasi customer ke tenant yang sudah ada' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User berhasil didaftarkan dan token dikembalikan',
    schema: {
      example: {
        tenant: {
          id: 'tenant-id',
          code: 'tenant-code',
          name: 'Toko Test',
        },
        user: {
          id: 'uuid',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'CUSTOMER',
        },
        tokens: {
          accessToken: 'ACCESS_TOKEN_JWT',
          refreshToken: 'REFRESH_TOKEN_JWT',
        },
      },
    },
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login tenant-aware' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login berhasil dan mengembalikan token JWT',
    schema: {
      example: {
        tenant: {
          id: 'tenant-id',
          code: 'tenant-code',
          name: 'Toko Test',
        },
        user: {
          id: 'uuid',
          email: 'user@example.com',
          role: 'CUSTOMER',
        },
        tokens: {
          accessToken: 'ACCESS_TOKEN_JWT',
          refreshToken: 'REFRESH_TOKEN_JWT',
        },
      },
    },
  })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    if (!req.tenant) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }

    return this.authService.login(dto, req.tenant);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token berhasil diperbarui',
    schema: {
      example: {
        tenant: {
          id: 'tenant-id',
          code: 'tenant-code',
          name: 'Toko Test',
        },
        user: {
          id: 'uuid',
          email: 'user@example.com',
          role: 'CUSTOMER',
        },
        tokens: {
          accessToken: 'NEW_ACCESS_TOKEN',
          refreshToken: 'NEW_REFRESH_TOKEN',
        },
      },
    },
  })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    if (!req.tenant) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }

    return this.authService.refresh(dto, req.tenant);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout & hapus token' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({
    status: 200,
    description: 'Logout berhasil',
    schema: { example: { message: 'Logout berhasil' } },
  })
  async logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refreshToken);
  }
}
