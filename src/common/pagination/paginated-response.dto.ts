import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Data hasil paginasi', isArray: true })
  data: T[];

  @ApiProperty({
    example: { total: 100, page: 1, limit: 10, totalPages: 10 },
    description: 'Metadata paginasi',
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
