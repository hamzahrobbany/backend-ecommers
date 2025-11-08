import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateTenantWithOwnerDto {
  @IsNotEmpty()
  code: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  ownerName: string;

  @IsEmail()
  ownerEmail: string;

  @MinLength(6)
  ownerPassword: string;
}
