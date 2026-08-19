/** Web Mercator helpers for an OSM tile map (256px tiles). */

export const TILE_SIZE = 256;

export function project(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom;
  const x = ((lng + 180) / 360) * n;
  const rad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return { x, y };
}

export function unproject(x: number, y: number, zoom: number) {
  const n = 2 ** zoom;
  const lng = (x / n) * 360 - 180;
  const lat =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  return {
    lat: Math.min(85, Math.max(-85, lat)),
    lng: ((((lng + 180) % 360) + 360) % 360) - 180,
  };
}

export function clampZoom(zoom: number) {
  return Math.min(19, Math.max(12, zoom));
}
