# Fotos de perfil que não carregam (arquivos HEIC do iPhone)

## O que está acontecendo

O candidato que se inscreveu no seu bico enviou a foto direto do iPhone, e o arquivo foi salvo no formato **.heic** (padrão da câmera da Apple). O navegador registrou o erro ao tentar exibir exatamente essa imagem:

```text
Failed to load <img>: .../avatar/1786642740840-pbg6bk.heic
```

Chrome, Edge, Firefox e Android **não sabem abrir .heic**. Como o app envia o arquivo original sem converter, a foto some para todo mundo que não usa iPhone. Hoje também não existe um "plano B": quando a imagem falha, aparece um espaço vazio em vez das iniciais da pessoa.

## Como resolver

### 1. Converter toda foto no envio (a correção de raiz)
Antes de subir qualquer imagem (foto de perfil, portfólio, comércio, marketplace, bicos, imóveis), o app passa a:
- Reduzir a imagem para um tamanho máximo razoável (evita fotos de 8 MB)
- **Sempre gravar em JPEG**, independentemente do formato de origem
- Se o navegador não conseguir abrir o arquivo (ex.: HEIC no Android/desktop), mostrar um aviso claro: "Esse formato de foto não é aceito. Escolha uma foto em JPG ou PNG."

Com isso, nenhum arquivo HEIC entra mais na plataforma.

### 2. Iniciais como plano B em toda foto de usuário
Criar um componente único de avatar que, se a imagem falhar por qualquer motivo, mostra automaticamente as iniciais da pessoa em um círculo laranja. Aplicado nos candidatos do bico, chat, marketplace, profissionais, comentários e cabeçalho.

### 3. Limpar as fotos quebradas que já existem
Rodar uma limpeza no banco removendo o link das fotos de perfil e mídias que terminam em `.heic`/`.heif`. Essas pessoas voltam a aparecer com as iniciais (em vez de um quadrado vazio) e podem reenviar a foto normalmente.

## Detalhes técnicos

- `src/lib/upload.ts`: nova função de normalização — `createImageBitmap`/`<img>` + `canvas.toBlob('image/jpeg', 0.85)`, redimensionando para no máx. 1600px no maior lado (512px para avatares). Falha de decode vira erro amigável. Extensão final sempre `.jpg`, `contentType: image/jpeg`.
- Inputs de arquivo passam a usar `accept="image/jpeg,image/png,image/webp"` (vídeo mantido onde já existe) para o seletor do celular já filtrar.
- Novo `src/components/UserAvatar.tsx` com `onError` → iniciais; substitui os `<img>` de avatar em `conta.freelances.$gigId`, `freelances.$gigId`, mensagens, `ProfessionalCard`, `SiteHeader` e afins.
- Migration de limpeza: `UPDATE public.profiles SET avatar_url = NULL WHERE avatar_url ILIKE '%.heic' OR avatar_url ILIKE '%.heif'`, mesma regra para `portfolio_items`, `business_media` e demais colunas de mídia.
