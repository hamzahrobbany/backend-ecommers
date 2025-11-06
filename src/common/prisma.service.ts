import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService
 * -------------
 * Service global untuk koneksi ke database PostgreSQL (via Prisma).
 * 
 * Bisa di-inject ke semua module (Auth, User, Product, Tenant, dsb)
 * tanpa perlu membuat instance Prisma baru.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Inisialisasi koneksi saat modul pertama kali dijalankan.
   */
  async onModuleInit() {
    await this.$connect();
    console.log('✅ PrismaService: Connected to database');
  }

  /**
   * Pastikan koneksi ditutup saat aplikasi berhenti.
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ PrismaService: Disconnected from database');
  }

  /**
   * Utility opsional untuk clear seluruh data saat development/testing.
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('❌ Tidak boleh menghapus data di mode production!');
    }

    const modelNames = Reflect.ownKeys(this).filter((key) =>
      /^[A-Z]/.test(String(key)),
    );

    for (const modelName of modelNames) {
      try {
        await (this as any)[modelName].deleteMany({});
      } catch (error) {
        console.warn(`⚠️  Gagal menghapus data dari ${String(modelName)}`);
      }
    }

    console.log('🧹 Database telah dibersihkan (development mode).');
  }
}
