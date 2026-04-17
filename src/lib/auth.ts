import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function loadUserMembership(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      businessId: true,
    },
  });

  return membership;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login",
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
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
    EmailProvider({
      from: process.env.RESEND_AUDIENCE_EMAIL ?? "noreply@zorby.app",
      maxAge: 15 * 60,
      generateVerificationToken() {
        return randomUUID();
      },
      async sendVerificationRequest({ identifier, url, provider }) {
        if (!resend) {
          throw new Error("RESEND_API_KEY nao configurado para magic link.");
        }

        await resend.emails.send({
          from: provider.from,
          to: identifier,
          subject: "Seu link de acesso ao Zorby",
          html: `
            <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
              <h1 style="font-size: 24px;">Entrar no Zorby</h1>
              <p>Use o botao abaixo para acessar sua conta com seguranca.</p>
              <p>
                <a href="${url}" style="display:inline-block;padding:12px 20px;background:#1664e8;color:#fff;border-radius:999px;text-decoration:none;">
                  Entrar agora
                </a>
              </p>
              <p style="color:#475569;font-size:14px;">Se voce nao pediu este link, ignore esta mensagem.</p>
            </div>
          `,
        });
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
    async jwt({ token, user }) {
      if (user?.id) {
        const membership = await loadUserMembership(user.id);

        token.sub = user.id;
        token.businessId = membership?.businessId;
        token.role = membership?.role;
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
