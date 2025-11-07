import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';
import { IsOptional, IsString, ValidateIf } from 'class-validator';

/**
 * DTO untuk update data Tenant.
 * Menggunakan PartialType agar semua field opsional,
 * ditambah validasi kondisional untuk keamanan input.
 */
export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiProperty({
    example: 'Toko Salwa Updated',
    required: false,
    description: 'Nama tenant (opsional, hanya jika ingin diubah)',
  })
  @ValidateIf((o) => o.name !== undefined)
  @IsString({ message: 'Name harus berupa string' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'salwa-store',
    required: false,
    description: 'Domain unik tenant (opsional, hanya jika ingin diubah)',
  })
  @ValidateIf((o) => o.domain !== undefined)
  @IsString({ message: 'Domain harus berupa string' })
  @IsOptional()
  domain?: string;
}
