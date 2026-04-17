# Zorby

SaaS de agendamento online para clínicas, salões, barbearias e profissionais autônomos, com página pública de reservas, painel de gestão, assinatura recorrente via Mercado Pago e filas para notificações/exportações.

## Stack

- Next.js 15 com App Router
- TypeScript estrito
- Prisma + PostgreSQL
- NextAuth com credenciais, magic link e Google OAuth
- Tailwind CSS
- BullMQ + Redis
- Resend para e-mail
- Evolution API para WhatsApp
- Mercado Pago para assinaturas

## O que pode ir para GitHub público

Pode ficar público:
- todo o código em `src/`, `prisma/`, `public/` e `worker/`
- `package.json`, `package-lock.json`, `tsconfig.json`
- `.env.example`
- `render.yaml`
- `README.md`

Não pode ficar público:
- `.env`
- qualquer senha de banco, token, chave de API ou segredo
- credenciais do Neon, Resend, Mercado Pago, Google, Upstash, Sentry e Cloudflare
- logs temporários locais

## Setup local

1. Instale as dependências:

```powershell
npm install
```

2. Copie o arquivo de ambiente:

```powershell
Copy-Item .env.example .env
```

3. Ajuste ao menos estas variáveis:

- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `APP_URL`

4. Gere o client do Prisma e aplique o schema:

```powershell
npm run db:generate
npm run db:push
```

5. Popule os planos base:

```powershell
npm run db:seed
```

6. Rode o app web:

```powershell
npm run build
npm run start -- --port 3010
```

7. Em outro terminal, rode o worker:

```powershell
npm run worker:dev
```

## Fluxos implementados

- cadastro/login com credenciais, magic link e Google
- wizard de onboarding
- página pública `/{slug}` com agendamento em 3 passos
- disponibilidade em tempo real com cache curto
- criação pública de agendamento
- cancelamento e reagendamento por token assinado
- painel com dashboard, agenda, clientes, serviços, profissionais, configurações e relatórios
- webhook do Mercado Pago para sincronizar status da assinatura
- fila BullMQ para confirmações, lembretes, cancelamentos, reagendamentos e exportações LGPD

## Testes

```powershell
npm run test
```

## Build

```powershell
npm run build
```

Observação para Windows: se houver conflito de casing no caminho por causa de `New project`, rode o build a partir de uma unidade `subst` apontando para a pasta do projeto.

## Deploy no Render

Documentação oficial usada:
- [Deploy a Next.js App](https://render.com/docs/deploy-nextjs-app)
- [Default Environment Variables](https://render.com/docs/environment-variables)
- [Deploying on Render](https://render.com/docs/deploys/)

### Web app

Crie um `Web Service` no Render apontando para este repositório.

Valores principais:
- Runtime: `Node`
- Build Command: `npm ci && npm run db:generate && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/api/health`

### Worker

Crie um `Worker` no Render apontando para o mesmo repositório.

Valores principais:
- Runtime: `Node`
- Build Command: `npm ci && npm run db:generate`
- Start Command: `npm run worker:start`

### Variáveis obrigatórias no Render

- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `APP_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `REDIS_URL`
- `RESEND_API_KEY`
- `RESEND_AUDIENCE_EMAIL`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`
- `MERCADO_PAGO_STARTER_PLAN_ID`
- `MERCADO_PAGO_PRO_MONTHLY_PLAN_ID`
- `MERCADO_PAGO_PRO_YEARLY_PLAN_ID`
- `MERCADO_PAGO_BUSINESS_MONTHLY_PLAN_ID`
- `MERCADO_PAGO_BUSINESS_YEARLY_PLAN_ID`

O arquivo [render.yaml](/C:/Users/Administrator/Documents/New%20project/zorby/render.yaml) já está preparado para isso.

## Resend

Documentação oficial:
- [Managing Domains](https://resend.com/docs/dashboard/domains/introduction)
- [API Keys](https://resend.com/docs/dashboard/api-keys/introduction)

Você vai precisar:
- verificar um domínio ou subdomínio de envio
- criar uma API key
- definir `RESEND_API_KEY`
- definir `RESEND_AUDIENCE_EMAIL`

Exemplo recomendado:
- domínio de envio: `mail.seudominio.com`
- remetente: `noreply@mail.seudominio.com`

## Mercado Pago

Documentação oficial:
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/notifications/webhooks)

Webhook esperado pelo projeto:

- `POST /api/webhooks/mercadopago`

Exemplo em produção:

- `https://app.seudominio.com/api/webhooks/mercadopago`

## Estrutura

```txt
src/
  app/
  components/
  lib/
  server/
prisma/
worker/
```
