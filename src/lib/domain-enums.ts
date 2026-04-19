export const UserStatus = {
  ACTIVE: "ACTIVE",
  INVITED: "INVITED",
  SUSPENDED: "SUSPENDED",
  DELETED: "DELETED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const MembershipRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  VIEWER: "VIEWER",
} as const;
export type MembershipRole = (typeof MembershipRole)[keyof typeof MembershipRole];

export const BusinessStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  ARCHIVED: "ARCHIVED",
} as const;
export type BusinessStatus = (typeof BusinessStatus)[keyof typeof BusinessStatus];

export const BusinessCategory = {
  HEALTH: "HEALTH",
  BEAUTY: "BEAUTY",
  EDUCATION: "EDUCATION",
  CONSULTING: "CONSULTING",
  SPORTS: "SPORTS",
  OTHER: "OTHER",
} as const;
export type BusinessCategory = (typeof BusinessCategory)[keyof typeof BusinessCategory];

export const OnboardingStep = {
  BUSINESS: "BUSINESS",
  SERVICES: "SERVICES",
  AVAILABILITY: "AVAILABILITY",
  LINK: "LINK",
  COMPLETED: "COMPLETED",
} as const;
export type OnboardingStep = (typeof OnboardingStep)[keyof typeof OnboardingStep];

export const LocationType = {
  HEADQUARTERS: "HEADQUARTERS",
  BRANCH: "BRANCH",
  MOBILE: "MOBILE",
  ONLINE: "ONLINE",
} as const;
export type LocationType = (typeof LocationType)[keyof typeof LocationType];

export const ProfessionalStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;
export type ProfessionalStatus = (typeof ProfessionalStatus)[keyof typeof ProfessionalStatus];

export const ServicePrepaymentMode = {
  NONE: "NONE",
  DEPOSIT: "DEPOSIT",
  FULL: "FULL",
} as const;
export type ServicePrepaymentMode =
  (typeof ServicePrepaymentMode)[keyof typeof ServicePrepaymentMode];

export const AppointmentStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const AppointmentSource = {
  PUBLIC_PAGE: "PUBLIC_PAGE",
  DASHBOARD: "DASHBOARD",
  API: "API",
  IMPORT: "IMPORT",
} as const;
export type AppointmentSource = (typeof AppointmentSource)[keyof typeof AppointmentSource];

export const AccessTokenPurpose = {
  CANCEL: "CANCEL",
  RESCHEDULE: "RESCHEDULE",
  REVIEW: "REVIEW",
} as const;
export type AccessTokenPurpose = (typeof AccessTokenPurpose)[keyof typeof AccessTokenPurpose];

export const BillingProvider = {
  STRIPE: "STRIPE",
  MERCADOPAGO: "MERCADOPAGO",
  PAGARME: "PAGARME",
  MANUAL: "MANUAL",
} as const;
export type BillingProvider = (typeof BillingProvider)[keyof typeof BillingProvider];

export const BillingInterval = {
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
} as const;
export type BillingInterval = (typeof BillingInterval)[keyof typeof BillingInterval];

export const SubscriptionStatus = {
  TRIALING: "TRIALING",
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  UNPAID: "UNPAID",
  CANCELED: "CANCELED",
  INCOMPLETE: "INCOMPLETE",
  PAUSED: "PAUSED",
  EXPIRED: "EXPIRED",
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const NotificationChannel = {
  EMAIL: "EMAIL",
  WHATSAPP: "WHATSAPP",
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const NotificationType = {
  APPOINTMENT_CREATED: "APPOINTMENT_CREATED",
  APPOINTMENT_CONFIRMED: "APPOINTMENT_CONFIRMED",
  APPOINTMENT_CANCELLED: "APPOINTMENT_CANCELLED",
  APPOINTMENT_RESCHEDULED: "APPOINTMENT_RESCHEDULED",
  REMINDER_24H: "REMINDER_24H",
  REMINDER_1H: "REMINDER_1H",
  REVIEW_REQUEST: "REVIEW_REQUEST",
  BILLING_PAST_DUE: "BILLING_PAST_DUE",
  BILLING_RENEWED: "BILLING_RENEWED",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SENT: "SENT",
  FAILED: "FAILED",
  CANCELED: "CANCELED",
} as const;
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

export const ReviewStatus = {
  PENDING: "PENDING",
  PUBLISHED: "PUBLISHED",
  HIDDEN: "HIDDEN",
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

export const PrivacyRequestType = {
  ACCESS: "ACCESS",
  DELETE: "DELETE",
} as const;
export type PrivacyRequestType = (typeof PrivacyRequestType)[keyof typeof PrivacyRequestType];

export const PrivacyRequestStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
} as const;
export type PrivacyRequestStatus =
  (typeof PrivacyRequestStatus)[keyof typeof PrivacyRequestStatus];

export const DataExportFormat = {
  CSV: "CSV",
  PDF: "PDF",
  JSON: "JSON",
} as const;
export type DataExportFormat = (typeof DataExportFormat)[keyof typeof DataExportFormat];

export const DataExportScope = {
  AGGREGATED: "AGGREGATED",
  FULL_CUSTOMERS: "FULL_CUSTOMERS",
} as const;
export type DataExportScope = (typeof DataExportScope)[keyof typeof DataExportScope];

export const PlanCode = {
  STARTER: "STARTER",
  PRO: "PRO",
  BUSINESS: "BUSINESS",
} as const;
export type PlanCode = (typeof PlanCode)[keyof typeof PlanCode];
