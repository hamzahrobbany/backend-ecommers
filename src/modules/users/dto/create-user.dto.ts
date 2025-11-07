import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Role } from '@prisma/client';

/**
 * DTO untuk membuat user baru.
 * Divalidasi dengan class-validator dan otomatis didokumentasikan di Swagger.
 */
export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Nama lengkap pengguna',
  })
  @IsString({ message: 'Nama harus berupa teks' })
  @MinLength(3, { message: 'Nama minimal 3 karakter' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Alamat email unik pengguna',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Password minimal 6 karakter dan disarankan mengandung huruf besar, kecil, dan angka.',
  })
  @IsString({ message: 'Password harus berupa teks' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  @MaxLength(50, { message: 'Password maksimal 50 karakter' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+=-]{6,}$/, {
    message:
      'Password harus mengandung minimal satu huruf dan satu angka',
  })
  password: string;

  @ApiProperty({
    enum: Role,
    example: 'CUSTOMER',
    required: false,
    description: 'Peran pengguna (ADMIN, STAFF, CUSTOMER)',
  })
  @IsOptional()
  @IsEnum(Role, {
    message: 'Role harus salah satu dari: ADMIN, STAFF, CUSTOMER',
  })
  role?: Role;
}
