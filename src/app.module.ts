import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// === Core Middleware ===
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';


// === Core Modules ===
import { PrismaModule } from './prisma/prisma.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';

// === Optional/Utility Modules ===
import { DebugController } from './modules/debug/debug.controller';

@Module({
  imports: [
    // 🌱 Global environment variables (.env)
    ConfigModule.forRoot({ isGlobal: true }),

    // 🧩 Core business modules
    PrismaModule,
    TenantsModule,
    AuthModule,
    ProductsModule,
  ],
  controllers: [DebugController],

  // 🧠 Penting agar Nest dapat meng‐inject TenantsService ke middleware
  providers: [TenantContextMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 🧩 Terapkan TenantContextMiddleware untuk semua route
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
