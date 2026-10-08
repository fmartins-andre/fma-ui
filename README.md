<div align="center">

# fma-ui

**Componentes React acessíveis, prontos pra copiar pro seu projeto.**

Um registro de componentes compatível com o [shadcn/ui](https://ui.shadcn.com), construído sobre
[react-aria-components](https://react-spectrum.adobe.com/react-aria/) e estilizado com Tailwind CSS v4.

[Instalação](#instalação) · [Componentes](#componentes) · [Por que fma-ui?](#por-que-fma-ui) · [Contribuindo](CONTRIBUTING.md)

![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white)
![react-aria-components](https://img.shields.io/badge/react--aria-components-e1251b?logo=adobe&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)
![shadcn compatible](https://img.shields.io/badge/shadcn-compatible-000000?logo=shadcnui&logoColor=white)

</div>

---

## O que é

O **fma-ui** não é uma biblioteca que você instala do npm e importa. É um **registro**: cada
componente é entregue como código-fonte direto no seu projeto, via o CLI do shadcn. O código é
seu: leia, ajuste, apague o que não usa.

```bash
npx shadcn@latest add @fma-ui/button
```

Pronto: `components/fma-ui/button.tsx` cai no seu projeto, com as dependências npm já
instaladas.

## Por que fma-ui?

- **♿ Acessibilidade de verdade.** Todo componente interativo é construído sobre
  react-aria-components, a base da Adobe. Teclado, foco, leitores de tela, toque e
  internacionalização funcionam desde o primeiro render.
- **🧩 Compatível com o ecossistema shadcn.** Mesmo formato de registro, mesmo CLI, mesmo
  visual (preset `nova`). Se você já usa shadcn/ui, não há nada novo pra aprender.
- **📦 Sem lock-in.** Você recebe código, não um pacote. Nenhuma dependência do fma-ui fica no
  seu `package.json`.
- **🔗 Dependências resolvidas sozinhas.** Cada item declara exatamente os pacotes npm e os outros
  componentes de que precisa; o `shadcn add` instala tudo junto.
- **🎨 Tailwind v4, CSS-first.** Tokens de design em variáveis CSS, com tema claro e escuro.
- **✅ Testado e documentado.** Cada componente tem uma story no Storybook com testes de
  interação rodando em navegador real.

## Instalação

### 1. Prepare o projeto

Se o seu projeto ainda não usa shadcn/ui, inicialize com a base react-aria:

```bash
npx shadcn@latest init --base aria
```

### 2. Registre o namespace

Uma vez, no `components.json` do projeto:

```json
{
  "registries": {
    "@fma-ui": "<site-url>/r/{name}.json"
  }
}
```

`<site-url>` é a URL onde o site (`apps/web`) está publicado — a variável
`FMA_UI_SITE_URL` do build (veja `.env.example`); a página de cada componente no site mostra o
snippet já preenchido.

É obrigatório: os itens dependem uns dos outros por `@fma-ui/<nome>`, e é o namespace que faz
o CLI buscá-los aqui, e não no registro oficial do shadcn.

### 3. Adicione componentes

```bash
npx shadcn@latest add @fma-ui/button @fma-ui/dialog @fma-ui/select
```

Tudo é instalado em pastas próprias: `components/fma-ui/`, `hooks/fma-ui/` e `lib/fma-ui/`
(blocos em `components/fma-ui/<bloco>/`). Os componentes oficiais do shadcn continuam em
`components/ui/`, então um `shadcn add` de lá nunca sobrescreve um componente do fma-ui, e os
dois convivem no mesmo projeto.

### 4. Use

```tsx
import { Button } from "@/components/fma-ui/button";

export function Example() {
  return <Button onPress={() => alert("Olá!")}>Clique aqui</Button>;
}
```

> **Atenção:** os componentes seguem a API do react-aria-components, não a do Radix. Por exemplo,
> é `isDisabled` em vez de `disabled`, e `onPress` em vez de `onClick`. Para um link com cara de
> botão, use `LinkButton` no lugar de `asChild`.

## Componentes

70 componentes, 2 blocos e as libs e hooks que eles usam, organizados por categoria:

| Categoria       | Componentes |
| --------------- | ----------- |
| **Formulários** | button · calendar · checkbox · combobox · date-field · date-picker · field · input · input-group · input-otp · label · masked-input · native-select · radio-group · select · simple-time-picker · slider · switch · textarea |
| **Botões**      | button-group · toggle · toggle-group |
| **Overlays**    | alert-dialog · command · context-menu · dialog · drawer¹ · dropdown-menu · hover-card · popover · sheet · tooltip |
| **Navegação**   | breadcrumb · menubar · navigation-menu · pagination · sidebar · stepper · tabs |
| **Dados**       | avatar · badge · carousel · chart · data-grid · icon-tile · kbd · table · timeline |
| **Feedback**    | alert · empty · icon-stack · progress · skeleton · sonner · spinner |
| **Layout**      | card · direction · item · resizable · scroll-area · separator |
| **Disclosure**  | accordion · collapsible |
| **Chat**        | attachment · bubble · marker · message · message-scroller¹ · questionnaire¹ |
| **Mídia**       | aspect-ratio |
| **Blocos**      | app-sidebar · event-calendar¹ |
| **Libs**        | date-availability · date-fns-compat · date-granularity · input-masks · interval-helpers · type-helper · types |
| **Hooks**       | use-available-date-correction · use-mask · use-mobile |

¹ experimental: a API ainda pode mudar.

O índice completo, legível por máquina, fica em
`<site-url>/r/registry.json`.

## Explore no Storybook

Para ver todos os componentes, variantes e tokens de design (cores, tipografia, espaçamento,
raio e sombra) rodando localmente:

```bash
git clone https://github.com/fmartins-andre/fma-ui.git
cd fma-ui
pnpm install
pnpm storybook   # http://localhost:6006
```

## Feito com

[react-aria-components](https://react-spectrum.adobe.com/react-aria/) ·
[Tailwind CSS v4](https://tailwindcss.com) ·
[class-variance-authority](https://cva.style) ·
[`cn`](https://github.com/shadcn-ui/cn) ·
[lucide](https://lucide.dev) ·
[shadcn CLI](https://ui.shadcn.com/docs/cli) ·
[TanStack Start](https://tanstack.com/start) ·
[Storybook](https://storybook.js.org) ·
[Vitest](https://vitest.dev) ·
[Biome](https://biomejs.dev) ·
[Turborepo](https://turbo.build)

Estrutura inspirada no [BaseLayer](https://github.com/zwgnr/BaseLayer). Componentes base
derivados do [shadcn/ui](https://ui.shadcn.com).

## Contribuindo

Quer adicionar um componente, corrigir um bug ou entender como o registro é gerado? Veja o
[**guia de contribuição**](CONTRIBUTING.md).
