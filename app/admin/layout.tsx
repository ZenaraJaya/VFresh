import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';

export const metadata = {
  title: 'VFresh Admin'
};

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // /admin/login is the one route under this layout that renders without a
  // session, so the chrome is skipped rather than the request redirected —
  // each protected page does its own requireAdmin() redirect.
  if (!session || session.user.role !== 'ADMIN') {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-1 bg-neutral-50 dark:bg-neutral-950">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          name={session.user.name}
          email={session.user.email}
          image={session.user.image}
        />
        <main className="flex-1 overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  );
}
