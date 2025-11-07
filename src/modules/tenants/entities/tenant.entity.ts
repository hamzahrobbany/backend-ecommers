import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

/**
 * 🏢 Tenant Entity — sinkron dengan Prisma model Tenant
 * -------------------------------------------------------
 * Representasi kelas TypeScript untuk model Prisma `Tenant`.
 * Dipakai untuk response DTO, middleware context, dan dokumentasi Swagger.
 */
export class Tenant {
  @ApiProperty({
    example: 'c9a1f9c2-87e5-4a0f-8a1b-49dc421cf16e',
    description: 'UUID unik untuk tenant',
  })
  id: string;

  @ApiProperty({
    example: 'Toko Salwa',
    description: 'Nama tenant (store, toko, koperasi)',
  })
  name: string;

  @ApiProperty({
    example: 'salwa',
    nullable: true,
    description: 'Domain unik atau kode tenant (opsional)',
  })
  domain: string | null;

  @ApiProperty({
    example: '2025-11-08T12:00:00.000Z',
    description: 'Waktu pembuatan tenant',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-11-08T12:10:00.000Z',
    description: 'Waktu pembaruan terakhir',
  })
  updatedAt: Date;

  // ⚙️ Relasi (optional) - sesuai Prisma
  @ApiProperty({
    type: () => [User],
    required: false,
    description: 'Daftar user yang terhubung ke tenant ini',
  })
  users?: User[];
}
