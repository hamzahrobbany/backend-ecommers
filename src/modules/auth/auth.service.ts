import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordUtil } from './utils/password.util';
import { TokenUtil } from './utils/token.util';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly tokenUtil: TokenUtil;

  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
  ) {
    this.tokenUtil = new TokenUtil(this.jwtService);
  }

  // ===========================================================
  // 🧩 REGISTER (Tenant-aware)
  // ===========================================================
  async register(dto: RegisterDto, tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context tidak ditemukan');
    }

    // ✅ Cek apakah email sudah terdaftar di tenant yang sama
    const exists = await this.authRepo.findUserByEmail(dto.email, tenantId);
    if (exists) {
      throw new UnauthorizedException('Email sudah terdaftar di tenant ini');
    }

    // 🔐 Hash password
    const hashed = await PasswordUtil.hashPassword(dto.password);

    // 🧩 Buat user baru di tenant
    const user = await this.authRepo.createUser({
      ...dto,
      password: hashed,
      tenantId,
    });

    // 🎟️ Buat payload JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId,
    };

    const tokens = await this.tokenUtil.generateTokenPair(payload);
    return { user, tokens };
  }

  // ===========================================================
  // 🧩 LOGIN
  // ===========================================================
  async login(dto: LoginDto, tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context tidak ditemukan');
    }

    const user = await this.authRepo.findUserByEmail(dto.email, tenantId);
    if (!user) {
      throw new UnauthorizedException('Email tidak ditemukan di tenant ini');
    }

    const valid = await PasswordUtil.comparePassword(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Password salah');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const tokens = await this.tokenUtil.generateTokenPair(payload);
    return { user, tokens };
  }

  // ===========================================================
  // 🧩 REFRESH TOKEN
  // ===========================================================
  async refresh(userId: string, refreshToken: string) {
    const valid = await this.authRepo.validateRefreshToken(userId, refreshToken);
    if (!valid) throw new UnauthorizedException('Refresh token tidak valid');

    const user = await this.authRepo.findUserById(userId);
    if (!user) throw new UnauthorizedException('User tidak ditemukan');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const tokens = await this.tokenUtil.generateTokenPair(payload);
    return { user, tokens };
  }

  // ===========================================================
  // 🧩 LOGOUT
  // ===========================================================
  async logout(token: string) {
    if (!token) {
      throw new BadRequestException('Token tidak boleh kosong');
    }

    await this.authRepo.revokeRefreshToken(token);
    return { message: 'Logout berhasil' };
  }

  // ===========================================================
  // 🧩 VALIDATE USER (opsional untuk guard)
  // ===========================================================
  async validateUser(email: string, password: string) {
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) return null;

    const isValid = await PasswordUtil.comparePassword(password, user.password);
    return isValid ? user : null;
  }
}
