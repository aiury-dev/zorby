"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm(props: { callbackUrl?: string }) {
  const router = useRouter();
  const callbackUrl = props.callbackUrl ?? "/dashboard/agenda";
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
        setMessage("Nao foi possivel entrar. Verifique email e senha.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  }

  async function handleMagicLink() {
    setMessage(null);
    const result = await signIn("email", {
      redirect: false,
      email,
      callbackUrl,
    });

    if (result?.error) {
      setMessage("Nao foi possivel enviar o magic link.");
      return;
    }

    setMessage("Enviamos um link seguro para seu email.");
  }

  return (
    <div className="w-full max-w-md rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-[color:var(--color-fg-default)]">Entrar no Zorby</h1>
        <p className="text-sm leading-6 text-[color:var(--color-fg-muted)]">
          Acesse seu painel ou receba um magic link sem senha.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleCredentialsSignIn}>
        <Input
          type="email"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button className="w-full" disabled={isPending}>
          {isPending ? "Entrando..." : "Entrar com email e senha"}
        </Button>
      </form>

      <Button className="mt-3 w-full" variant="secondary" onClick={handleMagicLink} type="button">
        Receber magic link
      </Button>

      <Button
        className="mt-3 w-full"
        variant="ghost"
        onClick={() => signIn("google", { callbackUrl })}
        type="button"
      >
        Continuar com Google
      </Button>

      {message ? <p className="mt-4 text-sm text-[color:var(--color-fg-muted)]">{message}</p> : null}

      <p className="mt-6 text-sm text-[color:var(--color-fg-muted)]">
        Ainda nao tem conta?{" "}
        <Link className="font-medium text-[color:var(--color-brand-500)]" href="/cadastro">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
