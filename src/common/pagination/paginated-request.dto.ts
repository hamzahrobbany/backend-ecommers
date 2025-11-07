import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO untuk parameter query pagination, search, dan sorting.
 * Bisa digunakan di semua modul controller.
 */
export class PaginatedRequestDto {
  @ApiPropertyOptional({
    description: 'Nomor halaman (default: 1)',
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Jumlah item per halaman (default: 10)',
    example: 10,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Kata kunci pencarian (misalnya: nama atau email)',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Kolom untuk sortir (contoh: name, email, createdAt)',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Urutan sortir: asc / desc (default: desc)',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
