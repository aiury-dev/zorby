"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    businessName: "",
    name: "",
    email: "",
    password: "",
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "Não foi possível criar sua conta.");
        return;
      }

      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      router.push("/onboarding/business");
      router.refresh();
    });
  }

  return (
    <div className="grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/80 bg-white/92 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="hidden bg-[linear-gradient(180deg,#071d12_0%,#0d2d1b_42%,#12703a_100%)] p-10 text-white lg:flex lg:flex-col">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">Zorby</p>
          <h2 className="mt-6 text-4xl font-semibold leading-tight">
            Crie sua conta e publique sua agenda profissional.
          </h2>
          <p className="mt-4 text-base leading-8 text-white/72">
            Em poucos minutos você já deixa o negócio pronto para receber agendamentos online.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <div className="rounded-[26px] border border-white/10 bg-white/[0.06] p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Building2 className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Estrutura desde o primeiro dia</p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Negócio, serviços, disponibilidade e página pública em um onboarding guiado.
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
                <p className="text-sm font-semibold">Fluxo simples e profissional</p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Sem etapas desnecessárias, com foco em publicar rápido e operar com clareza.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto rounded-[26px] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Pronto para desktop e mobile</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Seu painel e sua página pública já nascem com foco em experiência responsiva.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <section className="p-6 md:p-10 lg:p-12">
        <div className="mx-auto w-full max-w-lg">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
              Criar conta
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--color-fg-default)]">
              Comece sua operação no Zorby
            </h1>
            <p className="text-sm leading-7 text-[color:var(--color-fg-muted)]">
              Vamos abrir sua área e deixar o negócio pronto para receber agendamentos online.
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="signup-business">
                Nome do negócio
              </label>
              <Input
                id="signup-business"
                placeholder="Ex.: Studio Aurora"
                value={form.businessName}
                onChange={(event) => updateField("businessName", event.target.value)}
                required
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="signup-name">
                Seu nome
              </label>
              <Input
                id="signup-name"
                placeholder="Como você quer aparecer no painel"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="signup-email">
                E-mail
              </label>
              <Input
                id="signup-email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="signup-password">
                Senha
              </label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Crie uma senha segura"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                minLength={8}
                required
                className="h-12 rounded-2xl"
              />
            </div>

            <Button className="mt-2 h-12 w-full rounded-2xl text-sm font-semibold shadow-[0_14px_30px_rgba(22,100,232,0.22)]" disabled={isPending}>
              <span className="inline-flex items-center gap-2">
                {isPending ? "Criando sua conta..." : "Criar conta e continuar"}
                {!isPending ? <ArrowRight className="size-4" /> : null}
              </span>
            </Button>
          </form>

          {message ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-medium">Não foi possível concluir o cadastro.</p>
              <p className="mt-1">{message}</p>
            </div>
          ) : null}

          <p className="mt-8 text-sm text-[color:var(--color-fg-muted)]">
            Já tem conta?{" "}
            <Link className="font-medium text-[color:var(--color-brand-500)]" href="/login">
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
