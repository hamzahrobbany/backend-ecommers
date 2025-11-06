import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordUtil } from './utils/password.util';
import { TokenUtil } from './utils/token.util';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private tokenUtil: TokenUtil;

  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
  ) {
    this.tokenUtil = new TokenUtil(this.jwtService);
  }

  async register(dto: RegisterDto) {
    const exists = await this.authRepo.findUserByEmail(dto.email);
    if (exists) throw new UnauthorizedException('Email sudah terdaftar');

    const hashed = await PasswordUtil.hashPassword(dto.password);
    const user = await this.authRepo.createUser({ ...dto, password: hashed });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
    const tokens = await this.tokenUtil.generateTokenPair(payload);
    return { user, tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.authRepo.findUserByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Email tidak ditemukan');

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


  async logout(token: string) {
    await this.authRepo.revokeRefreshToken(token);
    return { message: 'Logout berhasil' };
  }

  async validateUser(email: string, password: string) {
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) return null;
    const isValid = await PasswordUtil.comparePassword(password, user.password);
    return isValid ? user : null;
  }
}
