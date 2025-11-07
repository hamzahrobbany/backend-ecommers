//src/modules/tenants/tenants.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    // Cek domain unik (jika ada)
    if (dto.domain) {
      const existing = await this.prisma.tenant.findUnique({
        where: { domain: dto.domain },
      });
      if (existing) {
        throw new BadRequestException(`Domain "${dto.domain}" sudah digunakan`);
      }
    }

    return this.prisma.tenant.create({ data: dto });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant dengan ID ${id} tidak ditemukan`);
    return tenant;
  }

  async findByDomain(domain: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { domain } });
    if (!tenant) throw new NotFoundException(`Tenant dengan domain ${domain} tidak ditemukan`);
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.findById(id);

    // ✅ Cek domain unik hanya jika domain diubah
    if (dto.domain && dto.domain !== tenant.domain) {
      const existing = await this.prisma.tenant.findUnique({
        where: { domain: dto.domain },
      });
      if (existing) {
        throw new BadRequestException(
          `Domain "${dto.domain}" sudah digunakan oleh tenant lain`,
        );
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.tenant.delete({ where: { id } });
  }
}
