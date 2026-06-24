'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ImageUpload } from '@/components/common/ImageUpload';

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [blogName, setBlogName] = useState('');
  const [aboutContent, setAboutContent] = useState('');
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (session?.user?.role !== 'admin') { router.push('/admin'); return; }
    fetch('/api/site-config').then(r => r.json()).then(d => {
      if (d.code === 200) {
        setBlogName(d.data.blogName); setAboutContent(d.data.aboutContent);
        setGithub(d.data.socialLinks?.github || ''); setTwitter(d.data.socialLinks?.twitter || '');
        setLogoUrl(d.data.logoUrl || '');
      }
    });
  }, [session, router]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/site-config', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blogName, aboutContent,
        socialLinks: { github, twitter },
        logoUrl: logoUrl || null,
      }),
    });
    setSaving(false);
    setMessage(res.ok ? '保存成功' : '保存失败');
    setTimeout(() => setMessage(''), 3000);
  };

  if (session?.user?.role !== 'admin') return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">站点设置</h1>
      {message && <div className={`p-3 mb-4 rounded-lg text-sm ${message.includes('成功') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">博客名称</label>
          <input type="text" value={blogName} onChange={(e) => setBlogName(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">关于页内容 (Markdown)</label>
          <textarea value={aboutContent} onChange={(e) => setAboutContent(e.target.value)} rows={10} className="w-full px-3 py-2 rounded-lg border text-sm font-mono resize-y" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">GitHub URL</label>
            <input type="text" value={github} onChange={(e) => setGithub(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Twitter URL</label>
            <input type="text" value={twitter} onChange={(e) => setTwitter(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Logo</label>
          <ImageUpload onUpload={(url) => setLogoUrl(url)} currentUrl={logoUrl} />
        </div>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  );
}
