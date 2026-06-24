import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { errorResponse } from './api-response';
import type { SessionUser } from '@/types/user';

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email || '',
    nickname: session.user.name || '',
    role: session.user.role as SessionUser['role'],
  };
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    throw errorResponse(401, '请先登录');
  }
  return user;
}

export async function requireAuthor() {
  const user = await requireAuth();
  if (user.role !== 'author' && user.role !== 'admin') {
    throw errorResponse(403, '无权操作：需要作者或管理员权限');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw errorResponse(403, '无权操作：需要管理员权限');
  }
  return user;
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === 'admin';
}

export function isAuthorOrAdmin(user: SessionUser | null): boolean {
  return user?.role === 'author' || user?.role === 'admin';
}
