'use client';

import { useState, useEffect } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export default function TagsPage() {
  const [tags, setTags] = useState<{ id: number; name: string; articleCount: number }[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [error, setError] = useState('');

  const fetchTags = async () => {
    const res = await fetch('/api/tags');
    const data = await res.json();
    if (data.code === 200) setTags(data.data.tags);
  };

  useEffect(() => { fetchTags(); }, []);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (editingId) {
      await fetch(`/api/admin/tags/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim().toLowerCase() }),
      });
    } else {
      const res = await fetch('/api/admin/tags', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
    }
    setName(''); setEditingId(null); setError('');
    fetchTags();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/tags/${deleteTarget}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message);
    } else {
      setDeleteTarget(null);
      setError('');
      fetchTags();
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">标签管理</h1>
      {error && <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">{error}</div>}

      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mb-6 space-y-3">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="标签名称" className="w-full px-3 py-2 rounded-lg border text-sm" />
        <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
          {editingId ? '更新标签' : '创建标签'}
        </button>
        {editingId && <button onClick={() => { setName(''); setEditingId(null); }} className="ml-2 px-4 py-2 rounded-lg border text-sm">取消</button>}
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
            <span className="font-medium">{tag.name}</span>
            <span className="text-gray-400 text-xs">({tag.articleCount})</span>
            <button onClick={() => { setName(tag.name); setEditingId(tag.id); }} className="text-blue-600 text-xs hover:underline">编辑</button>
            <button onClick={() => setDeleteTarget(tag.id)} className="text-red-500 text-xs hover:underline">×</button>
          </div>
        ))}
      </div>

      <ConfirmDialog open={!!deleteTarget} title="删除标签" message="确定删除此标签吗？使用中的标签无法删除。" confirmLabel="删除" danger onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
