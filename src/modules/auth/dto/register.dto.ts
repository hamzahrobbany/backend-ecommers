import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { Role } from '@prisma/client'; // pastikan enum Role di-import

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'CUSTOMER',
    required: false,
    enum: Role,
    description: 'Peran pengguna, default CUSTOMER',
  })
  @IsOptional()
  role?: Role;

}
