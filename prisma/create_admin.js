// Quick script to create/update admin user
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Check all users
  const users = await prisma.user.findMany({ select: { id: true, username: true, role: true } });
  console.log('Current users:', users);

  // Upsert admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    create: { username: 'admin', password: hashedPassword, role: 'ADMIN' },
    update: { role: 'ADMIN', password: hashedPassword },
  });
  console.log('Admin user:', { id: admin.id, username: admin.username, role: admin.role });
}

main().catch(console.error).finally(() => prisma.$disconnect());
