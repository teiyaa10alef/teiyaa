# Vagas de emprego — sistema completo (dois lados)

Hoje já existe uma base de vagas (publicar, candidatar, painel do anunciante, chat após pré-seleção). Este plano completa os dois lados: anúncio profissional com todas as informações reais de uma vaga, e um perfil de candidato com currículo em PDF.

## Lado de quem anuncia a vaga

Novos campos no formulário de publicação (wizard existente, reorganizado em 5 passos):

- **Empresa**: nome, logo, ramo, porte (MEI / pequena / média / grande), site ou Instagram, breve descrição.
- **A função**: título, área, descrição das atividades, nível (sem experiência / júnior / pleno / sênior), escolaridade mínima, nº de vagas, vaga afirmativa / PcD.
- **Jornada**: modelo (presencial / híbrido / remoto), tipo de contrato (CLT, PJ, temporário, meio período, estágio, autônomo), carga horária semanal, escala/turnos (ex.: 6x1, comercial, noturno), horário de início e fim, data prevista de início.
- **Remuneração**: valor fixo, faixa (de/até) ou "a combinar"; período (hora / dia / mês); comissão; benefícios (lista com opções e livre).
- **Candidatura**: exigir currículo em PDF (sim/não), exigir carta de apresentação, perguntas de triagem (até 3, resposta curta), prazo final da vaga, contato de WhatsApp.

Painel do anunciante (`/conta/vagas/<vaga>`) ganha:

- Lista de candidatos com foto, bio, cidade/comunidade, experiência resumida, respostas das perguntas e botão **Ver currículo (PDF)** com link seguro temporário.
- Filtro por status (novas, vistas, pré-selecionadas, aceitas, recusadas) e contadores.
- Marcar como "vista" automaticamente ao abrir a candidatura.
- Anotações privadas do recrutador por candidato.
- Encerrar vaga com motivo (preenchida / cancelada) e aviso automático aos candidatos.

## Lado de quem procura emprego

- Novo **perfil de candidato** em `/conta/candidato`: foto (da conta), título profissional, bio, cidade/comunidade, telefone/WhatsApp, disponibilidade (imediata / a combinar), turnos disponíveis, se tem CNH/veículo, habilidades, experiências (cargo, empresa, período, descrição) e formação.
- **Currículo em PDF**: upload de até 5 MB, armazenado em área privada; o candidato pode substituir ou remover. Só o próprio candidato e o dono das vagas em que ele se candidatou conseguem abrir, por link temporário.
- Ao se candidatar, o app usa o perfil pronto: o candidato revisa, escreve a mensagem, responde às perguntas de triagem e anexa/confirma o currículo em um passo só.
- Página da vaga mostra tudo de forma organizada: empresa, jornada, salário, benefícios, requisitos, prazo, nº de vagas, e um bloco "o que você precisa enviar".
- `/conta/candidaturas` mostra o andamento de cada candidatura com status visual, link para a vaga e para o chat quando liberado.
- Feed de vagas ganha filtros por modelo de trabalho, contrato, faixa salarial mínima e "sem experiência".

## Regras e privacidade

- Currículo e dados de contato do candidato só ficam visíveis para o dono da vaga onde ele se candidatou.
- Chat continua liberado só após pré-seleção ou aceite (regra atual mantida).
- Vagas expiradas (prazo vencido) saem do feed automaticamente e aparecem como "encerrada" para o dono.

## Detalhes técnicos

- **Migração**: novas colunas em `jobs` (empresa/logo/porte/site, nível, escolaridade, nº de vagas, PcD, carga horária semanal, escala, horários, data de início, `salary_min_cents`/`salary_max_cents`, prazo, `requires_cv`, `screening_questions` jsonb); novas colunas em `job_applications` (`cv_path`, `answers` jsonb, `cover_letter`, `owner_notes`, `seen_at`); nova tabela `candidate_profiles` (headline, bio, disponibilidade, turnos, CNH, habilidades, `experiences` jsonb, `education` jsonb, `cv_path`) com GRANTs e RLS por `auth.uid()`; política extra permitindo ao dono da vaga ler o perfil de quem se candidatou.
- **Storage**: bucket privado `resumes`; upload pelo próprio candidato sob `\<user_id\>/…`; leitura via server function autenticada que confere se o chamador é o candidato ou o dono da vaga e devolve uma URL assinada de curta duração.
- **Código**: estender `src/lib/jobs-api.ts`, criar `src/lib/candidate-api.ts` e `src/lib/resume.functions.ts` (server fn com `requireSupabaseAuth`), novas rotas `conta.candidato.tsx`, atualizar `vagas.novo.tsx`, `vagas.$jobId.tsx`, `conta.vagas.$jobId.tsx`, `conta.candidaturas.tsx`, `JobCard.tsx` e `JobFeed.tsx`.
- Validação com zod em todos os formulários; limite de 5 MB e apenas `application/pdf` no currículo.
