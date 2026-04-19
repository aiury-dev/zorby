import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { getPrimaryMembership } from "@/server/services/business";
import { signInWithFirebasePassword } from "@/server/services/firebase-auth";
import { createMobileToken } from "@/server/services/mobile-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
    }

    const firebaseSession = await signInWithFirebasePassword(email, password).catch(() => null);

    if (!firebaseSession?.localId) {
      return NextResponse.json({ error: "Credenciais invalidas." }, { status: 401 });
    }

    const [firebaseUser, membership] = await Promise.all([
      getFirebaseAdminAuth().getUser(firebaseSession.localId),
      getPrimaryMembership(firebaseSession.localId),
    ]);

    if (!firebaseUser) {
      return NextResponse.json(
        { error: "Conta sem espelho local sincronizado." },
        { status: 401 },
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: "Nenhum negocio vinculado a esta conta." },
        { status: 403 },
      );
    }

    const token = createMobileToken({
      userId: firebaseUser.uid,
      businessId: membership.businessId,
      role: membership.role,
      name: firebaseUser.displayName,
      email: firebaseUser.email ?? email,
    });

    return NextResponse.json({
      token,
      user: {
        id: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email ?? email,
        role: membership.role,
      },
      business: {
        id: membership.business.id,
        name: membership.business.name,
        slug: membership.business.slug,
        onboardingStep: membership.business.onboardingStep,
        status: membership.business.status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel entrar.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
