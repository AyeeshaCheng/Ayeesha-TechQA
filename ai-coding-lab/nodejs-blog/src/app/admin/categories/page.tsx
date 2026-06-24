'use client';

import { useState, useEffect } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<{ id: number; name: string; description: string; articleCount: number }[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (data.code === 200) setCategories(data.data.categories);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (editingId) {
      await fetch(`/api/admin/categories/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description }),
      });
    } else {
      await fetch('/api/admin/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description }),
      });
    }
    setName(''); setDescription(''); setEditingId(null);
    fetchCategories();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/categories/${deleteTarget}`, { method: 'DELETE' });
    setDeleteTarget(null);
    fetchCategories();
  };

  const startEdit = (cat: typeof categories[0]) => {
    setName(cat.name); setDescription(cat.description); setEditingId(cat.id);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">分类管理</h1>

      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mb-6 space-y-3">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="分类名称" className="w-full px-3 py-2 rounded-lg border text-sm" />
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="描述（可选）" className="w-full px-3 py-2 rounded-lg border text-sm" />
        <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
          {editingId ? '更新分类' : '创建分类'}
        </button>
        {editingId && <button onClick={() => { setName(''); setDescription(''); setEditingId(null); }} className="ml-2 px-4 py-2 rounded-lg border text-sm">取消</button>}
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div>
              <span className="font-medium">{cat.name}</span>
              {cat.description && <span className="text-gray-500 ml-2 text-sm">— {cat.description}</span>}
              <span className="text-gray-400 text-xs ml-2">({cat.articleCount} 篇)</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(cat)} className="px-3 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200">编辑</button>
              <button onClick={() => setDeleteTarget(cat.id)} className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100">删除</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog open={!!deleteTarget} title="删除分类" message="确定删除此分类吗？该分类下的文章将变为未分类。" confirmLabel="删除" danger onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
