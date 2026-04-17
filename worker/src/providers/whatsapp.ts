function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export async function sendWhatsappMessage(input: {
  to: string;
  text: string;
}) {
  const { EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_API_INSTANCE } = process.env;

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_API_INSTANCE) {
    return { skipped: true, reason: "Evolution API nao configurada." } as const;
  }

  const response = await fetch(
    `${EVOLUTION_API_URL.replace(/\/$/, "")}/message/sendText/${EVOLUTION_API_INSTANCE}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: normalizePhone(input.to),
        textMessage: {
          text: input.text,
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao enviar WhatsApp: ${body}`);
  }

  return { skipped: false } as const;
}
