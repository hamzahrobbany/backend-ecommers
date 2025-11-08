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
import {
  PaginatedRequestDto,
  PaginatedResponseDto,
} from '../../common/pagination';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ===========================================================
  // 🧩 CREATE USER
  // ===========================================================
  @Post()
  @ApiOperation({ summary: 'Tambah user baru untuk tenant aktif' })
  @ApiResponse({
    status: 201,
    description: 'User berhasil dibuat',
    type: UserResponseDto,
  })
  async create(@Body() dto: CreateUserDto, @Req() req: Request) {
<<<<<<< ours
    const tenant = (req as any).tenant;
    if (!tenant) throw new BadRequestException('Tenant context missing');

    return this.usersService.create(dto, tenant.id);
=======
    const tenantId = req.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant context missing');
    return this.usersService.create(dto, tenantId);
>>>>>>> theirs
  }

  // ===========================================================
  // 📜 LIST USERS (Pagination, Search, Sort)
  // ===========================================================
  @Get()
  @ApiOperation({
    summary:
      'List semua user di tenant aktif (dengan pagination, search, dan sorting)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Nomor halaman (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Jumlah item per halaman (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    example: 'jhon',
    description: 'Kata kunci pencarian user (nama, email, atau phone)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    example: 'createdAt',
    description: 'Kolom yang digunakan untuk sorting',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    example: 'desc',
    description: 'Arah sorting: asc atau desc',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar user dengan pagination',
    type: PaginatedResponseDto<UserResponseDto>,
  })
  async findAll(@Req() req: Request, @Query() query: PaginatedRequestDto) {
<<<<<<< ours
    const tenant = (req as any).tenant;
    if (!tenant) throw new BadRequestException('Tenant context missing');

    return this.usersService.findAll(tenant.id, query);
=======
    const tenantId = req.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant context missing');

    return this.usersService.findAll(
      tenantId,
      query.page,
      query.limit,
      query.search,
      query.sortBy,
      query.sortOrder,
    );
>>>>>>> theirs
  }

  // ===========================================================
  // 🔍 DETAIL USER BY ID
  // ===========================================================
  @Get(':id')
  @ApiOperation({ summary: 'Lihat detail user berdasarkan ID' })
  @ApiResponse({
    status: 200,
    description: 'Detail user',
    type: UserResponseDto,
  })
<<<<<<< ours
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const tenant = (req as any).tenant;
    if (!tenant) throw new BadRequestException('Tenant context missing');

    return this.usersService.findById(id, tenant.id);
=======
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const tenantId = req.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant context missing');
    return this.usersService.findById(id, tenantId);
>>>>>>> theirs
  }

  // ===========================================================
  // ✏️ UPDATE USER
  // ===========================================================
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
<<<<<<< ours
  ) {
    const tenant = (req as any).tenant;
    if (!tenant) throw new BadRequestException('Tenant context missing');

    return this.usersService.update(id, dto, tenant.id);
=======
  ): Promise<UserResponseDto> {
    const tenantId = req.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant context missing');
    return this.usersService.update(id, dto, tenantId);
>>>>>>> theirs
  }

  // ===========================================================
  // 🗑️ DELETE USER
  // ===========================================================
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus user dari tenant aktif' })
  @ApiResponse({
    status: 200,
    description: 'User berhasil dihapus',
    schema: { example: { message: 'User berhasil dihapus.' } },
  })
  async remove(@Param('id') id: string, @Req() req: Request) {
<<<<<<< ours
    const tenant = (req as any).tenant;
    if (!tenant) throw new BadRequestException('Tenant context missing');

    return this.usersService.remove(id, tenant.id);
=======
    const tenantId = req.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant context missing');
    return this.usersService.remove(id, tenantId);
>>>>>>> theirs
  }
}
