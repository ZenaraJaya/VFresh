import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { safeCallbackPath } from '@/lib/safe-callback';
import LoginForm from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const { callbackUrl } = await searchParams;
    const callback = safeCallbackPath(callbackUrl);
    const role = session.user.role;
    if (callback && (role === 'CUSTOMER' || role === 'DELIVERY')) {
      redirect(callback);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-16 vf-gradient">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
