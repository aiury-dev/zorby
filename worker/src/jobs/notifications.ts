import { randomUUID } from "crypto";
import type { Job } from "bullmq";
import { formatInTimeZone } from "date-fns-tz";
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from "@/lib/domain-enums";
import {
  renderAppointmentConfirmationEmail,
  renderCancellationEmail,
  renderReminder24hEmail,
} from "@/lib/email-templates";
import { logger } from "@/lib/logger";
import {
  getAppointmentByIdFromFirestore,
  getBusinessSettingsFromFirestore,
  getNotificationTemplatesForBusinessFromFirestore,
  getNotificationsForAppointmentFromFirestore,
  getProfessionalsForBusinessFromFirestore,
} from "@/server/services/firestore-read";
import { syncNotificationDocument } from "@/server/services/firebase-sync";
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

type NotificationRecord = {
  id: string;
  businessId: string;
  appointmentId: string;
  customerId?: string | null;
  channel: NotificationChannel;
  type: NotificationType;
  status: NotificationStatus;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  payload?: Record<string, string> | null;
  subject?: string | null;
  body?: string | null;
};

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
  const existing = (await getNotificationsForAppointmentFromFirestore(input.appointmentId)).find(
    (notification) =>
      notification.businessId === input.businessId &&
      notification.type === input.type &&
      notification.channel === input.channel &&
      notification.status === NotificationStatus.PENDING &&
      (notification.recipientEmail ?? null) === (input.recipientEmail ?? null) &&
      (notification.recipientPhone ?? null) === (input.recipientPhone ?? null),
  );

  const notification: NotificationRecord = {
    id: existing?.id ?? randomUUID(),
    businessId: input.businessId,
    appointmentId: input.appointmentId,
    customerId: input.customerId ?? null,
    type: input.type,
    channel: input.channel,
    status: NotificationStatus.PROCESSING,
    recipientName: input.recipientName ?? null,
    recipientEmail: input.recipientEmail ?? null,
    recipientPhone: input.recipientPhone ?? null,
    payload: (input.payload ?? (existing?.payload as Record<string, string> | null)) ?? null,
    subject: existing?.subject ?? null,
    body: existing?.body ?? null,
  };

  await syncNotificationDocument(notification);
  return notification;
}

async function completeNotificationRecord(
  notification: NotificationRecord,
  input: {
    status: NotificationStatus;
    subject?: string;
    body?: string;
    errorMessage?: string;
  },
) {
  await syncNotificationDocument({
    ...notification,
    status: input.status,
    subject: input.subject ?? null,
    body: input.body ?? null,
    sentAt: input.status === NotificationStatus.SENT ? new Date().toISOString() : null,
    failedAt: input.status === NotificationStatus.FAILED ? new Date().toISOString() : null,
    errorMessage: input.errorMessage ?? null,
  });
}

export async function processNotificationJob(job: Job<{ appointmentId: string }>) {
  const notificationType = jobTypeMap[job.name];

  if (!notificationType) {
    logger.warn("Job de notificacao ignorado", { jobName: job.name });
    return;
  }

  const appointment = await getAppointmentByIdFromFirestore(job.data.appointmentId);

  if (!appointment) {
    throw new Error("Agendamento nao encontrado para a fila de notificacoes.");
  }

  const [business, professionals, notifications, notificationTemplates] = await Promise.all([
    getBusinessSettingsFromFirestore(appointment.businessId),
    getProfessionalsForBusinessFromFirestore(appointment.businessId),
    getNotificationsForAppointmentFromFirestore(appointment.id),
    getNotificationTemplatesForBusinessFromFirestore(appointment.businessId),
  ]);

  if (!business) {
    throw new Error("Negocio nao encontrado para a fila de notificacoes.");
  }

  if (
    (notificationType === NotificationType.REMINDER_24H ||
      notificationType === NotificationType.REMINDER_1H) &&
    appointment.status === "CANCELLED"
  ) {
    logger.info("Lembrete ignorado porque o agendamento foi cancelado", {
      appointmentId: appointment.id,
      jobName: job.name,
    });
    return;
  }

  const currentPlan = business.subscriptions[0]?.plan;
  const sourceNotification = notifications.find((notification) => notification.type === notificationType);
  const customEmailTemplate = notificationTemplates.find(
    (template) => template.channel === NotificationChannel.EMAIL && template.type === notificationType,
  );
  const customWhatsappTemplate = notificationTemplates.find(
    (template) =>
      template.channel === NotificationChannel.WHATSAPP && template.type === notificationType,
  );
  const professional =
    professionals.find((item) => item.id === appointment.professionalId) ?? appointment.professional;

  const variables = {
    business_name: business.name,
    customer_name: appointment.customerNameSnapshot,
    professional_name: professional.displayName,
    service_name: appointment.serviceNameSnapshot,
    starts_at: formatInTimeZone(
      appointment.startsAtUtc,
      appointment.timezoneSnapshot,
      "dd/MM/yyyy 'as' HH:mm",
    ),
    location: [business.neighborhood, business.city].filter(Boolean).join(", ") || business.name,
    booking_url: `${process.env.APP_URL ?? "http://localhost:3000"}/${business.slug}`,
    cancellation_policy: business.cancellationPolicyText ?? "",
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

      await completeNotificationRecord(notification, {
        status: result.skipped ? NotificationStatus.CANCELED : NotificationStatus.SENT,
        subject: emailSubject,
        body: emailBody,
        errorMessage: result.skipped ? result.reason : undefined,
      });
    } catch (error) {
      await completeNotificationRecord(notification, {
        status: NotificationStatus.FAILED,
        subject: emailSubject,
        body: emailBody,
        errorMessage: error instanceof Error ? error.message : "Falha ao enviar e-mail.",
      });
      throw error;
    }
  }

  if (business.email) {
    const businessNotification = await beginNotificationRecord({
      businessId: appointment.businessId,
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      type: notificationType,
      channel: NotificationChannel.EMAIL,
      recipientName: business.name,
      recipientEmail: business.email,
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
        to: business.email,
        subject: operationalSubject,
        html: operationalBody,
      });

      await completeNotificationRecord(businessNotification, {
        status: result.skipped ? NotificationStatus.CANCELED : NotificationStatus.SENT,
        subject: operationalSubject,
        body: operationalBody,
        errorMessage: result.skipped ? result.reason : undefined,
      });
    } catch (error) {
      await completeNotificationRecord(businessNotification, {
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

      await completeNotificationRecord(whatsappNotification, {
        status: result.skipped ? NotificationStatus.CANCELED : NotificationStatus.SENT,
        body: whatsappCopy,
        errorMessage: result.skipped ? result.reason : undefined,
      });
    } catch (error) {
      await completeNotificationRecord(whatsappNotification, {
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
