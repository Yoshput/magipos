// Formatters for NyeniPOS
// Adheres to IDR currency and Asia/Jakarta timezone requirements

const JAKARTA_TZ = 'Asia/Jakarta';

/**
 * Format integer IDR to standard Indonesian Rupiah string: "Rp 13.000"
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}

/**
 * Format number with thousand separators
 */
export function formatNumber(val: number | null | undefined, decimals = 0): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return val.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format ISO date string to Indonesian formatted date in Asia/Jakarta
 * e.g. "27 Okt 2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: JAKARTA_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Format ISO date string to full Indonesian date & time in Asia/Jakarta
 * e.g. "27 Okt 2026, 14:30 WIB"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: JAKARTA_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${formatted} WIB`;
}

/**
 * Format quantity with base unit
 */
export function formatUnit(quantity: number, unit: string): string {
  return `${formatNumber(quantity, quantity % 1 === 0 ? 0 : 2)} ${unit}`;
}

/**
 * Generate unique receipt number: NYN-YYYYMMDD-XXXX
 */
export function generateReceiptNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `NYN-${year}${month}${day}-${random}`;
}

/**
 * Generate unique purchase number: PO-YYYYMMDD-XXXX
 */
export function generatePurchaseNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PO-${year}${month}${day}-${random}`;
}
