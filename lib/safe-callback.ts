export function safeCallbackPath(url: string | null | undefined) {
  if (!url) return null;
  if (!url.startsWith('/') || url.startsWith('//')) return null;
  return url;
}
