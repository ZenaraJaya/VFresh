'use client';

export default function DelayNotice({
  reason,
  proof,
}: {
  reason?: string | null;
  proof?: string | null;
}) {
  if (!reason && !proof) return null;

  return (
    <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900 dark:bg-amber-950/30">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
        Delay
      </p>
      {reason && (
        <p className="text-sm text-neutral-800 dark:text-neutral-100">{reason}</p>
      )}
      {proof && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={proof}
          alt="Delay proof"
          className="max-h-56 w-full rounded-lg object-cover"
        />
      )}
    </div>
  );
}
