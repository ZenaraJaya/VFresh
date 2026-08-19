'use client';

import { useState } from 'react';
import { Check, Loader2, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import { reverseGeocode, searchPlaces, type GeoHit } from '@/lib/maps';
import ConfirmAddressDialog from '@/components/maps/confirm-address-toast';
import DraggablePinMap from '@/components/maps/DraggablePinMap';

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
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GeoHit[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const writeLocation = async (
    nextLat: number,
    nextLng: number,
    nextAddress?: string
  ) => {
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
      toast.error('Location is not available. Drag the pin on the map instead.');
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
        toast.error('Could not read your location. Drag the pin on the map instead.');
      },
      { enableHighAccuracy: true, timeout: 12_000 }
    );
  };

  const askConfirm = () => {
    if (lat == null || lng == null) {
      toast.error('Drag the pin to your place first, then confirm the address.');
      return;
    }
    setConfirmOpen(true);
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

      <DraggablePinMap
        lat={lat}
        lng={lng}
        onPin={(next) => {
          void writeLocation(next.lat, next.lng);
        }}
      />

      <p className="text-xs text-neutral-500">
        Drag the green pin onto the door. The address fills in when you drop it, then tap Confirm address.
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
      {lat != null && lng != null ? (
        <ConfirmAddressDialog
          open={confirmOpen}
          address={address}
          lat={lat}
          lng={lng}
          onConfirm={() => {
            setConfirmOpen(false);
            onChange({ address, lat, lng, confirmed: true });
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      ) : null}
    </div>
  );
}
