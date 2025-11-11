export function formatPrice(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return '0';
  // Round to nearest integer and format with locale separators, no fraction digits
  return Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}
