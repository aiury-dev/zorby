import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { ZodError } from "zod";
import { renderWelcomeEmail } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import { createBusinessForUser } from "@/server/services/business";
import { registerSchema } from "@/server/validators/auth";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const email = body.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Ja existe uma conta com este email." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name: body.name,
        passwordHash,
      },
    });

    const business = await createBusinessForUser({
      userId: user.id,
      businessName: body.businessName,
      userName: body.name,
      userEmail: user.email,
    });

    if (resend) {
      const welcomeEmail = renderWelcomeEmail({
        ownerName: body.name,
        businessName: business.name,
        onboardingUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/onboarding/business`,
      });

      try {
        await resend.emails.send({
          from: process.env.RESEND_AUDIENCE_EMAIL ?? "noreply@zorby.app",
          to: user.email,
          subject: welcomeEmail.subject,
          html: welcomeEmail.html,
        });
      } catch {
        // Nao bloqueia o cadastro se o envio de boas-vindas falhar.
      }
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof ZodError
        ? error.issues[0]?.message ?? "Confira os dados informados."
        : error instanceof Error
          ? error.message
          : "Não foi possível criar a conta.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
