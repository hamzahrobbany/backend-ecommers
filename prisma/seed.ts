import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await hash('password123', 10);

  const tenant = await prisma.tenant.create({
    data: {
      code: 'salwa',
      name: 'Toko Salwa',
      users: {
        create: [
          {
            name: 'Hamzah Robbany',
            email: 'owner@salwa.com',
            password: hashedPassword,
            role: 'OWNER',
          },
          {
            name: 'John Customer',
            email: 'customer@salwa.com',
            password: hashedPassword,
            role: 'CUSTOMER',
          },
        ],
      },
    },
  });

  console.log('Seed selesai:', tenant);
}

main().finally(() => prisma.$disconnect());
