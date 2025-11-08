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
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let repo: jest.Mocked<AuthRepository>;

  const mockTenant = {
    id: 'tenant-uuid',
    name: 'Toko Salwa',
    domain: 'salwa',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockUser = {
    id: 'user-uuid',
    email: 'user@example.com',
    name: 'User Test',
    password: 'hashed123',
    role: 'CUSTOMER',
    tenantId: mockTenant.id,
  } as any;

  const mockTokens = {
    accessToken: 'ACCESS_TOKEN',
    refreshToken: 'REFRESH_TOKEN',
  };

  const mockRepo = {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn(),
    validateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    saveRefreshToken: jest.fn(),
  } as unknown as jest.Mocked<AuthRepository>;

  const mockJwt = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  } as unknown as JwtService;

  beforeEach(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repo = module.get(AuthRepository);

    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('✅ sukses register user baru dengan tenant', async () => {
      repo.findUserByEmail.mockResolvedValue(null);
      repo.createUser.mockResolvedValue(mockUser);

      jest.spyOn(PasswordUtil, 'hash').mockResolvedValue('hashed123');
      jest.spyOn(TokenUtil.prototype, 'generateTokens').mockResolvedValue(mockTokens);

      const dto = { email: 'user@example.com', name: 'User Test', password: '123456' };
      const result = await service.register(dto as any, mockTenant);

      expect(repo.findUserByEmail).toHaveBeenCalledWith('user@example.com', mockTenant.id);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        tenantId: mockUser.tenantId,
      });
      expect(result.tokens).toEqual(mockTokens);
      expect(result.tenant).toEqual({
        id: mockTenant.id,
        code: mockTenant.domain,
        name: mockTenant.name,
      });
    });

    it('❌ gagal jika tenant tidak ditemukan', async () => {
      await expect(service.register({} as any, null)).rejects.toThrow(BadRequestException);
    });

    it('❌ gagal jika email sudah terdaftar', async () => {
      repo.findUserByEmail.mockResolvedValue(mockUser);
      const dto = { email: mockUser.email, password: '123456', name: 'User Test' };
      await expect(service.register(dto as any, mockTenant)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login()', () => {
    it('✅ sukses login dengan password benar', async () => {
      repo.findUserByEmail.mockResolvedValue(mockUser);
      jest.spyOn(PasswordUtil, 'compare').mockResolvedValue(true);
      jest.spyOn(TokenUtil.prototype, 'generateTokens').mockResolvedValue(mockTokens);

      const dto = { email: mockUser.email, password: '123456' };
      const result = await service.login(dto as any, mockTenant);

      expect(result.tokens).toEqual(mockTokens);
    });

    it('❌ gagal jika email tidak ditemukan', async () => {
      repo.findUserByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'x', password: 'y' } as any, mockTenant)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('❌ gagal jika password salah', async () => {
      repo.findUserByEmail.mockResolvedValue(mockUser);
      jest.spyOn(PasswordUtil, 'compare').mockResolvedValue(false);
      await expect(service.login({ email: 'x', password: 'y' } as any, mockTenant)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh()', () => {
    it('✅ sukses memperbarui token', async () => {
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tenantId: mockTenant.id,
        tenantCode: mockTenant.domain,
      };

      jest.spyOn(TokenUtil.prototype, 'verifyRefresh').mockResolvedValue(payload as any);
      repo.validateRefreshToken.mockResolvedValue(true);
      repo.findUserById.mockResolvedValue(mockUser);
      repo.revokeRefreshToken.mockResolvedValue(undefined);
      jest.spyOn(TokenUtil.prototype, 'generateTokens').mockResolvedValue(mockTokens);

      const dto = { refreshToken: 'REFRESH_TOKEN' } as any;
      const result = await service.refresh(dto, mockTenant);
      expect(result.tokens).toEqual(mockTokens);
      expect(repo.revokeRefreshToken).toHaveBeenCalledWith('REFRESH_TOKEN');
    });

    it('❌ gagal jika refresh token tidak valid', async () => {
      jest.spyOn(TokenUtil.prototype, 'verifyRefresh').mockRejectedValue(new Error('invalid'));
      const dto = { refreshToken: 'REFRESH_TOKEN' } as any;

      await expect(service.refresh(dto, mockTenant)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout()', () => {
    it('✅ sukses logout', async () => {
      repo.revokeRefreshToken.mockResolvedValue(undefined);
      const result = await service.logout('TOKEN123');
      expect(result).toEqual({ message: 'Logout berhasil' });
    });

    it('❌ gagal jika token kosong', async () => {
      await expect(service.logout('')).rejects.toThrow(BadRequestException);
    });
    return { message: 'Logout berhasil.' };
  }
}
