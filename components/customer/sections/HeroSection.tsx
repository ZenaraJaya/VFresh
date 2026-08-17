import { ArrowRight, Clock, Salad, Truck } from 'lucide-react';
import HomeHashLink from '@/components/customer/layout/HomeHashLink';

export default function HeroSection() {
  return (
    <section id="home" className="vf-gradient">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:py-28">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            <Salad className="h-3.5 w-3.5" />
            Healthy meals in Miri
          </span>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Fresh food,
            <br />
            delivered in{' '}
            <span className="text-emerald-600 dark:text-emerald-400">Miri</span>
          </h1>

          <p className="max-w-lg text-lg text-neutral-600 dark:text-neutral-300">
            VFresh is a platform by Zenara Jaya. Order from local kitchens —
            bowls, wraps, salads and drinks — delivered in the Miri area,
            depending on each vendor&apos;s location.
          </p>

          <div className="flex flex-wrap gap-3">
            <HomeHashLink
              hash="menu"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-medium text-white transition hover:bg-emerald-600"
            >
              Browse the menu
              <ArrowRight className="h-4 w-4" />
            </HomeHashLink>
            <HomeHashLink
              hash="about"
              className="inline-flex items-center rounded-xl border border-neutral-300 px-6 py-3 font-medium text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              About us
            </HomeHashLink>
          </div>

          <dl className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: 'Service area', value: 'Miri' },
              { label: 'Local kitchens', value: 'Vendors' },
              { label: 'By', value: 'Zenara Jaya' }
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {stat.label}
                </dt>
                <dd className="text-2xl font-bold">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: Clock,
              title: 'Order by 10am',
              body: 'Same-day lunch around Miri when the kitchen is open.',
            },
            {
              icon: Truck,
              title: 'Local kitchens',
              body: 'Browse vendors, see their address and hours, then order.',
            },
            {
              icon: Salad,
              title: 'Made that morning',
              body: 'Fresh meals from kitchens on the platform.',
            },
            {
              icon: ArrowRight,
              title: 'Miri area',
              body: 'Delivery depends on the kitchen location.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-neutral-200 bg-white/70 p-5 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70"
            >
              <card.icon className="mb-3 h-6 w-6 text-emerald-500" />
              <h3 className="font-semibold">{card.title}</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
