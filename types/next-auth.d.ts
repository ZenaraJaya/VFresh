import 'next-auth';
import 'next-auth/jwt';

// The admin API routes gate on `session.user.role`, which isn't part of the
// stock next-auth session shape.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      vendorStatus?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: string;
    vendorStatus?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    vendorStatus?: string;
  }
}
