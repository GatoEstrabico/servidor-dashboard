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

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      emailVerifiedAt: new Date(),
      isPlatformAdmin: true
    },
    create: {
      email,
      displayName: email.split('@')[0],
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      emailVerifiedAt: new Date(),
      isPlatformAdmin: true
    }
  });

  let membership = await prisma.workspaceMember.findFirst({ where: { userId: admin.id } });
  if (!membership) {
    const accessCode = `LAB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const workspace = await prisma.workspace.create({
      data: { name: 'Laboratório Central', accessCode, memberships: { create: { userId: admin.id, role: 'owner' } } }
    });
    membership = { workspaceId: workspace.id, userId: admin.id, role: 'owner', createdAt: workspace.createdAt };
  } else if (membership.role !== 'owner') {
    membership = await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: membership.workspaceId, userId: admin.id } },
      data: { role: 'owner' }
    });
  }

  const workspacesWithoutCode = await prisma.workspace.findMany({ where: { accessCode: null }, select: { id: true } });
  for (const workspace of workspacesWithoutCode) {
    let candidate = `LAB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    let conflict = await prisma.workspace.findUnique({ where: { accessCode: candidate }, select: { id: true } });
    while (conflict) {
      candidate = `LAB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      conflict = await prisma.workspace.findUnique({ where: { accessCode: candidate }, select: { id: true } });
    }
    await prisma.workspace.update({ where: { id: workspace.id }, data: { accessCode: candidate } });
  }

  await prisma.user.update({ where: { id: admin.id }, data: { activeWorkspaceId: membership.workspaceId } });
  await prisma.device.updateMany({ where: { workspaceId: null }, data: { workspaceId: membership.workspaceId } });
  await prisma.globalSetting.upsert({
    where: { id: 'global' },
    create: { id: 'global', publicRegistrationEnabled: false },
    update: {}
  });
  console.log(`Usuario administrador pronto: ${email}`);
}

main().finally(() => prisma.$disconnect());
