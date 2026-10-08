# Contribuindo com o fma-ui

Este guia explica como o repositório funciona por dentro: preparar o ambiente, adicionar ou
customizar componentes, testar e publicar o registro.

> Usando um agente de IA? As regras resumidas para agentes estão em [`AGENTS.md`](AGENTS.md).

## Sumário

- [Ambiente](#ambiente)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Comandos](#comandos)
- [Adicionando componentes](#adicionando-componentes)
- [Anatomia de um componente](#anatomia-de-um-componente)
- [Storybook e testes](#storybook-e-testes)
- [Temas](#temas)
- [Gerando e publicando o registro](#gerando-e-publicando-o-registro)
- [Git hooks e CI](#git-hooks-e-ci)
- [Commits e pull requests](#commits-e-pull-requests)
- [Notas de versão](#notas-de-versão)

## Ambiente

### Dev container (recomendado)

O repositório traz um dev container em `.devcontainer/`. Abra a pasta no VS Code e escolha
**Reopen in Container**. Ele já vem com:

- Node 24, pnpm (via corepack) e o GitHub CLI (`gh`);
- `pnpm install` e o Chromium do Playwright instalados a cada start;
- portas `3000` (app web) e `6006` (Storybook) encaminhadas;
- Biome configurado como formatter, com organize imports ao salvar.

### Setup manual

Se preferir rodar sem o dev container:

- **Node** 24.x (LTS Krypton). O `.nvmrc` fixa a versão de desenvolvimento; `engines.node`
  aceita `>=24.14.0 <25.0.0`.
- **pnpm** 12.x, com `packageManager` fixando a versão exata via corepack.

```bash
corepack enable
pnpm install
pnpm --filter @fma-ui/ui exec playwright install --with-deps chromium  # só para test:storybook
```

O `pnpm-workspace.yaml` tem `engineStrict: true`: instalar com Node ou pnpm fora do range
**falha** (`ERR_PNPM_UNSUPPORTED_ENGINE`), não apenas avisa. O `preinstall` roda
`only-allow pnpm`, então `npm install` e `yarn install` são bloqueados.

## Estrutura do repositório

```
packages/
  registry/   → schemas zod do formato registry.json do shadcn (@fma-ui/registry)
  ui/         → os componentes (@fma-ui/ui)
    src/core/<nome>/             → um componente por pasta
    src/design-tokens/           → stories dos tokens (cor, tipografia, espaçamento...)
    src/styles.css               → tokens e variantes do Tailwind v4 (= tema "default")
    src/themes/<nome>.json       → temas curados, publicados como @fma-ui/theme-<nome>
    src/lib/theme/               → schema, CSS, import e item de registro dos temas (não publicado)
    scripts/gen-registry-json.ts → gera registry.json a partir de src/core/**/meta.json
    scripts/add-shadcn.ts        → baixa componentes oficiais do shadcn/ui
    scripts/add-from-registry.ts → baixa componentes de registros de terceiros
    tests/                       → testes unitários e gates estruturais
apps/
  web/        → TanStack Start; serve os itens finais em /r/<nome>.json
```

Monorepo com pnpm workspaces + Turborepo. Versões compartilhadas (react, typescript, vite,
tailwind, `@types/*`) ficam no `catalog:` do `pnpm-workspace.yaml`.

## Comandos

```bash
pnpm install                 # instala tudo
pnpm dev                     # turbo dev em todos os pacotes (app web na porta 3000)
pnpm build                   # build completo (inclui gerar + compilar o registro)
pnpm lint                    # Biome (format + lint)
pnpm type-check              # tsc --noEmit em todos os pacotes
pnpm test                    # testes unitários (vitest --project unit)
pnpm storybook               # Storybook na porta 6006
pnpm build-storybook         # build estático em storybook-static/
pnpm add:shadcn <nomes...>   # baixa componente(s) do shadcn/ui oficial
pnpm add:shadcn all          # baixa todos os componentes oficiais
pnpm add:registry <ref>      # baixa componente de um registro de terceiros
```

## Adicionando componentes

Cada componente declara sua origem no campo `source` do `meta.json`, propagado para o
`registry.json`:

| `source`      | Significado                                                        |
| ------------- | ------------------------------------------------------------------ |
| `shadcn`      | componente oficial vendorizado sem alterações                      |
| `customized`  | componente oficial com ajustes nossos                              |
| `original`    | componente criado do zero aqui                                     |
| `third-party` | componente de outro registro (exige `origin` com a URL/ref)        |

### Do shadcn/ui oficial

```bash
pnpm add:shadcn button card alert-dialog
pnpm add:shadcn all   # todos de uma vez
```

O script roda o `shadcn add` de verdade (instalando as dependências npm), move o resultado de
`components/ui/<nome>.tsx` para `src/core/<nome>/<nome>.tsx` e cria um `meta.json` stub com
`"source": "shadcn"`. Depois, edite descrição, categoria e tags.

Como o `components.json` usa `"style": "aria-nova"`, a versão baixada já vem baseada em
react-aria-components. Com `all`, o script usa a flag `--all` do próprio CLI e descobre os
componentes pelo que de fato caiu na pasta de staging.

### De um registro de terceiros

```bash
# por URL direta (qualquer registro shadcn-compatível)
pnpm add:registry https://exemplo.com/r/fancy-button.json

# por namespace (configure "registries" em packages/ui/components.json)
pnpm add:registry @acme/fancy-button
```

```json
{
  "registries": {
    "@acme": "https://exemplo.com/r/{name}.json"
  }
}
```

O `meta.json` sai com `"source": "third-party"` e `"origin"` apontando para a ref usada.
**Confira a licença do registro de origem antes de republicar.**

### Customizando ou criando

- **Customizar:** edite o `.tsx` e mude `meta.json` para `"source": "customized"`.
- **Criar:** crie `src/core/<nome>/` com `<nome>.tsx`, `meta.json` (`"source": "original"`) e
  `<nome>.stories.tsx`.

## Anatomia de um componente

```
src/core/<nome>/
  <nome>.tsx           → código
  meta.json            → metadata (categoria, status, source, tags, descrição)
  <nome>.stories.tsx   → story do Storybook (obrigatória)
```

Exemplo de `meta.json` (validado contra `ComponentMetaSchema` em
`packages/registry/src/schema.ts`):

```json
{
  "name": "button",
  "category": "forms",
  "status": "stable",
  "source": "shadcn",
  "description": "Displays a button, or a component that looks like one...",
  "tags": ["form", "interactive", "react-aria"]
}
```

Convenções:

- **`description` é a única fonte da descrição.** O `registry.json` e a story
  (`parameters.docs.description.component: meta.description`) leem dela; não duplique o texto.
- **`cn`** vem do pacote npm [`cn`](https://github.com/shadcn-ui/cn)
  (`import { cn } from "cn"`). `src/lib/utils.ts` é só um re-export, mantido por compatibilidade.
- **Outros componentes do registro** são importados via `@/core/<outro>/<outro>`.
- **Dependências são detectadas automaticamente** a partir dos imports
  (`detectNpmDependencies` e `detectRegistryDependencies` em `gen-registry-json.ts`): qualquer
  pacote novo entra sozinho em `dependencies` / `registryDependencies`. O pacote só precisa
  estar em `packages/ui/package.json`.
- **API react-aria:** `isDisabled` em vez de `disabled`, `onPress` em vez de `onClick`, sem
  `asChild`.
- **Variantes de estado** (`data-checked:`, `data-selected:`, `data-open:`...) dependem do CSS
  de variantes customizadas de `shadcn/tailwind.css`; veja o comentário em
  `packages/ui/src/styles.css`.

### Tokens de estado: accent × muted

Seguimos a definição da [doc de theming do shadcn](https://ui.shadcn.com/docs/theming), para
que cada tema controle a cor de interação de forma coerente em todos os componentes:

| Token | Uso | Exemplos |
| --- | --- | --- |
| `accent` / `accent-foreground` | Superfície de **interação**: hover, focus, item ativo/selecionado | item de menu/select/combobox/command em foco, linha de tabela em hover ou selecionada, dia de hoje e meio de intervalo no calendário |
| `muted` / `muted-foreground` | Superfície **estática** sutil e texto secundário | zebra e coluna fixada da tabela, footer, skeleton, descrições, placeholders |
| `primary` | Seleção de alta ênfase | dia selecionado, pontas de um intervalo |

Regras:

- Estado interativo usa `bg-accent` com `text-accent-foreground` (ou `bg-accent/50` sem trocar o
  texto, para hover leve de linha). Nunca `bg-muted` nem `bg-foreground/N`.
- Os estilos `*-nova` do shadcn divergem da própria doc (calendar e command com `muted`, e o
  `aria-nova` pinta itens em foco com `bg-foreground/10` no popover, sobrescrevendo o
  `bg-accent` do item). Ao vendorizar/atualizar um componente, confira e corrija isso.
- O gate `packages/ui/tests/interaction-tokens.test.ts` verifica componentes `customized` e
  `original` e todos os blocos. Exceções vão no `ALLOWED` desse teste, com o motivo; hoje são
  os controles com cara de botão ghost (badge, triggers do menubar e navigation-menu), que
  acompanham o `Button` e continuam `muted`, e o segmento em foco do date-field.

## Storybook e testes

```bash
pnpm storybook                               # dev server, porta 6006
pnpm --filter @fma-ui/ui build-storybook     # build estático
```

Os testes rodam no Vitest com dois projects (`packages/ui/vitest.config.ts`):

- **`unit`** (`pnpm test`): ambiente Node, sem navegador. Cobre:
  - funções puras dos scripts (`tests/gen-registry-json.test.ts`);
  - **gate estrutural** (`tests/registry-consistency.test.ts`): todo componente em `src/core/`
    precisa de `meta.json` válido e de um `<nome>.stories.tsx` ao lado;
  - **gate de dependências** (`tests/registry-dependencies.test.ts`): as dependências declaradas
    no `registry.json` precisam bater com os imports reais, e todo pacote importado precisa
    estar instalado.
- **`storybook`** (`pnpm --filter @fma-ui/ui test:storybook`): roda as stories como testes de
  interação num Chromium headless via Playwright (`@storybook/addon-vitest`). A story **é** o
  teste: use `play` functions com `storybook/test`, sem arquivo `.test.tsx` separado. Não roda
  no CI de PR, para manter o job leve.

## Temas

Temas curados ficam em `packages/ui/src/themes/<nome>.json` (schema `ThemeSchema` em
`src/lib/theme/schema.ts`): cores de light/dark para **todos** os tokens de
`tests/required-tokens.ts`, `radius` e, opcionalmente, `fonts`, `spacing`, `letterSpacing` e
`shadow`. O que não for definido fica com o valor do `styles.css` (ou do Tailwind).

- O gerador publica cada um como item `registry:theme` chamado `theme-<nome>`; o consumidor
  instala com `npx shadcn add @fma-ui/theme-<nome>` (o CLI reescreve `:root`/`.dark` e o
  `@theme inline` do CSS dele).
- **Fontes**: as do catálogo (`GOOGLE_FONTS` em `src/lib/theme/fonts.ts`) entram no item como
  dependências `@fontsource/<slug>` + um `@import` por peso, então `shadcn add` já instala e
  carrega as fontes no app consumidor. Fonte fora do catálogo só aparece na nota `docs` do
  item; temas curados só podem usar fontes do catálogo (o teste confere). Fonte nova no
  catálogo: confirme que `@fontsource/<slug>` existe com os pesos de `catalogWeights`.
- `default.json` espelha o `styles.css`; o teste `themes.test.ts` falha se divergirem.
- Todo tema novo entra na lista de `src/themes/index.ts` (o teste confere).
- Gate de contraste (`themes.test.ts`): texto principal ≥ 4.5:1, preenchimentos com texto
  (`primary`, `muted-foreground`, status…) ≥ 3:1, em light e dark.
- Os nossos `destructive/info/success/warning-foreground` são **texto sobre o fundo tingido** da
  cor (badge `*-light`), não texto sobre a cor sólida como no shadcn/tweakcn.
- Tema de terceiros: `"source": "third-party"` + `origin`, e uma linha na tabela de
  `src/themes/THIRD_PARTY_NOTICES.md` (com a licença). Os atuais vêm do
  [tweakcn](https://github.com/jnsahaj/tweakcn) (Apache-2.0).

No Storybook, o seletor de tema (ícone de pincel) aplica um tema a todas as stories, e
`design/Themes` mostra todos lado a lado.

### Editor de temas (`apps/web`, rota `/themes`)

`pnpm dev` e abra `http://localhost:3000/themes` (ou `?preset=<nome>`). Inspirado no tweakcn:
carrega um tema curado ou importa um (CSS do shadcn/tweakcn, item de registro por URL como
`https://tweakcn.com/r/themes/<id>.json`, ou JSON exportado aqui), edita cores por modo,
fontes (Google Fonts), tracking, radius, spacing, sombras e ajuste HSL global, com
undo/redo (Ctrl+Z) e contraste ao vivo. O preview usa os nossos componentes reais. Exporta
`index.css`, só as variáveis, o item `registry:theme` (instalável com
`npx shadcn add ./theme-<nome>.json`) ou o JSON do tema — que, salvo em
`packages/ui/src/themes/`, vira tema curado.

**Todo token de tema tem que ser editável aqui.** A cadeia é verificada automaticamente:
variável em `styles.css` → algo que um `Theme` consegue gerar (`src/lib/theme/css.ts`) →
controle no editor (`COLOR_GROUPS` para cores, `FONT_CONTROLS` para fontes, painéis do
`apps/web` para o resto). `tests/theme-editor-coverage.test.ts` cobre os dois primeiros elos e
as cores/fontes; o type-check do `apps/web` (`SETTINGS_COVERED` em `editor.tsx`) falha se um
campo novo do `ThemeSchema` não tiver controle. O CI de PR roda os dois.

Os testes e2e do editor ficam em `apps/web/e2e/` (Playwright, contra o build de produção):
`pnpm --filter web test:e2e`. O CI de PR roda num job próprio. Mudou o comportamento do
editor? Atualize ou acrescente um teste lá.

O editor aplica o tema no `<html>` inteiro (inclusive no próprio painel), para que popovers e
dialogs portados para o `<body>` também o recebam. A lógica (estado, histórico, HSL) fica em
`packages/ui/src/lib/theme/editor.ts`, com testes unitários.

## Gerando e publicando o registro

```bash
pnpm build
# ou só o pacote ui:
pnpm --filter @fma-ui/ui build
```

Isso roda, em sequência:

1. `tsc --noEmit`: type-check.
2. `generate:registry`: varre `src/core/**/meta.json` (e libs, hooks, blocos e
   `src/themes/*.json`) e escreve `packages/ui/registry.json`.
3. `registry:build`: roda `shadcn build`, que compila o `registry.json` em
   `apps/web/public/r/<nome>.json`, o formato consumido pelo CLI do shadcn.

> **`registry.json` e `apps/web/public/r/` são gerados: não edite à mão.** Depois de mudar
> qualquer componente, rode o build e **commite os arquivos gerados junto**.

Para testar o consumo localmente:

```bash
pnpm dev   # apps/web na porta 3000
# em outro projeto, com "registries": { "@fma-ui": "http://localhost:3000/r/{name}.json" }
# no components.json:
npx shadcn add @fma-ui/button
```

Os itens instalam em `components/fma-ui/`, `hooks/fma-ui/` e `lib/fma-ui/` e dependem uns dos
outros por `@fma-ui/<nome>` (veja `scripts/gen-registry-json.ts`). O CLI reescreve os imports
entre itens para esses caminhos, mas só quando o import nomeia um arquivo: importe libs em pasta
por um arquivo (`@/lib/date-fns-compat/index`), nunca pela pasta — o teste
`registry-consistency` barra isso.

## Git hooks e CI

Hooks do [lefthook](https://lefthook.dev) (instalados automaticamente no `pnpm install`) espelham
localmente o que o CI garante:

- **pre-commit:** `lint` (Biome nos arquivos staged) → `type-check` → `registry-check` (quando
  `packages/ui/src/core/**` muda: rebuilda e falha se o registro estiver fora de sincronia).
- **pre-push:** `type-check` → `test` → `build` → `build-storybook`.

O CI (`.github/workflows/registry-check.yml`) é o gate real:

- **em PRs:** roda os testes unitários, rebuilda o registro e falha se `registry.json` ou
  `apps/web/public/r/` estiverem desatualizados;
- **em push no `main`:** roda o build completo.

Não use `--no-verify`; corrija a causa.

## Commits e pull requests

- [Conventional Commits](https://www.conventionalcommits.org) em inglês, atômicos, com escopo
  quando fizer sentido: `feat(ui): ...`, `fix(web): ...`, `chore(devcontainer): ...`,
  `test(ui): ...`, `ci: ...`, `docs: ...`.
- Estilo de código garantido pelo Biome: 2 espaços, aspas duplas, ponto e vírgula, trailing
  commas, largura 100. Rode `pnpm exec biome check --write <arquivos>` para corrigir.
- Antes de abrir um PR:

  ```bash
  pnpm lint && pnpm type-check && pnpm test && pnpm --filter @fma-ui/ui build
  git status   # inclua registry.json / public/r se mudaram
  ```

## Notas de versão

- **TypeScript 7** removeu `baseUrl` (use só `paths`, relativo ao tsconfig) e não faz mais
  auto-discovery de `@types/node` em pacotes com `scripts/` fora de `src/`. Por isso
  `packages/ui/tsconfig.json` declara `"types": ["node"]` explicitamente.
- **nitro** está fixado em `3.0.260903-beta` (sem `^`) de propósito: a tag `latest` aponta para
  essa beta e não existe stable mais nova que a `3.0.0`, antiga demais para o
  `@tanstack/react-start` atual. Fixei na versão validada (`vite build` com o preset
  `cloudflare_module` + `wrangler dev` respondendo `/` e `/r/button.json`) para não flutuar para
  uma beta futura sem aviso.
