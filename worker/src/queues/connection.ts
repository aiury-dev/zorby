import IORedis from "ioredis";

let connection: IORedis | null | undefined;

export function getQueueConnection() {
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
