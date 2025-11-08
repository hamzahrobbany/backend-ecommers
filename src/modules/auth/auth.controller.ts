import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@ApiTags('Auth') // 🔖 Tab di Swagger UI
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ===========================================================
  // 🧩 REGISTER
  // ===========================================================
  @Post('register')
  @ApiOperation({ summary: 'Register akun baru' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User berhasil didaftarkan dan token dikembalikan',
    schema: {
      example: {
        user: {
          id: 'uuid',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'USER',
        },
        tokens: {
          access_token: 'ACCESS_TOKEN_JWT',
          refresh_token: 'REFRESH_TOKEN_JWT',
        },
      },
    },
  })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const tenantId = req.tenantId;

    if (!tenantId) {
      throw new BadRequestException(
        'Tenant context tidak ditemukan. Gunakan subdomain atau login lebih dulu.',
      );
    }

    return this.authService.register(dto, tenantId);
  }

  // ===========================================================
  // 🧩 LOGIN
  // ===========================================================
  @Post('login')
  @ApiOperation({ summary: 'Login dan dapatkan token JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login berhasil dan mengembalikan token JWT',
    schema: {
      example: {
        user: {
          id: 'uuid',
          email: 'user@example.com',
          role: 'USER',
        },
        tokens: {
          access_token: 'ACCESS_TOKEN_JWT',
          refresh_token: 'ACCESS_TOKEN_JWT',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Email tidak ditemukan atau password salah',
    schema: {
      example: { statusCode: 401, message: 'Unauthorized' },
    },
  })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new BadRequestException(
        'Tenant context tidak ditemukan. Pastikan permintaan berasal dari subdomain tenant.',
      );
    }

    return this.authService.login(dto, tenantId);
  }

  // ===========================================================
  // 🧩 REFRESH TOKEN
  // ===========================================================
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth() // 🔐 header Authorization: Bearer <refresh_token>
  @Post('refresh')
  @ApiOperation({
    summary: 'Perbarui token JWT menggunakan refresh_token',
    description:
      'Gunakan refresh_token valid untuk memperbarui access_token dan refresh_token baru.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token berhasil diperbarui',
    schema: {
      example: {
        user: {
          id: 'uuid',
          email: 'user@example.com',
          role: 'USER',
        },
        tokens: {
          access_token: 'NEW_ACCESS_TOKEN',
          refresh_token: 'NEW_REFRESH_TOKEN',
        },
      },
    },
  })
  async refresh(@Req() req: Request, @Body() dto: RefreshTokenDto) {
    const userId = (req as any).user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID tidak ditemukan di token refresh');
    }

    return this.authService.refresh(userId, dto.refresh_token);
  }

  // ===========================================================
  // 🧩 LOGOUT
  // ===========================================================
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({
    summary: 'Logout dan cabut refresh token',
    description:
      'Logout user aktif berdasarkan token Bearer di header Authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout berhasil',
    schema: { example: { message: 'Logout berhasil' } },
  })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid atau sudah kadaluarsa',
    schema: {
      example: { statusCode: 401, message: 'Unauthorized' },
    },
  })
  async logout(@Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new BadRequestException('Token tidak ditemukan di header Authorization');
    }

    return this.authService.logout(token);
  }
}
