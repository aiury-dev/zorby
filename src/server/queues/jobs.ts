import { addMinutes, subHours } from "date-fns";
import { getExportsQueue, getNotificationsQueue } from "@/lib/queue";

export async function enqueueAppointmentNotifications(input: {
  appointmentId: string;
  startsAtUtc: Date;
}) {
  const queue = getNotificationsQueue();
  if (!queue) {
    return;
  }

  await queue.add("appointment-confirmation", {
    appointmentId: input.appointmentId,
  });

  const reminder24hAt = subHours(input.startsAtUtc, 24);
  if (reminder24hAt.getTime() > Date.now()) {
    await queue.add(
      "appointment-reminder-24h",
      { appointmentId: input.appointmentId },
      { delay: reminder24hAt.getTime() - Date.now() },
    );
  }

  const reminder1hAt = addMinutes(input.startsAtUtc, -60);
  if (reminder1hAt.getTime() > Date.now()) {
    await queue.add(
      "appointment-reminder-1h",
      { appointmentId: input.appointmentId },
      { delay: reminder1hAt.getTime() - Date.now() },
    );
  }
}

export async function enqueueAppointmentLifecycleNotification(input: {
  jobName: "appointment-cancelled" | "appointment-rescheduled";
  appointmentId: string;
}) {
  const queue = getNotificationsQueue();
  if (!queue) {
    return;
  }

  await queue.add(input.jobName, {
    appointmentId: input.appointmentId,
  });
}

export async function enqueuePrivacyExport(exportId: string) {
  const queue = getExportsQueue();
  if (!queue) {
    return;
  }

  await queue.add("privacy-export", { exportId });
}
