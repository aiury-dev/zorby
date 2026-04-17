"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
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
        setMessage(payload.error ?? "Nao foi possivel criar sua conta.");
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
    <div className="w-full max-w-lg rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-[color:var(--color-fg-default)]">Criar conta</h1>
        <p className="text-sm leading-6 text-[color:var(--color-fg-muted)]">
          Vamos abrir sua area no Zorby e deixar o negocio pronto para agendar online.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <Input
          placeholder="Nome do negocio"
          value={form.businessName}
          onChange={(event) => updateField("businessName", event.target.value)}
          required
        />
        <Input
          placeholder="Seu nome"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="seuemail@exemplo.com"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Crie uma senha segura"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          required
        />
        <Button className="w-full" disabled={isPending}>
          {isPending ? "Criando sua conta..." : "Criar conta e continuar"}
        </Button>
      </form>

      {message ? <p className="mt-4 text-sm text-[color:var(--color-danger)]">{message}</p> : null}

      <p className="mt-6 text-sm text-[color:var(--color-fg-muted)]">
        Ja tem conta?{" "}
        <Link className="font-medium text-[color:var(--color-brand-500)]" href="/login">
          Entrar
        </Link>
      </p>
    </div>
  );
}
