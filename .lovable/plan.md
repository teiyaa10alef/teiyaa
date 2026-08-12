# Notificações e mensagens no topo

Adicionar dois botões no cabeçalho (visíveis quando logado, no desktop e no mobile):

1. **Mensagens** — ícone de balão com contador de mensagens não lidas (mercado + bicos), levando para `/mensagens`.
2. **Notificações** — ícone de sino com contador e um painel suspenso com as últimas atividades da conta.

## O que gera notificação

- **Mercado:** nova proposta no seu item, proposta aceita/recusada, nova conversa.
- **Bicos:** nova candidatura no seu bico, candidatura aceita/recusada, bico concluído.
- **Comércio:** nova avaliação recebida no seu negócio.
- **Profissional:** nova avaliação e novo pedido de orçamento (lead).
- **Mensagens:** nova mensagem recebida (mercado ou bico).

Cada item mostra ícone colorido por tipo, título curto, tempo relativo ("há 5 min") e leva direto para a tela certa (conversa, bico, negócio, item). Não lidas ficam destacadas; há "Marcar todas como lidas" e link "Ver tudo" para uma página `/conta/notificacoes` com o histórico completo.

## Comportamento

- Badge com número (99+ no máximo), atualizado em tempo real.
- Clicar numa notificação marca como lida e navega.
- No mobile, o sino fica ao lado do menu; a lista abre em painel deslizante para caber na tela.
- Sem login, os botões não aparecem.

## Detalhes técnicos

- Nova tabela `public.notifications` (user_id, type, title, body, link_path, entity_id, read_at, created_at) com GRANTs, RLS (dono lê/atualiza; inserção via triggers `security definer`) e índice em `(user_id, created_at desc)`.
- Triggers `AFTER INSERT` em `market_offers`, `market_messages`, `market_conversations`, `gig_applications`, `gig_messages`, `business_reviews`, `professional_reviews`/leads criam a notificação para o destinatário correto.
- `src/lib/notifications-api.ts`: `notificationsQuery(userId)`, `unreadCountQuery(userId)`, `markRead`, `markAllRead`; subscription Realtime na tabela para invalidar as queries.
- Contador de mensagens não lidas: consulta em `market_messages`/`gig_messages` com `read_at is null` e `sender_id <> user`, também via Realtime.
- Novo componente `src/components/NotificationsBell.tsx` (Popover no desktop, Sheet no mobile) usado em `SiteHeader.tsx`; nova rota `src/routes/conta.notificacoes.tsx` com head() próprio e atalho no hub `/conta`.
