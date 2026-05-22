import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import butcherImg from "@/assets/butcher.jpg";
import electricianImg from "@/assets/electrician.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

const quickActions = [
  { to: "/comercios", emoji: "🍔", label: "Comida" },
  { to: "/servicos", emoji: "🛠️", label: "Serviços" },
  { to: "/imoveis", emoji: "🏠", label: "Imóveis" },
  { to: "/vagas", emoji: "💼", label: "Vagas" },
  { to: "/freelances", emoji: "🤝", label: "Bicos" },
] as const;

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <header className="relative py-20 px-6 overflow-hidden bg-surface">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
              Tudo o que você precisa no{" "}
              <span className="text-brand">seu bairro</span>.
            </h1>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
              Conectamos vizinhos, fortalecemos comércios e criamos oportunidades reais
              dentro da sua comunidade. Do almoço ao emprego novo.
            </p>
            <form
              className="flex p-2 bg-muted rounded-2xl border border-border shadow-sm"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="text"
                placeholder="O que você está procurando hoje?"
                className="flex-1 bg-transparent px-4 py-3 outline-none text-lg placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="bg-brand text-primary-foreground px-6 md:px-8 py-3 rounded-xl font-bold hover:bg-brand-dark transition-colors"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none">
          <div className="w-full h-full bg-brand rounded-l-[100px] rotate-12 translate-x-20" />
        </div>
      </header>

      {/* Quick Actions */}
      <section className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickActions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col items-center gap-3 hover:border-brand/40 hover:-translate-y-0.5 transition-all"
            >
              <div className="size-12 bg-brand-soft rounded-full flex items-center justify-center text-xl">
                {a.emoji}
              </div>
              <span className="font-semibold">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Ecosystem Feed */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <h2 className="text-3xl font-bold">Acontecendo agora no bairro</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium">
              Recentes
            </button>
            <button className="px-4 py-2 bg-brand text-primary-foreground rounded-lg text-sm font-medium">
              Perto de mim
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Business Card */}
          <article className="bg-card rounded-3xl overflow-hidden border border-border group cursor-pointer">
            <div className="w-full aspect-[4/3] overflow-hidden">
              <img
                src={butcherImg}
                alt="Açougue Corte Real Paraisópolis"
                width={800}
                height={608}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-brand">
                  Açougue
                </span>
                <span className="flex items-center gap-1 text-sm font-bold">⭐ 4.9</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Corte Real Paraisópolis</h3>
              <p className="text-muted-foreground text-sm mb-4">
                As melhores carnes com preço de comunidade. Entrega rápida na sua porta.
              </p>
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-success font-bold text-sm">Aberto agora</span>
                <span className="text-xs text-muted-foreground">500m de você</span>
              </div>
            </div>
          </article>

          {/* Freelance Card */}
          <article className="bg-card rounded-3xl overflow-hidden border border-border group cursor-pointer">
            <div className="w-full aspect-[4/3] overflow-hidden">
              <img
                src={electricianImg}
                alt="Eletricista oferecendo serviço"
                width={800}
                height={608}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-brand">
                  Freelancer
                </span>
                <span className="px-2 py-1 bg-brand-soft text-brand text-[10px] font-bold rounded">
                  URGENTE
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">Ajuda para mudança</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Preciso de 2 pessoas para ajudar a carregar móveis hoje às 14h.
                Pagamento na hora.
              </p>
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-foreground font-bold text-lg">R$ 80,00</span>
                <button className="px-4 py-2 bg-foreground text-background rounded-xl text-xs font-bold">
                  Candidatar
                </button>
              </div>
            </div>
          </article>

          {/* Job Vacancy Card */}
          <article className="bg-brand rounded-3xl p-1 shadow-brand">
            <div className="bg-card rounded-[20px] p-6 h-full flex flex-col">
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-brand">
                  Vaga de emprego
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Vendedor(a) de loja</h3>
              <p className="text-muted-foreground text-sm mb-6 flex-1">
                Loja de roupas "Vibe Local" está contratando. Requisito: morar no bairro
                e ter boa comunicação.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="size-2 bg-brand rounded-full" />
                  <span>R$ 1.450 + comissão</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="size-2 bg-brand rounded-full" />
                  <span>Segunda a sábado</span>
                </div>
              </div>
              <button className="w-full py-4 bg-brand text-primary-foreground rounded-2xl font-bold shadow-brand">
                Enviar currículo
              </button>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
