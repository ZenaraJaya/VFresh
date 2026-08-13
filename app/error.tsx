'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        This page couldn&apos;t load
      </h1>
      <p className="mt-2 max-w-md text-neutral-600 dark:text-neutral-400">
        A server error occurred. Try again in a moment.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
      >
        Reload to try again
      </button>
    </div>
  );
}
