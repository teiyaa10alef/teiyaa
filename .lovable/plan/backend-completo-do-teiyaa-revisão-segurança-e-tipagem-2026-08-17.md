# Backend completo do Teiyaa — revisão, segurança e tipagem

O backend do Teiyaa já está ativo e funcionando (banco, login, arquivos e chat em tempo real). O que falta não é "ligar o backend", e sim fechar as lacunas de segurança, tipagem e alguns recursos que ainda não existem. Abaixo o que foi verificado e o que será feito.

## O que já está OK (verificado agora)

- Banco respondendo normalmente (não está mais pausado).
- Varredura de segurança automática: nenhum alerta aberto.
- Tipos do banco (37 tabelas + views + funções) estão gerados e atualizados.
- Anúncios em rascunho não vazam: vagas, imóveis, candidaturas, mensagens e notificações não retornam nada para visitante anônimo.

## 1. Corrigir vazamento de telefone no perfil público

A tabela de perfis é lida por qualquer visitante (necessário, para mostrar nome e foto em anúncios), mas hoje ela devolve **todas** as colunas — incluindo telefone e WhatsApp pessoais. Hoje esses campos estão vazios, então nada vazou ainda, mas basta um morador preencher.

Correção: criar uma visão pública com apenas `user_id`, nome, foto, bio e as marcações profissional/negócio; restringir a leitura anônima da tabela base a essas colunas; telefone e WhatsApp passam a ser lidos só pelo próprio dono. Ajustar as telas que mostram perfil de terceiros para usar a visão pública.

## 2. Remover o `as any` das APIs (tipagem real)

Nove arquivos de API (`account`, `business`, `candidate`, `gigs`, `jobs`, `listings`, `market`, `professional`, `properties`) desligam a checagem de tipos com um atalho, o que faz erros de coluna só aparecerem em produção.

Correção: usar o cliente tipado de verdade em todos eles, mantendo os tipos locais só onde houver views/funções, e conferir campo a campo contra o schema real. Onde houver divergência (coluna renomeada, campo que não existe mais), corrigir o código.

## 3. Revisão de permissões (RLS) área por área

Passar por cada domínio confirmando as quatro operações (ler, criar, editar, apagar):

- Negócios, profissionais, imóveis, marketplace, bicos e vagas: dono edita/apaga o próprio; público só vê publicado.
- Candidaturas e currículos: só o candidato e o dono da vaga.
- Conversas e mensagens: só os dois participantes (regra do bico pré-selecionado já existe e será mantida).
- Avaliações: um voto por usuário, sem editar avaliação alheia.
- Confirmar que toda tabela tem permissões de acesso explícitas concedidas.

Qualquer brecha encontrada vira uma migração de correção.

## 4. Reforços de conta

- Ativar a checagem de senhas vazadas no cadastro (bloqueia senhas já expostas em vazamentos conhecidos).
- Garantir criação automática de perfil no cadastro (incluindo login por telefone).
- Página de recuperação de senha em `/redefinir-senha`, hoje inexistente.

## 5. Novos recursos de backend

- **E-mails transacionais**: aviso de nova candidatura, nova mensagem e novo interessado no anúncio.
- **Busca unificada**: uma busca só que atravessa comércios, profissionais, imóveis, bicos, vagas e marketplace, com índice de texto no banco (acentos e plurais tratados).
- **Limites anti-spam**: teto de anúncios/candidaturas por usuário por dia, validado no servidor.

## Detalhes técnicos

- Migrações: view `public_profiles` com `security_invoker=on`; política de SELECT anônimo restrita; auditoria de policies por tabela; índices GIN `pg_trgm`/`tsvector` para a busca; tabela `rate_limits` + função `check_rate_limit`.
- Tipagem: trocar `const db = supabase as any` pelo cliente `Database`-tipado; usar `.returns<T>()` nas queries com join para não estourar o typecheck.
- E-mails: server function chamada nos pontos de mutação, com provedor a definir (Resend) — precisará de uma chave de API.
- Busca: server function pública (chave publicável, sem service role) consultando as views agregadas existentes.
- Auth: `configure_auth` com `password_hibp_enabled`, rota pública `/redefinir-senha` com `updateUser`.

## Ordem sugerida

1 → 3 → 2 → 4 → 5. Segurança primeiro, tipagem depois (ela depende do schema final), recursos novos por último.

## Uma decisão pendente

O envio de e-mails exige uma chave de um serviço externo (Resend). Se preferir, faço tudo menos os e-mails agora e deixamos isso para depois.
