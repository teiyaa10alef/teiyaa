# O que ainda falta no teiyaa

Análise do projeto atual. Já estão completos: comércios, profissionais, bicos (freelances), marketplace com chat, notificações, login e navegação por comunidade/cidade/estado.

## 1. Imóveis — não existe sistema próprio (maior lacuna)
Hoje a aba Imóveis lista da tabela genérica `listings` e não há nenhuma tela para anunciar um imóvel.
- Tabela própria: venda/aluguel, tipo (casa, kitnet, quarto, comercial), preço, condomínio/IPTU, quartos, banheiros, vagas, área, mobiliado, aceita pet, endereço/referência, fotos, status.
- Fluxo de anúncio em etapas + painel do anunciante em `/conta/imoveis`.
- Feed com filtros (alugar/comprar, faixa de preço, nº de quartos) e página pública do imóvel com contato/WhatsApp e chat.

## 2. Vagas de emprego — não existe sistema próprio (segunda maior lacuna)
Mesma situação: usa `listings`, sem candidatura.
- Tabela de vagas (cargo, tipo CLT/PJ/temporário, salário, jornada, requisitos, empresa vinculada ao comércio) e tabela de candidaturas com currículo simples do perfil.
- Painel do empregador para ver e triar candidatos, com chat.
- Página da vaga com botão "Candidatar-se" e `/conta/candidaturas-vagas`.

## 3. Conta do usuário
- **Editar perfil** não existe: nome, foto, bio, telefone/WhatsApp, trocar comunidade, senha.
- **`/conta/salvos`**: o favoritar de comércios já grava no banco, mas não há página para ver os salvos. Falta também favoritar imóveis, bicos e itens do marketplace.
- **Perfil público do vizinho**: hoje só existe perfil de profissional; falta uma página com histórico/reputação do usuário comum (bicos concluídos, avaliações).

## 4. Avaliações de bicos
A tabela `gig_reviews` e a função de envio existem, mas **falta a interface**: após concluir o bico, nenhum dos dois lados consegue avaliar. Falta também exibir essa nota no perfil e nos cards.

## 5. Marketplace
- Sem painel de propostas recebidas/enviadas organizadas (aceitar/recusar existe parcialmente).
- Falta marcar como vendido/reservado de forma visível e favoritar itens.
- Sem busca e filtros (preço, condição, categoria) no feed.

## 6. Busca e descoberta
- Não há busca global no topo (comércios + profissionais + itens + bicos em um só lugar).
- Sem geolocalização real ("perto de mim", distância, mapa) — hoje só bairro.
- Home logada poderia ter destaques do bairro (novos comércios, promoções ativas, bicos urgentes).

## 7. Confiança e moderação
- Sem denúncia de anúncio/usuário e sem painel administrativo (nenhuma tabela de papéis/admin existe).
- Sem verificação de comércio (selo).
- Sem bloqueio de usuário no chat.

## 8. Comunicação
- Notificações só dentro do site: falta e-mail (nova mensagem, candidatura, proposta) e push no celular.
- Chat sem envio de imagem e sem indicador de "digitando".

## 9. Crescimento e conteúdo
- Só Paraisópolis está ativo — falta cadastrar Heliópolis, Jardim São Luís, Capão Redondo e a tela de escolha por cidade.
- Compartilhamento: falta imagem de preview automática por anúncio.
- Sem página "Sobre", contato, termos de uso e política de privacidade (necessárias para publicar).
- PWA (instalar no celular, ícone, offline básico) não configurado.

---

## Sugestão de ordem
1. Imóveis (sistema completo)
2. Vagas + candidaturas
3. Editar perfil, salvos e perfil público do vizinho
4. Avaliação de bicos (fechar o ciclo já existente)
5. Busca global + melhorias do marketplace
6. Moderação, e-mails e páginas legais
