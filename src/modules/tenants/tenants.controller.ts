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
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ===========================================================
  // 🧩 CREATE TENANT
  // ===========================================================
  @Post()
  @ApiOperation({ summary: 'Create new tenant (store / toko)' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  // ===========================================================
  // 📜 LIST TENANTS (with Pagination)
  // ===========================================================
  @Get()
  @ApiOperation({ summary: 'List all tenants with pagination' })
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
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    return this.tenantsService.findAll({
      page: parsedPage > 0 ? parsedPage : 1,
      limit: parsedLimit > 0 ? parsedLimit : 10,
    });
  }

  // ===========================================================
  // 🔍 FIND ONE TENANT
  // ===========================================================
  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findById(id);
  }

  // ===========================================================
  // 🧱 UPDATE TENANT
  // ===========================================================
  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  // ===========================================================
  // 🗑️ DELETE TENANT
  // ===========================================================
  @Delete(':id')
  @ApiOperation({ summary: 'Delete tenant' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
