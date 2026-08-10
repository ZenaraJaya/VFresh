interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

export default function Badge({ text, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    success: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${variants[variant]}`}>
      {text}
    </span>
  );
}