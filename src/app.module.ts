import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';

// === Import modul lain di sini ===
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { TenantsModule } from './modules/tenants/tenants.module';
// Tambahkan module lain sesuai kebutuhan...
import { DebugController } from './modules/debug/debug.controller';

@Module({
  imports: [
    // Module untuk environment variables
    ConfigModule.forRoot({ isGlobal: true }),

    // Module utama
    PrismaModule,
    TenantsModule,
    AuthModule,
    ProductsModule,
  ],
  controllers: [DebugController],
})
export class AppModule implements NestModule {
  constructor() {
    console.log('🟢 AppModule Loaded!');
    console.log('🔹 Imported Modules: PrismaModule, AuthModule, ProductsModule,TenantsModule');
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
