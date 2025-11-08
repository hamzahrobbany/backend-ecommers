import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { PasswordUtil } from './utils/password.util';
import { TokenUtil } from './utils/token.util';
import { TokenResponse } from './interfaces/token-response.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { TenantsService } from '../tenants/tenants.service'; // 🧩 penting untuk mendukung tenantCode

type NullableTenant = TenantContext | null | undefined;

interface TenantContext {
  id: string;
  name?: string | null;
  domain?: string | null;
  code?: string | null;
}

@Injectable()
export class AuthService {
  private readonly tokenUtil: TokenUtil;

  constructor(
    private readonly authRepo: AuthRepository,
    private readonly tenantsService: TenantsService, // 🧩 tambahkan ini
    private readonly jwtService: JwtService,
  ) {
    this.tokenUtil = new TokenUtil(this.jwtService, this.authRepo);
  }

  // ===========================================================
  // 🧩 REGISTER — Mendukung tenant dari header ATAU body
  // ===========================================================
  async register(dto: RegisterDto, tenant: NullableTenant) {
    let activeTenant: TenantContext | null = null;

    // ✅ 1️⃣ Gunakan tenant dari middleware jika ada
    if (tenant?.id) {
      activeTenant = this.normalizeTenant(tenant);
    }
    // ✅ 2️⃣ Jika tidak ada tenant di context, cari dari tenantCode
    else if (dto.tenantCode) {
      const foundTenant = await this.tenantsService.findByCode(dto.tenantCode);
      if (foundTenant) {
        activeTenant = {
          id: foundTenant.id,
          name: foundTenant.name,
          code: foundTenant.code,
          domain: foundTenant.domain,
        };
      }
    }

    // ⚠️ 3️⃣ Jika tenant tetap tidak ditemukan → error
    if (!activeTenant || !activeTenant.id) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }

    // ✅ 4️⃣ Cek duplikasi email dalam tenant yang sama
    const existing = await this.authRepo.findUserByEmail(
      dto.email,
      activeTenant.id,
    );
    if (existing) {
      throw new BadRequestException('Email sudah terdaftar di tenant ini.');
    }

    // ✅ 5️⃣ Hash password & buat user
    const hashedPassword = await PasswordUtil.hash(dto.password);

    const user = await this.authRepo.createUser({
      ...dto,
      password: hashedPassword,
      tenantId: activeTenant.id,
      role: dto.role ?? 'CUSTOMER',
    });

    // ✅ 6️⃣ Buat token JWT
    const tokens = await this.issueTokens(user, activeTenant);

    // ✅ 7️⃣ Bangun respons
    return this.buildAuthResponse(user, activeTenant, tokens);
  }

  // ===========================================================
  // 🧩 LOGIN
  // ===========================================================
  async login(dto: LoginDto, tenant: NullableTenant) {
    const activeTenant = this.ensureTenant(tenant);

    const user = await this.authRepo.findUserByEmail(dto.email, activeTenant.id);
    if (!user) {
      throw new UnauthorizedException('Email tidak ditemukan di tenant ini.');
    }

    const isValid = await PasswordUtil.compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Password salah.');
    }

    const tokens = await this.issueTokens(user, activeTenant);
    return this.buildAuthResponse(user, activeTenant, tokens);
  }

  // ===========================================================
  // 🧩 REFRESH TOKEN
  // ===========================================================
  async refresh(dto: RefreshTokenDto, tenant: NullableTenant) {
    const activeTenant = this.ensureTenant(tenant);
    const refreshToken = dto.refreshToken;

    if (!refreshToken) {
      throw new BadRequestException('Refresh token wajib disertakan.');
    }

    const payload = await this.verifyRefreshToken(refreshToken);

    if (payload.tenantId !== activeTenant.id) {
      throw new UnauthorizedException('Refresh token tidak sesuai dengan tenant aktif.');
    }

    const storedTokenValid = await this.authRepo.validateRefreshToken(
      payload.sub,
      refreshToken,
    );
    if (!storedTokenValid) {
      throw new UnauthorizedException('Refresh token tidak valid atau sudah dicabut.');
    }

    const user = await this.authRepo.findUserById(payload.sub, activeTenant.id);
    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan untuk tenant ini.');
    }

    await this.authRepo.revokeRefreshToken(refreshToken);

    const tokens = await this.issueTokens(user, activeTenant);
    return this.buildAuthResponse(user, activeTenant, tokens);
  }

  // ===========================================================
  // 🧩 LOGOUT
  // ===========================================================
  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token wajib disertakan.');
    }
    await this.authRepo.revokeRefreshToken(refreshToken);
    return { message: 'Logout berhasil' };
  }

  // ===========================================================
  // 🧩 VALIDASI USER (untuk guard)
  // ===========================================================
  async validateUser(email: string, password: string, tenant: NullableTenant) {
    const activeTenant = this.ensureTenant(tenant);

    const user = await this.authRepo.findUserByEmail(email, activeTenant.id);
    if (!user) return null;

    const isValid = await PasswordUtil.compare(password, user.password);
    if (!isValid) return null;

    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  // ===========================================================
  // 🔐 UTILITAS INTERNAL
  // ===========================================================
  private async issueTokens(
    user: { id: string; email: string; role: string },
    tenant: TenantContext,
  ) {
    return this.tokenUtil.generateTokens(user, tenant);
  }

  private buildAuthResponse(
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      tenantId: string;
      password?: string | null;
    },
    tenant: TenantContext,
    tokens: TokenResponse,
  ) {
    const { password: _password, ...safeUser } = user;
    return {
      tenant: {
        id: tenant.id,
        code: this.resolveTenantCode(tenant),
        name: tenant.name,
      },
      user: safeUser,
      tokens,
    };
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      return await this.tokenUtil.verifyRefresh(token);
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid.');
    }
  }

  private ensureTenant(tenant: NullableTenant): TenantContext {
    if (!tenant?.id) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }
    return this.normalizeTenant(tenant as TenantContext);
  }

  private resolveTenantCode(tenant: TenantContext): string {
    return tenant.code?.trim() || tenant.domain?.trim() || tenant.id;
  }

  private normalizeTenant(tenant: TenantContext): TenantContext {
    return {
      ...tenant,
      code: tenant.code ?? tenant.domain ?? tenant.id,
    };
  }
}
