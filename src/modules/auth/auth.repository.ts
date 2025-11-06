import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { Role } from '@prisma/client'; // ✅ tambahkan ini

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

   createUser(dto: RegisterDto & { password: string }) {
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: dto.password,
        role: (dto.role as Role) ?? Role.CUSTOMER, // ✅ pakai enum Role
        tenantId: dto.tenantId ?? '',
      },
    });
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  async revokeRefreshToken(token: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
  }

  async validateRefreshToken(userId: string, token: string) {
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { userId, token },
    });
    return !!tokenRecord;
  }
}
