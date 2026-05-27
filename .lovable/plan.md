## Visão geral

Separar **comércios** e **serviços profissionais** do fluxo genérico de "listings". Criar dois sub-sistemas com perfis ricos e áreas de administração próprias, mantendo o feed atual da comunidade (que passa a exibir cards desses perfis também).

```text
profiles (já existe)
  ├── is_professional ──► professional_profiles ──► professional_services
  │                                              └─► portfolio_items (fotos/vídeos)
  └── is_business     ──► businesses ──► business_hours
                                       └─► business_services
                                       └─► business_media (logo, fotos)
```

Imóveis, freelances e vagas continuam usando `listings` (sem mudança agora).

---

## 1. Banco de dados (migration)

**`profiles`** — adicionar flags:
- `is_professional boolean default false`
- `is_business boolean default false`
- `bio text`

**`professional_profiles`** (1‑para‑1 com user):
- `user_id`, `community_id` (bairro principal), `headline`, `about`, `years_experience`, `service_area_km`, `whatsapp`, `phone`, `instagram`, `avatar_url`, `cover_url`, `is_published`

**`professional_services`** (N por profissional):
- `professional_id`, `title`, `description`, `price_from_cents`, `price_unit` (hora/serviço/diária)

**`portfolio_items`** (fotos e vídeos):
- `professional_id`, `media_url`, `media_type` (image/video), `caption`, `sort_order`

**`businesses`** (N por user — um dono pode ter mais de um comércio):
- `owner_id`, `community_id`, `name`, `slug`, `category` (alimentação, beleza, varejo, etc.), `description`, `logo_url`, `cover_url`, `address`, `lat`, `lng`, `whatsapp`, `phone`, `instagram`, `is_published`

**`business_hours`**:
- `business_id`, `weekday` (0–6), `opens_at time`, `closes_at time`, `is_closed boolean`

**`business_services`**:
- `business_id`, `title`, `description`, `price_cents`

**`business_media`**:
- `business_id`, `media_url`, `caption`, `sort_order`

**RLS:**
- Leitura pública apenas quando `is_published = true` (ou dono).
- Insert/update/delete apenas pelo dono (`auth.uid() = user_id` / `owner_id`).
- GRANTs apropriados (`anon` SELECT para perfis publicados, `authenticated` CRUD próprios).

**Storage bucket** `profiles-media` (público) para logos, capas, portfólio.

---

## 2. Rotas novas

```text
/profissionais/$communitySlug          lista de profissionais do bairro
/profissionais/perfil/$userId          perfil público do profissional
/negocios/$communitySlug               lista de comércios do bairro
/negocios/$slug                        página pública do comércio

/conta                                 hub do usuário (ativar perfis)
/conta/profissional                    admin do perfil profissional
/conta/profissional/portfolio          gerenciar fotos/vídeos
/conta/profissional/servicos           gerenciar serviços oferecidos
/conta/negocios                        lista dos meus comércios
/conta/negocios/novo                   criar comércio
/conta/negocios/$id                    editar comércio (info, horários, serviços, mídia)
```

As páginas `/c/$communitySlug` com `cat=comercio` e `cat=servico` passam a buscar de `businesses` / `professional_profiles` em vez de `listings`.

---

## 3. UI

- **Hub `/conta`**: dois toggles — "Sou profissional" e "Tenho um negócio". Ativar abre o admin correspondente.
- **Admin profissional**: formulário em abas (Sobre, Serviços, Portfólio, Contato). Upload múltiplo para portfólio.
- **Admin negócio**: formulário (Identidade, Endereço, Horários grid 7 dias, Serviços, Galeria, Contato). Suporte a múltiplos comércios por dono.
- **Perfil público profissional**: cover + avatar + headline + bio + serviços + grid portfólio + botão WhatsApp.
- **Página pública do comércio**: logo + cover + horários (com status "Aberto agora"), serviços, galeria, mapa estático opcional, contatos.

Tudo usando design tokens existentes (sem cores hard‑coded).

---

## 4. Server functions

`src/lib/professional.functions.ts` e `src/lib/business.functions.ts` com:
- `upsertProfessionalProfile`, `listProfessionalServices`, `addPortfolioItem`, `deletePortfolioItem`
- `createBusiness`, `updateBusiness`, `upsertBusinessHours`, `addBusinessMedia`, etc.

Leitura pública (listagens e perfil) usa `supabase` browser client direto (RLS faz o filtro `is_published`).

---

## 5. Header

Adicionar no menu (quando logado): "Minha conta" → dropdown com Profissional / Meus negócios.

---

## Ordem de execução

1. Migration (tabelas + RLS + bucket).
2. Server functions + queries.
3. Hub `/conta` + páginas de admin.
4. Páginas públicas (lista + perfil + comércio).
5. Integrar no feed do bairro (substituir `comercio`/`servico` por dados novos).
6. Atualizar header.

---

## Pergunta antes de seguir

Antes de criar a migration: confirma que **um usuário pode ter vários comércios** (ex.: dono de 2 lojas) mas **só um perfil profissional**? E os perfis devem entrar **automaticamente publicados** ou ficar como rascunho até o usuário clicar "Publicar"?
