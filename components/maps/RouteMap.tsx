'use client';

import { Navigation } from 'lucide-react';
import {
  formatCoords,
  mapsDirectionsUrl,
  mapsEmbedUrl,
  wazeUrl,
} from '@/lib/maps';

export default function RouteMap({
  lat,
  lng,
  address,
  follow = false,
}: {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  follow?: boolean;
}) {
  if (lat == null || lng == null) {
    return address ? (
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{address}</p>
    ) : null;
  }

  return (
    <div className="space-y-2">
      {address ? (
        <p className="text-sm text-neutral-700 dark:text-neutral-200">{address}</p>
      ) : null}
      <p className="text-xs text-neutral-500">{formatCoords(lat, lng)}</p>
      <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
        <iframe
          title="Delivery map"
          src={mapsEmbedUrl(lat, lng)}
          className="h-48 w-full"
          loading="lazy"
        />
      </div>
      {follow ? (
        <div className="flex flex-wrap gap-2">
          <a
            href={mapsDirectionsUrl(lat, lng)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            <Navigation className="h-4 w-4" />
            Follow route
          </a>
          <a
            href={wazeUrl(lat, lng)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700"
          >
            Open in Waze
          </a>
        </div>
      ) : null}
    </div>
  );
}
