import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../..', '.env') });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error('Configure BOOTSTRAP_ADMIN_EMAIL e uma BOOTSTRAP_ADMIN_PASSWORD com pelo menos 12 caracteres.');
  }

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: await argon2.hash(password, { type: argon2.argon2id }) },
    create: {
      email,
      displayName: email.split('@')[0],
      passwordHash: await argon2.hash(password, { type: argon2.argon2id })
    }
  });
  console.log(`Usuario administrador pronto: ${email}`);
}

main().finally(() => prisma.$disconnect());
