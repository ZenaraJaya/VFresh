import { Clock, MapPin } from 'lucide-react';

const ZONES = [
  {
    name: 'KLCC & Bukit Bintang',
    window: '11:30 – 12:00',
    note: 'Same-day if ordered before 10:00'
  },
  {
    name: 'Bangsar & Mid Valley',
    window: '11:45 – 12:15',
    note: 'Same-day if ordered before 10:00'
  },
  {
    name: 'Petaling Jaya & Damansara',
    window: '12:00 – 12:45',
    note: 'Same-day if ordered before 09:30'
  },
  {
    name: 'Cyberjaya & Puchong',
    window: '12:15 – 13:00',
    note: 'Next-day delivery only'
  }
];

export default function LocationSection() {
  return (
    <section
      id="location"
      className="scroll-mt-20 border-y border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Where we deliver
          </h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Four zones across the Klang Valley, each with a fixed delivery
            window so your team knows when lunch lands.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ZONES.map((zone) => (
            <div
              key={zone.name}
              className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <MapPin className="mb-3 h-6 w-6 text-emerald-500" />
              <h3 className="font-semibold">{zone.name}</h3>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <Clock className="h-4 w-4" />
                {zone.window}
              </p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {zone.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
