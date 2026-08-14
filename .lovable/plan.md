# Simplificar o footer do site

A seção atual do footer com o título "Faça parte do ecossistema teiyaa", estatísticas e o formulário de "Cadastre seu negócio" ocupa muito espaço vertical, aparece em todas as páginas e não agrega valor na navegação. O usuário relatou que a parte está atrapalhando a experiência.

## O que vai mudar

- Remover a seção principal do footer: título, estatísticas ("1.2k+ comércios", "450+ vagas", "15 bairros") e o formulário de cadastro de negócio.
- Manter apenas a parte inferior com: logo, copyright e links de Privacidade/Termos/Contato.
- Preservar o estilo visual escuro e a responsividade mobile.
- Garantir que o footer continue fechando bem a página sem parecer vazio ou quebrado.

## Arquivo afetado

- `src/components/SiteFooter.tsx` — reescrita para uma versão minimalista.

## Critério de pronto

- Footer exibe apenas logo, copyright e links legais.
- Não há mais formulário de cadastro nem estatísticas promocionais.
- Layout continua responsivo em mobile e desktop.
