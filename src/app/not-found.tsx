export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[color:var(--color-background)] px-6 py-20">
      <section className="w-full max-w-xl rounded-[28px] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface)] p-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.06),0_24px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
          404
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-[color:var(--color-fg-default)]">
          Pagina nao encontrada
        </h1>
        <p className="mt-3 text-base leading-7 text-[color:var(--color-fg-muted)]">
          O conteudo que voce tentou acessar ainda nao existe ou foi movido.
        </p>
      </section>
    </main>
  );
}
