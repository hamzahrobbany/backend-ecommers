import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import {
  PaginationService,
  PaginatedRequestDto,
} from '../../common/pagination';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationService,
  ) {}

  // ===========================================================
  // 🧩 CREATE TENANT
  // ===========================================================
  async create(dto: CreateTenantDto) {
    // 🔹 Validasi code unik
    const existingCode = await this.prisma.tenant.findUnique({
      where: { code: dto.code },
    });
    if (existingCode) {
      throw new BadRequestException(
        `Kode tenant "${dto.code}" sudah digunakan`,
      );
    }

    // 🔹 Validasi domain unik (jika ada)
    if (dto.domain) {
      const existingDomain = await this.prisma.tenant.findUnique({
        where: { domain: dto.domain },
      });
      if (existingDomain) {
        throw new BadRequestException(
          `Domain "${dto.domain}" sudah digunakan oleh tenant lain`,
        );
      }
    }

    return await this.prisma.tenant.create({ data: dto });
  }

  // ===========================================================
  // 📜 FIND ALL (with Pagination & Search)
  // ===========================================================
  async findAll(dto: PaginatedRequestDto) {
    return await this.pagination.prismaPaginate(this.prisma.tenant, dto, {
      baseQuery: { orderBy: { createdAt: 'desc' } },
      searchFields: ['name', 'code', 'domain', 'email'],
    });
  }

  // ===========================================================
  // 🔍 FIND ONE BY ID
  // ===========================================================
  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant dengan ID "${id}" tidak ditemukan`);
    }
    return tenant;
  }

  // ===========================================================
  // 🔍 FIND ONE BY CODE
  // ===========================================================
  async findByCode(code: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { code } });
    if (!tenant) {
      throw new NotFoundException(
        `Tenant dengan kode "${code}" tidak ditemukan`,
      );
    }
    return tenant;
  }

  // ===========================================================
  // 🔍 FIND ONE BY DOMAIN
  // ===========================================================
  async findByDomain(domain: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { domain } });
    if (!tenant) {
      throw new NotFoundException(
        `Tenant dengan domain "${domain}" tidak ditemukan`,
      );
    }
    return tenant;
  }

  // ===========================================================
  // 🧱 UPDATE TENANT
  // ===========================================================
  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.findById(id);

    // 🔹 Cek code unik jika diubah
    if (dto.code && dto.code !== tenant.code) {
      const existingCode = await this.prisma.tenant.findUnique({
        where: { code: dto.code },
      });
      if (existingCode) {
        throw new BadRequestException(
          `Kode "${dto.code}" sudah digunakan oleh tenant lain`,
        );
      }
    }

    // 🔹 Cek domain unik jika diubah
    if (dto.domain && dto.domain !== tenant.domain) {
      const existingDomain = await this.prisma.tenant.findUnique({
        where: { domain: dto.domain },
      });
      if (existingDomain) {
        throw new BadRequestException(
          `Domain "${dto.domain}" sudah digunakan oleh tenant lain`,
        );
      }
    }

    return await this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  // ===========================================================
  // 🗑️ DELETE TENANT
  // ===========================================================
  async remove(id: string) {
    await this.findById(id);
    await this.prisma.tenant.delete({ where: { id } });
    return { message: `Tenant dengan ID "${id}" berhasil dihapus` };
  }
}
