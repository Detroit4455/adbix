import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    mobileNumber: string;
    siteUrl?: string;
    lastUpdated?: string;
    role?: string;
  }

  interface Session {
    user: User & {
      id: string;
      mobileNumber: string;
      siteUrl?: string;
      lastUpdated?: string;
      role?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    mobileNumber: string;
    siteUrl?: string;
    lastUpdated?: string;
    role?: string;
  }
} 