import { redirect } from 'next/navigation';

export default function AccountOrderPaymentRedirect() {
  redirect('/account/billing');
}
