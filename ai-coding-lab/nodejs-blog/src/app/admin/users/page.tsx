'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<{ id: number; email: string; nickname: string; role: string; createdAt: string }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session?.user?.role !== 'admin') { router.push('/admin'); return; }
    fetch('/api/admin/users').then(r => r.json()).then(d => { if (d.code === 200) setUsers(d.data.users); });
  }, [session, router]);

  const changeRole = async (userId: number, role: string) => {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } else {
      setError(data.message);
    }
  };

  if (session?.user?.role !== 'admin') return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>
      {error && <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-850">
            <tr>
              <th className="text-left p-3">昵称</th>
              <th className="text-left p-3">邮箱</th>
              <th className="p-3">角色</th>
              <th className="p-3">注册时间</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-medium">{u.nickname}</td>
                <td className="p-3 text-gray-500">{u.email}</td>
                <td className="p-3">
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="px-2 py-1 rounded border text-xs">
                    <option value="reader">读者</option>
                    <option value="author">作者</option>
                    <option value="admin">管理员</option>
                  </select>
                </td>
                <td className="p-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
