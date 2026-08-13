# Conversa no bico só depois da pré-seleção

Hoje qualquer candidato pode abrir o chat com o anunciante logo após se candidatar. A regra passa a ser: o candidato só fala com o anunciante se estiver **pré-selecionado** ou **escolhido**.

## O que muda

1. **Quem pode iniciar a conversa**
   - O anunciante continua podendo abrir o chat com qualquer candidato (é ele quem escolhe).
   - O candidato só consegue abrir/entrar no chat quando sua candidatura estiver como "Pré-selecionada" ou "Aceita".

2. **Tela do bico (candidato)**
   - Enquanto a candidatura estiver como enviada/vista: no lugar do botão "Conversar", um aviso curto — "Você poderá conversar com o anunciante assim que for pré-selecionado".
   - Quando for pré-selecionado ou aceito, o botão "Conversar" aparece normalmente.

3. **Bloqueio real (não só visual)**
   - Regra no banco impedindo que o candidato crie a conversa antes de ser pré-selecionado/aceito, e impedindo o envio de mensagens nesse estado.
   - Se um candidato recusado/retirado tentar abrir um link antigo de conversa, o chat aparece em modo somente leitura com aviso.

4. **Caixa de mensagens**
   - Conversas de bico continuam listadas normalmente para quem já foi pré-selecionado ou aceito.

## Detalhes técnicos

- Migração: política de INSERT em `gig_conversations` passa a exigir, quando `auth.uid() = applicant_id`, a existência de uma `gig_applications` com `status in ('shortlisted','accepted')` para aquele bico/candidato (via função `security definer` `can_gig_applicant_chat(_gig_id, _user_id)`). O dono segue permitido por `is_gig_owner`.
- Política de INSERT em `gig_messages`: além de participante, o candidato precisa passar por `can_gig_applicant_chat`; o dono envia sempre.
- App: `startGigConversation` recebe o status da candidatura e lança erro amigável antes de chamar o banco; `src/routes/freelances.$gigId.tsx` troca o botão por aviso conforme `myApp.status`; `src/routes/mensagens.bico.$conversationId.tsx` esconde o campo de envio quando o candidato não está mais habilitado.
- Nada muda no fluxo do anunciante em `src/routes/conta.freelances.$gigId.tsx` (ele já marca "Pré-selecionar" e "Aceitar").
