import accounts from './demo-accounts.json';

export type DemoRole = keyof typeof accounts;

export const DEMO_ACCOUNTS = accounts;

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
