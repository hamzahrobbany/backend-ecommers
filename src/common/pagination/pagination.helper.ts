import { Prisma, PrismaClient } from '@prisma/client';
import { PaginatedRequestDto } from './paginated-request.dto';
import { PaginatedResponseDto } from './paginated-response.dto';

export type PrismaDelegateKey = {
  [K in keyof PrismaClient]: PrismaClient[K] extends { findMany(args?: any): any; count(args?: any): any }
    ? K extends `$${string}`
      ? never
      : K
    : never;
}[keyof PrismaClient];

export type PrismaDelegateMap = {
  [K in PrismaDelegateKey]: PrismaClient[K];
};

type FindManyArgs<K extends PrismaDelegateKey> = Prisma.Args<PrismaDelegateMap[K], 'findMany'>;
type CountArgs<K extends PrismaDelegateKey> = Prisma.Args<PrismaDelegateMap[K], 'count'>;
type WhereInput<K extends PrismaDelegateKey> = FindManyArgs<K>['where'];
type DelegateExecutor<K extends PrismaDelegateKey> = {
  findMany(args?: FindManyArgs<K>): Promise<unknown>;
  count(args?: CountArgs<K>): Promise<number>;
};

export interface PaginatePrismaOptions<K extends PrismaDelegateKey> {
  /**
   * Prisma findMany args dasar (where, select, include, dsb).
   * Akan digabung dengan skip/take, search, dan orderBy dari DTO.
   */
  baseQuery?: FindManyArgs<K>;
  /**
   * Kolom yang diizinkan untuk pencarian full-text sederhana (contains, case-insensitive).
   */
  searchFields?: string[];
}

/**
 * Helper universal pagination untuk semua Prisma delegate.
 * - Mendukung pencarian sederhana via OR pada kolom yang disediakan.
 * - Menghormati orderBy bawaan, atau jatuh ke DTO sortBy/sortOrder.
 * - Mengembalikan PaginatedResponseDto standar.
 */
export async function paginatePrismaQuery<
  T,
  K extends PrismaDelegateKey,
>(model: PrismaDelegateMap[K], dto: PaginatedRequestDto, options: PaginatePrismaOptions<K> = {}): Promise<PaginatedResponseDto<T>> {
  const { baseQuery, searchFields = [] } = options;
  const { page = 1, limit = 10, search, sortBy, sortOrder } = dto;

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
  const skip = (safePage - 1) * safeLimit;
  const take = safeLimit;

  const baseWhere = baseQuery?.where ? ({ ...baseQuery.where } as WhereInput<K>) : undefined;
  const searchFilter = buildSearchFilter<K>(search, searchFields);
  const where = mergeWhereClauses(baseWhere, searchFilter);

  const baseFindMany = baseQuery ?? ({} as FindManyArgs<K>);
  const effectiveOrderBy =
    baseFindMany.orderBy ??
    (sortBy
      ? ({ [sortBy]: sortOrder ?? 'desc' } as FindManyArgs<K>['orderBy'])
      : undefined);

  const findManyArgs: FindManyArgs<K> = {
    ...baseFindMany,
    where,
    skip,
    take,
    ...(effectiveOrderBy ? { orderBy: effectiveOrderBy } : {}),
  };

  const countArgs: CountArgs<K> = where ? ({ where } as CountArgs<K>) : ({} as CountArgs<K>);

  const delegate = model as unknown as DelegateExecutor<K>;

  const [data, total] = await Promise.all([
    delegate.findMany(findManyArgs),
    delegate.count(countArgs),
  ]);

  return new PaginatedResponseDto<T>(data as T[], total, safePage, safeLimit);
}

function buildSearchFilter<K extends PrismaDelegateKey>(
  search?: string,
  searchFields: string[] = [],
): WhereInput<K> | undefined {
  if (!search || searchFields.length === 0) {
    return undefined;
  }

  const orConditions = searchFields.map((field) => ({
    [field]: { contains: search, mode: 'insensitive' },
  }));

  return { OR: orConditions } as WhereInput<K>;
}

function mergeWhereClauses<K extends PrismaDelegateKey>(
  baseWhere: WhereInput<K> | undefined,
  searchFilter: WhereInput<K> | undefined,
): WhereInput<K> | undefined {
  if (!searchFilter) return baseWhere;
  if (!baseWhere) return searchFilter;

  const { AND, ...rest } = baseWhere as Record<string, any>;
  const normalizedAnd = normalizeEnumerable<WhereInput<K>>(AND);

  return {
    ...rest,
    AND: [...normalizedAnd, searchFilter],
  } as WhereInput<K>;
}

function normalizeEnumerable<T>(value: Prisma.Enumerable<T> | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? [...value] : [value];
}
