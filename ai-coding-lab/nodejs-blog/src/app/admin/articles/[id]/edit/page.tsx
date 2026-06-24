'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MarkdownEditor } from '@/components/article/MarkdownEditor';
import { ImageUpload } from '@/components/common/ImageUpload';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { Category, Tag } from '@/types/article';

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params?.id as string;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [status, setStatus] = useState('draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => { if (d.code === 200) setCategories(d.data.categories); });
    fetch('/api/tags').then(r => r.json()).then(d => { if (d.code === 200) setTags(d.data.tags); });
    // Fetch article
    fetch(`/api/articles/${articleId}`).then(r => r.json()).then(d => {
      if (d.code === 200) {
        const a = d.data;
        setTitle(a.title); setSlug(a.slug || ''); setContent(a.content);
        setSummary(a.summary); setCoverImageUrl(a.coverImageUrl || '');
        setStatus(a.status); setSeoTitle(a.seoTitle || '');
        setSeoDescription(a.seoDescription || ''); setOgImageUrl(a.ogImageUrl || '');
        setCategoryId(a.category?.id?.toString() || '');
        setSelectedTags(a.tags?.map((t: Tag) => t.id) || []);
      }
      setLoading(false);
    });
  }, [articleId]);

  const handleTagToggle = (tagId: number) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('标题不能为空'); return; }
    setSaving(true); setError('');
    const res = await fetch(`/api/author/articles/${articleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(), slug: slug || undefined, content, summary,
        coverImageUrl: coverImageUrl || null, seoTitle: seoTitle || null,
        seoDescription: seoDescription || null, ogImageUrl: ogImageUrl || null,
        categoryId: categoryId ? parseInt(categoryId) : null, tagIds: selectedTags,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) setError('');
    else setError(data.message || '保存失败');
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/author/articles/${articleId}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/articles');
    else setError('删除失败');
    setShowDelete(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">加载中...</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">编辑文章</h1>
        <div className="flex gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-850">
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
          <button onClick={() => setShowDelete(true)} className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50">
            删除
          </button>
        </div>
      </div>

      {error && <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="文章标题" className="w-full px-4 py-3 text-xl font-bold rounded-lg border" />
          <MarkdownEditor value={content} onChange={setContent} />
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-xl border">
            <label className="block text-sm font-medium mb-1">分类</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm">
              <option value="">无分类</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="p-4 rounded-xl border">
            <label className="block text-sm font-medium mb-2">标签</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button key={tag.id} type="button" onClick={() => handleTagToggle(tag.id)}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${selectedTags.includes(tag.id) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl border">
            <label className="block text-sm font-medium mb-2">摘要</label>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border text-sm resize-none" />
          </div>
          <div className="p-4 rounded-xl border">
            <label className="block text-sm font-medium mb-2">封面图</label>
            <ImageUpload onUpload={(url) => setCoverImageUrl(url)} currentUrl={coverImageUrl} />
          </div>
          <details className="p-4 rounded-xl border">
            <summary className="text-sm font-medium cursor-pointer">SEO 设置</summary>
            <div className="space-y-3 mt-3">
              <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="SEO 标题" className="w-full px-3 py-2 rounded-lg border text-sm" />
              <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="SEO 描述" rows={2} className="w-full px-3 py-2 rounded-lg border text-sm resize-none" />
              <input type="text" value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} placeholder="OG 图片 URL" className="w-full px-3 py-2 rounded-lg border text-sm" />
            </div>
          </details>
        </div>
      </div>

      <ConfirmDialog open={showDelete} title="删除文章" message="确定要删除这篇文章吗？此操作不可恢复。" confirmLabel="删除" danger onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
    </div>
  );
}
