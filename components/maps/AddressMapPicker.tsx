'use client';

import { useRef, useState } from 'react';
import { Check, Loader2, MapPin, Navigation } from 'lucide-react';
import {
  MAP_EMBED_DELTA,
  MIRI_CENTER,
  confirmDeliveryAddress,
  mapsEmbedUrl,
  reverseGeocode,
  searchPlaces,
  type GeoHit,
} from '@/lib/maps';

export default function AddressMapPicker({
  address,
  lat,
  lng,
  confirmed = false,
  onChange,
}: {
  address: string;
  lat?: number | null;
  lng?: number | null;
  confirmed?: boolean;
  onChange: (next: {
    address?: string;
    lat: number;
    lng: number;
    confirmed: boolean;
  }) => void;
}) {
  const mapBox = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GeoHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [view, setView] = useState({
    lat: lat ?? MIRI_CENTER.lat,
    lng: lng ?? MIRI_CENTER.lng,
  });

  const showLat = lat ?? view.lat;
  const showLng = lng ?? view.lng;
  const hasPin = lat != null && lng != null;

  const writeLocation = async (
    nextLat: number,
    nextLng: number,
    nextAddress?: string
  ) => {
    setView({ lat: nextLat, lng: nextLng });
    setOffset({ x: 0, y: 0 });
    const label =
      nextAddress?.trim() ||
      (await reverseGeocode(nextLat, nextLng)) ||
      address;
    onChange({
      address: label,
      lat: nextLat,
      lng: nextLng,
      confirmed: false,
    });
  };

  const search = async () => {
    setBusy(true);
    try {
      const found = await searchPlaces(query || address);
      setHits(found);
      if (found.length === 1) {
        setHits([]);
        await writeLocation(found[0].lat, found[0].lng, found[0].label);
      }
    } finally {
      setBusy(false);
    }
  };

  const useHere = () => {
    if (!navigator.geolocation) {
      window.alert('Location is not available. Search, then drag the pin.');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await writeLocation(pos.coords.latitude, pos.coords.longitude);
        setBusy(false);
      },
      () => {
        setBusy(false);
        window.alert('Could not read your location. Search, then drag the pin.');
      },
      { enableHighAccuracy: true, timeout: 12_000 }
    );
  };

  const finishDrag = async (clientX: number, clientY: number) => {
    const start = drag.current;
    const box = mapBox.current;
    drag.current = null;
    setDragging(false);
    if (!start || !box) {
      setOffset({ x: 0, y: 0 });
      return;
    }
    const rect = box.getBoundingClientRect();
    const dx = clientX - start.startX;
    const dy = clientY - start.startY;
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
      setOffset({ x: 0, y: 0 });
      return;
    }
    const nextLng = showLng + (dx / rect.width) * (MAP_EMBED_DELTA * 2);
    const nextLat = showLat - (dy / rect.height) * (MAP_EMBED_DELTA * 2);
    setBusy(true);
    try {
      await writeLocation(nextLat, nextLng);
    } finally {
      setBusy(false);
    }
  };

  const askConfirm = () => {
    if (!hasPin) {
      window.alert('Drag the pin to your place first, then confirm the address.');
      return;
    }
    const ok = confirmDeliveryAddress(address, showLat, showLng);
    onChange({
      address,
      lat: showLat,
      lng: showLng,
      confirmed: ok,
    });
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
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700"
        >
          Search
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
                  setHits([]);
                  void writeLocation(hit.lat, hit.lng, hit.label);
                }}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        ref={mapBox}
        className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700"
      >
        <iframe
          title="Delivery map"
          src={mapsEmbedUrl(showLat, showLng)}
          className="pointer-events-none h-56 w-full"
          loading="eager"
        />
        {dragging ? (
          <div className="absolute inset-0 z-10" />
        ) : null}
        <button
          type="button"
          aria-label="Drag pin to the delivery place"
          className="absolute left-1/2 top-1/2 z-20 flex h-12 w-12 cursor-grab touch-none items-center justify-center rounded-full text-emerald-600 active:cursor-grabbing"
          style={{
            transform: `translate(calc(-50% + ${offset.x}px), calc(-85% + ${offset.y}px))`,
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = {
              pointerId: e.pointerId,
              startX: e.clientX,
              startY: e.clientY,
            };
            setDragging(true);
            setOffset({ x: 0, y: 0 });
          }}
          onPointerMove={(e) => {
            if (!drag.current || drag.current.pointerId !== e.pointerId) return;
            setOffset({
              x: e.clientX - drag.current.startX,
              y: e.clientY - drag.current.startY,
            });
          }}
          onPointerUp={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId);
            void finishDrag(e.clientX, e.clientY);
          }}
          onPointerCancel={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId);
            drag.current = null;
            setDragging(false);
            setOffset({ x: 0, y: 0 });
          }}
        >
          <MapPin className="h-10 w-10 drop-shadow-md" fill="currentColor" />
        </button>
      </div>

      <p className="text-xs text-neutral-500">
        Drag the green pin to the door. The address fills in automatically, then tap Confirm address.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={askConfirm}
        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${
          confirmed
            ? 'bg-emerald-600 text-white'
            : 'bg-amber-500 text-white hover:bg-amber-600'
        }`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {confirmed ? 'Address confirmed' : 'Confirm address'}
      </button>
    </div>
  );
}
