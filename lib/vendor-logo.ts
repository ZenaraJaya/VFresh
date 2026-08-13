const MAX_DATA_URL_LENGTH = 250_000;

export function normalizeVendorLogo(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;

  const value = String(raw).trim();
  if (!value) return null;

  if (value.startsWith('data:image/')) {
    if (value.length > MAX_DATA_URL_LENGTH) {
      throw new Error('Logo is too large. Use a smaller image (under ~180KB).');
    }
    if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) {
      throw new Error('Logo must be a PNG, JPEG, WebP, or GIF.');
    }
    return value;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('Logo URL must start with http or https.');
    }
    return value;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Logo')) throw err;
    throw new Error('Enter a valid image URL or upload a file.');
  }
}
