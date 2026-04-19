# Zorby

SaaS de agendamento online com painel operacional, pagina publica de reservas, worker para notificacoes/exportacoes e base unica em Firebase Auth + Cloud Firestore + Firebase Storage.

## Stack

- Next.js 15 com App Router
- TypeScript estrito
- Firebase Auth
- Cloud Firestore
- Firebase Storage
- NextAuth
- BullMQ + Redis
- Resend para email
- Mercado Pago para assinaturas

## Setup local

1. Instale as dependencias:

```powershell
npm install
```

2. Copie o arquivo de ambiente:

```powershell
Copy-Item .env.example .env
```

3. Preencha no minimo:

- `APP_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

4. Rode o app:

```powershell
npm run dev
```

5. Em outro terminal, rode o worker:

```powershell
npm run worker:dev
```

## Scripts principais

```powershell
npm run dev
npm run build
npm run start
npm run worker:dev
npm run worker:start
npm run lint
npm run typecheck
npm run test
```

## Deploy no Render

O projeto esta pronto para deploy Firebase-only pelo [render.yaml](/C:/Users/Administrator/Documents/New%20Project/zorby/render.yaml).

### Web

- Build Command: `npm ci && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/api/health`

### Worker

- Build Command: `npm ci`
- Start Command: `npm run worker:start`

### Variaveis obrigatorias

- `APP_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `REDIS_URL`
- `RESEND_API_KEY`
- `RESEND_AUDIENCE_EMAIL`

Se usar billing e integracoes:

- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`
- `MERCADO_PAGO_STARTER_PLAN_ID`
- `MERCADO_PAGO_PRO_MONTHLY_PLAN_ID`
- `MERCADO_PAGO_PRO_YEARLY_PLAN_ID`
- `MERCADO_PAGO_BUSINESS_MONTHLY_PLAN_ID`
- `MERCADO_PAGO_BUSINESS_YEARLY_PLAN_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Observacoes

- Prisma, Neon e schema relacional legado foram removidos do runtime.
- O projeto agora assume Firebase como base unica operacional.
- Para Windows, se houver problema de casing no caminho `New project` vs `New Project`, rode comandos a partir do caminho com casing consistente.
