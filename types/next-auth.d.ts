import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    idleExpired?: boolean;
    lastActivity?: number;
    user: {
      id: string;
      role: string;
      vendorStatus?: string;
      companyId?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: string;
    vendorStatus?: string;
    companyId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    vendorStatus?: string;
    companyId?: string;
    lastActivity?: number;
    idleExpired?: boolean;
  }
}
