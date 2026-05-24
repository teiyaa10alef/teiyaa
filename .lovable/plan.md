## Objetivo
Criar uma estrutura geográfica hierárquica (Estado → Cidade → Bairro/Comunidade) onde cada anúncio (comércio, serviço, imóvel, freelance, vaga) pertence a UMA comunidade. O usuário escolhe uma comunidade como "casa" e vê o feed dela por padrão, mas pode expandir o escopo para Cidade ou Estado.

Começamos com **Paraisópolis (SP/SP)** como única comunidade ativa, mas a estrutura já suporta adicionar Heliópolis, Jardim São Luís, Capão Redondo, etc., sem refatorar.

## Modelo de dados (Lovable Cloud / Postgres)

```text
states (estados)
 └─ cities (cidades)
     └─ communities (bairros/comunidades) ← unidade central do feed
         └─ listings (anúncios de qualquer tipo)
```

**Tabelas:**

- `states` — id, code (ex: "SP"), name ("São Paulo"), slug ("sp")
- `cities` — id, state_id (FK), name, slug ("sao-paulo"), unique(state_id, slug)
- `communities` — id, city_id (FK), name ("Paraisópolis"), slug ("paraisopolis"), description, cover_image_url, is_active (bool — só ativas aparecem), unique(city_id, slug)
- `listings` — id, community_id (FK, **obrigatório**), category (enum: 'comercio' | 'servico' | 'imovel' | 'freelance' | 'vaga'), subcategory (texto livre por enquanto: "açougue", "barbearia", "eletricista"...), title, description, price_cents (nullable), contact_whatsapp, contact_phone, images (jsonb array de URLs), owner_id (FK auth.users), status ('active'|'paused'|'archived'), created_at, updated_at

**Por que `community_id` obrigatório em `listings`:** garante que TODO anúncio pertença a uma comunidade. Filtrar por cidade ou estado é só JOIN subindo a hierarquia. Sem dados órfãos, sem ambiguidade.

**Índices:** `listings(community_id, category, status, created_at desc)` — cobre o caso de uso principal (feed de uma comunidade filtrado por categoria, mais recentes primeiro).

**RLS:**
- `states`, `cities`, `communities`: SELECT público (qualquer um lê).
- `listings`: SELECT público de `status='active'`. INSERT/UPDATE/DELETE só pelo `owner_id` autenticado.

## Escopo de visualização (micro → macro)

URL é a fonte de verdade — ótimo para SEO e compartilhamento:

```text
/c/paraisopolis                       → feed da comunidade (micro, padrão)
/c/paraisopolis/comercios             → categoria dentro da comunidade
/cidade/sao-paulo                     → feed agregado da cidade (macro)
/cidade/sao-paulo/comercios           → categoria por cidade
/estado/sp                            → feed do estado inteiro
/estado/sp/comercios                  → categoria por estado
```

Um seletor de escopo no topo (chips: "Paraisópolis" • "São Paulo (cidade)" • "São Paulo (estado)") troca a URL. A comunidade escolhida fica salva em `localStorage` como "casa" do usuário e vira o destino padrão de `/`.

## Páginas e mudanças no app

**Novas rotas:**
- `src/routes/c.$communitySlug.tsx` — feed da comunidade + filtro por categoria via search param `?cat=comercios`
- `src/routes/c.$communitySlug.$category.tsx` — atalho SEO para categoria
- `src/routes/cidade.$citySlug.tsx` — feed agregado da cidade
- `src/routes/estado.$stateSlug.tsx` — feed agregado do estado
- `src/routes/anunciar.tsx` — formulário de criar anúncio (exige login; pré-seleciona comunidade do usuário)

**Rotas existentes que mudam:**
- `/` (index): se o usuário já escolheu uma comunidade, redireciona para `/c/{slug}`. Senão, mostra um onboarding curto: "Escolha sua comunidade" (lista comunidades ativas; hoje só Paraisópolis).
- `/comercios`, `/servicos`, `/imoveis`, `/freelances`, `/vagas`: viram redirects para `/c/{comunidadeAtual}/{categoria}` (mantém os links antigos funcionando).

**Componentes novos:**
- `CommunityScopeSwitcher` — chips para alternar entre Comunidade / Cidade / Estado
- `ListingCard` — card unificado de anúncio (usado em todos os feeds)
- `ListingsFeed` — lista paginada com filtro por categoria
- `useCurrentCommunity()` — hook que lê o slug da URL ou do localStorage

## Seed inicial

Migration semeia:
- 1 estado: São Paulo (SP)
- 1 cidade: São Paulo
- 1 comunidade ativa: Paraisópolis
- 4 comunidades **inativas** já cadastradas (Heliópolis, Jardim São Luís, Capão Redondo, Brasilândia) — aparecem em "Em breve" para validar demanda

## Fora de escopo (próximos passos, não agora)
- Autenticação real (login/cadastro) — virá quando ativarmos Lovable Cloud no próximo passo
- Upload de imagens de anúncios (storage)
- Busca textual / geolocalização real
- Avaliações, chat, favoritos
- Painel do anunciante

## O que preciso de você antes de implementar
1. Posso **ativar o Lovable Cloud agora** para criar essas tabelas e ter login real? (sem isso não dá pra cadastrar anúncios de verdade)
2. Confirma: comunidade escolhida pelo usuário é salva só no navegador (localStorage) por enquanto, e depois migra pro perfil quando ele logar? Ou prefere já exigir login no primeiro acesso?
