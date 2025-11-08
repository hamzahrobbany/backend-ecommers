import { PrismaClient, Role } from '@prisma/client';
import { hashSync } from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

/**
 * 🏢 Tenant seed data
 */
const tenantSeed = {
  id: randomUUID(),
  code: 'test',
  name: 'Toko Test',
  address: 'Jl. Merdeka No. 10',
  email: 'admin@test.com',
  phone: '+62 812-3456-7890',
};

/**
 * ☕ Product seed data
 */
const productSeeds = [
  {
    id: 'f6d8f6d8-0b8e-4b3e-a1a5-0d63e4b8c1a1',
    name: 'Kopi Arabica Gayo',
    description: 'Kopi khas Aceh dengan aroma khas dan cita rasa kuat.',
    price: 75000,
    category: 'Coffee Beans',
    stock: 120,
    image:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
  },
  {
    id: 'b7e4a6e9-2f7f-4c0c-9437-6a23b079a9c5',
    name: 'Kopi Robusta Lampung',
    description: 'Kopi Robusta dengan karakter pahit dan kafein tinggi.',
    price: 60000,
    category: 'Coffee Beans',
    stock: 80,
    image:
      'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800',
  },
  {
    id: 'c9d2f7a1-6b8c-45e2-9237-8b0d2c3e4f5a',
    name: 'Cold Brew Botol 250ml',
    description: 'Kopi dingin siap minum hasil seduhan 12 jam.',
    price: 25000,
    category: 'Ready to Drink',
    stock: 50,
    image:
      'https://images.unsplash.com/photo-1590080875839-46e17aa0b6d7?w=800',
  },
];

/**
 * 🌱 Seed runner
 */
async function main() {
  console.log('🚀 Memulai proses seeding...');

  const passwordHash = hashSync('password123', 10);

  const tenant = await prisma.$transaction(async (tx) => {
    // 🔹 1. Tenant
    const tenant = await tx.tenant.upsert({
      where: { code: tenantSeed.code },
      update: {
        name: tenantSeed.name,
        address: tenantSeed.address,
        email: tenantSeed.email,
        phone: tenantSeed.phone,
      },
      create: tenantSeed,
    });

    // 🔹 2. Admin User
    await tx.user.upsert({
      where: { email: tenantSeed.email },
      update: {
        name: 'Admin Test',
        password: passwordHash,
        role: Role.ADMIN,
        tenantId: tenant.id,
      },
      create: {
        id: randomUUID(),
        name: 'Admin Test',
        email: tenantSeed.email,
        password: passwordHash,
        role: Role.ADMIN,
        tenantId: tenant.id,
      },
    });

    // 🔹 3. Product Samples
    await tx.product.createMany({
      data: productSeeds.map((p) => ({
        ...p,
        tenantId: tenant.id,
      })),
      skipDuplicates: true,
    });

    return tenant;
  });

  console.log(`✅ Seeder selesai! Tenant: ${tenant.code}`);
}

/**
 * 🧩 Run the seed
 */
main()
  .catch(async (error) => {
    console.error('❌ Gagal menjalankan seeder:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
