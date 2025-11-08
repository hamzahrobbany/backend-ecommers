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
    private readonly jwtService: JwtService,
  ) {
    this.tokenUtil = new TokenUtil(this.jwtService, this.authRepo);
  }

  async register(dto: RegisterDto, tenant: NullableTenant) {
    const activeTenant = this.ensureTenant(tenant);

    const existing = await this.authRepo.findUserByEmail(dto.email, activeTenant.id);
    if (existing) {
      throw new BadRequestException('Email sudah terdaftar di tenant ini.');
    }

    const hashedPassword = await PasswordUtil.hash(dto.password);

    const user = await this.authRepo.createUser({
      ...dto,
      password: hashedPassword,
      tenantId: activeTenant.id,
    });

    const tokens = await this.issueTokens(user, activeTenant);

    return this.buildAuthResponse(user, activeTenant, tokens);
  }

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

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token wajib disertakan.');
    }

    await this.authRepo.revokeRefreshToken(refreshToken);

    return { message: 'Logout berhasil' };
  }

  async validateUser(email: string, password: string, tenant: NullableTenant) {
    const activeTenant = this.ensureTenant(tenant);

    const user = await this.authRepo.findUserByEmail(email, activeTenant.id);
    if (!user) {
      return null;
    }

    const isValid = await PasswordUtil.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

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
    } catch (error) {
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
    if (tenant.code && tenant.code.trim().length > 0) {
      return tenant.code;
    }

    if (tenant.domain && tenant.domain.trim().length > 0) {
      return tenant.domain;
    }

    return tenant.id;
  }

  private normalizeTenant(tenant: TenantContext): TenantContext {
    return {
      ...tenant,
      code: tenant.code ?? tenant.domain ?? tenant.id,
    };
  }
}
