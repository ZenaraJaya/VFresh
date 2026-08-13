import { Star } from 'lucide-react';

const REVIEWS = [
  {
    quote:
      'We used to spend an hour a day coordinating lunch for 40 people. Now it is one order and one invoice.',
    name: 'Aisyah R.',
    role: 'Office manager, Miri'
  },
  {
    quote:
      'The bowls actually taste like they were made that morning, because they were. Our team noticed immediately.',
    name: 'Daniel Lim',
    role: 'Team lead, Miri'
  },
  {
    quote:
      'Finance stopped complaining about receipts. That alone was worth switching.',
    name: 'Priya N.',
    role: 'Operations, Miri'
  }
];

export default function ReviewSection() {
  return (
    <section id="reviews" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-3 flex items-center justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="h-5 w-5 fill-amber-400 text-amber-400"
              aria-hidden
            />
          ))}
        </div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          What customers say
        </h2>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          From teams and households ordering through VFresh in Miri.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {REVIEWS.map((review) => (
          <figure
            key={review.name}
            className="flex flex-col rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800"
          >
            <blockquote className="flex-1 text-neutral-700 dark:text-neutral-300">
              &ldquo;{review.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <div className="font-semibold">{review.name}</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {review.role}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
