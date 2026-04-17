const MERCADO_PAGO_API_URL = "https://api.mercadopago.com";

async function mercadoPagoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN nao configurado.");
  }

  const response = await fetch(`${MERCADO_PAGO_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mercado Pago retornou ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

export type MercadoPagoPreapproval = {
  id: string;
  status: string;
  external_reference?: string;
  preapproval_plan_id?: string;
  payer_id?: number;
  reason?: string;
  date_created?: string;
  last_modified?: string;
  init_point?: string;
  auto_recurring?: {
    frequency?: number;
    frequency_type?: string;
    currency_id?: string;
    transaction_amount?: number;
    start_date?: string;
    end_date?: string;
  };
  next_payment_date?: string;
};

export async function getMercadoPagoPreapproval(preapprovalId: string) {
  return mercadoPagoFetch<MercadoPagoPreapproval>(`/preapproval/${preapprovalId}`);
}

export async function createMercadoPagoPreapproval(input: {
  reason: string;
  externalReference: string;
  payerEmail: string;
  preapprovalPlanId?: string;
  transactionAmount: number;
  frequency: number;
  frequencyType: "months" | "days";
  backUrl: string;
  status?: "pending" | "authorized";
}) {
  return mercadoPagoFetch<MercadoPagoPreapproval>("/preapproval", {
    method: "POST",
    body: JSON.stringify({
      reason: input.reason,
      external_reference: input.externalReference,
      payer_email: input.payerEmail,
      preapproval_plan_id: input.preapprovalPlanId,
      auto_recurring: {
        frequency: input.frequency,
        frequency_type: input.frequencyType,
        transaction_amount: input.transactionAmount,
        currency_id: "BRL",
      },
      back_url: input.backUrl,
      status: input.status ?? "pending",
    }),
  });
}

export async function updateMercadoPagoPreapproval(
  preapprovalId: string,
  payload: Record<string, unknown>,
) {
  return mercadoPagoFetch<MercadoPagoPreapproval>(`/preapproval/${preapprovalId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
