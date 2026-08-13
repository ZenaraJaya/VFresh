import { Store } from 'lucide-react';

export default function VendorLogo({
  src,
  name,
  className = 'h-14 w-14',
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`rounded-2xl object-cover ${className}`}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 ${className}`}
    >
      <Store className="h-6 w-6" />
    </span>
  );
}
