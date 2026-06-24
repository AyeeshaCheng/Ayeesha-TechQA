'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { MobileNav } from './MobileNav';

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold tracking-tight hover:text-blue-600 transition-colors">
          Ayeesha Blog
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
          <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            首页
          </Link>
          <Link href="/tags" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            标签
          </Link>
          <Link href="/categories" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            分类
          </Link>
          <Link href="/about" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            关于
          </Link>
          {(user?.role === 'admin' || user?.role === 'author') && (
            <Link
              href="/admin"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 transition-colors"
            >
              管理
            </Link>
          )}
        </nav>

        {/* Auth section */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 text-sm font-medium hover:text-blue-600 transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
                <span>{user.name}</span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 shadow-lg py-1">
                    <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800">
                      {user.email}
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                注册
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setMenuOpen(true)}
          aria-label="打开菜单"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} user={user} />
    </header>
  );
}
