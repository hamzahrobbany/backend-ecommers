
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PaginationModule } from '../../common/pagination';

@Module({
  imports: [PrismaModule, PaginationModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
