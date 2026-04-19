import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('admin2026', 10);
  
  const newAdmin = await prisma.user.create({
    data: {
      username: 'sbadmin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Tài khoản admin mới đã tạo thành công!');
  console.log('   Username: sbadmin');
  console.log('   Password: admin2026');
  console.log('   Role:', newAdmin.role);
  console.log('   ID:', newAdmin.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
