# Impedir conversa consigo mesmo

Hoje as telas escondem os botões de "Conversar" quando o usuário é o dono, mas nada no banco impede que uma conversa com a mesma pessoa nos dois lados seja criada. Por isso foi possível abrir um chat consigo mesmo (o caso do bico aberto agora).

## O que muda

1. **Bloqueio no banco (definitivo)**
   - Conversas de bico: impedir que dono e candidato sejam a mesma pessoa.
   - Conversas do marketplace: impedir que comprador e vendedor sejam a mesma pessoa.
   - Candidaturas em bicos: impedir candidatura no próprio anúncio.
   - Propostas do marketplace: impedir proposta no próprio item.
   - Pedidos de orçamento a profissionais: impedir pedido para o próprio perfil.

2. **Bloqueio no app (mensagem amigável)**
   - Antes de abrir/criar conversa ou enviar candidatura/proposta, verificar se as duas pontas são o mesmo usuário e mostrar um aviso claro ("Você não pode conversar com você mesmo") em vez de erro técnico.

3. **Limpeza dos dados já criados**
   - Remover as conversas (e mensagens) existentes em que as duas pontas são o mesmo usuário, além de candidaturas/propostas próprias, se houver.

4. **Telas de mensagens**
   - Filtrar da caixa de entrada qualquer conversa própria remanescente e mostrar uma tela de "conversa indisponível" ao acessar um link antigo.

## Detalhes técnicos

- Migração com `CHECK` em `gig_conversations (owner_id <> applicant_id)` e `market_conversations (buyer_id <> seller_id)`; para `gig_applications`, `market_offers` e `professional_leads`, validação via trigger `BEFORE INSERT` (a comparação depende de outra tabela). Limpeza dos registros inválidos executada antes de aplicar as restrições.
- Guardas em `startGigConversation`, `startConversation`, `applyToGig`, `createOffer` e no fluxo de lead do profissional, lançando erro tratado com toast.
- Filtro nas listas de conversas em `src/lib/gigs-api.ts` e `src/lib/market-api.ts`.
