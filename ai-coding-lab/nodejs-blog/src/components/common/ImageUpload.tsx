'use client';

import { useState, useRef } from 'react';
import { SITE_CONFIG } from '@/config/site';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string | null;
}

export function ImageUpload({ onUpload, currentUrl }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    // Validate type
    if (!SITE_CONFIG.ALLOWED_MIME_TYPES.includes(file.type as typeof SITE_CONFIG.ALLOWED_MIME_TYPES[number])) {
      setError('不支持的格式，仅支持 JPEG、PNG、WebP');
      return;
    }

    // Validate size
    if (file.size > SITE_CONFIG.MAX_UPLOAD_SIZE) {
      setError(`文件过大，最大允许 ${SITE_CONFIG.MAX_UPLOAD_SIZE / 1024 / 1024}MB`);
      return;
    }

    // Show local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.data) {
        onUpload(data.data.url);
        setPreview(data.data.url);
      } else {
        setError(data.message || '上传失败');
      }
    } catch {
      setError('上传失败，请检查网络连接');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden ${
          preview
            ? 'border-transparent'
            : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 h-40 flex items-center justify-center'
        }`}
      >
        {preview ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                {uploading ? '上传中...' : '点击更换'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">点击上传图片</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
