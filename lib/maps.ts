/** Miri, Sarawak — default map centre. */
export const MIRI_CENTER = { lat: 4.3995, lng: 113.9914 };

/** How far the OSM embed is padded around the marker (degrees). */
export const MAP_EMBED_DELTA = 0.008;

export function mapsEmbedUrl(lat: number, lng: number, zoom = 16) {
  const d = MAP_EMBED_DELTA;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function mapsOpenUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}

/** Turn-by-turn from the rider’s current GPS to the pin. */
export function mapsDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function wazeUrl(lat: number, lng: number) {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

export function formatCoords(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return null;
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/** Browser confirm so the shopper signs off on the pin + written address. */
export function confirmDeliveryAddress(address: string, lat?: number | null, lng?: number | null) {
  const pin = formatCoords(lat, lng);
  const body = [
    'Please confirm this delivery address.',
    '',
    address.trim() || 'Add the floor and unit in the address field.',
    pin ? `\nPin: ${pin}` : '',
    '',
    'The rider will navigate to this pin.',
  ]
    .filter(Boolean)
    .join('\n');
  return window.confirm(body);
}

export type GeoHit = {
  lat: number;
  lng: number;
  label: string;
};

export async function searchPlaces(query: string): Promise<GeoHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', q);
  url.searchParams.set('countrycodes', 'my');
  url.searchParams.set('limit', '6');
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const rows = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  return rows.map((row) => ({
    lat: Number(row.lat),
    lng: Number(row.lon),
    label: row.display_name,
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'json');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('zoom', '18');
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? null;
}
