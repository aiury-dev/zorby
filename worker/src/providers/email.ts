import { Resend } from "resend";

let resendClient: Resend | null | undefined;

function getResendClient() {
  if (resendClient !== undefined) {
    return resendClient;
  }

  resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  return resendClient;
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResendClient();

  if (!resend) {
    return { skipped: true, reason: "RESEND_API_KEY nao configurado." } as const;
  }

  await resend.emails.send({
    from: process.env.RESEND_AUDIENCE_EMAIL ?? "noreply@zorby.app",
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  return { skipped: false } as const;
}
