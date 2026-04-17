import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { syncSubscriptionFromMercadoPagoId, syncSubscriptionFromMercadoPagoPreapproval } from "@/server/services/subscriptions";

function isWebhookAuthorized(signature: string | null) {
  const expected = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  if (!expected) {
    return true;
  }

  return signature === expected;
}

export async function POST(request: Request) {
  const headersList = await headers();
  const signature = headersList.get("x-signature") ?? headersList.get("x-webhook-secret");

  if (!isWebhookAuthorized(signature)) {
    return NextResponse.json({ error: "Webhook nao autorizado." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      action?: string;
      type?: string;
      data?: { id?: string };
      id?: string;
      status?: string;
      external_reference?: string;
    };

    if (payload.data?.id) {
      await syncSubscriptionFromMercadoPagoId(payload.data.id);
      return NextResponse.json({ received: true });
    }

    if (payload.id && payload.status) {
      await syncSubscriptionFromMercadoPagoPreapproval({
        id: payload.id,
        status: payload.status,
        external_reference: payload.external_reference,
      });
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true, ignored: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao processar webhook do Mercado Pago.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
