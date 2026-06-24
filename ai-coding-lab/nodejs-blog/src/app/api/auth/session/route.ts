import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return errorResponse(401, '未登录');
  }
  return successResponse({
    user: {
      id: session.user.id,
      email: session.user.email,
      nickname: session.user.name,
      role: session.user.role,
    },
  });
}
