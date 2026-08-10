import Link from 'next/link';
import { ArrowRight, Clock, Salad, Truck } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="vf-gradient">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:py-28">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            <Salad className="h-3.5 w-3.5" />
            Corporate meal delivery
          </span>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Fresh food,
            <br />
            delivered to your{' '}
            <span className="text-emerald-600 dark:text-emerald-400">desk</span>
          </h1>

          <p className="max-w-lg text-lg text-neutral-600 dark:text-neutral-300">
            Cold-pressed smoothies, grain bowls, wraps and salads made each
            morning and delivered to offices across the Klang Valley. One
            monthly invoice per company — no petty cash, no chasing receipts.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-medium text-white transition hover:bg-emerald-600"
            >
              Browse the menu
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#about"
              className="inline-flex items-center rounded-xl border border-neutral-300 px-6 py-3 font-medium transition hover:bg-white dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              How it works
            </Link>
          </div>

          <dl className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: 'Companies served', value: '120+' },
              { label: 'Meals per week', value: '4,800' },
              { label: 'Avg. delivery', value: '25 min' }
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
              body: 'Same-day lunch delivery for the whole team.'
            },
            {
              icon: Truck,
              title: 'Free over RM 100',
              body: 'Office-sized orders ship at no extra cost.'
            },
            {
              icon: Salad,
              title: 'Made that morning',
              body: 'Nothing sits overnight. Ever.'
            },
            {
              icon: ArrowRight,
              title: 'Monthly invoice',
              body: 'One statement per company, due in 30 days.'
            }
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
