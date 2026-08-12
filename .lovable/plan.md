# Sistema de freelances (bicos) completo

Hoje a aba **Freelances** do bairro lista da tabela genérica `listings`, sem candidatura, sem conversa e sem controle do anunciante. A ideia é transformar em um sistema próprio: quem precisa publica o bico com valor, data e local; os vizinhos se candidatam (podendo propor outro valor); o anunciante compara, conversa pelo chat interno, escolhe alguém e, no fim, os dois se avaliam.

Decisões já definidas: o anunciante define um valor e o candidato pode propor outro (pagamento acertado fora do app); a conversa acontece no chat interno, igual ao marketplace.

---

## 1. Banco de dados (uma migration)

**`gigs`** — o bico anunciado
- `owner_id`, `community_id`, `title`, `description`, `category` (limpeza, mudança/carreto, montagem, pintura, jardinagem, entregas, eventos, cuidados, tecnologia, outros)
- Pagamento: `budget_cents`, `budget_type` (valor fechado / por hora / a combinar), `is_negotiable`
- Quando e onde: `scheduled_date`, `scheduled_time`, `duration_hours` (estimativa), `address_hint` (referência, sem endereço exato público), `is_urgent`
- Requisitos: `requirements` (lista de tags: "tem carro", "leva ferramentas", "força física"...)
- `images` (fotos do serviço, ex.: a geladeira a ser levada)
- `status`: aberto / em andamento / concluído / cancelado
- `applications_count`, `view_count`
- `assigned_user_id` (quem foi escolhido)

**`gig_applications`** — candidaturas
- `gig_id`, `applicant_id`, `message`, `proposed_cents` (opcional — a contraproposta), `available_at` (disponibilidade)
- `status`: enviada / vista / pré-selecionada / aceita / recusada / retirada
- 1 candidatura por pessoa por bico; o dono não se candidata
- Visível só para o dono do bico e para o próprio candidato

**`gig_conversations` + `gig_messages`** — chat interno espelhando o do marketplace
- Conversa criada quando o anunciante responde a uma candidatura
- Mensagens em tempo real, com `read_at`, aparecendo na mesma caixa `/mensagens`

**`gig_reviews`** — avaliação mútua ao concluir
- `gig_id`, `reviewer_id`, `reviewee_id`, `role` (contratante / freelancer), `rating`, `comment`
- Alimenta a reputação exibida no card do candidato

Tudo com RLS + GRANTs: bicos abertos são públicos; candidaturas, conversas e mensagens só para os envolvidos. Contadores por função no banco.

---

## 2. Fluxo de quem publica o bico

**`/freelances/novo`** — formulário em etapas, curto e direto:
1. O que precisa — título, categoria, descrição, fotos
2. Quando — data, horário, duração estimada, marcar "urgente"
3. Onde — bairro e ponto de referência
4. Quanto paga — valor, tipo (fechado / por hora / a combinar), aceitar propostas
5. Requisitos e publicar

**`/conta/freelances`** — painel do anunciante:
- Lista dos bicos com status e nº de candidaturas ("3 novas")
- Tela do bico com as candidaturas em cards comparáveis: foto, nome, bairro, nota média, bicos concluídos, valor proposto, disponibilidade, mensagem, link para o perfil profissional (se tiver)
- Ações: pré-selecionar (estrela), conversar (abre o chat), aceitar, recusar
- Ao aceitar: o bico vira "em andamento", os demais recebem recusa automática, e libera o botão "Marcar como concluído" → avaliação

## 3. Fluxo de quem se candidata

**Feed de freelances** (`/c/$slug?cat=freelance`, e cidade/estado) passa a listar `gigs`:
- Busca, chips de categoria, filtros: "Urgentes", "Pagam mais", "Hoje/Esta semana", "Perto de mim"
- Card: título, selo de urgente, valor em destaque, data/horário, bairro, nº de candidatos, tempo desde a publicação

**Página do bico `/freelances/$gigId`**:
- Detalhes completos, fotos, requisitos, mapa/referência, perfil de quem publicou (com nota)
- Botão **"Quero fazer"** → mensagem, valor proposto (se aceitar propostas) e disponibilidade
- Depois de enviado: mostra o status da candidatura e o acesso ao chat

**`/conta/candidaturas`** — minhas candidaturas com status, valor proposto e atalho para a conversa.

## 4. Notificações e comunicação

- Badge de "novas candidaturas" no painel e no menu da conta
- Chat interno unificado: conversas de marketplace e de freelance na mesma caixa `/mensagens`, com etiqueta indicando a origem
- Estados claros por candidatura (enviada, vista, pré-selecionada, aceita, recusada)

---

## Detalhes técnicos

- `src/lib/gigs-api.ts` no padrão de `business-api.ts` / `market-api.ts`: listagem por escopo com filtros, candidaturas, chat e avaliações.
- `ListingsFeed` delega para `GigFeed` quando `cat=freelance` (como já faz com comércios e profissionais).
- Componentes novos: `GigCard`, `GigFeed`, `GigFilters`, `ApplicationCard`, `ApplyForm`, `GigWizard`, `GigReviewForm`.
- Chat reaproveita a UI de `mensagens.$conversationId` com uma camada de origem (market/gig) para as duas fontes.
- Rotas do dono ficam sob a área de conta já existente; contadores por função no banco.
- Mobile-first, apenas tokens de design atuais, mesmo padrão visual de comércios e profissionais.

## Ordem de execução

1. Migration (gigs, candidaturas, chat, avaliações, RLS + GRANTs, contadores)
2. `gigs-api.ts`
3. Feed + página pública do bico + candidatura
4. Painel do anunciante com comparação de candidatos e chat
5. Conclusão, avaliação mútua e reputação nos cards
