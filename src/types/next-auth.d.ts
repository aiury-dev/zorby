import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      businessId?: string;
      role?: "OWNER" | "ADMIN" | "STAFF" | "VIEWER";
    };
  }

  interface User {
    businessId?: string;
    role?: "OWNER" | "ADMIN" | "STAFF" | "VIEWER";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    businessId?: string;
    role?: "OWNER" | "ADMIN" | "STAFF" | "VIEWER";
  }
}
