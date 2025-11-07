import { ApiProperty } from '@nestjs/swagger';

export class TenantResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ required: false }) domain?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
