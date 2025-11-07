import { PartialType, ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { Role } from '@prisma/client';

/**
 * DTO untuk update data user.
 * Semua field opsional, tapi tetap divalidasi jika dikirim.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    example: 'John Doe Updated',
    required: false,
    description: 'Nama baru pengguna (opsional)',
  })
  @ValidateIf((o) => o.name !== undefined)
  @IsString({ message: 'Nama harus berupa teks' })
  @MinLength(3, { message: 'Nama minimal 3 karakter' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'PasswordBaru123',
    required: false,
    description:
      'Password baru (opsional, minimal 6 karakter, harus mengandung huruf dan angka)',
  })
  @ValidateIf((o) => o.password !== undefined)
  @IsString({ message: 'Password harus berupa teks' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  @MaxLength(50, { message: 'Password maksimal 50 karakter' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+=-]{6,}$/, {
    message:
      'Password harus mengandung minimal satu huruf dan satu angka',
  })
  @IsOptional()
  password?: string;

  @ApiProperty({
    enum: Role,
    example: 'STAFF',
    required: false,
    description: 'Role baru pengguna (opsional)',
  })
  @ValidateIf((o) => o.role !== undefined)
  @IsEnum(Role, {
    message: 'Role harus salah satu dari: ADMIN, STAFF, CUSTOMER',
  })
  @IsOptional()
  role?: Role;
}
