type TlsWithSystemCa = {
  setDefaultCACertificates?: (certs: readonly string[]) => void;
  getCACertificates?: (type?: string) => string[];
};

let applied = false;

/**
 * Trust OS-installed CAs in addition to Node's bundled store.
 * Needed on Windows when a local root CA (corporate proxy / antivirus)
 * intercepts TLS to Neon and Node would otherwise reject the chain.
 *
 * Loaded via process.getBuiltinModule so this file can never pull `node:tls`
 * into the browser bundle.
 */
export function trustSystemCa() {
  if (applied) return;
  if (typeof process === 'undefined' || process.platform !== 'win32') return;

  const getBuiltin = (
    process as { getBuiltinModule?: (id: string) => unknown }
  ).getBuiltinModule;
  const tls = getBuiltin?.('tls') as TlsWithSystemCa | undefined;
  if (!tls?.setDefaultCACertificates || !tls.getCACertificates) return;

  try {
    tls.setDefaultCACertificates([
      ...tls.getCACertificates('default'),
      ...tls.getCACertificates('system'),
    ]);
    applied = true;
  } catch {
    // Node too old or platform has no extra system store — ignore.
  }
}

trustSystemCa();
