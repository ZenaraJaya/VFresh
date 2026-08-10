import { Leaf, Sprout, Sun, Wheat } from 'lucide-react';

const PILLARS = [
  {
    icon: Sprout,
    title: 'Cameron Highlands greens',
    body: 'Kale, romaine and spinach picked the day before and driven down overnight.'
  },
  {
    icon: Sun,
    title: 'Nothing from concentrate',
    body: 'Every smoothie is pressed from whole fruit on the morning it ships.'
  },
  {
    icon: Wheat,
    title: 'Whole grains only',
    body: 'Brown rice, quinoa and barley — no refined fillers to bulk out a bowl.'
  },
  {
    icon: Leaf,
    title: 'No added sugar',
    body: 'Sweetness comes from dates and fruit. Nothing else goes in.'
  }
];

export default function IngredientsSection() {
  return (
    <section id="ingredients" className="mx-auto max-w-6xl px-4 py-20">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What goes in
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            We publish our sourcing because most places won&apos;t. If an
            ingredient isn&apos;t on this list, it isn&apos;t in the food.
          </p>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            {[
              'No preservatives, colourings or stabilisers',
              'Halal-certified proteins throughout',
              'Compostable bowls and paper-sleeve cutlery',
              'Allergens listed on every item page'
            ].map((point) => (
              <li key={point} className="flex items-start gap-2">
                <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800"
            >
              <pillar.icon className="mb-3 h-6 w-6 text-emerald-500" />
              <h3 className="font-semibold">{pillar.title}</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
