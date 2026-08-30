const AUD_FORMATTER = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });

export function formatCurrency(value: number): string {
  return AUD_FORMATTER.format(value);
}
