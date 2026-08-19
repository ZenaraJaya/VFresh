'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, MapPin, Navigation } from 'lucide-react';
import {
  MIRI_CENTER,
  confirmDeliveryAddress,
  reverseGeocode,
  searchPlaces,
  type GeoHit,
} from '@/lib/maps';

type LeafletNs = {
  map: (el: HTMLElement, opts?: { zoomControl?: boolean }) => LeafletMap;
  tileLayer: (url: string, opts?: { attribution?: string }) => { addTo: (map: LeafletMap) => void };
  marker: (
    latlng: [number, number],
    opts?: { draggable?: boolean; icon?: unknown }
  ) => LeafletMarker;
  icon: (opts: {
    iconUrl: string;
    iconRetinaUrl?: string;
    shadowUrl?: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
  }) => unknown;
};

type LeafletMap = {
  setView: (latlng: [number, number], zoom: number) => LeafletMap;
  on: (event: 'click', fn: (e: { latlng: { lat: number; lng: number } }) => void) => void;
  remove: () => void;
  invalidateSize: () => void;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  setLatLng: (latlng: [number, number]) => void;
  on: (event: 'dragend', fn: () => void) => void;
  getLatLng: () => { lat: number; lng: number };
  remove: () => void;
};

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const MARKER_ICON = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const MARKER_ICON_2X = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const MARKER_SHADOW = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

function loadLeaflet(): Promise<LeafletNs> {
  const existing = (window as unknown as { L?: LeafletNs }).L;
  if (existing) return Promise.resolve(existing);

  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);
  }

  return new Promise((resolve, reject) => {
    const ready = () => {
      const L = (window as unknown as { L?: LeafletNs }).L;
      if (L) resolve(L);
      else reject(new Error('Leaflet failed to load'));
    };
    const prev = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (prev) {
      prev.addEventListener('load', ready);
      if ((window as unknown as { L?: LeafletNs }).L) ready();
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = ready;
    script.onerror = () => reject(new Error('Leaflet failed to load'));
    document.body.appendChild(script);
  });
}

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
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GeoHit[]>([]);
  const [busy, setBusy] = useState(false);
  const pinLat = lat ?? MIRI_CENTER.lat;
  const pinLng = lng ?? MIRI_CENTER.lng;
  const hasPin = lat != null && lng != null;

  const askConfirm = (nextAddress: string, nextLat: number, nextLng: number) => {
    const ok = confirmDeliveryAddress(nextAddress, nextLat, nextLng);
    onChangeRef.current({
      address: nextAddress,
      lat: nextLat,
      lng: nextLng,
      confirmed: ok,
    });
    if (!ok) {
      window.alert('Move the pin to the right place, then tap Confirm address.');
    }
  };

  const applyPin = async (
    nextLat: number,
    nextLng: number,
    nextAddress?: string,
    prompt = true
  ) => {
    const label =
      nextAddress?.trim() ||
      (await reverseGeocode(nextLat, nextLng)) ||
      address;
    onChangeRef.current({
      address: label,
      lat: nextLat,
      lng: nextLng,
      confirmed: false,
    });
    if (prompt) askConfirm(label, nextLat, nextLng);
  };

  useEffect(() => {
    let cancelled = false;
    const el = mapEl.current;
    if (!el) return;

    void loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current) return;
        const map = L.map(mapEl.current, { zoomControl: true }).setView(
          [pinLat, pinLng],
          16
        );
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);
        const icon = L.icon({
          iconUrl: MARKER_ICON,
          iconRetinaUrl: MARKER_ICON_2X,
          shadowUrl: MARKER_SHADOW,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });
        const marker = L.marker([pinLat, pinLng], {
          draggable: true,
          icon,
        }).addTo(map);
        map.on('click', (event) => {
          void applyPin(event.latlng.lat, event.latlng.lng);
        });
        marker.on('dragend', () => {
          const next = marker.getLatLng();
          void applyPin(next.lat, next.lng);
        });
        mapRef.current = map;
        markerRef.current = marker;
        requestAnimationFrame(() => map.invalidateSize());
      })
      .catch(() => {
        // Search / GPS still work without the interactive map.
      });

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      mapRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
    // Map is created once; pin updates sync in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.setView([pinLat, pinLng], 16);
    markerRef.current?.setLatLng([pinLat, pinLng]);
  }, [pinLat, pinLng]);

  const search = async () => {
    setBusy(true);
    try {
      const found = await searchPlaces(query || address);
      setHits(found);
      if (found.length === 1) {
        setHits([]);
        await applyPin(found[0].lat, found[0].lng, found[0].label);
      }
    } finally {
      setBusy(false);
    }
  };

  const useHere = () => {
    if (!navigator.geolocation) {
      window.alert('Location is not available on this device. Search or tap the map to place the pin.');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await applyPin(pos.coords.latitude, pos.coords.longitude);
        setBusy(false);
      },
      () => {
        setBusy(false);
        window.alert('Could not read your location. Allow location access, or tap the map to place the pin.');
      },
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
                  setHits([]);
                  void applyPin(hit.lat, hit.lng, hit.label);
                }}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="relative z-0 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
        <div ref={mapEl} className="h-56 w-full bg-neutral-100 dark:bg-neutral-900" />
        <style>{`
          .leaflet-container { height: 100%; width: 100%; z-index: 0; }
          .leaflet-pane, .leaflet-top, .leaflet-bottom { z-index: 1; }
        `}</style>
      </div>
      <p className="text-xs text-neutral-500">
        {hasPin
          ? `Pin set at ${pinLat.toFixed(5)}, ${pinLng.toFixed(5)}. Tap the map or drag the pin, then confirm.`
          : 'Search, use your location, or tap the map so the rider can follow the pin.'}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (!hasPin) {
            window.alert('Locate the pin on the map first, then confirm the address.');
            return;
          }
          askConfirm(address, pinLat, pinLng);
        }}
        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${
          confirmed
            ? 'bg-emerald-600 text-white'
            : 'bg-amber-500 text-white hover:bg-amber-600'
        }`}
      >
        <Check className="h-4 w-4" />
        {confirmed ? 'Address confirmed' : 'Confirm address'}
      </button>
    </div>
  );
}
