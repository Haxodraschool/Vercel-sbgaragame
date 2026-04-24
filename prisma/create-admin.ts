import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const username = 'bigadmin';
    const password = '123456';
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    
    if (existingUser) {
      console.log(`User ${username} already exists. Updating role to ADMIN...`);
      await prisma.user.update({
        where: { username },
        data: { role: 'ADMIN' },
      });
      console.log('✅ Updated user role to ADMIN');
    } else {
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create admin user
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: 'ADMIN',
          gold: 0,
          level: 1,
          exp: 0,
          currentDay: 1,
          garageHealth: 100,
          techPoints: 0,
          crewSlots: 1,
          isFinalRound: false,
        },
      });
      
      console.log('✅ Created admin account:');
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.id}`);
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
