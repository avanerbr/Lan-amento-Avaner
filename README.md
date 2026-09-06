# Painel de Lançamento — Avaner

Site estático (sem build, sem terminal) para acompanhar o relançamento via
live, feito com o Guilherme Assis: metas, desempenho por pessoa, riscos,
linha do tempo, materiais criativos, pedidos entre o time e observações,
tudo em tempo real via Supabase. Não é específico de um produto (HS,
Yamaha, etc.) — é o lançamento da Avaner como um todo.

Segue o mesmo padrão do **Código Vermelho**: HTML/CSS/JS puro, publicado no
Coolify como site estático, dados no Supabase. Tudo pode ser editado pelo
**editor web do GitHub** — não precisa de terminal nem de instalar nada.

---

## 1. Criar o projeto Supabase (novo, dedicado)

Crie um projeto **novo e separado** — não reaproveite o do Código Vermelho
nem o do CRM. É o mesmo motivo pelo qual o Código Vermelho já tem o dele
próprio: evitar concorrência de conexões entre ferramentas diferentes.

1. Acesse [supabase.com](https://supabase.com) → **New project**.
2. Nome sugerido: `avaner-lancamento` (região: São Paulo, se disponível).
3. Anote a senha do banco em local seguro (não é usada pelo painel, só se
   você precisar entrar direto no Postgres um dia).

## 2. Rodar o banco de dados

No painel do projeto → **SQL Editor** → **New query**:

1. Cole o conteúdo de `supabase/schema.sql` inteiro → **Run**.
2. Cole o conteúdo de `supabase/seed.sql` inteiro → **Run**.

Isso cria as tabelas (`tasks`, `metrics`, `metrics_history`,
`creative_assets`, `notes`, `requests`), ativa o tempo real, cria o bucket
de armazenamento `criativos` e popula as 34 tarefas do checklist do
Guilherme (as 4 primeiras já entram marcadas como concluídas).

Se algo der erro de "already exists" ao rodar de novo, pode ignorar — os
dois arquivos foram feitos pra serem seguros de rodar mais de uma vez.

**Se você já tinha rodado uma versão anterior do `schema.sql`:** rode o
`schema.sql` novo de novo — ele só adiciona o que ainda não existe (a
tabela `requests`, e agora também as colunas de status/prioridade das
tarefas e o vínculo pedido↔tarefa); nada do que já estava lá é apagado ou
recriado.

## 3. Criar os 3 usuários do time

**Authentication → Users → Add user** (uma vez para cada pessoa):

| Nome | E-mail (sugestão) | Senha |
|---|---|---|
| Michael | michael@avaner.com.br | defina uma senha |
| Jamille | jamille@avaner.com.br | defina uma senha |
| Guilherme | guilherme@avaner.com.br | defina uma senha |

Marque **"Auto Confirm User"** ao criar, pra não depender de e-mail de
confirmação. Cada um troca a própria senha depois, se quiser (**Authentication
→ Users → clicar no usuário → Reset password**).

> Use exatamente os e-mails que você cadastrar aqui no arquivo
> `js/config.js` (passo 5) — é o que faz o painel saber automaticamente
> quem logou e qual cor/nome mostrar.

## 4. Pegar a URL e a chave do projeto

**Project Settings → API**:
- **Project URL** → algo como `https://xxxxx.supabase.co`
- **anon public key** → uma chave longa (começa com `eyJ...`)

## 5. Preencher `js/config.js`

Abra `js/config.js` (pelo editor web do GitHub, depois do passo 6) e
substitua:

```js
SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
SUPABASE_ANON_KEY: 'SUA-CHAVE-ANON-AQUI',
```

E confira se os e-mails em `TEAM` batem com os que você criou no passo 3.
As datas do lançamento (`START_DATE`, `LIVE_DATE`) e as metas
(`GOAL_REVENUE_MIN/MAX`, `GOAL_GROUP_COUNT`, `GOAL_GROUP_DATE`) também
ficam nesse arquivo — mude aqui se o cronograma mudar de novo no futuro.

## 6. Subir no GitHub

1. Crie um repositório novo na organização `avanerbr` (ex:
   `painel-lancamento`).
2. Envie **todos os arquivos deste zip** para o repositório — pelo GitHub
   Desktop ou arrastando na interface web (Add file → Upload files).
3. Edite `js/config.js` direto pelo editor do GitHub com os valores do
   passo 4/5 e faça o commit.

**Todos os arquivos deste zip são novos** — é um repositório do zero, não
há nada para excluir.

## 7. Publicar no Coolify

1. No Coolify, **New Resource → Public Repository** (ou conecte o
   repositório do GitHub como já fazem com os outros projetos).
2. **Build Pack: Static** (mesmo usado no Código Vermelho) — sem comando de
   build, diretório de publicação é a raiz do repositório (`/`).
3. Configure o domínio, ex: `lancamento.avaner.com.br`.
4. Deploy. Toda vez que você commitar uma mudança no GitHub, o Coolify
   publica sozinho.

## 8. Apontar o domínio

Na TurboCloud (cPanel), crie um registro apontando o subdomínio escolhido
(`lancamento.avaner.com.br`) para o IP do seu servidor Coolify
(`187.127.36.189`), do mesmo jeito que foi feito para o Código Vermelho e
o CRM.

---

## Como usar no dia a dia

Em `login.html`, Michael, Jamille e Guilherme escolhem o próprio nome numa
lista (em vez de digitar e-mail) e digitam só a senha. O painel já sabe
automaticamente quem é quem (nome, cor, cargo) a partir do login.

O painel é dividido em 4 páginas, acessíveis pelas abas do topo:

- **Visão Geral**: no topo, um cartão pessoal ("Minhas pendências") mostra
  suas tarefas atrasadas/bloqueadas e pedidos esperando por você. Logo
  abaixo, a linha do tempo (ver abaixo). Depois vêm metas de faturamento e
  grupo, um feed de "Atividade recente" (o que o time andou fazendo,
  juntando tarefas/criativos/notas/pedidos num só lugar), desempenho por
  pessoa, gráficos de evolução e preocupações (incluindo o critério de
  "pronto pra começar os anúncios").
- **Tarefas**: as 5 fases do checklist do Guilherme em abas — clique numa
  fase pra ver só as tarefas dela. Cada tarefa tem 4 status: **A fazer**,
  **Em andamento**, **Bloqueada** e **Concluída** — clique no botão
  correspondente pra mudar (aparece na hora, antes mesmo de confirmar no
  banco). Marcar como **Bloqueada** abre um miniformulário pra dizer de
  quem você precisa e o quê — isso cria automaticamente um Pedido pra
  aquela pessoa, já linkado na tarefa (aparece com "🔗 tarefa: …" na aba
  Pedidos). O ícone 🔥 ao lado do título marca uma tarefa como urgente. No
  topo da fase "Campanhas" aparece o aviso de pronto/não-pronto pra subir
  os anúncios.
- **Criativos**: o Guilherme sobe arquivo direto (fica guardado no
  Supabase Storage) ou cola um link (Drive, Frame.io, etc.) — os dois
  aparecem juntos, filtráveis por fase.
- **Pedidos**: qualquer um pede algo de alguém específico (ou de "Todos")
  — aparece um contador no cabeçalho de quantos pedidos estão esperando a
  pessoa logada, e um "Concluir" quando resolvido. Pedidos criados a
  partir de uma tarefa bloqueada aparecem com o nome da tarefa junto. É o
  "sistema aponta o que eu preciso fazer" — mais direto que deixar tudo
  solto nas observações.
- **Observações** (dentro da página Pedidos): mural simples de notas
  sobre o andamento geral — cada um só apaga as próprias.

## Linha do tempo

Fica logo no topo da Visão Geral agora. O visual é todo em tons de azul,
mais "vivo": a fase já concluída aparece em azul sólido com um ✓, a fase
em que vocês estão agora pulsa com um brilho passando por cima (pra
chamar o olho pra onde a atenção deveria estar), e as fases futuras ficam
esmaecidas. O marcador "hoje" continua em verde, com um efeito de "ping"
(círculo pulsando), pra ficar fácil de achar onde estamos na régua do
tempo mesmo de relance.

## Critério para começar os anúncios

O painel calcula sozinho se dá pra subir as campanhas da Fase 2: o
critério é a Fase 1 (Alicerce) estar 100% concluída. Enquanto não estiver,
aparece "Ainda não é hora" com a lista do que falta; quando completar,
vira "Pronto para começar os anúncios". Esse critério está definido no
topo de `js/tasks.js` (`READINESS_GATES`) — dá pra ajustar ou adicionar
outros critérios ali se um dia quiser.

## Sobre as cores

O painel inteiro usa um tema único, escuro, no mesmo tom de azul-marinho
do login — fundo e cartões em navy, textos claros, igual do início ao
fim (não muda com o modo claro/escuro do sistema). O cromo geral (fundo,
cabeçalho, botões, bordas, destaques) usa a paleta oficial da Avaner
(azul-marinho, prata, areia, grafite, verde-maçã).

Testei a paleta oficial de apoio (verde-maçã, azul-ardósia, areia) como
cor de **identidade nos gráficos** (quem fez o quê) e ela falha em testes
de contraste e de daltonismo sobre o fundo navy — fica difícil distinguir
rapidamente quem é quem. Por isso, só nos **gráficos de dados**
(desempenho por pessoa, linha do tempo, evolução) uso uma paleta separada
— azul, laranja, água e amarelo — validada matematicamente pra ter
contraste suficiente e ser diferenciável sob daltonismo, testada
especificamente contra o navy `#041E42` da marca. O login continua com o
cartão branco sobre fundo navy, como no rascunho que você mandou.

## Notas de segurança (proporcionais a uma ferramenta interna de 3 pessoas)

- O bucket `criativos` é público pra leitura (qualquer um com o link
  consegue ver/baixar um criativo) — simples de servir imagens e vídeos
  sem lidar com links assinados. Só usuário logado consegue subir ou
  apagar. Se um dia isso incomodar, dá pra trocar pra bucket privado e
  usar `createSignedUrl()` em `js/creatives.js`.
- Qualquer um dos 3 logados pode editar/apagar qualquer coisa (tarefas,
  metas, criativos, notas de outra pessoa) — é uma ferramenta de time
  pequeno e confiável, não um sistema multiusuário com permissões
  granulares.

## Se algo não funcionar

- **Tela de login não sai do lugar / erro no console**: confira se
  `js/config.js` tem a URL e a chave certas do Supabase.
- **Login diz "e-mail ou senha incorretos"**: confira se o usuário foi
  criado em Authentication → Users e se "Auto Confirm User" foi marcado.
- **Painel abre mas nada carrega**: veja o console do navegador (F12) —
  geralmente é RLS ou nome de tabela; confira se `schema.sql` rodou sem
  erros.
- **Upload de criativo falha**: confira se o bucket `criativos` existe em
  Storage e se as políticas do passo 2 foram criadas.
