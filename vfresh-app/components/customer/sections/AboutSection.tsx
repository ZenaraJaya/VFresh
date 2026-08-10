import { ClipboardList, PackageCheck, Receipt, UtensilsCrossed } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Your team orders',
    body: 'Everyone picks their own meal from the menu and charges it to the company account.'
  },
  {
    icon: UtensilsCrossed,
    title: 'We cook that morning',
    body: 'Prep starts at 5am. Nothing is made the night before, nothing is frozen.'
  },
  {
    icon: PackageCheck,
    title: 'Delivered to the floor',
    body: 'Labelled by name and department, dropped at your pantry between 11:30 and 12:30.'
  },
  {
    icon: Receipt,
    title: 'One invoice a month',
    body: 'Finance gets a single itemised statement per company, payable in 30 days.'
  }
];

export default function AboutSection() {
  return (
    <section
      id="about"
      className="border-y border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Built for offices, not for one-off orders. Set up a company account
            once and your whole team can order without touching a card.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <span className="absolute right-5 top-5 text-4xl font-bold text-neutral-100 dark:text-neutral-800">
                {i + 1}
              </span>
              <step.icon className="mb-4 h-7 w-7 text-emerald-500" />
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
