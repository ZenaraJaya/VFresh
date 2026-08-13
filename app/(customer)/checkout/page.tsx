import { requireCustomer } from '@/lib/auth-guard';
import CheckoutClient from './CheckoutClient';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  await requireCustomer();
  return <CheckoutClient />;
}
