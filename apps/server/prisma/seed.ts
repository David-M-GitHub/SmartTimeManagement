import { prisma } from '../src/db/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  const adminEmail = 'admin@example.com';
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!exists) {
    const hash = await bcrypt.hash('admin', 10);
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        passworthash: hash,
        role: 'admin'
      }
    });
    console.log('Seeded admin user admin@example.com / admin');
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
