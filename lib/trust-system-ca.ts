import tls from 'node:tls';

type TlsWithSystemCa = typeof tls & {
  setDefaultCACertificates?: (certs: readonly string[]) => void;
  getCACertificates?: (type?: string) => string[];
};

const nodeTls = tls as TlsWithSystemCa;

let applied = false;

/**
 * Trust OS-installed CAs in addition to Node's bundled store.
 * Needed on Windows when a local root CA (corporate proxy / antivirus)
 * intercepts TLS to Neon and Node would otherwise reject the chain.
 */
export function trustSystemCa() {
  if (applied) return;
  // Vercel/Linux already have a working CA store. Replacing it here has
  // broken TLS to Neon in serverless workers.
  if (process.platform !== 'win32') return;
  if (typeof nodeTls.setDefaultCACertificates !== 'function') return;
  if (typeof nodeTls.getCACertificates !== 'function') return;

  try {
    nodeTls.setDefaultCACertificates([
      ...nodeTls.getCACertificates('default'),
      ...nodeTls.getCACertificates('system'),
    ]);
    applied = true;
  } catch {
    // Node too old or platform has no extra system store — ignore.
  }
}

trustSystemCa();
