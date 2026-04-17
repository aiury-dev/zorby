type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

function write(level: LogLevel, message: string, context: LogPayload = {}) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}

export const logger = {
  info(message: string, context?: LogPayload) {
    write("info", message, context);
  },
  warn(message: string, context?: LogPayload) {
    write("warn", message, context);
  },
  error(message: string, context?: LogPayload) {
    write("error", message, context);
  },
};
