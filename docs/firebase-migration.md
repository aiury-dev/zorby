# Migracao Firebase do Zorby

Este documento define a base da migracao de `Prisma + PostgreSQL` para `Firebase Auth + Cloud Firestore + Firebase Storage`.

## Objetivo

Trocar a base relacional atual por Firebase sem perder os fluxos centrais:

- login de empresa/profissional
- login do cliente final
- onboarding
- vitrine `/agendar`
- pagina publica `/{slug}`
- reserva com bloqueio de horario
- dashboard
- notificacoes e historico

## Arquitetura alvo

- `Firebase Auth`
  - usuarios da empresa
  - clientes finais
- `Cloud Firestore`
  - negocios, profissionais, servicos, disponibilidades, clientes, agendamentos, reviews
- `Firebase Storage`
  - logo, capa, portfolio, fotos de profissionais
- `Next.js API / server actions`
  - regras criticas de booking
  - integracao Mercado Pago
  - compatibilidade com app/web

## Colecoes alvo

### `users`

Documento por usuario autenticado.

Campos base:
- `id`
- `firebaseUid`
- `type`: `business_user` | `customer`
- `name`
- `email`
- `phone`
- `image`
- `status`
- `createdAt`
- `updatedAt`

### `businesses`

Documento por negocio.

Campos base:
- `id`
- `ownerUserId`
- `name`
- `legalName`
- `slug`
- `category`
- `status`
- `description`
- `phone`
- `email`
- `websiteUrl`
- `logoUrl`
- `coverImageUrl`
- `brandPrimaryColor`
- `brandSecondaryColor`
- `publicBookingEnabled`
- `publicBookingPaused`
- `address`
- `geo`
- `cancellationPolicyText`
- `onboardingStep`
- `createdAt`
- `updatedAt`

Subcolecoes sugeridas:
- `businesses/{businessId}/memberships`
- `businesses/{businessId}/locations`
- `businesses/{businessId}/services`
- `businesses/{businessId}/professionals`
- `businesses/{businessId}/customers`
- `businesses/{businessId}/appointments`
- `businesses/{businessId}/reviews`
- `businesses/{businessId}/notifications`

### `services`

Preferencia: subcolecao em `businesses/{businessId}/services`.

Campos:
- `id`
- `name`
- `description`
- `durationMinutes`
- `bufferAfterMinutes`
- `priceCents`
- `colorHex`
- `isActive`
- `sortOrder`
- `prepaymentMode`
- `prepaymentAmountCents`
- `variants`

### `professionals`

Preferencia: subcolecao em `businesses/{businessId}/professionals`.

Campos:
- `id`
- `displayName`
- `publicDisplayName`
- `roleLabel`
- `email`
- `phone`
- `bio`
- `photoUrl`
- `specialties`
- `status`
- `acceptsOnlineBookings`
- `sortOrder`
- `serviceIds`
- `createdAt`
- `updatedAt`

### `availabilities`

Pode ficar embutido no profissional ou em subcolecao:
- `businesses/{businessId}/professionals/{professionalId}/availabilities`

Campos:
- `dayOfWeek`
- `startMinutes`
- `endMinutes`
- `slotIntervalMinutes`
- `capacity`
- `isActive`
- `validFrom`
- `validUntil`

### `appointments`

Ponto mais critico da migracao.

Modelo sugerido:
- documento em `businesses/{businessId}/appointments/{appointmentId}`
- documento espelho opcional em `customers/{customerId}/appointments/{appointmentId}` para leitura rapida no app

Campos:
- `id`
- `businessId`
- `professionalId`
- `serviceId`
- `serviceVariantId`
- `customerId`
- `status`
- `source`
- `startsAtUtc`
- `endsAtUtc`
- `timezoneSnapshot`
- `customerNameSnapshot`
- `customerEmailSnapshot`
- `customerPhoneSnapshot`
- `serviceNameSnapshot`
- `priceCents`
- `prepaymentMode`
- `prepaymentAmountCents`
- `cancelledAt`
- `completedAt`
- `noShowMarkedAt`
- `version`
- `createdAt`
- `updatedAt`

### `appointment_slots`

Para evitar conflito de horario no Firestore, usar reserva por slot.

Sugestao:
- `businesses/{businessId}/slotLocks/{professionalId_yyyyMMdd_HHmm}`

Campos:
- `professionalId`
- `businessId`
- `appointmentId`
- `startsAtUtc`
- `endsAtUtc`
- `status`
- `createdAt`

Regra:
- criar/reservar slot lock dentro de transacao Firestore
- se ja existir lock ativo, o horario nao pode ser agendado novamente

### `customers`

Subcolecao em `businesses/{businessId}/customers`.

Campos:
- `id`
- `fullName`
- `email`
- `phone`
- `notes`
- `privacyConsentAt`
- `marketingConsentAt`
- `lastBookedAt`
- `deletedAt`
- `createdAt`
- `updatedAt`

### `reviews`

Subcolecao em `businesses/{businessId}/reviews`.

Campos:
- `appointmentId`
- `customerId`
- `professionalId`
- `rating`
- `title`
- `body`
- `customerNameSnapshot`
- `status`
- `isPublic`
- `publishedAt`
- `createdAt`

## Ordem recomendada de migracao

### Fase 1

- adicionar Firebase ao projeto
- criar wrappers `firebase-admin` e `firebase-client`
- definir envs
- modelar colecoes

### Fase 2

- migrar autenticacao para `Firebase Auth`
- manter Prisma temporariamente para dados

### Fase 3

- migrar leitura publica:
  - `/agendar`
  - `/{slug}`
  - discovery

### Fase 4

- migrar escrita operacional:
  - business
  - services
  - professionals
  - availability

### Fase 5

- migrar booking com lock de slots em Firestore
- validar cancelamento/reagendamento/review

### Fase 6

- migrar dashboard e relatorios principais

### Fase 7

- migrar worker/notificacoes/exportacoes

### Fase 8

- desligar Prisma/Postgres

## Observacao importante

Migrar direto para Firestore sem fase de compatibilidade e sem lock de slots vai quebrar:

- conflito de horario
- dashboard
- relatorios
- cancelamento/reagendamento
- consistencia do onboarding

Por isso a migracao precisa ser faseada.
