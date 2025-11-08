import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { PaginatedRequestDto } from '../../common/pagination/paginated-request.dto';
import { PaginatedResponseDto } from '../../common/pagination/paginated-response.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { CreateTenantWithOwnerDto } from './dto/create-tenant-with-owner.dto';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ===========================================================
  // 🧩 CREATE TENANT
  // ===========================================================
  @Post()
  @ApiOperation({
    summary: 'Create new tenant and bootstrap owner account (admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant and owner created successfully',
  })
  create(@Body() dto: CreateTenantWithOwnerDto) {
    return this.tenantsService.createTenantWithOwner(dto);
  }

  // ===========================================================
  // 📜 LIST TENANTS (with Pagination & Search)
  // ===========================================================
  @Get()
  @ApiOperation({ summary: 'List all tenants with pagination & search' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Nomor halaman (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Jumlah item per halaman (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'kopi',
    description: 'Kata kunci pencarian tenant berdasarkan nama / deskripsi',
  })
  async findAll(@Query() query: PaginatedRequestDto) {
    return this.tenantsService.findAll(query);
  }

  // ===========================================================
  // 🔍 FIND ONE TENANT
  // ===========================================================
  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant detail retrieved successfully',
    type: TenantResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findById(id);
  }

  // ===========================================================
  // 🧱 UPDATE TENANT
  // ===========================================================
  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
    type: TenantResponseDto,
  })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  // ===========================================================
  // 🗑️ DELETE TENANT
  // ===========================================================
  @Delete(':id')
  @ApiOperation({ summary: 'Delete tenant' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
