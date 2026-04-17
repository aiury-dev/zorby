import IORedis from "ioredis";
import { Queue } from "bullmq";

let connection: IORedis | null | undefined;
let notificationsQueue: Queue | null | undefined;
let exportsQueue: Queue | null | undefined;

function getConnection() {
  if (connection !== undefined) {
    return connection;
  }

  if (!process.env.REDIS_URL) {
    connection = null;
    return connection;
  }

  connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  return connection;
}

export function getNotificationsQueue() {
  if (notificationsQueue !== undefined) {
    return notificationsQueue;
  }

  const redis = getConnection();
  if (!redis) {
    notificationsQueue = null;
    return notificationsQueue;
  }

  notificationsQueue = new Queue("notifications", { connection: redis });
  return notificationsQueue;
}

export function getExportsQueue() {
  if (exportsQueue !== undefined) {
    return exportsQueue;
  }

  const redis = getConnection();
  if (!redis) {
    exportsQueue = null;
    return exportsQueue;
  }

  exportsQueue = new Queue("exports", { connection: redis });
  return exportsQueue;
}
