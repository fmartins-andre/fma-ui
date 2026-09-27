# @fmartinsandre/ui

Biblioteca de componentes pessoal, 100% compatível com o formato de registro do
[shadcn/ui](https://ui.shadcn.com). Três tipos de componente convivem aqui:

- **shadcn** — componentes oficiais vendorizados como estão.
- **customized** — componentes oficiais com ajustes seus.
- **original** — componentes totalmente seus.

O tipo de cada um fica declarado em `meta.json` (`source: "shadcn" | "customized" | "original"`)
e é propagado pro `registry.json` gerado.

Estrutura inspirada no [BaseLayer](https://github.com/zwgnr/BaseLayer). Base de
interação: **react-aria-components**, via o suporte oficial do próprio shadcn CLI
(`shadcn init --base aria`, style `aria-nova` em `components.json`) — não é porte
manual nosso, é o que a CLI já gera quando pedida. `pnpm add:shadcn <nome>` já traz
a versão react-aria-components direto, porque nosso `components.json` está com
`"style": "aria-nova"`.

> **Nota:** `cn()` não é mais função nossa — vem do pacote npm
> [`cn`](https://github.com/shadcn-ui/cn) (`import { cn } from "cn"`), mantido pelo
> time do shadcn (substitui clsx+tailwind-merge). `packages/ui/src/lib/utils.ts` é só
> um re-export dele, mantido por convenção/compat. O gerador de registry detecta
> dependências de import genericamente (`detectNpmDependencies` em
> `gen-registry-json.ts`) — qualquer pacote novo que um componente importe entra
> sozinho, sem precisar editar o script.

> **Nota 2:** componentes que usam variantes de estado tipo `data-checked:`,
> `data-selected:`, `data-open:`, `data-closed:` (switch, checkbox, accordion...)
> precisam do CSS de variantes customizadas que vem em `shadcn/tailwind.css`. `button`
> e `card` não precisam (só usam `hover:`/`aria-invalid:`/`aria-expanded:`, nativos do
> Tailwind) — ver comentário em `packages/ui/src/styles.css` pra quando isso mudar.

## Estrutura

```
packages/
  registry/   → schemas zod do formato shadcn registry.json (@fmartinsandre/registry)
  ui/         → os componentes em si (@fmartinsandre/ui)
    src/core/<nome>/<nome>.tsx   → código do componente
    src/core/<nome>/meta.json    → metadata (categoria, status, source, tags, descrição)
    scripts/gen-registry-json.ts → gera registry.json a partir de src/core/**/meta.json
    scripts/add-shadcn.ts        → baixa componente(s) oficiais do shadcn/ui
    scripts/add-from-registry.ts → baixa componente(s) de um registro de terceiros
apps/
  web/        → TanStack Start; serve os itens finais em /r/<nome>.json
```

## Fluxo de trabalho

### 1. Baixar um componente oficial do shadcn/ui

```bash
pnpm add:shadcn button card "alert-dialog"
```

Isso roda o `shadcn add` de verdade (instala as deps npm que o componente precisa) e
reorganiza o resultado de `components/ui/<nome>.tsx` (formato padrão do shadcn) pro
nosso formato `src/core/<nome>/<nome>.tsx`, criando um `meta.json` stub com
`"source": "shadcn"`. Edite a descrição/categoria/tags depois.

### 1b. Baixar um componente de um registro de terceiros (pra republicar no seu)

```bash
# por URL direta do item (funciona com qualquer registro shadcn-compatível)
pnpm add:registry https://exemplo.com/r/fancy-button.json

# por atalho de namespace (precisa configurar "registries" no packages/ui/components.json)
pnpm add:registry @acme/fancy-button
```

Pra usar o atalho de namespace, adicione em `packages/ui/components.json`:

```json
{
  "registries": {
    "@acme": "https://exemplo.com/r/{name}.json"
  }
}
```

Diferente do `add:shadcn`, aqui o `meta.json` sai com `"source": "third-party"` e
`"origin"` apontando pra URL/ref que você passou — serve pra rastrear de onde veio
e **confira a licença do registro de origem antes de republicar**. O script não
tenta adivinhar o nome do componente: ele pega o que de fato caiu na pasta de
staging depois do `shadcn add`, então também funciona pra blocos com nomes que não
batem com o ref passado.

### 2. Customizar ou criar um componente original

Edite o `.tsx` normalmente. Se partiu de um componente do shadcn, mude
`meta.json` → `"source": "customized"`. Se é seu do zero, crie a pasta
`src/core/<nome>/` com `<nome>.tsx` + `meta.json` (`"source": "original"`).

Componentes usam `cn()` do pacote `cn` (`import { cn } from "cn"`) e podem importar
outros componentes do registro via `@/core/<outro>/<outro>` — o gerador detecta
essas dependências automaticamente (`registryDependencies`).

### 2b. Storybook, testes e docs

Cada componente é uma pasta autocontida em `src/core/<nome>/`:

```
src/core/<nome>/
  <nome>.tsx           → código
  meta.json            → metadata (fonte de verdade da descrição/categoria/tags)
  <nome>.stories.tsx   → story do Storybook (obrigatória — ver gate abaixo)
```

`meta.json.description` é a **única** fonte da descrição — o `registry.json`
(via `gen-registry-json.ts`) e a story (`parameters.docs.description.component`)
os dois leem dela, em vez de duplicar o texto em dois lugares (diferente do que
o EMITTE faz, com JSDoc em inglês + `docs.description` em português repetindo o
mesmo conteúdo).

```bash
pnpm --filter @fmartinsandre/ui storybook        # dev server, porta 6006
pnpm --filter @fmartinsandre/ui build-storybook  # build estático em storybook-static/
```

Testes rodam via Vitest com dois "projects" (`packages/ui/vitest.config.ts`):

- **`unit`** (`pnpm --filter @fmartinsandre/ui test`) — ambiente Node, sem browser.
  Cobre funções puras dos scripts (`tests/gen-registry-json.test.ts`) e um gate
  estrutural (`tests/registry-consistency.test.ts`): **todo componente em
  `src/core/` precisa ter `meta.json` válido contra `ComponentMetaSchema` e um
  `<nome>.stories.tsx` colocado ao lado** — falha o teste (e o CI) se faltar. É
  o gate que o registro do EMITTE não tem (lá, cobrir uma story é convenção, não
  verificado automaticamente).
- **`storybook`** (`pnpm --filter @fmartinsandre/ui test:storybook`) — roda as
  próprias stories como testes de interação num Chromium headless via Playwright
  (`@storybook/addon-vitest`), usando `play` functions dentro da story
  (padrão emprestado do EMITTE: a story É o teste de interação, sem arquivo
  `.test.tsx` separado). Exige `pnpm exec playwright install chromium` uma vez;
  não roda no CI de PR pra manter o job leve — só `test` (unit) roda lá.

### 2c. Git hooks (lefthook)

Espelha localmente (feedback rápido) o que o CI já garante — o CI continua sendo
o gate real, não-contornável. `lefthook.yml` na raiz, instalado automaticamente
via `"prepare": "lefthook install"` (roda no `pnpm install`). Inspirado no
`lefthook.yml` do EMITTE, adaptado: um único step de lint (Biome faz
format+lint juntos, sem prettier/eslint separados) e `registry-check` roda o
build-e-diff direto inline em vez de um script separado.

- **`pre-commit`**: `lint` (Biome nos arquivos staged) → `type-check` → `registry-check`
  (só quando `packages/ui/src/core/**` muda — rebuilda e falha se `registry.json`/`public/r`
  ficarem fora de sincronia com o que foi commitado).
- **`pre-push`**: `type-check` → `test` → `build` → `build-storybook` — rede de segurança
  mais pesada antes de qualquer push.

### 3. Gerar e publicar o registro

```bash
pnpm build
# equivalente, rodando só no pacote ui:
pnpm --filter @fmartinsandre/ui build
```

Isso roda, em sequência:
1. `tsc --noEmit` — type-check.
2. `generate:registry` — varre `src/core/**/meta.json` e escreve `packages/ui/registry.json`.
3. `registry:build` — roda `shadcn build`, que compila `registry.json` em arquivos
   individuais `apps/web/public/r/<nome>.json` (formato que o CLI do shadcn consome).

O CI (`.github/workflows/registry-check.yml`) falha se `registry.json` ou
`apps/web/public/r/` estiverem desatualizados em relação ao código-fonte.

### 4. Consumir o registro em outro projeto

Com `apps/web` publicado (Vercel, Netlify, etc.) ou rodando local (`pnpm dev`, porta 3000):

```bash
npx shadcn add https://seu-dominio.com/r/button.json
# local:
npx shadcn add http://localhost:3000/r/button.json
```

`cn` (o pacote npm) entra sozinho na lista de `dependencies` do item — o `shadcn add`
do consumidor instala junto, sem precisar de um item de registro separado pra isso.

## Node / pnpm

- Node: LTS Krypton (24.x) — `.nvmrc` fixa `24.21.0` pro dev local; `engines.node`
  no `package.json` (`>=24.14.0 <25.0.0`) aceita qualquer patch da mesma LTS.
- pnpm: `>=10.12.1 <11.0.0`, com `packageManager` fixando `10.12.1` exato via corepack.
- `.npmrc` tem `engine-strict=true` — instalar com Node/pnpm fora do range **falha**
  (`ERR_PNPM_UNSUPPORTED_ENGINE`), não só avisa.
- `preinstall` roda `npx -y only-allow pnpm` — `npm install`/`yarn install` são
  bloqueados na hora.

## Comandos

```bash
pnpm install       # instala tudo
pnpm dev           # turbo dev em todos os pacotes/apps
pnpm build         # build completo (inclui gerar + compilar o registro)
pnpm lint          # biome, via turbo
pnpm type-check    # tsc --noEmit em todos os pacotes
pnpm test          # vitest --project unit em todos os pacotes, via turbo
pnpm add:shadcn <nomes...>  # baixa componente(s) do shadcn/ui oficial
```

## Stack

- pnpm workspaces + turborepo
- Tailwind v4 (CSS-first, tokens em `packages/ui/src/styles.css`)
- react-aria-components + class-variance-authority + `cn` (base oficial `aria`,
  preset visual `nova` do shadcn CLI — `pnpm dlx shadcn@latest init --base aria`)
- TanStack Start (`apps/web`) servindo os arquivos estáticos `public/r/*.json`
- Biome (lint + format)
- TypeScript 7 (compilador nativo) + zod v4 + `@types/node` 26

## Notas de versão

- **TypeScript 7** removeu `baseUrl` (usar só `paths` relativo ao tsconfig) e, pelo
  menos nesta versão, não faz mais auto-discovery de `@types/node` em pacotes com
  `scripts/` fora de `src/` — por isso `packages/ui/tsconfig.json` tem
  `"types": ["node"]` explícito.
- **nitro** está fixado em `3.0.260903-beta` (sem `^`) de propósito: a tag `latest`
  do pacote aponta pra essa beta (não existe stable mais novo que `3.0.0`, que é
  velho demais e não foi testado com a versão atual do `@tanstack/react-start`).
  Fixei exato na versão que validei rodando (`vite build` + `node .output/server/index.mjs`
  respondendo `/` e `/r/button.json`), em vez de deixar `"latest"` flutuar pra uma
  beta futura sem aviso.
