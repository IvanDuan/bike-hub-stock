import type { BikeStatus } from "@/lib/constants";
import { statusColor, statusLabel } from "@/lib/constants";

export function StatusBadge({ status }: { status: BikeStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}
