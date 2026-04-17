type BaseShellInput = {
  preheader: string;
  title: string;
  subtitle: string;
  contentHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

function renderShell(input: BaseShellInput) {
  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${input.title}</title>
      </head>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${input.preheader}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 32px;background:linear-gradient(135deg,#1664e8 0%,#1254c7 100%);color:#ffffff;">
                    <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;opacity:0.8;">Zorby</p>
                    <h1 style="margin:16px 0 8px;font-size:30px;line-height:1.2;">${input.title}</h1>
                    <p style="margin:0;font-size:15px;line-height:1.7;opacity:0.92;">${input.subtitle}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    ${input.contentHtml}
                    ${
                      input.ctaLabel && input.ctaUrl
                        ? `<p style="margin:28px 0 0;"><a href="${input.ctaUrl}" style="display:inline-block;padding:14px 20px;border-radius:999px;background:#1664e8;color:#ffffff;text-decoration:none;font-weight:700;">${input.ctaLabel}</a></p>`
                        : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 28px;color:#64748b;font-size:13px;line-height:1.6;">
                    ${input.footerNote ?? "Enviado pelo Zorby para ajudar seu negocio a manter a agenda organizada."}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function renderWelcomeEmail(input: {
  ownerName: string;
  businessName: string;
  onboardingUrl: string;
}) {
  return {
    subject: `Bem-vindo ao Zorby, ${input.ownerName}`,
    html: renderShell({
      preheader: "Sua conta foi criada. Falta completar o onboarding do negocio.",
      title: `Sua conta da ${input.businessName} foi criada`,
      subtitle: "Agora falta so completar as 5 etapas do onboarding para ativar seu link de agendamento.",
      contentHtml: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.8;">Ola, ${input.ownerName}.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.8;">
          Seu acesso ao Zorby esta pronto. Para reduzir churn de ativacao, voce sera guiado por 5 etapas simples:
          negocio, servicos, disponibilidade, link e conclusao.
        </p>
        <div style="border:1px solid #e2e8f0;border-radius:20px;padding:18px;background:#f8fafc;">
          <p style="margin:0;font-size:14px;line-height:1.8;color:#475569;">
            1. Dados do negocio<br />
            2. Servicos<br />
            3. Disponibilidade<br />
            4. Link de agendamento<br />
            5. Concluido
          </p>
        </div>
      `,
      ctaLabel: "Completar onboarding",
      ctaUrl: input.onboardingUrl,
    }),
  };
}

export function renderAppointmentConfirmationEmail(input: {
  businessName: string;
  customerName: string;
  professionalName: string;
  serviceName: string;
  startsAtLabel: string;
  location: string;
  cancellationPolicy?: string;
  cancelUrl?: string;
  rescheduleUrl?: string;
}) {
  return {
    subject: `Agendamento confirmado com ${input.businessName}`,
    html: renderShell({
      preheader: "Seu agendamento foi confirmado.",
      title: "Agendamento confirmado",
      subtitle: `Seu horario com ${input.professionalName} esta reservado.`,
      contentHtml: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.8;">Ola, ${input.customerName}.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:20px;background:#f8fafc;padding:18px;">
          <tr><td style="font-size:14px;line-height:1.9;color:#0f172a;">
            <strong>Servico:</strong> ${input.serviceName}<br />
            <strong>Profissional:</strong> ${input.professionalName}<br />
            <strong>Quando:</strong> ${input.startsAtLabel}<br />
            <strong>Local:</strong> ${input.location}
          </td></tr>
        </table>
        ${
          input.cancellationPolicy
            ? `<p style="margin:18px 0 0;font-size:14px;line-height:1.8;color:#475569;"><strong>Politica de cancelamento:</strong> ${input.cancellationPolicy}</p>`
            : ""
        }
        ${
          input.cancelUrl || input.rescheduleUrl
            ? `<p style="margin:20px 0 0;font-size:14px;line-height:1.8;">
                ${input.cancelUrl ? `<a href="${input.cancelUrl}" style="color:#1664e8;text-decoration:none;font-weight:700;">Cancelar</a>` : ""}
                ${input.cancelUrl && input.rescheduleUrl ? " · " : ""}
                ${input.rescheduleUrl ? `<a href="${input.rescheduleUrl}" style="color:#1664e8;text-decoration:none;font-weight:700;">Reagendar</a>` : ""}
              </p>`
            : ""
        }
      `,
    }),
  };
}

export function renderReminder24hEmail(input: {
  customerName: string;
  professionalName: string;
  serviceName: string;
  startsAtLabel: string;
  location: string;
}) {
  return {
    subject: "Lembrete do seu horario de amanha",
    html: renderShell({
      preheader: "Seu atendimento acontece em 24 horas.",
      title: "Falta 1 dia para o seu horario",
      subtitle: `Estamos passando para lembrar do atendimento com ${input.professionalName}.`,
      contentHtml: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.8;">Ola, ${input.customerName}.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.8;">
          Seu agendamento de <strong>${input.serviceName}</strong> acontece em <strong>${input.startsAtLabel}</strong>.
        </p>
        <p style="margin:0;font-size:14px;line-height:1.8;color:#475569;"><strong>Local:</strong> ${input.location}</p>
      `,
    }),
  };
}

export function renderCancellationEmail(input: {
  customerName: string;
  serviceName: string;
  startsAtLabel: string;
  businessName: string;
  bookingUrl?: string;
}) {
  return {
    subject: `Agendamento cancelado em ${input.businessName}`,
    html: renderShell({
      preheader: "Seu agendamento foi cancelado com sucesso.",
      title: "Agendamento cancelado",
      subtitle: "Recebemos e processamos seu cancelamento.",
      contentHtml: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.8;">Ola, ${input.customerName}.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.8;">
          O horario de <strong>${input.serviceName}</strong> marcado para <strong>${input.startsAtLabel}</strong> foi cancelado.
        </p>
        <p style="margin:0;font-size:14px;line-height:1.8;color:#475569;">
          Se quiser, voce pode agendar novamente pela pagina publica de ${input.businessName}.
        </p>
      `,
      ctaLabel: input.bookingUrl ? "Agendar novamente" : undefined,
      ctaUrl: input.bookingUrl,
    }),
  };
}
