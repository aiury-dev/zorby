import type { Job } from "bullmq";
import { NotificationStatus } from "@/generated/prisma/enums";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { uploadExportPayload } from "../providers/storage";

export async function processPrivacyExportJob(job: Job<{ exportId: string }>) {
  const exportRecord = await prisma.dataExport.findUnique({
    where: { id: job.data.exportId },
    include: {
      business: true,
      requestedByUser: true,
    },
  });

  if (!exportRecord) {
    throw new Error("Solicitacao de exportacao nao encontrada.");
  }

  await prisma.dataExport.update({
    where: { id: exportRecord.id },
    data: { status: NotificationStatus.PROCESSING },
  });

  try {
    const payload =
      exportRecord.scope === "AGGREGATED"
        ? await buildAggregatedPayload(exportRecord.businessId)
        : await buildFullCustomersPayload(exportRecord.businessId);

    const fileUrl = await uploadExportPayload({
      fileName: `${exportRecord.business.slug}-${exportRecord.id}.json`,
      payload,
    });

    await prisma.dataExport.update({
      where: { id: exportRecord.id },
      data: {
        status: NotificationStatus.SENT,
        fileUrl,
        completedAt: new Date(),
      },
    });

    logger.info("Exportacao LGPD concluida", {
      exportId: exportRecord.id,
      businessId: exportRecord.businessId,
    });
  } catch (error) {
    await prisma.dataExport.update({
      where: { id: exportRecord.id },
      data: {
        status: NotificationStatus.FAILED,
        note: error instanceof Error ? error.message : "Falha ao gerar exportacao.",
      },
    });

    throw error;
  }
}

async function buildAggregatedPayload(businessId: string) {
  const [appointments, customers, reviews] = await Promise.all([
    prisma.appointment.count({ where: { businessId } }),
    prisma.customer.count({ where: { businessId, deletedAt: null } }),
    prisma.review.count({ where: { businessId } }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    type: "AGGREGATED",
    totals: {
      appointments,
      customers,
      reviews,
    },
  };
}

async function buildFullCustomersPayload(businessId: string) {
  const customers = await prisma.customer.findMany({
    where: { businessId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      appointments: {
        orderBy: { startsAtUtc: "desc" },
        select: {
          id: true,
          startsAtUtc: true,
          endsAtUtc: true,
          status: true,
          serviceNameSnapshot: true,
          customerPhoneSnapshot: true,
          customerEmailSnapshot: true,
        },
      },
    },
  });

  return {
    generatedAt: new Date().toISOString(),
    type: "FULL_CUSTOMERS",
    customers,
  };
}
