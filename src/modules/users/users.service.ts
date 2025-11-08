import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationService, PaginatedRequestDto } from '../../common/pagination';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationService,
  ) {}

  // ===========================================================
  // 🧩 CREATE USER
  // ===========================================================
  async create(dto: CreateUserDto, tenantId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role || 'CUSTOMER',
        tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  // ===========================================================
  // 📜 FIND ALL (Pagination + Search + Sort)
  // ===========================================================
  async findAll(tenantId: string, dto: PaginatedRequestDto) {
    // Gunakan prismaPaginate helper dari PaginationService
    return this.pagination.prismaPaginate(this.prisma.user, dto, {
      baseQuery: {
        where: { tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
      searchFields: ['name', 'email'],
    });
  }

  // ===========================================================
  // 🔍 FIND USER BY ID
  // ===========================================================
  async findById(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }
    return user;
  }

  // ===========================================================
  // ✏️ UPDATE USER
  // ===========================================================
  async update(id: string, dto: UpdateUserDto, tenantId: string) {
    await this.findById(id, tenantId);

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // ===========================================================
  // ❌ DELETE USER
  // ===========================================================
  async remove(id: string, tenantId: string) {
    const user = await this.findById(id, tenantId);
    await this.prisma.user.delete({ where: { id } });
    return { message: `User "${user.email}" berhasil dihapus.` };
  }
}
