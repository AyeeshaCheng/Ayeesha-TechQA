import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { registerSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, parsed.error.errors[0]?.message || '参数错误');
  }

  const { email, password, nickname } = parsed.data;
  const lowerEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: lowerEmail } });
  if (existing) {
    return errorResponse(409, '该邮箱已被注册');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: lowerEmail,
      passwordHash,
      nickname,
      role: 'reader',
    },
  });

  return successResponse(
    { userId: user.id, nickname: user.nickname, role: user.role },
    '注册成功',
    201,
  );
}
