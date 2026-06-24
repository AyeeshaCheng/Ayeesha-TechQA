'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MarkdownEditor } from '@/components/article/MarkdownEditor';
import { ImageUpload } from '@/components/common/ImageUpload';
import type { Category, Tag } from '@/types/article';

export default function NewArticlePage() {
  const router = useRouter();
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

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => { if (d.code === 200) setCategories(d.data.categories); });
    fetch('/api/tags').then(r => r.json()).then(d => { if (d.code === 200) setTags(d.data.tags); });
  }, []);

  const handleTagToggle = (tagId: number) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('标题不能为空'); return; }
    if (status === 'published' && !content.trim()) { setError('发布文章时内容不能为空'); return; }

    setSaving(true);
    setError('');
    const res = await fetch('/api/author/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        content,
        summary,
        coverImageUrl: coverImageUrl || null,
        status,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        ogImageUrl: ogImageUrl || null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        tagIds: selectedTags,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      router.push(`/admin/articles/${data.data.id}/edit`);
    } else {
      setError(data.message || '保存失败');
    }
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">新建文章</h1>
      {error && <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor area */}
        <div className="lg:col-span-2 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章标题"
            className="w-full px-4 py-3 text-xl font-bold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="URL Slug（留空自动生成）"
            className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <MarkdownEditor value={content} onChange={setContent} />
        </div>

        {/* Sidebar form */}
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">状态</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-850">
                <option value="draft">草稿</option>
                <option value="published">发布</option>
                <option value="archived">归档</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">分类</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-850">
                <option value="">无分类</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <label className="block text-sm font-medium mb-2">标签</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedTags.includes(tag.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <label className="block text-sm font-medium mb-2">摘要</label>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-850 resize-none" />
          </div>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <label className="block text-sm font-medium mb-2">封面图</label>
            <ImageUpload onUpload={(url) => setCoverImageUrl(url)} currentUrl={coverImageUrl} />
          </div>

          <details className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <summary className="text-sm font-medium cursor-pointer">SEO 设置</summary>
            <div className="space-y-3 mt-3">
              <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="SEO 标题" className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-850" />
              <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="SEO 描述" rows={2} className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-850 resize-none" />
              <input type="text" value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} placeholder="OG 图片 URL" className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-850" />
            </div>
          </details>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : status === 'published' ? '发布文章' : '保存草稿'}
          </button>
        </div>
      </div>
    </div>
  );
}
