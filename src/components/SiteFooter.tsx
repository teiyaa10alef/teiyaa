export function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-white py-8 md:py-10 mt-12 md:mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
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
