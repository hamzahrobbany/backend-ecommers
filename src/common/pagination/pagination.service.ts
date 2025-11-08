import { Injectable } from '@nestjs/common';
import { PaginatedRequestDto } from './paginated-request.dto';
import { PaginatedResponseDto } from './paginated-response.dto';
import {
  paginatePrismaQuery,
  PaginatePrismaOptions,
  PrismaDelegateKey,
  PrismaDelegateMap,
} from './pagination.helper';

@Injectable()
export class PaginationService {
  buildPagination(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }

  buildResponse<T>(data: T[], total: number, page = 1, limit = 10) {
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async prismaPaginate<T, K extends PrismaDelegateKey>(
    model: PrismaDelegateMap[K],
    dto: PaginatedRequestDto,
    options: PaginatePrismaOptions<K> = {},
  ): Promise<PaginatedResponseDto<T>> {
    return paginatePrismaQuery<T, K>(model, dto, options);
  }
}
