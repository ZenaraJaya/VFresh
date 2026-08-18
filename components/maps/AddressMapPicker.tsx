'use client';

import { useState } from 'react';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import {
  MIRI_CENTER,
  mapsEmbedUrl,
  reverseGeocode,
  searchPlaces,
  type GeoHit,
} from '@/lib/maps';

export default function AddressMapPicker({
  address,
  lat,
  lng,
  onChange,
}: {
  address: string;
  lat?: number | null;
  lng?: number | null;
  onChange: (next: { address?: string; lat: number; lng: number }) => void;
}) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GeoHit[]>([]);
  const [busy, setBusy] = useState(false);
  const pinLat = lat ?? MIRI_CENTER.lat;
  const pinLng = lng ?? MIRI_CENTER.lng;
  const hasPin = lat != null && lng != null;

  const search = async () => {
    setBusy(true);
    try {
      const found = await searchPlaces(query || address);
      setHits(found);
      if (found.length === 1) {
        onChange({
          address: found[0].label,
          lat: found[0].lat,
          lng: found[0].lng,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const useHere = () => {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nextLat = pos.coords.latitude;
        const nextLng = pos.coords.longitude;
        const label = await reverseGeocode(nextLat, nextLng);
        onChange({
          address: label ?? address,
          lat: nextLat,
          lng: nextLng,
        });
        setBusy(false);
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 12_000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a place in Miri"
          className="min-w-[12rem] flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void search();
            }
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void search()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          Pin on map
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={useHere}
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700"
        >
          <Navigation className="h-4 w-4" />
          Use my location
        </button>
      </div>
      {hits.length > 1 ? (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 text-sm dark:divide-neutral-800 dark:border-neutral-700">
          {hits.map((hit) => (
            <li key={`${hit.lat}-${hit.lng}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800"
                onClick={() => {
                  onChange({ address: hit.label, lat: hit.lat, lng: hit.lng });
                  setHits([]);
                }}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
        <iframe
          title="Delivery pin"
          src={mapsEmbedUrl(pinLat, pinLng)}
          className="h-52 w-full"
          loading="lazy"
        />
      </div>
      <p className="text-xs text-neutral-500">
        {hasPin
          ? `Pin set at ${pinLat.toFixed(5)}, ${pinLng.toFixed(5)}. Add floor/unit in the address field.`
          : 'Search a place or use your location so the rider can follow the route.'}
      </p>
    </div>
  );
}
