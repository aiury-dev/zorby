import type { MembershipRole } from "@/lib/domain-enums";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createBusinessForUser, getPrimaryMembership } from "@/server/services/business";
import { getUserByIdFromFirestore } from "@/server/services/firestore-read";
import { ensureFirebaseGoogleUser, signInWithFirebasePassword } from "@/server/services/firebase-auth";
import { syncUserDocument } from "@/server/services/firebase-sync";

async function loadUserMembership(userId: string) {
  const membership = await getPrimaryMembership(userId);
  if (!membership) {
    return null;
  }

  return {
    role: membership.role as MembershipRole,
    businessId: membership.businessId,
  };
}

async function ensureGoogleUserMirror(input: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const firebaseUser = await ensureFirebaseGoogleUser(input);
  const existingUser = await getUserByIdFromFirestore(firebaseUser.uid);

  if (!existingUser) {
    await syncUserDocument({
      id: firebaseUser.uid,
      email: input.email,
      name: input.name ?? null,
      image: input.image ?? null,
    }).catch(() => undefined);

    await createBusinessForUser({
      userId: firebaseUser.uid,
      businessName: input.name?.trim() || "Meu negocio",
      userName: input.name?.trim() || "Proprietario",
      userEmail: input.email,
      userImage: input.image ?? null,
    });
  } else {
    await syncUserDocument({
      id: firebaseUser.uid,
      email: input.email,
      name: input.name ?? null,
      image: input.image ?? null,
      phone: existingUser.phone,
    }).catch(() => undefined);
  }

  const membership = await getPrimaryMembership(firebaseUser.uid);

  return {
    id: firebaseUser.uid,
    email: input.email,
    name: input.name ?? undefined,
    image: input.image ?? undefined,
    businessId: membership?.businessId,
    role: membership?.role,
  };
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email e senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const firebaseSession = await signInWithFirebasePassword(
          credentials.email.toLowerCase(),
          credentials.password,
        ).catch(() => null);

        if (!firebaseSession?.localId) {
          return null;
        }

        const user = await getUserByIdFromFirestore(firebaseSession.localId);

        if (!user) {
          return null;
        }

        const membership = await loadUserMembership(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image ?? undefined,
          businessId: membership?.businessId,
          role: membership?.role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) {
        return true;
      }

      await ensureGoogleUserMirror({
        email: user.email,
        name: user.name,
        image: user.image,
      });

      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id) {
        const membership = await loadUserMembership(user.id);

        token.sub = user.id;
        token.businessId = membership?.businessId;
        token.role = membership?.role;
      }

      if (account?.provider === "google" && token.email) {
        const googleUser = await ensureGoogleUserMirror({
          email: token.email,
          name: typeof token.name === "string" ? token.name : null,
          image: typeof token.picture === "string" ? token.picture : null,
        });

        token.sub = googleUser.id;
        token.businessId = googleUser.businessId;
        token.role = googleUser.role as MembershipRole | undefined;
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id = token.sub ?? "";
      session.user.businessId = typeof token.businessId === "string" ? token.businessId : undefined;
      session.user.role =
        typeof token.role === "string"
          ? (token.role as "OWNER" | "ADMIN" | "STAFF" | "VIEWER")
          : undefined;

      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
