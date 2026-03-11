interface ProgressBarProps {
  downloaded: number;
  total: number | null;
  speed: number;
  onCancel?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProgressBar({
  downloaded,
  total,
  speed,
  onCancel,
}: ProgressBarProps) {
  const percent = total ? Math.round((downloaded / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-slate-600 mb-1">
        <span>
          {formatBytes(downloaded)}
          {total ? ` / ${formatBytes(total)}` : ""}
        </span>
        <span>{formatBytes(speed)}/s</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          取消下载
        </button>
      )}
    </div>
  );
}
