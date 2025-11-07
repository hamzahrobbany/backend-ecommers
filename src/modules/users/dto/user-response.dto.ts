import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/**
 * DTO untuk response data User.
 * Digunakan untuk menghindari kebocoran data sensitif seperti password.
 */
export class UserResponseDto {
  @ApiProperty({
    example: 'f8a2c13e-7b23-4c3a-b0f2-9f41a1eaa6c1',
    description: 'ID unik pengguna (UUID)',
  })
  id: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Nama lengkap pengguna',
  })
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Alamat email pengguna',
  })
  email: string;

  @ApiProperty({
    enum: Role,
    example: 'CUSTOMER',
    description: 'Peran pengguna dalam tenant (ADMIN, STAFF, CUSTOMER)',
  })
  role: Role;

  @ApiProperty({
    example: 'a92c1c5b-18f4-4b5b-a812-8cb77d6e12a1',
    description: 'ID tenant tempat pengguna terdaftar',
  })
  tenantId: string;

  @ApiProperty({
    example: '2025-11-07T15:21:33.000Z',
    description: 'Tanggal saat user pertama kali dibuat',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-11-07T16:00:00.000Z',
    description: 'Tanggal terakhir kali data user diperbarui',
  })
  updatedAt: Date;
}
