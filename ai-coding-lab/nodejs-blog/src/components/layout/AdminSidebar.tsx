'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

const links = [
  { href: '/admin', label: '仪表盘', icon: '📊' },
  { href: '/admin/articles', label: '文章管理', icon: '📝' },
  { href: '/admin/categories', label: '分类管理', icon: '📂' },
  { href: '/admin/tags', label: '标签管理', icon: '🏷️' },
  { href: '/admin/media', label: '媒体管理', icon: '🖼️' },
];

const adminLinks = [
  { href: '/admin/users', label: '用户管理', icon: '👥' },
  { href: '/admin/settings', label: '站点设置', icon: '⚙️' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = session?.user?.role === 'admin';

  const allLinks = isAdmin ? [...links, ...adminLinks] : links;

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-16 left-4 z-30 lg:hidden p-2 rounded-md bg-white dark:bg-gray-900 border shadow-sm"
        onClick={() => setCollapsed(!collapsed)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M4 6h16M4 12h16M4 18h16' : 'M6 18L18 6M6 6l12 12'} />
        </svg>
      </button>

      {/* Overlay */}
      {!collapsed && <div className="fixed inset-0 z-20 lg:hidden bg-black/50" onClick={() => setCollapsed(true)} />}

      {/* Sidebar */}
      <aside className={`fixed top-14 left-0 z-20 h-[calc(100vh-3.5rem)] w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto transition-transform ${collapsed ? '-translate-x-full' : 'translate-x-0'} lg:translate-x-0 lg:static lg:z-0`}>
        <nav className="p-4 space-y-1">
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setCollapsed(true)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
