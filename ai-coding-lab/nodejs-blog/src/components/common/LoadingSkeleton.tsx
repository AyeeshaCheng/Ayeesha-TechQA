export function LoadingSkeleton({ type = 'card' }: { type?: 'card' | 'table' | 'text' }) {
  if (type === 'card') {
    return (
      <div className="animate-pulse rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <div className="h-40 bg-gray-200 dark:bg-gray-750 rounded-md mb-4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-750 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-750 rounded w-1/2" />
      </div>
    );
  }
  if (type === 'table') {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 dark:bg-gray-750 rounded" />
        ))}
      </div>
    );
  }
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-750 rounded w-full" />
      <div className="h-4 bg-gray-200 dark:bg-gray-750 rounded w-5/6" />
      <div className="h-4 bg-gray-200 dark:bg-gray-750 rounded w-4/6" />
    </div>
  );
}
