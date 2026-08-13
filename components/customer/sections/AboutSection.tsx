import { Leaf, MapPin, Store, Users } from 'lucide-react';

const POINTS = [
  {
    icon: Leaf,
    title: 'A healthy food platform',
    body: 'VFresh brings local kitchens onto one site so you can order fresh meals without hopping between apps.',
  },
  {
    icon: Store,
    title: 'Independent vendors',
    body: 'Each kitchen sets its own menu, hours, and location. You see who is open and where they cook before you order.',
  },
  {
    icon: MapPin,
    title: 'Built for Miri',
    body: 'We serve the Miri area. Delivery follows the vendor you pick — check their location on their page.',
  },
  {
    icon: Users,
    title: 'By Zenara Jaya',
    body: 'VFresh is a platform from Zenara Jaya, based in Miri, Sarawak — connecting neighbourhood kitchens with people who want better food.',
  },
];

export default function AboutSection() {
  return (
    <section
      id="about"
      className="scroll-mt-20 border-y border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            About us
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            VFresh, a platform by Zenara Jaya
          </h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            We are not a single kitchen. VFresh is the place in Miri to browse
            healthy vendors, see where they are, and order in one checkout.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((point) => (
            <li
              key={point.title}
              className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <point.icon className="mb-4 h-7 w-7 text-emerald-500" />
              <h3 className="font-semibold">{point.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {point.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
