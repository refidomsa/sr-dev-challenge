import type { OrderStatus } from '../api/types';

// The backend sends the money in cents: 29010 -> "RD$290.10"
export function formatMoney(cents: number): string {
  const amount = cents / 100;
  const text = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `RD$${text}`;
}

export function formatGallons(gallons: number): string {
  return gallons.toLocaleString('en-US');
}

// Dates are always shown in Dominican time, wherever the browser is.
export function formatDateTime(isoDate: string | null): string {
  if (isoDate === null) {
    return '—';
  }
  return new Date(isoDate).toLocaleString('es-DO', {
    timeZone: 'America/Santo_Domingo',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  DISPATCHED: 'Despachado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
};
