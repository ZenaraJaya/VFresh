import AccountNav from '@/components/customer/account/AccountNav';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl px-3 py-8 sm:px-4 sm:py-12">
      <AccountNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
