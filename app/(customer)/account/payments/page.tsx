import { redirect } from 'next/navigation';

export default function AccountPaymentsRedirect() {
  redirect('/account/billing');
}
