"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  CalendarSearch,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm(props: { callbackUrl?: string; googleEnabled?: boolean }) {
  const router = useRouter();
  const callbackUrl = props.callbackUrl ?? "/dashboard/agenda";
  const googleEnabled = props.googleEnabled ?? false;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleCredentialsSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (result?.error) {
        setMessage("Não foi possível entrar. Verifique seu e-mail e sua senha.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  }

  return (
    <div className="grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/80 bg-white/92 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="hidden bg-[linear-gradient(180deg,#0b1220_0%,#102447_42%,#15508f_100%)] p-10 text-white lg:flex lg:flex-col">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">Zorby</p>
          <h2 className="mt-6 text-4xl font-semibold leading-tight">
            Entre no painel e acompanhe sua operação em tempo real.
          </h2>
          <p className="mt-4 text-base leading-8 text-white/72">
            Agenda, clientes, serviços e disponibilidade em um fluxo simples para desktop e mobile.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <div className="rounded-[26px] border border-white/10 bg-white/[0.06] p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Mail className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Login com e-mail e senha</p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Acesso direto ao painel, sem etapas intermediárias e sem magic link.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/[0.06] p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Experiência mais profissional</p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Fluxo limpo, visual consistente e navegação pronta para uso em tela grande e pequena.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto rounded-[26px] border border-white/10 bg-white/[0.06] p-5">
          <p className="text-sm font-semibold">Dica</p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Se ainda estiver configurando o ambiente, faça login com a conta criada no cadastro e continue o onboarding normalmente.
          </p>
        </div>
      </aside>

      <section className="p-6 md:p-10 lg:p-12">
        <div className="mx-auto w-full max-w-md">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
              Acesso de empresa
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--color-fg-default)]">
              Entrar no Zorby
            </h1>
            <p className="text-sm leading-7 text-[color:var(--color-fg-muted)]">
              Acesse sua conta com e-mail e senha para continuar a operação do seu negócio.
            </p>
          </div>

          <div className="mt-6 rounded-[24px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-[color:var(--color-brand-500)]">
                <Store className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                  Esta área é para empresas e profissionais
                </p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                  Se você é cliente final e quer reservar um horário, use a entrada de agendamento.
                </p>
                <Link
                  href="/agendar"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-brand-500)]"
                >
                  <CalendarSearch className="size-4" />
                  Quero agendar um serviço
                </Link>
              </div>
            </div>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleCredentialsSignIn}>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--color-fg-default)]"
                htmlFor="login-email"
              >
                E-mail
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--color-fg-default)]"
                htmlFor="login-password"
              >
                Senha
              </label>
              <Input
                id="login-password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="h-12 rounded-2xl"
              />
            </div>

            <Button
              className="mt-2 h-12 w-full rounded-2xl text-sm font-semibold shadow-[0_14px_30px_rgba(22,100,232,0.22)]"
              disabled={isPending}
            >
              <span className="inline-flex items-center gap-2">
                {isPending ? "Entrando..." : "Entrar com e-mail e senha"}
                {!isPending ? <ArrowRight className="size-4" /> : null}
              </span>
            </Button>
          </form>

          {googleEnabled ? (
            <button
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[color:var(--color-border-default)] bg-white px-5 text-sm font-semibold text-[color:var(--color-fg-default)] shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:border-[color:var(--color-border-strong)] hover:bg-slate-50"
              onClick={() => signIn("google", { callbackUrl })}
              type="button"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5A9.5 9.5 0 1 0 12 21.5c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.1-.2-1.5H12Z"
                />
                <path
                  fill="#4285F4"
                  d="M3.6 7.7 6.8 10c.9-2.6 3.3-4.3 5.2-4.3 1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5c-3.6 0-6.9 2-8.4 5.2Z"
                />
                <path
                  fill="#FBBC05"
                  d="M12 21.5c2.5 0 4.6-.8 6.1-2.3l-2.8-2.3c-.8.6-1.8 1-3.3 1-2.7 0-4.9-1.8-5.7-4.2l-3.1 2.4A9.5 9.5 0 0 0 12 21.5Z"
                />
                <path
                  fill="#34A853"
                  d="M6.3 13.7c-.2-.6-.3-1.1-.3-1.7s.1-1.2.3-1.7L3.2 7.9A9.5 9.5 0 0 0 2.5 12c0 1.5.4 2.9 1 4.1l2.8-2.4Z"
                />
              </svg>
              Continuar com Google
            </button>
          ) : (
            <div className="mt-4 rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3 text-sm text-[color:var(--color-fg-muted)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-white p-2 text-[color:var(--color-fg-muted)]">
                  <LockKeyhole className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-[color:var(--color-fg-default)]">
                    Login com Google indisponível
                  </p>
                  <p className="mt-1 leading-6">
                    Ative o Google OAuth nas variáveis de ambiente para liberar essa opção.
                  </p>
                </div>
              </div>
            </div>
          )}

          {message ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {message}
            </div>
          ) : null}

          <p className="mt-8 text-sm text-[color:var(--color-fg-muted)]">
            Ainda não tem conta?{" "}
            <Link className="font-medium text-[color:var(--color-brand-500)]" href="/cadastro">
              Criar conta
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
