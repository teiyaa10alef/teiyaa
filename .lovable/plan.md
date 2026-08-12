# Sistema completo de comércios (anunciar + descobrir)

Hoje já existem as tabelas `businesses`, `business_hours`, `business_services`, `business_media`, o admin em `/conta/negocios` e a página pública `/negocios/$slug`. Porém a aba **Comércios** do bairro ainda busca da tabela genérica `listings`, o `/anunciar` é uma página "em construção", e não existem avaliações, promoções nem favoritos.

O objetivo é fechar o ciclo: quem anuncia tem um fluxo guiado e um painel com resultado; quem busca encontra rápido, filtra e confia.

---

## 1. Banco de dados (uma migration)

**`business_reviews`** — avaliações
- `business_id`, `user_id`, `rating` (1–5), `comment`, `created_at`
- 1 avaliação por pessoa por comércio; o dono não avalia o próprio
- Leitura pública; escrita/edição só do autor

**`business_promotions`** — promoções e cupons
- `business_id`, `title`, `description`, `discount_label` (ex.: "20% OFF"), `starts_at`, `ends_at`, `is_active`
- Leitura pública quando o comércio está publicado e a promoção está vigente; CRUD só do dono
- Validação de datas por trigger (não por CHECK)

**`business_favorites`** — salvos
- `user_id`, `business_id`, único por par; só o próprio usuário lê e escreve

**Ajustes em `businesses`**
- `view_count` e `whatsapp_click_count` (contadores simples para o painel do dono)
- Índices por `community_id`, `category`, `is_published`
- Função de busca por nome/descrição/serviços

Todas com GRANTs corretos (`anon` só para leitura pública, `authenticated` para o resto) e RLS.

---

## 2. Fluxo de quem anuncia

**`/anunciar`** deixa de ser placeholder e vira a porta de entrada: explica os benefícios e leva para "Cadastrar meu comércio" (ou login, se não logado).

**Cadastro em etapas** (`/conta/negocios/novo`), com barra de progresso e possibilidade de sair e voltar:
1. Identidade — nome, categoria, bairro, descrição curta
2. Contato e endereço — WhatsApp, telefone, Instagram, endereço
3. Visual — logo e capa
4. Horários — grade dos 7 dias com atalhos ("copiar para todos", "fechado")
5. Serviços/produtos — lista com preço opcional
6. Revisão e **Publicar** — publica na hora, sem moderação

**Painel do comércio** (`/conta/negocios/$businessId`) em abas: Visão geral (visualizações, cliques no WhatsApp, nota média, nº de avaliações), Informações, Horários, Serviços, Galeria, **Promoções**, **Avaliações** (ler e responder não entra agora; só visualizar). Botão de publicar/despublicar sempre visível, além de indicador de "perfil completo" (checklist do que falta: logo, horários, ao menos 1 serviço, WhatsApp).

---

## 3. Fluxo de quem busca

**Aba Comércios do bairro** (`/c/$slug?cat=comercio`, e equivalentes de cidade/estado) passa a listar `businesses` publicados em vez de `listings`:
- Barra de busca por nome/serviço
- Chips de subcategoria (Alimentação, Beleza, Mercado, Saúde, Moda, Serviços, Outros)
- Filtros rápidos: "Abertos agora", "Com promoção", "Melhor avaliados"
- Card do comércio: logo, nome, categoria, nota (estrelas + nº), selo "Aberto agora", selo de promoção, botão WhatsApp direto e ícone de favoritar

**Página pública `/negocios/$slug`** ganha:
- Nota média e lista de avaliações + formulário para avaliar (exige login)
- Bloco de promoções vigentes
- Botão de favoritar
- Contadores de visualização e clique no WhatsApp
- Metadados de compartilhamento com nome, descrição e imagem do comércio; JSON-LD `LocalBusiness` com horários e nota

**`/conta/salvos`** — lista dos comércios favoritados.

---

## 4. Detalhes técnicos

- `src/lib/business-api.ts`: queries de listagem com filtros/busca, agregados de nota, promoções, favoritos e contadores (leitura pública via client do browser, protegida por RLS).
- `src/lib/business-hours.ts`: lógica de "aberto agora" reaproveitada por card e página (hoje está inline em `negocios.$slug.tsx`).
- Novos componentes: `BusinessCard`, `BusinessFilters`, `RatingStars`, `ReviewList`/`ReviewForm`, `PromotionBadge`, `FavoriteButton`, `HoursGrid`, `BusinessWizard`.
- `ListingsFeed` passa a delegar para o feed de comércios quando `cat=comercio`; as outras categorias continuam em `listings`.
- Contadores incrementados por função no banco (evita corrida e não exige expor update).
- Somente tokens de design existentes; layout mobile-first, seguindo o padrão atual do app.

---

## Ordem de execução

1. Migration (avaliações, promoções, favoritos, contadores, índices, RLS + GRANTs)
2. `business-api.ts` + utilitários de horário
3. Wizard de cadastro + painel do dono com abas e checklist
4. Feed de comércios (busca, filtros, cards) substituindo `listings` em `cat=comercio`
5. Página pública enriquecida (avaliações, promoções, favoritar, SEO)
6. `/anunciar` reformulado e `/conta/salvos`
