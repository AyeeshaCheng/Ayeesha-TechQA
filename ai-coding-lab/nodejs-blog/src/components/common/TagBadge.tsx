import Link from 'next/link';

interface TagBadgeProps {
  name: string;
  clickable?: boolean;
  size?: 'sm' | 'md';
}

export function TagBadge({ name, clickable = true, size = 'sm' }: TagBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  const className = `inline-block ${sizeClasses} rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium transition-colors ${
    clickable ? 'hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer' : ''
  }`;

  if (clickable) {
    return (
      <Link href={`/tags/${encodeURIComponent(name)}`} className={className}>
        {name}
      </Link>
    );
  }

  return <span className={className}>{name}</span>;
}
