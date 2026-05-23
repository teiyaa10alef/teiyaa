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
      <section className="max-w-5xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-8 md:pb-12">
        <span className="inline-block px-3 py-1 bg-brand-soft text-brand text-xs font-bold uppercase tracking-widest rounded-full">
          {eyebrow}
        </span>
        <h1 className="mt-5 md:mt-6 text-3xl md:text-6xl font-bold leading-[1.1] tracking-tight">
          {title}
        </h1>
        <p className="mt-5 md:mt-6 text-base md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          {description}
        </p>
        <div className="mt-8 md:mt-10 flex flex-col sm:flex-row flex-wrap gap-3">
          <button className="w-full sm:w-auto px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand hover:bg-brand-dark transition-colors">
            {ctaLabel}
          </button>
          <button className="w-full sm:w-auto px-6 py-3 bg-surface border border-border rounded-full font-semibold hover:border-brand/40 transition-colors">
            Explorar listagens
          </button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 md:px-6 pb-16 md:pb-20">
        <div className="bg-card border border-border rounded-3xl p-6 md:p-12">
          <h2 className="text-xl md:text-2xl font-bold mb-5 md:mb-6">O que você encontra aqui</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 p-4 bg-muted rounded-2xl border border-border"
              >
                <div className="mt-1 size-2 rounded-full bg-brand shrink-0" />
                <span className="text-foreground text-sm md:text-base">{b}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 md:mt-8 text-sm text-muted-foreground">
            Em breve: listagens reais do seu bairro com filtros, avaliações e contato
            direto.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
