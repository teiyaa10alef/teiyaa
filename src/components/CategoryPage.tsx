import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

interface CategoryPageProps {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  bullets: string[];
}

export function CategoryPage({
  eyebrow,
  title,
  description,
  ctaLabel,
  bullets,
}: CategoryPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-12">
        <span className="inline-block px-3 py-1 bg-brand-soft text-brand text-xs font-bold uppercase tracking-widest rounded-full">
          {eyebrow}
        </span>
        <h1 className="mt-6 text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight">
          {title}
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl leading-relaxed">
          {description}
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <button className="px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand hover:bg-brand-dark transition-colors">
            {ctaLabel}
          </button>
          <button className="px-6 py-3 bg-surface border border-border rounded-full font-semibold hover:border-brand/40 transition-colors">
            Explorar listagens
          </button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl font-bold mb-6">O que você encontra aqui</h2>
          <ul className="grid md:grid-cols-2 gap-4">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 p-4 bg-muted rounded-2xl border border-border"
              >
                <div className="mt-1 size-2 rounded-full bg-brand shrink-0" />
                <span className="text-foreground">{b}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-muted-foreground">
            Em breve: listagens reais do seu bairro com filtros, avaliações e contato
            direto.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
