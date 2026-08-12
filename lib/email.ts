/**
 * Send transactional email via Brevo (Sendinblue) API.
 * Uses BREVO_API_KEY + BREVO_SMTP_USER (sender email) + BREVO_SENDER_NAME.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SMTP_USER;
  const senderName = process.env.BREVO_SENDER_NAME || 'VFresh';

  if (!apiKey || !senderEmail) {
    console.warn(
      'BREVO_API_KEY or BREVO_SMTP_USER missing — email not sent:',
      opts.subject,
      '→',
      opts.to
    );
    return { ok: false as const, skipped: true as const };
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: opts.to }],
      subject: opts.subject,
      htmlContent: opts.html,
      textContent: opts.text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('Brevo send failed', res.status, detail);
    return { ok: false as const, skipped: false as const, detail };
  }

  return { ok: true as const };
}

export function vendorApprovalEmail(opts: {
  businessName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}) {
  const subject = 'Your VFresh vendor account is approved';
  const text = `Hi ${opts.businessName},

Your vendor registration on VFresh has been approved.

Sign in at: ${opts.loginUrl}
Email: ${opts.email}
Temporary password: ${opts.tempPassword}

Please sign in and change your password after your first login.

— VFresh`;

  const html = `
    <div style="font-family:sans-serif;line-height:1.5;color:#111">
      <h2>Welcome to VFresh</h2>
      <p>Hi <strong>${opts.businessName}</strong>,</p>
      <p>Your vendor registration has been <strong>approved</strong>.</p>
      <p>
        <a href="${opts.loginUrl}">Sign in here</a><br/>
        Email: <code>${opts.email}</code><br/>
        Temporary password: <code>${opts.tempPassword}</code>
      </p>
      <p>Please change your password after your first login.</p>
      <p>— VFresh</p>
    </div>
  `;

  return { subject, text, html };
}
