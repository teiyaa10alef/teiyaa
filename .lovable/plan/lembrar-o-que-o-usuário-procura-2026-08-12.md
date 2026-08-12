# Lembrar o que o usuário procura

Hoje a categoria escolhida (Comércios, Profissionais, Imóveis, Freelances, Vagas) só existe no endereço da página (`?cat=...`). Assim que o usuário abre um anúncio, vai para a conta ou clica no logo e volta, o endereço perde essa informação e a tela volta a perguntar "O que você procura?".

## O que muda

1. **A escolha fica salva.** Sempre que o usuário seleciona uma categoria, ela é guardada no navegador junto com a comunidade já salva hoje.
2. **Volta direto no lugar certo.** Ao entrar em uma página de comunidade/cidade/estado sem categoria no endereço, o site reaplica automaticamente a última categoria usada. A tela "O que você procura?" só aparece para quem nunca escolheu nada.
3. **Logo e navegação preservam o contexto.** Clicar no logo "teiyaa" leva de volta à comunidade salva com a categoria salva, em vez de recomeçar do zero.
4. **Trocar de categoria continua fácil.** A barra de filtros permanece igual; escolher outra categoria atualiza o que fica salvo.
5. **Voltar de um anúncio.** As páginas de detalhe (comércio, profissional, bico, item) mantêm o link "voltar" apontando para a comunidade + categoria salva.

## Detalhes técnicos

- `src/lib/community.ts`: adicionar `getStoredCategory()` / `setStoredCategory()` (chave `teiyaa:last-category`) e um hook `useStoredCategory()` para leitura pós-hidratação.
- `src/routes/c.$communitySlug.tsx`, `cidade.$citySlug.tsx`, `estado.$stateSlug.tsx`:
  - `useEffect` grava `cat` quando presente;
  - quando `cat` está ausente, um `useEffect` lê a categoria salva e faz `navigate({ search: { cat }, replace: true })` — `replace` evita quebrar o botão voltar do navegador.
  - A leitura acontece só no cliente (localStorage), então não há risco de divergência de hidratação; enquanto não houver categoria salva, `CategoryPrompt` continua sendo renderizado.
- `src/components/SiteHeader.tsx`: o logo passa a usar comunidade salva (`useHomeCommunitySlug`) + categoria salva quando existirem; caso contrário, continua indo para `/`.
- `src/components/ScopeBar.tsx`: os links de categoria e de troca de escopo já carregam `cat`; nenhum ajuste estrutural, apenas garantir que a gravação ocorra na rota.
