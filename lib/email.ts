/**
 * Send transactional email via Resend.
 * Uses RESEND_API_KEY and EMAIL_FROM (or RESEND_FROM / BREVO_SENDER_EMAIL).
 */
function envValue(name: string) {
  return process.env[name]?.trim().replace(/^["']|["']$/g, '') || '';
}

function parseSender() {
  const fallbackName = envValue('BREVO_SENDER_NAME') || 'VFresh';
  const raw =
    envValue('EMAIL_FROM') ||
    envValue('RESEND_FROM') ||
    envValue('BREVO_SENDER_EMAIL') ||
    envValue('BREVO_SMTP_USER');
  const named = /^(.*)<([^>]+)>\s*$/.exec(raw);
  if (named) {
    const name = named[1].trim().replace(/^["']|["']$/g, '') || fallbackName;
    return { name, email: named[2].trim().toLowerCase() };
  }
  const value = raw.toLowerCase();
  if (value.includes('@')) return { name: fallbackName, email: value };
  if (value.includes('.')) {
    return { name: fallbackName, email: `hello@${value}` };
  }
  return { name: fallbackName, email: value };
}

export async function sendEmail(opts: {
  to: string | string[];
  cc?: string[];
  subject: string;
  html: string;
  text?: string;
}) {
  const apiKey = envValue('RESEND_API_KEY');
  const sender = parseSender();
  const replyTo =
    envValue('EMAIL_RECEIVE') ||
    envValue('EMAIL_REPLY_TO') ||
    sender.email;

  const to = uniqueEmails(opts.to);
  const cc = uniqueEmails(opts.cc).filter((email) => !to.includes(email));

  if (!apiKey || !sender.email.includes('@')) {
    console.warn(
      'RESEND_API_KEY or EMAIL_FROM missing — email not sent:',
      opts.subject,
      '→',
      to.join(', ')
    );
    return {
      ok: false as const,
      skipped: true as const,
      detail:
        'Email is not configured. Set RESEND_API_KEY and EMAIL_FROM=vfresh.com (verify that domain in Resend).',
    };
  }

  if (to.length === 0) {
    return {
      ok: false as const,
      skipped: false as const,
      detail: 'No recipient email',
    };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${sender.name} <${sender.email}>`,
      to,
      ...(cc.length ? { cc } : {}),
      reply_to: replyTo,
      subject: opts.subject,
      html: opts.html,
      ...(opts.text ? { text: opts.text } : {}),
    }),
  });

  if (!res.ok) {
    const raw = await res.text();
    console.error('Resend send failed', res.status, raw);
    return {
      ok: false as const,
      skipped: false as const,
      detail: resendErrorMessage(raw, res.status),
    };
  }

  return { ok: true as const };
}

function uniqueEmails(value?: string | string[] | null) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return [
    ...new Set(
      list
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.includes('@'))
    ),
  ];
}

function resendErrorMessage(raw: string, status: number) {
  try {
    const parsed = JSON.parse(raw) as { message?: string; name?: string };
    const message = parsed.message || '';
    if (/domain|not verified|from/i.test(message)) {
      return `${message} Verify vfresh.com in Resend and send from EMAIL_FROM.`;
    }
    if (parsed.message) return parsed.message;
  } catch {
    // use raw text
  }
  const trimmed = raw.trim();
  if (trimmed) return trimmed.slice(0, 280);
  return `Email provider returned ${status}`;
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

export function companyInvoiceEmail(opts: {
  companyName: string;
  invoiceNumber: string;
  amount: string;
  orderCount: number;
  dueYmd: string;
  periodLabel: string;
  billingEmail?: string;
  billingAddress?: string | null;
  phone?: string | null;
  viewUrl?: string;
}) {
  const billTo = [
    opts.companyName,
    opts.billingEmail,
    opts.phone,
    opts.billingAddress,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join('\n');
  const subject = `VFresh invoice ${opts.invoiceNumber} — ${opts.companyName}`;
  const text = `Hi ${opts.companyName},

Your VFresh company invoice for ${opts.periodLabel} is ready.

Invoice: ${opts.invoiceNumber}
Orders: ${opts.orderCount}
Amount: ${opts.amount}
Due: ${opts.dueYmd}

Bill to:
${billTo || opts.companyName}

Sign in to VFresh → Account → Invoices to view it. Payment is due within 30 days.
${opts.viewUrl ? `\nView invoice: ${opts.viewUrl}\n` : ''}
— VFresh`;
  const html = `
    <div style="font-family:sans-serif;line-height:1.5;color:#111">
      <h2>Invoice ${escapeHtml(opts.invoiceNumber)}</h2>
      <p>Hi <strong>${escapeHtml(opts.companyName)}</strong>,</p>
      <p>Your VFresh company invoice for <strong>${escapeHtml(opts.periodLabel)}</strong> is ready.</p>
      <p>
        Orders: ${opts.orderCount}<br/>
        Amount: <strong>${escapeHtml(opts.amount)}</strong><br/>
        Due: ${escapeHtml(opts.dueYmd)}
      </p>
      <p><strong>Bill to</strong><br/>
        ${escapeHtml(opts.companyName)}<br/>
        ${opts.billingEmail ? `${escapeHtml(opts.billingEmail)}<br/>` : ''}
        ${opts.phone ? `${escapeHtml(opts.phone)}<br/>` : ''}
        ${opts.billingAddress ? escapeHtml(opts.billingAddress).replace(/\n/g, '<br/>') : ''}
      </p>
      ${
        opts.viewUrl
          ? `<p><a href="${escapeHtml(opts.viewUrl)}">View invoice in VFresh</a></p>`
          : '<p>Sign in to VFresh → Account → Invoices to view it.</p>'
      }
      <p>Payment is due within 30 days.</p>
      <p>— VFresh</p>
    </div>
  `;
  return { subject, text, html };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function vendorWarningEmail(opts: {
  businessName: string;
  warningNumber: number;
  reason: string;
  remainingBeforeSuspend: number;
}) {
  const subject = `VFresh warning ${opts.warningNumber} of 2 — ${opts.businessName}`;
  const next =
    opts.remainingBeforeSuspend > 0
      ? `This is warning ${opts.warningNumber} of 2. Please correct the issue. A further warning with no improvement can lead to suspension.`
      : 'This is your second warning. If there is no improvement, your kitchen will be suspended. Suspended kitchens cannot register again — you would need to email VFresh admin.';
  const text = `Hi ${opts.businessName},

VFresh has issued a formal warning (${opts.warningNumber} of 2).

Reason:
${opts.reason}

${next}

— VFresh`;
  const html = `
    <div style="font-family:sans-serif;line-height:1.5;color:#111">
      <h2>Formal warning (${opts.warningNumber} of 2)</h2>
      <p>Hi <strong>${escapeHtml(opts.businessName)}</strong>,</p>
      <p>VFresh has issued a formal warning about your kitchen.</p>
      <p><strong>Reason</strong></p>
      <p>${escapeHtml(opts.reason)}</p>
      <p>${escapeHtml(next)}</p>
      <p>— VFresh</p>
    </div>
  `;
  return { subject, text, html };
}

export function vendorSuspendEmail(opts: {
  businessName: string;
  reason: string;
  appealEmail: string;
}) {
  const subject = `Your VFresh kitchen has been suspended — ${opts.businessName}`;
  const text = `Hi ${opts.businessName},

Your VFresh vendor account has been suspended after two warnings with no improvement.

Reason:
${opts.reason}

You cannot register again with this email. To appeal, email ${opts.appealEmail}.

— VFresh`;
  const html = `
    <div style="font-family:sans-serif;line-height:1.5;color:#111">
      <h2>Kitchen suspended</h2>
      <p>Hi <strong>${escapeHtml(opts.businessName)}</strong>,</p>
      <p>Your vendor account has been <strong>suspended</strong> after two warnings with no improvement.</p>
      <p><strong>Reason</strong></p>
      <p>${escapeHtml(opts.reason)}</p>
      <p>You cannot register again with this email. To appeal, email <a href="mailto:${escapeHtml(opts.appealEmail)}">${escapeHtml(opts.appealEmail)}</a>.</p>
      <p>— VFresh</p>
    </div>
  `;
  return { subject, text, html };
}

export function menuRejectEmail(opts: {
  businessName: string;
  dishName: string;
  reason: string;
}) {
  const subject = `Dish removed from VFresh: ${opts.dishName}`;
  const text = `Hi ${opts.businessName},

The dish "${opts.dishName}" was removed from the storefront after review.

Reason:
${opts.reason}

Please list only appropriate, accurate items.

— VFresh`;
  const html = `
    <div style="font-family:sans-serif;line-height:1.5;color:#111">
      <h2>Dish removed</h2>
      <p>Hi <strong>${escapeHtml(opts.businessName)}</strong>,</p>
      <p>The dish <strong>${escapeHtml(opts.dishName)}</strong> was removed from the storefront after review.</p>
      <p><strong>Reason</strong></p>
      <p>${escapeHtml(opts.reason)}</p>
      <p>Please list only appropriate, accurate items.</p>
      <p>— VFresh</p>
    </div>
  `;
  return { subject, text, html };
}
