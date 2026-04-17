import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMobileToken } from "@/server/services/mobile-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        memberships: {
          orderBy: { createdAt: "asc" },
          take: 1,
          select: {
            role: true,
            businessId: true,
            business: {
              select: {
                id: true,
                name: true,
                slug: true,
                onboardingStep: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const membership = user.memberships[0];
    if (!membership) {
      return NextResponse.json({ error: "Nenhum negócio vinculado a esta conta." }, { status: 403 });
    }

    const token = createMobileToken({
      userId: user.id,
      businessId: membership.businessId,
      role: membership.role,
      name: user.name,
      email: user.email,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: membership.role,
      },
      business: membership.business,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível entrar.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
