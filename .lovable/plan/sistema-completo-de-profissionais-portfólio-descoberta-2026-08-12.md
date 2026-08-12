# Sistema completo de profissionais (portfólio + descoberta)

Hoje o profissional tem apenas um cadastro simples em `/conta/profissional` (profissão, bio, contatos, serviços e portfólio básico) e a aba **Profissionais** do bairro ainda lista da tabela genérica `listings`. A ideia é levar essa área ao mesmo nível do sistema de comércios: portfólio rico, credibilidade (avaliações) e um feed de busca de verdade.

---

## 1. Banco de dados (uma migration)

**`professional_reviews`** — avaliações de clientes
- `professional_id`, `user_id`, `rating` (1–5), `comment`
- 1 avaliação por pessoa por profissional; o próprio não se avalia
- Leitura pública quando o perfil está publicado; escrever/editar só o autor

**`professional_leads`** — pedidos de orçamento pelo site
- `professional_id`, `requester_id`, `description`, `budget_cents` (opcional), `contact_whatsapp`, `status` (novo / respondido / fechado)
- Só o profissional e quem pediu enxergam

**Ajustes em `professional_profiles`**
- `view_count`, `whatsapp_click_count` (contadores via função no banco)
- `specialties` (lista de tags, ex.: "instalação elétrica", "quadro de luz")
- `service_area_km` e `is_published` já existem
- Índices por `community_id`, `profession`, `is_published`

**Ajustes em `portfolio_items`**
- `title` e `cover` (item de destaque) para cada trabalho, além do `caption`

Tudo com RLS + GRANTs (leitura pública apenas do que está publicado).

---

## 2. Fluxo de quem oferece serviço

**Cadastro em etapas** (`/conta/profissional`, reescrito como wizard com progresso, igual ao de comércios):
1. Quem é você — profissão, categoria, bairro, anos de experiência
2. Sobre e especialidades — headline, descrição, tags de especialidade
3. Contato e área de atendimento — WhatsApp, telefone, Instagram, raio em km
4. Fotos — avatar e capa
5. Serviços e preços — título, descrição, preço "a partir de" e unidade (hora/dia/serviço)
6. Portfólio — upload múltiplo de fotos/vídeos com título e legenda, reordenável
7. Revisão e **Publicar**

**Painel do profissional** em abas: Visão geral (visualizações, cliques no WhatsApp, nota média, nº de avaliações, pedidos recebidos), Perfil, Serviços, Portfólio, **Pedidos de orçamento**, **Avaliações**. Checklist de "perfil completo" (foto, 3+ trabalhos no portfólio, 1+ serviço, WhatsApp) e botão publicar/despublicar.

---

## 3. Fluxo de quem procura

**Aba Profissionais do bairro** (`/c/$slug?cat=servico`, e city/state) passa a listar `professional_profiles` publicados:
- Busca por profissão, especialidade ou nome
- Chips de profissão (Pedreiro, Pintor, Eletricista, Encanador, Diarista, Montador, Marceneiro, Ar-condicionado, Jardinagem, Frete, Outros)
- Filtros: "Melhor avaliados", "Com portfólio", "Atende meu bairro"
- Card: foto, nome/profissão, especialidades, nota em estrelas, prévia de 3 fotos do portfólio, preço a partir de, botão WhatsApp e "Pedir orçamento"

**Página pública `/profissionais/perfil/$userId`** ganha:
- Galeria de portfólio em grade com lightbox (imagem e vídeo)
- Tabela de serviços com preços
- Avaliações com nota média + formulário (exige login)
- Formulário "Pedir orçamento" (cria um lead) e botão de WhatsApp com contador
- Área de atendimento e horário de contato
- Metadados de compartilhamento próprios + JSON-LD `LocalBusiness`/`Person`

---

## 4. Detalhes técnicos

- `src/lib/professional-api.ts` espelhando `business-api.ts`: listagem por escopo com filtros/busca, agregados de nota, portfólio, leads e contadores.
- `ListingsFeed` delega para `ProfessionalFeed` quando `cat=servico` (como já faz com `BusinessFeed`).
- Componentes novos: `ProfessionalCard`, `ProfessionalFeed`, `ProfessionalFilters`, `PortfolioGallery` (com lightbox), `ReviewList`/`ReviewForm` reaproveitados, `QuoteRequestForm`, `ProfessionalWizard`.
- Contadores por função no banco (sem expor update).
- Uploads pelo `uploadMedia` existente; múltiplos arquivos por vez no portfólio.
- Somente tokens de design atuais, mobile-first, no mesmo padrão visual dos comércios.

---

## Ordem de execução

1. Migration (avaliações, leads, contadores, especialidades, campos de portfólio, RLS + GRANTs)
2. `professional-api.ts`
3. Wizard de cadastro + painel com abas e checklist
4. Feed de profissionais substituindo `listings` em `cat=servico`
5. Página pública enriquecida (portfólio, avaliações, orçamento, SEO)
