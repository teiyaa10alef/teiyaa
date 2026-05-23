export function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-white py-12 md:py-16 mt-16 md:mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
        <div>
          <h2 className="text-2xl md:text-4xl font-bold mb-5 md:mb-6 leading-tight">
            Faça parte do ecossistema teiyaa.
          </h2>
          <p className="text-slate-400 text-base md:text-lg mb-6 md:mb-8">
            Seja você um morador, comerciante ou prestador de serviço, nosso objetivo é
            crescer juntos.
          </p>
          <div className="flex flex-wrap gap-3 md:gap-4">
            <div className="flex-1 min-w-[100px] bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-brand font-bold text-xl md:text-2xl">1.2k+</div>
              <div className="text-xs text-slate-500">Comércios ativos</div>
            </div>
            <div className="flex-1 min-w-[100px] bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-brand font-bold text-xl md:text-2xl">450+</div>
              <div className="text-xs text-slate-500">Vagas preenchidas</div>
            </div>
            <div className="flex-1 min-w-[100px] bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-brand font-bold text-xl md:text-2xl">15</div>
              <div className="text-xs text-slate-500">Bairros conectados</div>
            </div>
          </div>
        </div>
        <div className="bg-white/5 p-6 md:p-8 rounded-3xl border border-white/10">
          <h4 className="text-lg md:text-xl font-bold mb-4 text-center">Cadastre seu negócio</h4>
          <div className="space-y-3 md:space-y-4">
            <input
              type="text"
              placeholder="Nome do comércio"
              className="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-brand placeholder:text-slate-400"
            />
            <input
              type="email"
              placeholder="E-mail de contato"
              className="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-brand placeholder:text-slate-400"
            />
            <button className="w-full py-3 md:py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-brand hover:text-white transition-all">
              Começar gratuitamente
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-10 md:mt-16 pt-6 md:pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
        <div className="font-bold text-white text-xl tracking-tighter">teiyaa</div>
        <p className="text-center">© 2024 Teiyaa — O bairro todo em um só lugar.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacidade</a>
          <a href="#" className="hover:text-white transition-colors">Termos</a>
          <a href="#" className="hover:text-white transition-colors">Contato</a>
        </div>
      </div>
    </footer>
  );
}
