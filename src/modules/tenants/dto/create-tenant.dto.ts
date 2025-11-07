import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Toko Salwa' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'salwa', required: false })
  @IsOptional()
  @IsString()
  domain?: string;
}
