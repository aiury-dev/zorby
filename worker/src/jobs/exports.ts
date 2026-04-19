import type { Job } from "bullmq";
import { NotificationStatus } from "@/lib/domain-enums";
import { logger } from "@/lib/logger";
import {
  getAppointmentsForBusinessFromFirestore,
  getBusinessSettingsFromFirestore,
  getCustomersForBusinessFromFirestore,
  getDataExportByIdFromFirestore,
  getReviewsForBusinessFromFirestore,
  getUserByIdFromFirestore,
} from "@/server/services/firestore-read";
import { syncDataExportDocument } from "@/server/services/firebase-sync";
import { uploadExportPayload } from "../providers/storage";

function toSyncPayload(exportRecord: Awaited<ReturnType<typeof getDataExportByIdFromFirestore>>) {
  if (!exportRecord) {
    throw new Error("Exportação não encontrada para sincronização.");
  }

  return {
    id: exportRecord.id,
    businessId: exportRecord.businessId,
    requestedByUserId: exportRecord.requestedByUserId,
    format: exportRecord.format,
    scope: exportRecord.scope,
    fileUrl: exportRecord.fileUrl,
    note: exportRecord.note,
    completedAt: exportRecord.completedAt?.toISOString() ?? null,
    createdAt: exportRecord.createdAt?.toISOString(),
  };
}

export async function processPrivacyExportJob(job: Job<{ exportId: string }>) {
  const exportRecord = await getDataExportByIdFromFirestore(job.data.exportId);

  if (!exportRecord) {
    throw new Error("Solicitação de exportação não encontrada.");
  }

  const [business, requestedByUser] = await Promise.all([
    getBusinessSettingsFromFirestore(exportRecord.businessId),
    getUserByIdFromFirestore(exportRecord.requestedByUserId),
  ]);

  if (!business) {
    throw new Error("Negócio da exportação não encontrado.");
  }

  await syncDataExportDocument({
    ...toSyncPayload(exportRecord),
    status: NotificationStatus.PROCESSING,
    note: null,
  }).catch(() => undefined);

  try {
    const payload =
      exportRecord.scope === "AGGREGATED"
        ? await buildAggregatedPayload(exportRecord.businessId)
        : await buildFullCustomersPayload(exportRecord.businessId);

    const fileUrl = await uploadExportPayload({
      fileName: `${business.slug}-${exportRecord.id}.json`,
      payload: {
        ...payload,
        requestedBy: requestedByUser
          ? {
              id: requestedByUser.id,
              email: requestedByUser.email,
              name: requestedByUser.name,
            }
          : null,
      },
    });

    await syncDataExportDocument({
      ...toSyncPayload(exportRecord),
      status: NotificationStatus.SENT,
      fileUrl,
      completedAt: new Date().toISOString(),
      note: null,
    }).catch(() => undefined);

    logger.info("Exportação LGPD concluída", {
      exportId: exportRecord.id,
      businessId: exportRecord.businessId,
    });
  } catch (error) {
    await syncDataExportDocument({
      ...toSyncPayload(exportRecord),
      status: NotificationStatus.FAILED,
      note: error instanceof Error ? error.message : "Falha ao gerar exportação.",
    }).catch(() => undefined);

    throw error;
  }
}

async function buildAggregatedPayload(businessId: string) {
  const [appointments, customers, reviews] = await Promise.all([
    getAppointmentsForBusinessFromFirestore(businessId),
    getCustomersForBusinessFromFirestore(businessId),
    getReviewsForBusinessFromFirestore(businessId),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    type: "AGGREGATED",
    totals: {
      appointments: appointments.length,
      customers: customers.length,
      reviews: reviews.length,
    },
  };
}

async function buildFullCustomersPayload(businessId: string) {
  const [customers, appointments] = await Promise.all([
    getCustomersForBusinessFromFirestore(businessId),
    getAppointmentsForBusinessFromFirestore(businessId),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    type: "FULL_CUSTOMERS",
    customers: customers.map((customer) => ({
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      timezone: customer.timezone,
      lastBookedAt: customer.lastBookedAt?.toISOString() ?? null,
      appointments: appointments
        .filter((appointment) => appointment.customerId === customer.id)
        .sort((left, right) => right.startsAtUtc.getTime() - left.startsAtUtc.getTime())
        .map((appointment) => ({
          id: appointment.id,
          startsAtUtc: appointment.startsAtUtc.toISOString(),
          endsAtUtc: appointment.endsAtUtc.toISOString(),
          status: appointment.status,
          serviceNameSnapshot: appointment.serviceNameSnapshot,
          customerPhoneSnapshot: appointment.customerPhoneSnapshot,
          customerEmailSnapshot: appointment.customerEmailSnapshot,
        })),
    })),
  };
}
