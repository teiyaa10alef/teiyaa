## Objetivo
Deixar o teiyaa totalmente responsivo e confortável de usar em telas pequenas (≤390px), sem alterar funcionalidades.

## Problemas observados no mobile
- Header com nav desktop oculto mas sem menu hambúrguer — usuário não consegue navegar.
- Hero com `text-5xl` + paddings grandes, busca em linha (input + botão) estoura largura.
- Quick Actions em `grid-cols-2` deixam "Bicos" sozinho; cartões com padding grande.
- Feed em coluna única funciona, mas títulos `text-3xl`/`text-2xl` e paddings precisam encolher.
- Footer usa `grid md:grid-cols-2` ok, mas stats em flex podem quebrar; CTA com paddings grandes.
- CategoryPage com `text-6xl` no h1 estoura no mobile.
- Falta `<meta viewport>` confirmado no `__root.tsx` (verificar) e tap targets ≥44px.

## Mudanças por arquivo

**src/components/SiteHeader.tsx**
- Adicionar botão hambúrguer (lucide `Menu`/`X`) visível em `md:hidden`.
- Usar Sheet (já disponível) para drawer com os links de navegação no mobile.
- Reduzir altura do header para `h-16 md:h-20` e logo `text-2xl md:text-3xl`.

**src/routes/index.tsx**
- Hero: `py-12 md:py-20`, `px-4 md:px-6`, h1 `text-4xl md:text-6xl`, parágrafo `text-base md:text-xl`.
- Formulário de busca: empilhar no mobile (`flex-col md:flex-row`), botão full-width.
- Quick Actions: `grid-cols-3 md:grid-cols-5` (5 itens cabem melhor 3+2), padding `p-4 md:p-6`, ícone `size-10 md:size-12`, label `text-xs md:text-base`.
- Feed: títulos `text-2xl md:text-3xl`, cards com `p-4 md:p-6`, tamanhos de texto reduzidos no mobile, gap `gap-5 md:gap-8`.
- Header das ações (Recentes/Perto de mim): garantir wrap suave.

**src/components/CategoryPage.tsx**
- h1 `text-3xl md:text-6xl`, paddings `px-4 md:px-6 pt-12 md:pt-20`.
- Card interno `p-6 md:p-12`, grid bullets `grid-cols-1 md:grid-cols-2`.
- Botões CTA com `w-full sm:w-auto`.

**src/components/SiteFooter.tsx**
- `py-12 md:py-16`, `px-4 md:px-6`, h2 `text-2xl md:text-4xl`.
- Stats: `flex-wrap gap-3` e cards `flex-1 min-w-[110px]`.
- Form CTA padding reduzido no mobile.
- Rodapé inferior: já é `flex-col md:flex-row`, confirmar.

**src/routes/__root.tsx**
- Confirmar meta viewport `width=device-width, initial-scale=1` (adicionar se faltando).

## Fora de escopo
- Backend, Lovable Cloud, novas funcionalidades, mudança de design/cores.
- Apenas ajustes responsivos com Tailwind nos componentes/rotas existentes.
