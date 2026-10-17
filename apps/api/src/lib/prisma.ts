import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

dotenv.config({ path: resolve(process.cwd(), '../../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL nao esta configurada.');

const adapter = new PrismaPg({
	connectionString,
	max: 10,
	connectionTimeoutMillis: 5_000,
	idleTimeoutMillis: 300_000
});

export const prisma = new PrismaClient({ adapter });
