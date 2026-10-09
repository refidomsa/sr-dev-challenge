import type { OrderStatus } from '../api/types';
import { STATUS_LABELS } from '../lib/format';

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
