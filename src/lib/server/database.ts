import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

// Prevent multiple Prisma clients in development
declare global {
	var __prisma: PrismaClient | undefined;
}

// Create and export Prisma client
export const db = globalThis.__prisma || new PrismaClient({
	log: dev ? ['query', 'error', 'warn'] : ['error']
});

if (dev) {
	globalThis.__prisma = db;
}

export default db;