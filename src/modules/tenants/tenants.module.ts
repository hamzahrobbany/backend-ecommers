import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { PaginationModule } from '../../common/pagination';

@Module({
  imports: [PrismaModule, PaginationModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
