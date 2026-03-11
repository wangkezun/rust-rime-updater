interface StatusBadgeProps {
  status: "ok" | "update" | "warning" | "error" | "unknown";
  label: string;
}

const statusStyles = {
  ok: "bg-green-100 text-green-800",
  update: "bg-amber-100 text-amber-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
  unknown: "bg-gray-100 text-gray-600",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      {label}
    </span>
  );
}
