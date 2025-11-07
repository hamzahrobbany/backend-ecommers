import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================
  // 🔍 Cari user berdasarkan email (opsional tenant)
  // ===========================================================
  findUserByEmail(email: string, tenantId?: string) {
    if (tenantId) {
      return this.prisma.user.findFirst({
        where: { email, tenantId },
      });
    }
    return this.prisma.user.findUnique({ where: { email } });
  }

  // ===========================================================
  // 🔍 Cari user berdasarkan ID
  // ===========================================================
  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // ===========================================================
  // 🧩 Buat user baru (dengan tenant)
  // ===========================================================
  createUser(dto: RegisterDto & { password: string; tenantId: string }) {
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: dto.password,
        role: (dto.role as Role) ?? Role.CUSTOMER,
        tenantId: dto.tenantId, // ✅ wajib tenantId valid
      },
    });
  }

  // ===========================================================
  // 💾 Simpan refresh token
  // ===========================================================
  async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  // ===========================================================
  // 🚪 Cabut (hapus) refresh token
  // ===========================================================
  async revokeRefreshToken(token: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
  }

  // ===========================================================
  // 🔐 Validasi refresh token
  // ===========================================================
  async validateRefreshToken(userId: string, token: string) {
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { userId, token },
    });
    return !!tokenRecord;
  }
}
