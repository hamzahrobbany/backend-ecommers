
//src/common/pagination/paginated-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO generik untuk response hasil pagination.
 * Bisa digunakan di semua modul (Users, Products, Orders, dsb).
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Data hasil query',
    isArray: true,
    example: [
      {
        id: 'uuid',
        name: 'John Doe',
        email: 'john@example.com',
      },
    ],
  })
  data: T[];

  @ApiProperty({
    description: 'Jumlah total item yang ditemukan',
    example: 42,
  })
  total: number;

  @ApiProperty({
    description: 'Nomor halaman saat ini',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Jumlah item per halaman',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Jumlah total halaman',
    example: 5,
  })
  totalPages: number;
}
