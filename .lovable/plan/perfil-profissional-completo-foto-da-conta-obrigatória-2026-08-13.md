# Perfil profissional completo (foto da conta obrigatória)

O que já existe hoje: perfil profissional com profissão, especialidades, anos de experiência, serviços com preço, portfólio com galeria/lightbox, avaliações com nota média e pedido de orçamento + WhatsApp na página pública. O que falta é o elo com a **conta do usuário**: hoje o nome e a foto vêm de um avatar separado do perfil profissional, e não existe nenhuma tela para o morador editar nome, sobrenome e foto depois do cadastro (isso só é gravado no momento de criar a conta).

---

## 1. Identidade vem da conta

- Nova página **Editar perfil** (`/conta/perfil`): foto, nome, sobrenome, bio curta, telefone/WhatsApp. Atalho no hub "Minha conta".
- O perfil profissional passa a exibir **foto + nome e sobrenome da conta** no topo (não mais um avatar próprio). A capa continua sendo do perfil profissional.
- O card de profissional na busca também usa a foto e o nome da conta.

## 2. Foto de perfil obrigatória

- Para **publicar** o perfil profissional é obrigatório ter foto na conta e nome e sobrenome preenchidos.
- Se faltar, o painel mostra um aviso no topo com botão "Adicionar foto agora" que leva direto para Editar perfil; o botão Publicar fica bloqueado com explicação.
- O checklist de perfil completo passa a checar a foto e o nome da conta, além de: profissão, sobre, habilidades, anos de experiência, WhatsApp, 1 serviço e 3 fotos no portfólio.

## 3. Portfólio mais forte

- Upload de várias fotos de uma vez, com título e legenda por trabalho.
- Reordenar (subir/descer) e definir a **capa** do portfólio.
- Contador de trabalhos e prévia de 3 fotos no card de busca (já existente) usando a capa como primeira imagem.

## 4. Habilidades e experiência em destaque

- Bloco "Habilidades" (as especialidades já salvas) exibido como etiquetas na página pública, com sugestões por profissão no painel.
- "Anos de experiência" exibido como selo ao lado do nome e usado como critério de ordenação "Mais experientes" na busca.

## 5. Página pública para quem procura

Ordem final da página `/profissionais/perfil/{usuário}`:
1. Capa + foto da conta, nome e sobrenome, profissão, nota média e anos de experiência
2. Sobre / apresentação
3. Habilidades
4. Serviços e preços
5. Portfólio (galeria com lightbox)
6. Avaliações + formulário (exige login, uma por pessoa, não pode avaliar a si mesmo)
7. Contato fixo no rodapé no celular: WhatsApp e "Pedir orçamento"

Metadados de compartilhamento com o nome e profissão do profissional e a foto como imagem de prévia.

---

## Detalhes técnicos

- Nova rota `src/routes/conta.perfil.tsx` gravando em `profiles` (`display_name`, `avatar_url`, `bio`, `phone`, `whatsapp`) via `account-api.ts`; upload pelo `uploadMedia` existente.
- `professional-api.ts`: junta `profiles` no fetch do perfil público e nos cards (já faz para reviews) e expõe `owner_avatar_url` / `owner_name`; nova ordenação por experiência.
- `conta.profissional.tsx`: guarda de publicação (foto + nome), checklist atualizado, aba Portfólio com upload múltiplo, reordenação e definição de capa.
- Sem mudança de banco: `profiles.bio`, `portfolio_items.title/is_cover/sort_order` e `professional_profiles.specialties/years_experience` já existem.
- Mobile-first, apenas tokens de design atuais.

## Ordem de execução

1. Página Editar perfil + atalho na conta
2. Identidade da conta no perfil profissional e nos cards
3. Guarda de publicação + checklist
4. Portfólio (upload múltiplo, ordem, capa)
5. Página pública reorganizada com habilidades, contato fixo e metadados
