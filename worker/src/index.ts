import "dotenv/config";
import { Worker } from "bullmq";
import { logger } from "@/lib/logger";
import { processPrivacyExportJob } from "./jobs/exports";
import { processNotificationJob } from "./jobs/notifications";
import { getQueueConnection } from "./queues/connection";

const connection = getQueueConnection();

if (!connection) {
  logger.warn("Worker nao iniciado porque REDIS_URL nao esta configurado.");
  process.exit(0);
}

const activeConnection = connection;

const notificationsWorker = new Worker("notifications", processNotificationJob, {
  connection: activeConnection,
  concurrency: 5,
});

const exportsWorker = new Worker("exports", processPrivacyExportJob, {
  connection: activeConnection,
  concurrency: 2,
});

for (const worker of [notificationsWorker, exportsWorker]) {
  worker.on("completed", (job) => {
    logger.info("Job concluido", {
      queue: worker.name,
      jobId: job.id,
      jobName: job.name,
    });
  });

  worker.on("failed", (job, error) => {
    logger.error("Job falhou", {
      queue: worker.name,
      jobId: job?.id,
      jobName: job?.name,
      error: error.message,
    });
  });
}

logger.info("Workers do Zorby iniciados", {
  notificationsQueue: notificationsWorker.name,
  exportsQueue: exportsWorker.name,
});

async function shutdown() {
  await Promise.all([notificationsWorker.close(), exportsWorker.close()]);
  await activeConnection.quit();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
