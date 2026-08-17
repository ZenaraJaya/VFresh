import { UserRound } from 'lucide-react';

export default function ProfileAvatar({
  src,
  name,
  size = 36,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  const dim = `${size}px`;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || 'Profile'}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: dim, height: dim }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
      style={{ width: dim, height: dim }}
      aria-hidden
    >
      <UserRound style={{ width: size * 0.48, height: size * 0.48 }} />
    </span>
  );
}
