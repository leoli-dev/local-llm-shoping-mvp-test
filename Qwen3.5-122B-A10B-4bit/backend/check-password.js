import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const user = await prisma.user.findUnique({ where: { email: 'john@example.com' } });
console.log('Username:', user.username);
console.log('Password (hashed):', user.password.substring(0, 30) + '...');
console.log('Is hashed (starts with $):', user.password.startsWith('$'));
await prisma.$disconnect();
