import type { Job } from "bullmq";
import { formatInTimeZone } from "date-fns-tz";
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from "@/generated/prisma/enums";
import {
  renderAppointmentConfirmationEmail,
  renderCancellationEmail,
  renderReminder24hEmail,
} from "@/lib/email-templates";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "../providers/email";
import { sendWhatsappMessage } from "../providers/whatsapp";

const jobTypeMap: Record<string, NotificationType> = {
  "appointment-confirmation": NotificationType.APPOINTMENT_CONFIRMED,
  "appointment-reminder-24h": NotificationType.REMINDER_24H,
  "appointment-reminder-1h": NotificationType.REMINDER_1H,
  "appointment-cancelled": NotificationType.APPOINTMENT_CANCELLED,
  "appointment-rescheduled": NotificationType.APPOINTMENT_RESCHEDULED,
};

function renderTemplate(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce(
    (content, [key, value]) => content.replaceAll(`{{${key}}}`, value),
    template,
  );
}

function buildDefaultCopy(type: NotificationType, variables: Record<string, string>) {
  switch (type) {
    case NotificationType.APPOINTMENT_CONFIRMED:
      return renderAppointmentConfirmationEmail({
        businessName: variables.business_name,
        customerName: variables.customer_name,
        professionalName: variables.professional_name,
        serviceName: variables.service_name,
        startsAtLabel: variables.starts_at,
        location: variables.location,
        cancellationPolicy: variables.cancellation_policy,
        cancelUrl: variables.cancel_url,
        rescheduleUrl: variables.reschedule_url,
      });
    case NotificationType.APPOINTMENT_CANCELLED:
      return renderCancellationEmail({
        customerName: variables.customer_name,
        serviceName: variables.service_name,
        startsAtLabel: variables.starts_at,
        businessName: variables.business_name,
        bookingUrl: variables.booking_url,
      });
    case NotificationType.REMINDER_24H:
      return renderReminder24hEmail({
        customerName: variables.customer_name,
        professionalName: variables.professional_name,
        serviceName: variables.service_name,
        startsAtLabel: variables.starts_at,
        location: variables.location,
      });
    case NotificationType.APPOINTMENT_RESCHEDULED:
      return {
        subject: "Seu agendamento foi reagendado",
        body: `
          <p>Ola, {{customer_name}}.</p>
          <p>Seu novo horario ficou assim:</p>
          <p><strong>{{starts_at}}</strong></p>
          <p><a href="{{cancel_url}}">Cancelar</a> · <a href="{{reschedule_url}}">Reagendar novamente</a></p>
        `,
      };
    case NotificationType.REMINDER_1H:
      return {
        subject: "Seu atendimento comeca em 1 hora",
        body: `
          <p>Falta pouco para o seu horario.</p>
          <p><strong>{{starts_at}}</strong> · {{service_name}}</p>
        `,
      };
    default:
      return {
        subject: "Atualizacao do seu agendamento",
        body: "<p>Houve uma atualizacao no seu agendamento.</p>",
      };
  }
}

async function beginNotificationRecord(input: {
  businessId: string;
  appointmentId: string;
  customerId?: string | null;
  type: NotificationType;
  channel: NotificationChannel;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  payload?: Record<string, string> | null;
}) {
  const existing = await prisma.notification.findFirst({
    where: {
      businessId: input.businessId,
      appointmentId: input.appointmentId,
      type: input.type,
      channel: input.channel,
      status: NotificationStatus.PENDING,
      recipientEmail: input.recipientEmail ?? undefined,
      recipientPhone: input.recipientPhone ?? undefined,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return prisma.notification.update({
      where: { id: existing.id },
      data: {
        status: NotificationStatus.PROCESSING,
        payload: input.payload ? (input.payload as never) : existing.payload ?? undefined,
      },
    });
  }

  return prisma.notification.create({
    data: {
      businessId: input.businessId,
      appointmentId: input.appointmentId,
      customerId: input.customerId ?? null,
      type: input.type,
      channel: input.channel,
      status: NotificationStatus.PROCESSING,
      recipientName: input.recipientName ?? null,
      recipientEmail: input.recipientEmail ?? null,
      recipientPhone: input.recipientPhone ?? null,
      payload: input.payload ? (input.payload as never) : undefined,
    },
  });
}

async function completeNotificationRecord(
  id: string,
  input: {
    status: NotificationStatus;
    subject?: string;
    body?: string;
    errorMessage?: string;
  },
) {
  await prisma.notification.update({
    where: { id },
    data: {
      status: input.status,
      subject: input.subject ?? undefined,
      body: input.body ?? undefined,
      sentAt: input.status === NotificationStatus.SENT ? new Date() : undefined,
      failedAt: input.status === NotificationStatus.FAILED ? new Date() : undefined,
      errorMessage: input.errorMessage ?? undefined,
    },
  });
}

export async function processNotificationJob(job: Job<{ appointmentId: string }>) {
  const notificationType = jobTypeMap[job.name];

  if (!notificationType) {
    logger.warn("Job de notificacao ignorado", { jobName: job.name });
    return;
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: job.data.appointmentId },
    include: {
      business: {
        include: {
          subscriptions: {
            include: { plan: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      customer: true,
      professional: true,
    },
  });

  if (!appointment) {
    throw new Error("Agendamento nao encontrado para a fila de notificacoes.");
  }

  if (
    [NotificationType.REMINDER_24H, NotificationType.REMINDER_1H].some(
      (type) => type === notificationType,
    ) &&
    appointment.status === "CANCELLED"
  ) {
    logger.info("Lembrete ignorado porque o agendamento foi cancelado", {
      appointmentId: appointment.id,
      jobName: job.name,
    });
    return;
  }

  const currentPlan = appointment.business.subscriptions[0]?.plan;
  const sourceNotification = await prisma.notification.findFirst({
    where: {
      appointmentId: appointment.id,
      type: notificationType,
    },
    orderBy: { createdAt: "desc" },
  });
  const customEmailTemplate = await prisma.notificationTemplate.findFirst({
    where: {
      businessId: appointment.businessId,
      channel: NotificationChannel.EMAIL,
      type: notificationType,
      isActive: true,
    },
  });
  const customWhatsappTemplate = await prisma.notificationTemplate.findFirst({
    where: {
      businessId: appointment.businessId,
      channel: NotificationChannel.WHATSAPP,
      type: notificationType,
      isActive: true,
    },
  });

  const variables = {
    business_name: appointment.business.name,
    customer_name: appointment.customerNameSnapshot,
    professional_name: appointment.professional.displayName,
    service_name: appointment.serviceNameSnapshot,
    starts_at: formatInTimeZone(
      appointment.startsAtUtc,
      appointment.timezoneSnapshot,
      "dd/MM/yyyy 'as' HH:mm",
    ),
    location:
      appointment.locationNameSnapshot ||
      [appointment.business.neighborhood, appointment.business.city].filter(Boolean).join(", ") ||
      appointment.business.name,
    booking_url: `${process.env.APP_URL ?? "http://localhost:3000"}/${appointment.business.slug}`,
    cancellation_policy: appointment.business.cancellationPolicyText ?? "",
    cancel_url:
      typeof sourceNotification?.payload === "object" &&
      sourceNotification?.payload &&
      "cancelUrl" in sourceNotification.payload
        ? String(sourceNotification.payload.cancelUrl)
        : "",
    reschedule_url:
      typeof sourceNotification?.payload === "object" &&
      sourceNotification?.payload &&
      "rescheduleUrl" in sourceNotification.payload
        ? String(sourceNotification.payload.rescheduleUrl)
        : "",
  };

  const fallback = buildDefaultCopy(notificationType, variables);
  const emailSubject = renderTemplate(customEmailTemplate?.subject || fallback.subject, variables);
  const fallbackBody = "html" in fallback ? fallback.html : fallback.body;
  const emailBody = renderTemplate(customEmailTemplate?.body || fallbackBody, variables);

  if (appointment.customerEmailSnapshot) {
    const notification = await beginNotificationRecord({
      businessId: appointment.businessId,
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      type: notificationType,
      channel: NotificationChannel.EMAIL,
      recipientName: appointment.customerNameSnapshot,
      recipientEmail: appointment.customerEmailSnapshot,
      recipientPhone: appointment.customerPhoneSnapshot,
      payload: (sourceNotification?.payload as Record<string, string> | null) ?? null,
    });

    try {
      const result = await sendTransactionalEmail({
        to: appointment.customerEmailSnapshot,
        subject: emailSubject,
        html: emailBody,
      });

      await completeNotificationRecord(notification.id, {
        status: result.skipped ? NotificationStatus.CANCELED : NotificationStatus.SENT,
        subject: emailSubject,
        body: emailBody,
        errorMessage: result.skipped ? result.reason : undefined,
      });
    } catch (error) {
      await completeNotificationRecord(notification.id, {
        status: NotificationStatus.FAILED,
        subject: emailSubject,
        body: emailBody,
        errorMessage: error instanceof Error ? error.message : "Falha ao enviar e-mail.",
      });
      throw error;
    }
  }

  if (appointment.business.email) {
    const businessNotification = await beginNotificationRecord({
      businessId: appointment.businessId,
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      type: notificationType,
      channel: NotificationChannel.EMAIL,
      recipientName: appointment.business.name,
      recipientEmail: appointment.business.email,
      payload: { audience: "business" },
    });

    const operationalSubject = `[Zorby] ${emailSubject}`;
    const operationalBody = `
      <p>Voce recebeu uma atualizacao no painel.</p>
      <p><strong>Cliente:</strong> ${appointment.customerNameSnapshot}</p>
      <p><strong>Servico:</strong> ${appointment.serviceNameSnapshot}</p>
      <p><strong>Quando:</strong> ${variables.starts_at}</p>
    `;

    try {
      const result = await sendTransactionalEmail({
        to: appointment.business.email,
        subject: operationalSubject,
        html: operationalBody,
      });

      await completeNotificationRecord(businessNotification.id, {
        status: result.skipped ? NotificationStatus.CANCELED : NotificationStatus.SENT,
        subject: operationalSubject,
        body: operationalBody,
        errorMessage: result.skipped ? result.reason : undefined,
      });
    } catch (error) {
      await completeNotificationRecord(businessNotification.id, {
        status: NotificationStatus.FAILED,
        subject: operationalSubject,
        body: operationalBody,
        errorMessage: error instanceof Error ? error.message : "Falha ao enviar e-mail operacional.",
      });
      throw error;
    }
  }

  if (currentPlan?.whatsappEnabled && appointment.customerPhoneSnapshot) {
    const whatsappCopy = renderTemplate(
      customWhatsappTemplate?.body ||
        `Ola, {{customer_name}}. Atualizacao do seu agendamento: {{service_name}} em {{starts_at}}.`,
      variables,
    );

    const whatsappNotification = await beginNotificationRecord({
      businessId: appointment.businessId,
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      type: notificationType,
      channel: NotificationChannel.WHATSAPP,
      recipientName: appointment.customerNameSnapshot,
      recipientPhone: appointment.customerPhoneSnapshot,
    });

    try {
      const result = await sendWhatsappMessage({
        to: appointment.customerPhoneSnapshot,
        text: whatsappCopy,
      });

      await completeNotificationRecord(whatsappNotification.id, {
        status: result.skipped ? NotificationStatus.CANCELED : NotificationStatus.SENT,
        body: whatsappCopy,
        errorMessage: result.skipped ? result.reason : undefined,
      });
    } catch (error) {
      await completeNotificationRecord(whatsappNotification.id, {
        status: NotificationStatus.FAILED,
        body: whatsappCopy,
        errorMessage: error instanceof Error ? error.message : "Falha ao enviar WhatsApp.",
      });
      throw error;
    }
  }

  logger.info("Job de notificacao processado", {
    appointmentId: appointment.id,
    type: notificationType,
  });
}
