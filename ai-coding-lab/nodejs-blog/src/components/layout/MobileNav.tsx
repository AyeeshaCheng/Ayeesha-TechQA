'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  user?: { name?: string | null; email?: string | null; role?: string } | null;
}

export function MobileNav({ open, onClose, user }: MobileNavProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl p-6">
        <div className="flex justify-end mb-6">
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-4 text-base font-medium">
          <Link href="/" onClick={onClose} className="hover:text-blue-600">
            首页
          </Link>
          <Link href="/tags" onClick={onClose} className="hover:text-blue-600">
            标签
          </Link>
          <Link href="/categories" onClick={onClose} className="hover:text-blue-600">
            分类
          </Link>
          <Link href="/about" onClick={onClose} className="hover:text-blue-600">
            关于
          </Link>
          {(user?.role === 'admin' || user?.role === 'author') && (
            <Link href="/admin" onClick={onClose} className="text-blue-600 font-semibold">
              管理
            </Link>
          )}
        </nav>

        <hr className="my-6 border-gray-200 dark:border-gray-800" />

        {user ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{user.email}</p>
            <button
              onClick={() => signOut()}
              className="text-sm text-red-600 font-medium"
            >
              退出登录
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link href="/login" onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-lg border">
              登录
            </Link>
            <Link href="/register" onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white">
              注册
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
