import { Module } from '@nestjs/common';
import { PaginatedRequestDto } from './paginated-request.dto';
import { PaginatedResponseDto } from './paginated-response.dto';

/**
 * Modul Pagination global — berisi DTO untuk request dan response pagination.
 * Bisa diimport di modul mana pun untuk standardisasi pagination API.
 */
@Module({
  providers: [],
  exports: [PaginatedRequestDto, PaginatedResponseDto],
})
export class PaginationModule {}
