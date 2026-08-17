import { MapPin } from 'lucide-react';
import HomeHashLink from '@/components/customer/layout/HomeHashLink';

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
            Miri area. Coverage follows each kitchen&apos;s location — the same
            place shown on the vendor cards above.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-950">
          <MapPin className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
          <h3 className="text-xl font-semibold">Miri, Sarawak</h3>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            We deliver around Miri. Exact reach depends on the vendor you order
            from — open their page for address and hours.
          </p>
          <HomeHashLink
            hash="vendors"
            className="mt-5 inline-flex text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            See vendor locations
          </HomeHashLink>
        </div>
      </div>
    </section>
  );
}
