const MY_DIAL = '60';

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

/** National number without country code or leading 0 (e.g. 123456789). */
export function toLocalDigits(stored: string) {
  let d = digitsOnly(stored);
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith(MY_DIAL)) d = d.slice(MY_DIAL.length);
  if (d.startsWith('0')) d = d.slice(1);
  return d;
}

/** Store as +60… so numbers are consistent even if the user omits the country code. */
export function composeMyPhone(localInput: string) {
  const national = toLocalDigits(localInput);
  if (!national) return '';
  return `+${MY_DIAL}${national}`;
}

export function normalizeMyPhone(value: string | null | undefined) {
  if (value === undefined) return undefined;
  const composed = composeMyPhone(value ?? '');
  return composed.length ? composed : null;
}

/** WhatsApp click-to-chat. `stored` is +60… */
export function waMeHref(stored: string, text: string) {
  const local = toLocalDigits(stored);
  if (!local) return null;
  return `https://wa.me/${MY_DIAL}${local}?text=${encodeURIComponent(text)}`;
}

export function smsHref(stored: string, text: string) {
  const composed = composeMyPhone(stored);
  if (!composed) return null;
  return `sms:${composed}?body=${encodeURIComponent(text)}`;
}
