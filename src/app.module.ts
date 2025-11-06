import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { TenantsModule } from './tenants/tenants.module';
import { SubscribeModule } from './subscribe/subscribe.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    ProductsModule,
    TenantsModule,
    SubscribeModule,
    UsersModule,
  ],
})
export class AppModule {}
