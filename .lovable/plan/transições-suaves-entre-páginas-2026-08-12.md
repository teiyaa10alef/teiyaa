# Transições suaves entre páginas

Hoje, ao clicar em qualquer botão, a tela fica branca porque as páginas carregam dados sem nenhum estado visual de espera. A ideia é trocar esse "branco" por uma transição leve e bonita, e fazer o site parecer mais rápido.

## O que muda para o usuário

- Ao clicar em um link, uma barra fininha laranja de progresso aparece no topo.
- O conteúdo antigo continua visível por um instante e o novo entra com um fade + leve deslize (~180ms), sem piscar branco.
- Quando a espera é maior, aparecem "esqueletos" (blocos cinza no formato dos cards) em vez de tela vazia.
- Links passam a pré-carregar os dados ao passar o mouse/tocar, então muitas navegações ficam instantâneas.
- Respeita "reduzir movimento" do sistema para quem prefere sem animação.

## Como será feito (técnico)

1. `src/router.tsx`
   - `defaultPreload: "intent"` + `defaultPreloadDelay: 50` para pré-carregar.
   - `defaultPendingComponent` (skeleton genérico), `defaultPendingMs: 150`, `defaultPendingMinMs: 250` para evitar flashes.
   - `defaultViewTransition: true` (usa View Transitions nativas quando disponíveis; custo zero em JS).

2. Novo `src/components/RouteProgress.tsx`
   - Usa `useRouterState({ select: s => s.status })` para mostrar uma barra de progresso laranja (CSS puro, sem biblioteca) durante navegações.
   - Montado uma vez em `__root.tsx`.

3. Novo `src/components/PageSkeletons.tsx`
   - `FeedSkeleton` (grade de cards), `DetailSkeleton` (banner + blocos) usando o `Skeleton` já existente.
   - Usados como `pendingComponent` nas rotas pesadas: `c.$communitySlug`, `cidade.$citySlug`, `estado.$stateSlug`, `negocios.$slug`, `profissionais.perfil.$userId`, `freelances.$gigId`, `mercado.$itemId`, `mensagens.*`, `conta.*`.

4. Animação de entrada
   - Em `src/styles.css`: keyframes `page-in` (opacity 0→1, translateY 6px→0, 180ms ease-out), classe utilitária `.page-enter`, e barra de progresso; tudo desativado dentro de `@media (prefers-reduced-motion: reduce)`.
   - Wrapper leve em `__root.tsx` aplicando a classe com `key` na rota atual, sem adicionar nenhuma biblioteca de animação.

5. Feeds com Suspense
   - Envolver os feeds (`ListingsFeed`, `BusinessFeed`, `ProfessionalFeed`, `GigFeed`) em `<Suspense fallback={<FeedSkeleton />}>` para que a troca de categoria também não deixe a área em branco.

Sem novas dependências; só CSS e APIs já disponíveis no roteador.
