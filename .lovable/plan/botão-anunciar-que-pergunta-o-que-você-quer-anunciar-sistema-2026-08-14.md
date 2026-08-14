# Botão "Anunciar" que pergunta o que você quer anunciar (+ sistema de vagas)

Hoje o botão laranja "Anunciar" leva direto para uma página de venda focada só em comércio ("Coloque seu negócio no mapa da comunidade"). Quem quer anunciar um imóvel ou uma vaga cai no lugar errado.

A página `/anunciar` passa a ser uma central de escolha: primeiro o usuário diz **o que** quer anunciar, e só depois entra no formulário certo.

## 1. Nova página /anunciar

Título direto: "O que você quer anunciar?" — seis cartões, cada um com ícone e cor da categoria:

| Opção | Vai para |
| --- | --- |
| Comércio (padaria, salão, mercado…) | cadastro de comércio |
| Serviço profissional (pedreiro, eletricista…) | perfil profissional |
| Imóvel (aluguel ou venda) | anunciar imóvel |
| Bico / freelance (preciso de ajuda) | publicar bico |
| Vaga de emprego | publicar vaga (novo) |
| Item no marketplace (usado ou novo) | anunciar item |

Detalhes:
- Cada cartão traz uma linha explicando quando usar, para não haver confusão entre "serviço profissional" e "bico".
- Sem login, o clique leva ao login e volta para o formulário escolhido depois.
- Abaixo dos cartões, uma faixa curta com os benefícios (grátis, edita quando quiser, contato direto) e atalho para "Meus anúncios".
- Os textos e cartões de venda de comércio saem daqui e ficam no próprio fluxo de comércio.

## 2. Sistema de vagas de emprego (novo)

Hoje vagas só existem como anúncio genérico, sem formulário nem candidatura. Passa a ser um módulo completo, no mesmo padrão dos bicos:

**Publicar vaga** (`/vagas/nova`) — formulário em etapas:
1. Cargo, área e descrição
2. Tipo (CLT, PJ, temporário, meio período, estágio), presencial/remoto, salário (ou "a combinar")
3. Requisitos, benefícios e bairro/comunidade
4. Contato e revisão → publicar

**Ver vagas** — a aba Vagas do bairro passa a listar vagas de verdade, com busca por cargo, filtros por tipo de contrato e "com salário informado". Página da vaga com descrição, requisitos, benefícios, empresa/anunciante e botão "Candidatar-se".

**Candidatura** — o morador se candidata com uma mensagem curta; o anunciante recebe notificação, vê a lista de candidatos em `/conta/vagas/$vagaId` e pode marcar como pré-selecionado, aceito ou recusado. Igual aos bicos, a conversa por chat só abre depois de pré-selecionado ou aceito. O candidato acompanha tudo em "Minhas candidaturas".

**Encerrar** — o anunciante pode pausar ou encerrar a vaga quando preencher.

## Detalhes técnicos

- Banco (uma migration): tabelas `jobs` e `job_applications` com RLS + GRANTs, enums de tipo de contrato/modalidade/status, contador de candidaturas por trigger, notificações reaproveitando `push_notification`, e trigger que impede candidatura no próprio anúncio. Chat de vaga reaproveita o padrão de `gig_conversations` com função `can_job_applicant_chat`.
- `src/lib/jobs-api.ts` seguindo o formato de `gigs-api.ts` (queries por escopo bairro/cidade/estado, filtros, candidaturas, mudança de status).
- Novos componentes `JobCard` / `JobFeed`; `ListingsFeed` passa a usar `JobFeed` quando `cat=vaga`.
- Rotas: `/anunciar` (reescrita), `/vagas` (feed), `/vagas/$jobId`, `/vagas/nova`, `/conta/vagas`, `/conta/vagas/$jobId`, e "Minhas candidaturas" ganha aba de vagas.
- Guarda de perfil completo (nome + foto) antes de publicar, igual aos outros fluxos.
- Só tokens de design existentes, mobile-first, com `head()` próprio em cada rota nova.

## Ordem de execução

1. Migration de vagas
2. `jobs-api.ts` + feed/cards e substituição em `cat=vaga`
3. Formulário de vaga, página pública e candidaturas
4. Painel do anunciante e minhas candidaturas
5. Nova página `/anunciar` com as seis opções
