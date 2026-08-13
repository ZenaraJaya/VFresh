import { loadCustomerAccount } from '@/lib/customer-account';
import OrdersSubnav from '@/components/customer/account/OrdersSubnav';
import PreferredPaymentForm from '@/components/customer/account/PreferredPaymentForm';
import type { PaymentMethod } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AccountPaymentMethodPage() {
  const { me } = await loadCustomerAccount('/account/orders/payment');
  const initial = (me?.paymentMethod ?? 'COMPANY_ACCOUNT') as PaymentMethod;

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Payment method
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Default for new orders. Company account bills go on the shared monthly
        invoice for your workplace.
      </p>
      <OrdersSubnav />
      <div className="mt-6 max-w-lg">
        <PreferredPaymentForm initial={initial} />
      </div>
    </>
  );
}
