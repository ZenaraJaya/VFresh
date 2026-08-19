'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Minus, Plus } from 'lucide-react';
import { MIRI_CENTER } from '@/lib/maps';
import {
  TILE_SIZE,
  clampZoom,
  project,
  unproject,
} from '@/lib/web-mercator';

const HEIGHT = 280;

type Point = { lat: number; lng: number };

export default function DraggablePinMap({
  lat,
  lng,
  onPin,
}: {
  lat?: number | null;
  lng?: number | null;
  onPin: (next: Point) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const gesture = useRef<
    | {
        kind: 'pan' | 'marker';
        pointerId: number;
        startX: number;
        startY: number;
        origin: Point;
      }
    | null
  >(null);

  const [size, setSize] = useState({ w: 320, h: HEIGHT });
  const [zoom, setZoom] = useState(17);
  const [center, setCenter] = useState<Point>({
    lat: lat ?? MIRI_CENTER.lat,
    lng: lng ?? MIRI_CENTER.lng,
  });
  const [marker, setMarker] = useState<Point>({
    lat: lat ?? MIRI_CENTER.lat,
    lng: lng ?? MIRI_CENTER.lng,
  });
  const [markerShift, setMarkerShift] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.max(1, rect.width), h: HEIGHT });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (lat == null || lng == null) return;
    setMarker({ lat, lng });
    setCenter({ lat, lng });
    setMarkerShift({ x: 0, y: 0 });
  }, [lat, lng]);

  const markerPx = () => {
    const c = project(center.lat, center.lng, zoom);
    const m = project(marker.lat, marker.lng, zoom);
    return {
      x: size.w / 2 + (m.x - c.x) * TILE_SIZE + markerShift.x,
      y: size.h / 2 + (m.y - c.y) * TILE_SIZE + markerShift.y,
    };
  };

  const tiles = () => {
    const c = project(center.lat, center.lng, zoom);
    const n = 2 ** zoom;
    const minX = Math.floor(c.x - size.w / 2 / TILE_SIZE) - 1;
    const maxX = Math.floor(c.x + size.w / 2 / TILE_SIZE) + 1;
    const minY = Math.floor(c.y - size.h / 2 / TILE_SIZE) - 1;
    const maxY = Math.floor(c.y + size.h / 2 / TILE_SIZE) + 1;
    const out: { key: string; left: number; top: number; src: string }[] = [];
    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        if (y < 0 || y >= n) continue;
        const tx = ((x % n) + n) % n;
        out.push({
          key: `${zoom}-${tx}-${y}`,
          left: size.w / 2 + (x - c.x) * TILE_SIZE,
          top: size.h / 2 + (y - c.y) * TILE_SIZE,
          src: `https://tile.openstreetmap.org/${zoom}/${tx}/${y}.png`,
        });
      }
    }
    return out;
  };

  const endGesture = (clientX: number, clientY: number) => {
    const g = gesture.current;
    const el = box.current;
    gesture.current = null;
    if (!g) return;

    const dx = clientX - g.startX;
    const dy = clientY - g.startY;

    if (g.kind === 'pan') {
      if (el && Math.abs(dx) < 5 && Math.abs(dy) < 5) {
        const rect = el.getBoundingClientRect();
        const p = project(g.origin.lat, g.origin.lng, zoom);
        const next = unproject(
          p.x + (clientX - rect.left - size.w / 2) / TILE_SIZE,
          p.y + (clientY - rect.top - size.h / 2) / TILE_SIZE,
          zoom
        );
        setMarker(next);
        setCenter(next);
        onPin(next);
      }
      return;
    }

    const p = project(g.origin.lat, g.origin.lng, zoom);
    const next = unproject(p.x + dx / TILE_SIZE, p.y + dy / TILE_SIZE, zoom);
    setMarker(next);
    setMarkerShift({ x: 0, y: 0 });
    setCenter(next);
    onPin(next);
  };

  const pin = markerPx();

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
      <div
        ref={box}
        className="relative touch-none select-none bg-neutral-200 dark:bg-neutral-800"
        style={{ height: HEIGHT }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          gesture.current = {
            kind: 'pan',
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            origin: center,
          };
        }}
        onPointerMove={(e) => {
          const g = gesture.current;
          if (!g || g.pointerId !== e.pointerId) return;
          const dx = e.clientX - g.startX;
          const dy = e.clientY - g.startY;
          if (g.kind === 'pan') {
            const p = project(g.origin.lat, g.origin.lng, zoom);
            setCenter(unproject(p.x - dx / TILE_SIZE, p.y - dy / TILE_SIZE, zoom));
          } else {
            setMarkerShift({ x: dx, y: dy });
          }
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          endGesture(e.clientX, e.clientY);
        }}
        onPointerCancel={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          gesture.current = null;
          setMarkerShift({ x: 0, y: 0 });
        }}
      >
        {tiles().map((tile) => (
          <img
            key={tile.key}
            alt=""
            draggable={false}
            src={tile.src}
            className="pointer-events-none absolute"
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              left: tile.left,
              top: tile.top,
            }}
          />
        ))}

        <button
          type="button"
          aria-label="Drag pin to the delivery place"
          className="absolute z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-[90%] cursor-grab items-center justify-center text-emerald-600 active:cursor-grabbing"
          style={{ left: pin.x, top: pin.y }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            gesture.current = {
              kind: 'marker',
              pointerId: e.pointerId,
              startX: e.clientX,
              startY: e.clientY,
              origin: marker,
            };
            setMarkerShift({ x: 0, y: 0 });
          }}
        >
          <MapPin className="h-11 w-11 drop-shadow-md" fill="currentColor" />
        </button>

        <div className="absolute right-2 top-2 z-10 flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow dark:border-neutral-700 dark:bg-neutral-900">
          <button
            type="button"
            aria-label="Zoom in"
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setZoom((z) => clampZoom(z + 1))}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            className="border-t border-neutral-200 p-1.5 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setZoom((z) => clampZoom(z - 1))}
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="border-t border-neutral-200 px-3 py-1.5 text-[11px] text-neutral-500 dark:border-neutral-700">
        Drag the map to move. Drag the pin onto the door. © OpenStreetMap
      </p>
    </div>
  );
}
