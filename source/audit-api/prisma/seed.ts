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

  // Create security rules
  const rules = [
    { name: 'SQL Injection Detection', description: 'Detects SQL injection attempts', pattern: 'sql.*injection|union.*select|drop.*table', severity: 'high', status: 'active' },
    { name: 'XSS Attack Detection', description: 'Detects cross-site scripting attempts', pattern: '<script|javascript:|onerror=|onload=', severity: 'high', status: 'active' },
    { name: 'Brute Force Login', description: 'Detects multiple failed login attempts', pattern: 'failed.*login', severity: 'medium', status: 'active' },
    { name: 'Path Traversal', description: 'Detects directory traversal attempts', pattern: '\\.\\./|\\.\\.\x5c', severity: 'high', status: 'active' },
    { name: 'Command Injection', description: 'Detects OS command injection attempts', pattern: ';.*rm|;.*cat|;.*wget|\\|.*curl', severity: 'critical', status: 'active' },
    { name: 'Rate Limiting', description: 'Monitors for excessive requests', pattern: 'rate.*limit', severity: 'low', status: 'draft' },
    { name: 'Suspicious User-Agent', description: 'Flags suspicious user agents', pattern: 'bot|crawler|scanner', severity: 'low', status: 'active' },
    { name: 'File Upload Validation', description: 'Validates uploaded file types', pattern: '\\.exe|\\.sh|\\.bat', severity: 'medium', status: 'active' },
    { name: 'API Key Exposure', description: 'Detects exposed API keys', pattern: 'api.*key|secret.*token', severity: 'high', status: 'draft' },
    { name: 'SSRF Detection', description: 'Server-side request forgery detection', pattern: 'localhost|127\\.0\\.0\\.1|internal', severity: 'high', status: 'active' },
  ];

  console.log('🛡️  Creating security rules...');
  for (const rule of rules) {
    await prisma.rule.create({
      data: {
        ...rule,
        createdBy: admin.id,
      },
    });
  }
  console.log(`✅ Created ${rules.length} security rules`);

  // Create audit log entries
  const actions = ['USER_LOGIN', 'USER_LOGOUT', 'RULE_CREATED', 'RULE_UPDATED', 'RULE_DELETED', 'RULE_APPROVED', 'RULE_PAUSED', 'RULE_RESUMED', 'SETTINGS_CHANGED'];
  const users = [
    { username: viewer.username, id: viewer.id },
    { username: analyst.username, id: analyst.id },
    { username: admin.username, id: admin.id }
  ];
  const ruleNames = rules.map(r => r.name);

  console.log('📝 Creating audit log entries...');
  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const target = action.includes('RULE') ? ruleNames[Math.floor(Math.random() * ruleNames.length)] : null;
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        username: user.username,
        action,
        target,
        hash: `hash_${timestamp.getTime()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
      },
    });
  }
  console.log('✅ Created 50 audit log entries');

  console.log('🔒 Skipping security events (simulator will generate them)');

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

