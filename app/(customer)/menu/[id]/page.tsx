import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Badge from '@/components/shared/ui/Badge';
import AddToCartPanel from '@/components/customer/menu/AddToCartPanel';
import { prisma } from '@/lib/db';
import { formatMYR } from '@/lib/pricing';
import { VENDOR_HOURS_SELECT } from '@/lib/vendor-availability';
import type { MenuItem } from '@/types';

export const dynamic = 'force-dynamic';

// Next 16: route params are always a Promise.
export default async function MenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.menuItem.findUnique({
    where: { id },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          slug: true,
          ...VENDOR_HOURS_SELECT,
        },
      },
    },
  });
  if (!item) notFound();

  const related = await prisma.menuItem.findMany({
    where: { category: item.category, available: true, id: { not: item.id } },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          slug: true,
          ...VENDOR_HOURS_SELECT,
        },
      },
    },
    take: 3,
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <Link
        href="/menu"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-emerald-600 dark:text-neutral-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to menu
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800">
          {item.image && (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(min-width: 1024px) 480px, 90vw"
              className="object-cover"
              priority
            />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {item.category}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              {item.name}
            </h1>
            <p className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatMYR(item.price)}
            </p>
          </div>

          <p className="text-neutral-600 dark:text-neutral-300">
            {item.description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {(item.badges as string[]).map((badge) => (
              <Badge key={badge} text={badge} />
            ))}
          </div>

          {item.available ? (
            <AddToCartPanel item={item as unknown as MenuItem} />
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
              This item is currently unavailable.
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold">
            More from {item.category.toLowerCase()}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/menu/${r.id}`}
                className="flex gap-3 rounded-xl border border-neutral-200 p-3 transition hover:shadow-md dark:border-neutral-800"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  {r.image && (
                    <Image
                      src={r.image}
                      alt={r.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.name}</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {formatMYR(r.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
