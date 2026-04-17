import type { DefaultSession } from "next-auth";

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
