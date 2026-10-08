# AGENTS.md

Instruções para agentes de IA que trabalham neste repositório. Esta é a **fonte única**
de verdade — `CLAUDE.md`, `GEMINI.md` e `.github/copilot-instructions.md` apenas apontam
pra cá. Edite só este arquivo. Detalhes adicionais e motivações estão no `CONTRIBUTING.md`.

## O que é

`fma-ui`: registro pessoal de componentes compatível com o formato do
[shadcn/ui](https://ui.shadcn.com). Os componentes são distribuídos via
`shadcn add @fma-ui/<nome>` (o consumidor registra o namespace no `components.json`), não
publicados no npm. Tudo instala em pastas `fma-ui` (`components/fma-ui/`, `hooks/fma-ui/`,
`lib/fma-ui/`) e as dependências entre itens são `@fma-ui/<nome>`, para nunca colidir com o
shadcn oficial. Base de interação: **react-aria-components** (style `aria-nova` do
shadcn CLI, em `packages/ui/components.json`). Site publicado (docs, `/themes`, `/storybook/`,
registro em `/r/`): https://ui.fmartinsandre.dev.br.

## Estrutura

```
packages/registry/  → @fma-ui/registry: schemas zod do formato registry.json (ComponentMetaSchema etc.)
packages/ui/        → @fma-ui/ui: os componentes
  src/core/<nome>/<nome>.tsx          código do componente
  src/core/<nome>/meta.json           metadata (fonte única da descrição)
  src/core/<nome>/<nome>.stories.tsx  story do Storybook (obrigatória)
  src/lib/, src/hooks/                libs e hooks publicados como registry:lib / registry:hook
                                      (<nome>.ts + <nome>.meta.json, ou pasta <nome>/ com meta.json)
  src/blocks/<nome>/                  blocos (registry:block): composições multi-arquivo de
                                      componentes, com meta.json e <nome>.stories.tsx
  src/design-tokens/                  stories dos tokens; tokens em src/styles.css (Tailwind v4)
  src/themes/<nome>.json              temas curados (registry:theme "theme-<nome>"); lista em index.ts
  src/lib/theme/                      lib de temas (schema, CSS, import, item de registro); não publicada
  scripts/                            gen-registry-json, add-shadcn, add-from-registry
  tests/                              testes unit (vitest) + gates estruturais
  registry.json                       GERADO — não editar à mão
apps/web/           → TanStack Start; serve public/r/<nome>.json (GERADO — não editar à mão)
  src/theme-editor/                   editor de temas em /themes (estilo tweakcn); importa a UI
                                      de packages/ui via alias @/* (tsconfig paths)
  src/site/, src/routes/_site/        site de docs (estilo shadcn): home, /docs, /components/<nome>,
                                      /blocks/<nome>; lê registry.json e renderiza as stories como
                                      exemplos (portable stories); stories fullscreen/blocos em
                                      iframe (/preview/...)
  storybook-static.ts                 plugin Vite: serve o build estático do Storybook
                                      (packages/ui/storybook-static) em /storybook/. No build,
                                      reaproveita se estiver em dia com src/ e .storybook/, senão
                                      roda build-storybook, e copia pra public/storybook (ignorado
                                      pelo git); no dev, usa o build se existir (senão link pra :6006)
.devcontainer/      → ambiente de desenvolvimento padrão (ver seção "Dev container")
```

## Dev container

O ambiente de desenvolvimento esperado é o dev container em `.devcontainer/`. Provavelmente
você está rodando dentro dele (`/workspaces/design-system`, usuário `node`).

- **Imagem**: `mcr.microsoft.com/devcontainers/typescript-node:4-24-trixie` (Node 24, Debian
  trixie). Feature `github-cli` (comando `gh`; autenticar com `gh auth login`). pnpm vem do
  corepack via `packageManager`.
- **`post-create.sh`** (uma vez, na criação): configura busca de histórico no `~/.inputrc` e
  instala o Claude Code (`~/.local/bin`).
- **`post-start.sh`** (a cada start): `pnpm install --frozen-lockfile` e instala o Chromium
  do Playwright + libs do SO (necessários pro `test:storybook`). O browser é baixado como
  usuário `node` (cache em `~/.cache/ms-playwright`); só o `install-deps` usa `sudo`.
- **Portas encaminhadas**: `3000` (`apps/web`, `pnpm dev`), `6006` (Storybook) e `8787`
  (`pnpm --filter web preview`, wrangler).
- **VS Code**: Biome é o formatter padrão, com quick-fix e organize imports ao salvar;
  extensões de Tailwind, GitLens, npm-intellisense e corretor ortográfico (en + pt-BR).

Ao mexer no dev container:

- Mantenha os scripts idempotentes e com `set -euo pipefail`; `post-start.sh` roda em todo
  start, então nada caro ou destrutivo ali sem guarda.
- Não rode `pnpm`/`playwright install` sob `sudo` (instalaria em `/root` e ficaria invisível
  pro usuário `node`); `sudo` só pra dependências do SO, como já é feito.
- A versão do Node da imagem deve continuar compatível com `.nvmrc` e `engines.node`
  (`>=24.14.0 <25`); ao trocar uma, alinhe as outras (inclusive `@types/node` no catalog).
- Novas portas de serviços do repo vão em `forwardPorts`.
- Mudanças em `.devcontainer/` só valem após **Rebuild Container** — não dá pra validar de
  dentro do container atual; diga isso ao usuário em vez de afirmar que funcionou.
- Se estiver fora do dev container, reproduza o `post-start.sh` manualmente (Node 24 +
  `corepack enable` + `pnpm install` + `pnpm --filter @fma-ui/ui exec playwright install
  --with-deps chromium`).

## Comandos

Use **sempre `pnpm`** (npm/yarn são bloqueados). Node 24.x (`.nvmrc`), pnpm 12.x;
`engineStrict: true` faz o install falhar fora dessas versões.

```bash
pnpm install
pnpm lint                              # biome check (format + lint)
pnpm exec biome check --write <files>  # corrige formatação/lint
pnpm type-check                        # tsc --noEmit em todos os pacotes
pnpm test                              # vitest --project unit
pnpm build                             # type-check + gera registry.json + public/r
pnpm --filter @fma-ui/ui build         # build só do pacote ui (regenera o registro)
pnpm --filter @fma-ui/ui test:storybook  # testes de interação (Playwright/Chromium)
pnpm --filter web test:e2e             # e2e do site e do editor de temas (build + wrangler dev)
pnpm --filter web preview              # serve o build no workerd local (porta 8787)
pnpm --filter web deploy:worker        # wrangler deploy do último build (Cloudflare Workers)
pnpm storybook                         # dev server na porta 6006
pnpm add:shadcn <nomes...> | all       # vendoriza componentes oficiais do shadcn
pnpm add:registry <url | @ns/nome>     # baixa componente de registro de terceiros
```

## Variáveis de ambiente

`FMA_UI_SITE_URL` (URL pública do `apps/web`: `homepage` do registro e custom domain do
Worker) é obrigatória pro gerador do registro e pro dev/build do `apps/web`. Defina no ambiente
ou num `.env` na raiz (copie `.env.example`; git-ignorado). Schema zod e mensagens em
`packages/registry/src/env.ts` (`@fma-ui/registry/env`, só Node). No CI vem da repository
variable `FMA_UI_SITE_URL`; no Cloudflare, das variáveis de build. Variável nova: adicione ao
`RegistryEnvSchema`, ao `.env.example` e ao `env:` do workflow. Nunca escreva o domínio no código.

## Regras essenciais

1. **Arquivos gerados**: `packages/ui/registry.json` e `apps/web/public/r/*.json` são
   saída de `pnpm --filter @fma-ui/ui build`. Nunca edite à mão. Depois de qualquer mudança
   em `packages/ui/src/core/**` (ou nos scripts), rode o build e **commite os arquivos
   gerados junto** — o CI e o hook de pre-commit falham se estiverem fora de sincronia.
2. **Todo componente** em `src/core/<nome>/` precisa de `<nome>.tsx`, `meta.json` válido
   contra `ComponentMetaSchema` (`packages/registry/src/schema.ts`) e `<nome>.stories.tsx`.
   O teste `tests/registry-consistency.test.ts` impõe isso.
   Libs/hooks em `src/lib` e `src/hooks` só são publicados se tiverem metadata
   (`<nome>.meta.json` ao lado do arquivo, ou `meta.json` dentro da pasta da lib); em vez de
   story, exigem testes unit em `tests/` importando `@/lib/<nome>` / `@/hooks/<nome>`.
   `src/lib/utils.ts` não é publicado. Testes unit rodam com `TZ=UTC`.
   Blocos em `src/blocks/<nome>/` publicam todos os `.ts(x)` da pasta (menos stories) e
   instalam em `components/fma-ui/<nome>/`; em vez de teste unit, exigem `<nome>.stories.tsx`.
3. **`meta.json`**:
   - `source`: `"shadcn"` (vendorizado como está), `"customized"` (oficial alterado — mude
     pra isso ao editar um componente `shadcn`), `"original"` (nosso) ou `"third-party"`
     (exige `origin` com a URL/ref; confira a licença antes de republicar).
   - `description` é a **única** fonte da descrição: a story lê via
     `parameters.docs.description.component: meta.description`. Não duplique o texto.
4. **Dependências são detectadas automaticamente** pelos imports (`detectNpmDependencies` /
   `detectRegistryDependencies` em `scripts/gen-registry-json.ts`). Não as declare à mão.
   Toda dependência npm importada por um componente precisa estar em
   `packages/ui/package.json#dependencies` (verificado por `tests/registry-dependencies.test.ts`).
5. **Imports nos componentes**: `cn` vem do pacote npm `cn` (`import { cn } from "cn"`);
   `src/lib/utils.ts` é só re-export. Outros componentes do registro via
   `@/core/<outro>/<outro>` ou `../<outro>/<outro>`. Libs em pasta são importadas por um
   arquivo (`@/lib/date-fns-compat/index`), nunca pela pasta: o CLI do shadcn só reescreve
   imports que nomeiam arquivos. Variantes com `class-variance-authority`.
   Ícones de `lucide-react`.
6. **API react-aria**: os componentes seguem a API do react-aria-components, não a do Radix
   (ex.: `isDisabled` em vez de `disabled`, sem `asChild` — `LinkButton` pra link com cara
   de botão). Leia o componente existente antes de assumir a API do shadcn padrão.
7. **Stories**: formato CSF3 com `satisfies Meta<typeof X>`, `tags: ["autodocs"]`, título
   `ui/<Nome>`. Testes de interação são `play` functions dentro da story (sem `.test.tsx`
   separado), usando `storybook/test`. Siga uma story existente (ex.: `core/badge/`).
8. **Novo componente vindo do shadcn**: use `pnpm add:shadcn <nome>` em vez de copiar código
   — o script instala deps, move pra `src/core/<nome>/` e cria o `meta.json` stub (edite
   descrição/categoria/tags depois).

9. **Temas**: `src/themes/<nome>.json` segue `ThemeSchema` (`src/lib/theme/schema.ts`) com
   todos os tokens de `tests/required-tokens.ts`; registre em `src/themes/index.ts`.
   `default.json` precisa bater com `styles.css`. Terceiros: `source: "third-party"`, `origin`
   e linha em `src/themes/THIRD_PARTY_NOTICES.md`. Nossos `*-foreground` de status são texto
   sobre o fundo **tingido**, não sobre a cor sólida (diferente do shadcn/tweakcn). O
   `tests/themes.test.ts` impõe isso e um gate de contraste.
10. **Todo token de tema é editável no editor (`/themes`)**. Token novo: declare em
   `styles.css` (`:root`, `.dark`, `@theme inline`), em `COLOR_TOKENS`
   (`src/lib/theme/schema.ts`) **e** em `tests/required-tokens.ts`, adicione-o a um grupo
   de `COLOR_GROUPS` (`src/lib/theme/editor-controls.ts`) e preencha-o em todos os
   `src/themes/*.json`. Configuração nova que não seja cor (campo no `ThemeSchema`): gere a
   variável em `src/lib/theme/css.ts` e renderize um controle num painel de
   `apps/web/src/theme-editor/` (listado em `TYPOGRAPHY_SETTINGS` ou `OTHER_SETTINGS`).
   `tests/theme-editor-coverage.test.ts` e o type-check do `apps/web` (`SETTINGS_COVERED`)
   falham se faltar algum elo.
11. **Tokens de estado** (doc de theming do shadcn): hover/focus/selecionado/hoje/intervalo usam
   `bg-accent` + `text-accent-foreground`; `muted` é só superfície estática (zebra, footer,
   skeleton) e texto secundário. Nunca `bg-muted` nem `bg-foreground/N` como destaque de
   interação — os estilos `*-nova` do shadcn fazem isso; corrija ao vendorizar. Imposto em
   componentes `customized`/`original` e blocos por `tests/interaction-tokens.test.ts`
   (exceções no `ALLOWED`, com motivo). Detalhes no `CONTRIBUTING.md`.

## Estilo de código

- Biome é lint + formatter (sem ESLint/Prettier): 2 espaços, aspas duplas, ponto-e-vírgula,
  trailing commas, largura 100.
- TypeScript 7 strict: sem `baseUrl` (só `paths` com `@/*` → `src/*`); evite `!` não-nulo.
- Tailwind v4 CSS-first; tokens e variantes customizadas em `packages/ui/src/styles.css`.
- Versões compartilhadas (react, typescript, vite, tailwind, @types/*) ficam no `catalog:`
  do `pnpm-workspace.yaml` — use `"catalog:"` nos `package.json` em vez de versões soltas.
- `nitro` está fixado em versão exata de propósito; não troque por `^`/`latest`.
- `apps/web` faz deploy no **Cloudflare Workers** (preset `cloudflare_module` no `vite.config.ts`;
  `wrangler.jsonc` é mesclado no `.output/server/wrangler.json` gerado). O Worker tem limite de
  tamanho: código pesado que só roda no cliente (stories/Storybook, shiki) entra por `import()`
  atrás de `import.meta.env.SSR` pra ficar fora do bundle do servidor. Nada de APIs só de Node
  em runtime (`fs` etc.).

## Git

- Conventional Commits em inglês, commits atômicos, com escopo quando fizer sentido:
  `feat(ui): ...`, `fix(web): ...`, `chore: ...`, `test(ui): ...`, `ci: ...`, `docs: ...`.
- `main` é protegida por ruleset: sem push direto/force-push; tudo via PR, com os checks de
  drift do registro e e2e do editor passando antes do merge.
- Hooks do lefthook: **pre-commit** roda lint → type-check → registry-check;
  **pre-push** roda type-check → test → build → build-storybook. Não use `--no-verify`;
  corrija a causa.

## Antes de concluir uma tarefa

```bash
pnpm lint && pnpm type-check && pnpm test && pnpm --filter @fma-ui/ui build
git status   # registry.json / public/r alterados? inclua-os no commit
```
