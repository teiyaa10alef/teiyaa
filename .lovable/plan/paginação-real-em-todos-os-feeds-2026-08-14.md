# Paginação real em todos os feeds

Hoje cada feed (imóveis, comércios, profissionais, freelances, vagas, marketplace, anúncios gerais) baixa até 50–60 registros de uma vez e faz busca, filtro e ordenação no navegador. Com muitos anúncios isso fica lento, gasta dados do celular e vira uma rolagem sem fim.

## Como vai funcionar para o usuário

- Cada área carrega **12 anúncios por vez**.
- No fim da lista aparece um botão **"Ver mais anúncios"** (com contador: "Mostrando 12 de 137"). Nada de rolagem infinita automática.
- Busca, filtros e ordenação passam a ser aplicados no servidor: o resultado é sempre o correto do bairro/cidade/estado inteiro, não só dos primeiros 60 que tinham sido baixados.
- Ao voltar de um anúncio para a lista, a posição e as páginas já carregadas são mantidas.
- Estados claros: esqueleto de carregamento, "carregando mais…" no botão e mensagem de "nenhum anúncio encontrado" com sugestão de limpar filtros.

## Áreas cobertas

Imóveis, Comércios, Profissionais, Freelances/Bicos, Vagas, Marketplace e o feed de anúncios da categoria — todos com o mesmo comportamento e visual.

## Detalhes técnicos

1. **Camada de dados**: em `properties-api`, `business-api`, `professional-api`, `gigs-api`, `jobs-api`, `market-api` e `listings-api`, trocar as funções `...ByScopeQuery(scope)` por `infiniteQueryOptions` que aceitam `{ scope, filters, sort }` e usam `.range(from, to)` com `PAGE_SIZE = 12` e `{ count: "exact" }` para o total.
2. **Filtros no servidor**: termo de busca via `ilike`/`or` nas colunas de título/descrição, filtros de categoria, faixa de preço, quartos, tipo de contrato etc. via `eq`/`gte`/`lte`, e ordenação via `.order()` (recentes, menor/maior preço, salário). Ordenação secundária por `id` para paginação estável.
3. **Hook compartilhado** `src/hooks/use-paged-feed.ts` envolvendo `useInfiniteQuery`, expondo `items`, `total`, `hasNextPage`, `isFetchingNextPage` e `loadMore`.
4. **Componente compartilhado** `src/components/FeedPagination.tsx` com o contador e o botão "Ver mais anúncios" (touch-friendly, altura mínima 44px, cores do tema laranja).
5. **Feeds**: `PropertyFeed`, `BusinessFeed`, `ProfessionalFeed`, `GigFeed`, `JobFeed`, `ListingsFeed` e o feed do marketplace passam a mandar os filtros para o hook (com debounce de ~300ms na busca) em vez de filtrar arrays em memória; os `useSuspenseQuery` viram o hook paginado com esqueleto.
6. **Índices no banco**: migração criando índices em `(community_id, created_at desc)` para as tabelas de anúncios, para manter as consultas rápidas em escala.
7. **Estado ao voltar**: manter o cache das páginas por chave de filtro (`gcTime` maior) para restaurar a lista ao voltar do detalhe.
