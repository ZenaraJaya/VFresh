export const DEMO_ACCOUNTS = {
  customer: {
    label: 'Customer',
    email: 'customer@vfresh.my',
    password: 'VFreshAdmin123!',
  },
  vendor: {
    label: 'Vendor',
    email: 'vendor@vfresh.my',
    password: 'VFreshVendor123!',
  },
  admin: {
    label: 'Admin',
    email: 'admin@vfresh.my',
    password: 'VFreshAdmin123!',
  },
  delivery: {
    label: 'Delivery',
    email: 'courier@vfresh.my',
    password: 'VFreshCourier123!',
  },
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;

const passwordByEmail = new Map(
  Object.values(DEMO_ACCOUNTS).map((account) => [
    account.email.toLowerCase(),
    account.password,
  ])
);

export function demoPasswordForEmail(email: string) {
  return passwordByEmail.get(email.toLowerCase().trim()) ?? null;
}

export function isPublishedDemoPassword(email: string, password: string) {
  const expected = demoPasswordForEmail(email);
  return Boolean(expected && password === expected);
}

export function credentialValue(value: unknown) {
  if (Array.isArray(value)) return String(value[0] ?? '').trim();
  return String(value ?? '').trim();
}
