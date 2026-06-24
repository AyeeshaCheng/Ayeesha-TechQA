export function EmptyState({
  icon = '📭',
  message,
  actionLabel,
  actionHref,
}: {
  icon?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">{message}</p>
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}
