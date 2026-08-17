export function adminAppealEmail() {
  return (
    process.env.ADMIN_APPEAL_EMAIL ||
    process.env.BREVO_SMTP_USER ||
    'admin@vfresh.my'
  );
}

export function appBaseUrl() {
  const base =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';
  return base.replace(/\/$/, '');
}
