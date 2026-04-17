import { z } from "zod";

export const availabilityQuerySchema = z.object({
  date: z.string().min(10),
  serviceId: z.string().cuid().optional(),
  professionalId: z.string().cuid().optional(),
  timezone: z.string().default("America/Sao_Paulo"),
});

export const publicBookingSchema = z.object({
  serviceId: z.string().cuid(),
  professionalId: z.string().cuid(),
  serviceVariantId: z.string().cuid().optional(),
  startsAt: z.string().datetime(),
  customerName: z.string().min(2),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().min(10),
  customerTimezone: z.string().default("America/Sao_Paulo"),
  consent: z.boolean().refine((value) => value, "O consentimento e obrigatorio."),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const rescheduleBookingSchema = z.object({
  startsAt: z.string().datetime(),
  customerTimezone: z.string().default("America/Sao_Paulo"),
});
