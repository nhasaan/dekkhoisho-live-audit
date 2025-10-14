import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password once for all users
  const hashedPassword = await bcrypt.hash('123', 10);

  // Create viewer user
  const viewer = await prisma.user.upsert({
    where: { username: 'viewer' },
    update: {},
    create: {
      username: 'viewer',
      passwordHash: hashedPassword,
      role: 'viewer',
    },
  });
  console.log('✅ Created viewer:', viewer.username);

  // Create analyst user
  const analyst = await prisma.user.upsert({
    where: { username: 'analyst' },
    update: {},
    create: {
      username: 'analyst',
      passwordHash: hashedPassword,
      role: 'analyst',
    },
  });
  console.log('✅ Created analyst:', analyst.username);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      role: 'admin',
    },
  });
  console.log('✅ Created admin:', admin.username);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

