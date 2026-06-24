'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MarkdownRenderer } from '@/lib/markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [preview, setPreview] = useState(value);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Debounced preview update
  useEffect(() => {
    const timer = setTimeout(() => setPreview(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  const insertMarkdown = useCallback((syntax: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);
    const newText = before + syntax.replace('$1', selected) + after;
    onChange(newText);
    // Restore cursor
    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + syntax.indexOf('$1');
      textarea.setSelectionRange(cursorPos, cursorPos + selected.length);
    }, 0);
  }, [value, onChange]);

  const toolbarButtons = [
    { label: 'B', syntax: '**$1**', title: '加粗' },
    { label: 'I', syntax: '*$1*', title: '斜体' },
    { label: '~~', syntax: '~~$1~~', title: '删除线' },
    { label: 'H2', syntax: '\n## $1\n', title: '二级标题' },
    { label: 'H3', syntax: '\n### $1\n', title: '三级标题' },
    { label: '`', syntax: '`$1`', title: '行内代码' },
    { label: '```', syntax: '\n```\n$1\n```\n', title: '代码块' },
    { label: '>', syntax: '\n> $1\n', title: '引用' },
    { label: '•', syntax: '\n- $1\n', title: '无序列表' },
    { label: '1.', syntax: '\n1. $1\n', title: '有序列表' },
    { label: '🔗', syntax: '[$1](url)', title: '链接' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-12rem)]">
      {/* Editor pane */}
      <div className="flex-1 flex flex-col">
        <div className="flex flex-wrap gap-1 mb-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700">
          {toolbarButtons.map((btn) => (
            <button
              key={btn.title}
              type="button"
              title={btn.title}
              onClick={() => insertMarkdown(btn.syntax)}
              className="px-2 py-1 text-xs font-mono rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {btn.label}
            </button>
          ))}
        </div>
        <textarea
          ref={editorRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '开始编写 Markdown 内容...'}
          className="flex-1 w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
        />
      </div>
      {/* Preview pane */}
      <div className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto">
        {preview ? (
          <MarkdownRenderer content={preview} />
        ) : (
          <p className="text-gray-400 text-sm">预览区域</p>
        )}
      </div>
    </div>
  );
}
