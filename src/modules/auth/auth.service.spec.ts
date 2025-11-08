import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordUtil } from './utils/password.util';
import { TokenUtil } from './utils/token.util';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Injectable()
export class AuthService {
  private readonly tokenUtil: TokenUtil;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.tokenUtil = new TokenUtil(this.jwtService);
  }

  // ===========================================================
  // 🧩 REGISTER (Tenant-aware)
  // ===========================================================
  async register(dto: CreateUserDto, tenant: Tenant) {
    if (!tenant?.id) {
      throw new BadRequestException(
        'Tenant context tidak ditemukan. Gunakan subdomain atau X-Tenant-ID header.',
      );
    }

    // Cek apakah email sudah ada di tenant yang sama
    const existing = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        tenantId: tenant.id,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Email "${dto.email}" sudah terdaftar di tenant ini.`,
      );
    }

    const hashed = await PasswordUtil.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        role: dto.role ?? 'CUSTOMER',
        tenantId: tenant.id,
      },
    });

    const tokens = await this.tokenUtil.generateTokens(user, tenant);
    await this.tokenUtil.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      tenant,
      user,
      tokens,
    };
  }

  // ===========================================================
  // 🔐 LOGIN (Tenant-aware)
  // ===========================================================
  async login(dto: LoginDto, tenant: Tenant) {
    if (!tenant?.id) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        tenantId: tenant.id,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email tidak ditemukan di tenant ini.');
    }

    const isMatch = await PasswordUtil.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Password salah.');
    }

    const tokens = await this.tokenUtil.generateTokens(user, tenant);
    await this.tokenUtil.saveRefreshToken(user.id, tokens.refreshToken);

    return { tenant, user, tokens };
  }

  // ===========================================================
  // ♻️ REFRESH TOKEN
  // ===========================================================
  async refresh(refreshToken: string, tenant: Tenant) {
    const payload = await this.tokenUtil.verifyRefresh(refreshToken);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.tenantId !== tenant.id) {
      throw new UnauthorizedException('Token tidak valid untuk tenant ini.');
    }

    const tokens = await this.tokenUtil.generateTokens(user, tenant);
    await this.tokenUtil.saveRefreshToken(user.id, tokens.refreshToken);

    return { tenant, user, tokens };
  }

  // ===========================================================
  // 🚪 LOGOUT
  // ===========================================================
  async logout(refreshToken: string) {
    const payload = await this.tokenUtil.verifyRefresh(refreshToken);
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken, userId: payload.sub },
    });
    return { message: 'Logout berhasil.' };
  }
}
