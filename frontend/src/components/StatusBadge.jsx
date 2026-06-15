const styles = {
  pending:   "bg-amber-50 text-amber-700 border border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  approved:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  active:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  inactive:  "bg-gray-100 text-gray-500 border border-gray-200",
  critical:  "bg-red-50 text-red-700 border border-red-200",
  high:      "bg-orange-50 text-orange-700 border border-orange-200",
  medium:    "bg-amber-50 text-amber-700 border border-amber-200",
  low:       "bg-blue-50 text-blue-700 border border-blue-200",
};

const dots = {
  pending:   "bg-amber-400",
  confirmed: "bg-blue-500",
  completed: "bg-emerald-500",
  approved:  "bg-emerald-500",
  active:    "bg-emerald-500",
  inactive:  "bg-gray-400",
  critical:  "bg-red-500",
  high:      "bg-orange-500",
  medium:    "bg-amber-400",
  low:       "bg-blue-400",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium capitalize ${styles[status] || "bg-gray-100 text-gray-500"}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[status] || "bg-gray-400"}`}></span>
      {status}
    </span>
  );
}
