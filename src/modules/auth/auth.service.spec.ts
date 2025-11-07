import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { PasswordUtil } from './utils/password.util';
import { TokenUtil } from './utils/token.util';
import { Tenant } from '../tenants/entities/tenant.entity';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let repo: AuthRepository;
  let jwt: JwtService;

  const mockTenant: Tenant = {
    id: 'tenant-uuid',
    name: 'Toko Salwa',
    domain: 'salwa',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-uuid',
    email: 'user@example.com',
    name: 'User Test',
    password: 'hashed123',
    role: 'CUSTOMER',
    tenantId: mockTenant.id,
  };

  const mockTokens = {
    access_token: 'ACCESS_TOKEN',
    refresh_token: 'REFRESH_TOKEN',
  };

  const mockRepo = {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn(),
    validateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
  };

  const mockJwt = {
    signAsync: jest.fn().mockResolvedValue('JWT_TOKEN'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repo = module.get<AuthRepository>(AuthRepository);
    jwt = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  // ===========================================================
  // 🧩 REGISTER
  // ===========================================================
  describe('register()', () => {
    it('✅ sukses register user baru dengan tenant', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);
      mockRepo.createUser.mockResolvedValue(mockUser);

      jest.spyOn(PasswordUtil, 'hashPassword').mockResolvedValue('hashed123');
      jest.spyOn(TokenUtil.prototype, 'generateTokenPair').mockResolvedValue(mockTokens);

      const dto = { email: 'user@example.com', name: 'User Test', password: '123456' };
      const result = await service.register(dto as any, mockTenant);

      expect(mockRepo.findUserByEmail).toHaveBeenCalledWith('user@example.com', mockTenant.id);
      expect(result.user).toEqual(mockUser);
      expect(result.tokens).toEqual(mockTokens);
    });

    it('❌ gagal jika tenant tidak ditemukan', async () => {
      await expect(service.register({} as any, null as any)).rejects.toThrow(BadRequestException);
    });

    it('❌ gagal jika email sudah terdaftar', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(mockUser);
      const dto = { email: mockUser.email, password: '123456' };
      await expect(service.register(dto as any, mockTenant)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ===========================================================
  // 🧩 LOGIN
  // ===========================================================
  describe('login()', () => {
    it('✅ sukses login dengan password benar', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(mockUser);
      jest.spyOn(PasswordUtil, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(TokenUtil.prototype, 'generateTokenPair').mockResolvedValue(mockTokens);

      const dto = { email: mockUser.email, password: '123456' };
      const result = await service.login(dto as any);

      expect(result.user).toEqual(mockUser);
      expect(result.tokens).toEqual(mockTokens);
    });

    it('❌ gagal jika email tidak ditemukan', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'x', password: 'y' } as any)).rejects.toThrow(UnauthorizedException);
    });

    it('❌ gagal jika password salah', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(mockUser);
      jest.spyOn(PasswordUtil, 'comparePassword').mockResolvedValue(false);
      await expect(service.login({ email: 'x', password: 'y' } as any)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ===========================================================
  // 🧩 REFRESH TOKEN
  // ===========================================================
  describe('refresh()', () => {
    it('✅ sukses memperbarui token', async () => {
      mockRepo.validateRefreshToken.mockResolvedValue(true);
      mockRepo.findUserById.mockResolvedValue(mockUser);
      jest.spyOn(TokenUtil.prototype, 'generateTokenPair').mockResolvedValue(mockTokens);

      const result = await service.refresh(mockUser.id, 'REFRESH_TOKEN');
      expect(result.tokens).toEqual(mockTokens);
    });

    it('❌ gagal jika refresh token tidak valid', async () => {
      mockRepo.validateRefreshToken.mockResolvedValue(false);
      await expect(service.refresh(mockUser.id, 'REFRESH_TOKEN')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ===========================================================
  // 🧩 LOGOUT
  // ===========================================================
  describe('logout()', () => {
    it('✅ sukses logout', async () => {
      mockRepo.revokeRefreshToken.mockResolvedValue(undefined);
      const result = await service.logout('TOKEN123');
      expect(result).toEqual({ message: 'Logout berhasil' });
    });

    it('❌ gagal jika token kosong', async () => {
      await expect(service.logout('')).rejects.toThrow(BadRequestException);
    });
  });
});
