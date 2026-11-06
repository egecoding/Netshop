import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import type { AstroCookies } from 'astro';
import { prisma } from './db';
import { SESSION_COOKIE } from './constants';
import type { Role, User } from '@prisma/client';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_RENEW_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000; // renew if < 15 days left

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  const storedBuffer = Buffer.from(hash, 'hex');
  if (storedBuffer.length !== derived.length) return false;
  return timingSafeEqual(storedBuffer, derived);
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const id = hashToken(token);
  await prisma.session.create({
    data: {
      id,
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

export async function validateSessionToken(
  token: string
): Promise<{ user: User; sessionId: string } | null> {
  const id = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id } }).catch(() => {});
    return null;
  }

  if (session.expiresAt.getTime() - Date.now() < SESSION_RENEW_THRESHOLD_MS) {
    await prisma.session.update({
      where: { id },
      data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
  }

  return { user: session.user, sessionId: id };
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
}

export function setSessionCookie(cookies: AstroCookies, token: string): void {
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function requireRole(user: Pick<User, 'role'> | null | undefined, role: Role): boolean {
  return !!user && user.role === role;
}
