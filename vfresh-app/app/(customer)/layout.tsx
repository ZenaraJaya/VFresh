import SiteShell from '@/components/customer/layout/SiteShell';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
