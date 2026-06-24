'use client';

import { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/common/ImageUpload';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export default function MediaPage() {
  const [media, setMedia] = useState<{ id: number; url: string; originalName: string; fileSize: number; mimeType: string; createdAt: string }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const fetchMedia = async () => {
    const res = await fetch('/api/media');
    const data = await res.json();
    if (data.code === 200) setMedia(data.data.media);
  };

  useEffect(() => { fetchMedia(); }, []);

  const handleUpload = (url: string) => { fetchMedia(); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/media/${deleteTarget}`, { method: 'DELETE' });
    setDeleteTarget(null);
    fetchMedia();
  };

  const copyUrl = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">媒体管理</h1>
      <div className="mb-6 p-4 rounded-xl border bg-white dark:bg-gray-900">
        <ImageUpload onUpload={handleUpload} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((m) => (
          <div key={m.id} className="rounded-xl border overflow-hidden bg-white dark:bg-gray-900 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt={m.originalName} className="w-full h-32 object-cover" />
            <div className="p-2">
              <p className="text-xs truncate text-gray-500">{m.originalName}</p>
              <p className="text-xs text-gray-400">{Math.round(m.fileSize / 1024)}KB</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => copyUrl(m.url, m.id)} className="flex-1 px-2 py-1 text-xs rounded bg-blue-50 text-blue-600 hover:bg-blue-100">
                  {copied === m.id ? '已复制!': '复制 URL'}
                </button>
                <button onClick={() => setDeleteTarget(m.id)} className="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100">删除</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {media.length === 0 && <p className="text-center text-gray-500 py-12">暂无上传的图片</p>}
      <ConfirmDialog open={!!deleteTarget} title="删除图片" message="确定删除此图片吗？引用该图片的文章将显示裂图。" confirmLabel="删除" danger onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
