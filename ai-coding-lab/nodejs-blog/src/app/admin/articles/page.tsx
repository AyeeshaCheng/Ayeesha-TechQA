'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArticleStatusBadge } from '@/components/article/ArticleStatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import type { ArticleListItem, ArticleStatus } from '@/types/article';

export default function AdminArticlesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [articles, setArticles] = useState<(ArticleListItem & { status: ArticleStatus })[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

  const isAdmin = session?.user?.role === 'admin';
  const apiBase = isAdmin ? '/api/admin/articles' : '/api/author/articles';

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`${apiBase}?${params}`);
    const data = await res.json();
    if (data.code === 200) setArticles(data.data.items);
    setLoading(false);
  }, [statusFilter, apiBase]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const url = isAdmin ? `/api/admin/articles` : `/api/author/articles/${deleteTarget.id}`;
    const method = isAdmin ? 'DELETE' : 'DELETE';
    const fetchUrl = isAdmin ? `${url}?id=${deleteTarget.id}` : url;
    await fetch(fetchUrl, { method });
    setDeleteTarget(null);
    fetchArticles();
  };

  const handleStatusChange = async (id: number, newStatus: ArticleStatus) => {
    await fetch(`/api/author/articles/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchArticles();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link
          href="/admin/articles/new"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          + 新建文章
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'draft', 'published', 'archived'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {s || '全部'}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton type="table" />
      ) : articles.length === 0 ? (
        <EmptyState icon="📝" message="暂无文章" actionLabel="新建文章" actionHref="/admin/articles/new" />
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-850">
              <tr>
                <th className="text-left p-3">标题</th>
                <th className="p-3">状态</th>
                <th className="p-3">阅读</th>
                <th className="p-3">日期</th>
                <th className="p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="p-3 max-w-xs truncate">{a.title}</td>
                  <td className="p-3 text-center"><ArticleStatusBadge status={a.status} /></td>
                  <td className="p-3 text-center text-gray-500">{a.viewCount}</td>
                  <td className="p-3 text-center text-gray-500 text-xs">
                    {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/admin/articles/${a.id}/edit`}
                        className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"
                      >
                        编辑
                      </Link>
                      {a.status === 'draft' && (
                        <button onClick={() => handleStatusChange(a.id, 'published')} className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200">发布</button>
                      )}
                      {a.status === 'published' && (
                        <button onClick={() => handleStatusChange(a.id, 'archived')} className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200">归档</button>
                      )}
                      <button
                        onClick={() => setDeleteTarget({ id: a.id, title: a.title })}
                        className="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除文章"
        message={`确定要删除《${deleteTarget?.title}》吗？此操作不可恢复。`}
        confirmLabel="删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
