export function deliveryScanPath(orderNumber: string) {
  return `/delivery?o=${encodeURIComponent(orderNumber)}`;
}

export function parseScannedOrderNumber(raw: string) {
  const text = raw.trim();
  try {
    const url = new URL(text);
    const o = url.searchParams.get('o') || url.searchParams.get('order');
    if (o?.trim()) return o.trim();
  } catch {
    // not a full URL — maybe a path or bare order number
  }
  try {
    const url = new URL(text, 'https://vfresh.local');
    const o = url.searchParams.get('o') || url.searchParams.get('order');
    if (o?.trim()) return o.trim();
  } catch {
    // ignore
  }
  const m = /\bORD-[A-Z0-9-]+\b/i.exec(text);
  if (m) return m[0].toUpperCase();
  if (/^[A-Z0-9-]{6,}$/i.test(text)) return text;
  return null;
}
