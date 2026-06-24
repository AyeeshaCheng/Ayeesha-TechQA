import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin API routes
  if (pathname.startsWith('/api/admin/')) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token) {
      return NextResponse.json({ code: 401, message: '请先登录' }, { status: 401 });
    }
    if (token.role !== 'admin') {
      return NextResponse.json({ code: 403, message: '无权操作：需要管理员权限' }, { status: 403 });
    }
  }

  // Protect author API routes
  if (pathname.startsWith('/api/author/')) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token) {
      return NextResponse.json({ code: 401, message: '请先登录' }, { status: 401 });
    }
    if (token.role !== 'author' && token.role !== 'admin') {
      return NextResponse.json({ code: 403, message: '无权操作：需要作者或管理员权限' }, { status: 403 });
    }
  }

  // Protect admin pages
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (token.role !== 'admin' && token.role !== 'author') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect media upload API
  if (pathname.startsWith('/api/media/')) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token) {
      return NextResponse.json({ code: 401, message: '请先登录' }, { status: 401 });
    }
    if (token.role !== 'author' && token.role !== 'admin') {
      return NextResponse.json({ code: 403, message: '无权操作' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/author/:path*', '/api/media/:path*'],
};
