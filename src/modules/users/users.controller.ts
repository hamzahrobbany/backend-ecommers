import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedRequestDto } from '../../common/pagination/paginated-request.dto';
import { PaginatedResponseDto } from '../../common/pagination/paginated-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 🧩 CREATE USER
  @Post()
  @ApiOperation({ summary: 'Tambah user baru untuk tenant aktif' })
  @ApiResponse({
    status: 201,
    description: 'User berhasil dibuat',
    type: UserResponseDto,
  })
  async create(@Body() dto: CreateUserDto, @Req() req: Request) {
    const tenant = req.tenant;
    if (!tenant) throw new BadRequestException('Tenant context missing');
    return this.usersService.create(dto, tenant.id);
  }

  // 📜 LIST USER DENGAN PAGINASI, SEARCH & SORT
  @Get()
  @ApiOperation({
    summary: 'List semua user di tenant aktif (dengan paginasi, pencarian, dan sorting)',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar user dengan pagination',
    type: PaginatedResponseDto<UserResponseDto>,
  })
  async findAll(@Req() req: Request, @Query() query: PaginatedRequestDto) {
    const tenant = req.tenant;
    if (!tenant) throw new BadRequestException('Tenant context missing');

    return this.usersService.findAll(
      tenant.id,
      query.page,
      query.limit,
      query.search,
      query.sortBy,
      query.sortOrder,
    );
  }

  // 🔍 DETAIL USER BY ID
  @Get(':id')
  @ApiOperation({ summary: 'Lihat detail user berdasarkan ID' })
  @ApiResponse({
    status: 200,
    description: 'Detail user',
    type: UserResponseDto,
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const tenant = req.tenant;
    if (!tenant) throw new BadRequestException('Tenant context missing');
    return this.usersService.findById(id, tenant.id);
  }

  // ✏️ UPDATE USER
  @Patch(':id')
  @ApiOperation({ summary: 'Update data user' })
  @ApiResponse({
    status: 200,
    description: 'User berhasil diperbarui',
    type: UserResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const tenant = req.tenant;
    if (!tenant) throw new BadRequestException('Tenant context missing');
    return this.usersService.update(id, dto, tenant.id);
  }

  // ❌ DELETE USER
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus user dari tenant aktif' })
  @ApiResponse({
    status: 200,
    description: 'User berhasil dihapus',
    schema: {
      example: { message: 'User berhasil dihapus.' },
    },
  })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const tenant = req.tenant;
    if (!tenant) throw new BadRequestException('Tenant context missing');
    return this.usersService.remove(id, tenant.id);
  }
}
