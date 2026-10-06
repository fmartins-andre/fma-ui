# Relatório — issues #19–#26 (2026-10-05)

Execução não supervisionada. Todas as 8 issues abertas foram fechadas; 11 PRs mergeados
(#27–#37), cada um com CI verde e hooks de pre-commit/pre-push passando. Arquivo não commitado.

## Resumo por issue

| Issue | PR(s) | O que foi feito |
|---|---|---|
| #19 atalhos do event-calendar | #27 | M/W/D/A/R e os números dos presets trocam a visão. Escuta nativa em capture (o react-aria bloqueia o keydown nos botões). Respeita `shortcutsScope`. |
| #21 menubar | #28 | Com um menu aberto, hover em outro gatilho ou ←/→ abre o vizinho. |
| #23 navigation-menu | #29, #30 | `openOnHover` opcional (peek não-modal) + `NavigationMenuIndicator`. |
| #25 status experimental | #31 | drawer → stable; questionnaire e message-scroller continuam experimental. |
| #20 header do data-grid no escuro | #32 | **Bug real** encontrado e corrigido (ver abaixo). |
| #26 customizações do EMITTE | — (comentário na issue) | Nenhuma customização perdida. |
| #22 data-grid | #33 | Linha expandida + arrastar coluna. Auto-size medido não foi feito. |
| #24 event-calendar stable | #34, #35, #36, #37 | Lint sem exceções, criação por teclado, testes que faltavam, story de configurações → `stable`. |

## Decisões e ressalvas (para validar)

**#19** — A issue dizia que `shortcutsScope` não tinha sido portado, mas ele já existia; implementei os dois
escopos. Os atalhos são ignorados com modificadores, em campos editáveis e em dialog/menu/listbox.

**#21 menubar** — O popover do react-aria é modal e deixa o resto da página `inert`, então o
hover nos outros gatilhos não chega e o foco do menu antigo cai no `body`. Solução: `pointermove`
no document comparando com o retângulo dos gatilhos, e o foco é levado para o menu novo (primeiro item quando
a troca é por teclado). **Validar à mão** a sensação do hover entre menus.

**#23 navigation-menu** — Aberto por hover, o menu é um "peek" não-modal (`role="group"`, não rouba foco,
não trava o scroll). Clicar no gatilho "fixa" o menu como dropdown modal normal; o Popover é remontado via `key`,
porque trocar a modalidade sem remontar fazia o react-aria fechá-lo. O fechamento por hover usa `pointermove`
no document. O viewport animado (estilo Radix) não foi feito: cada dropdown é um Popover próprio.
Nas stories, `userEvent.hover` não funciona com react-aria no runner (ele reporta (0,0)), então as stories
disparam os pointer events à mão.

**#25** — O upstream (aria-nova) continua em base-ui / @shadcn/react, com código idêntico ao nosso
(fora as transformações do CLI) e sem marcar nada como experimental: a marcação era nossa. drawer foi para stable
(`@base-ui/react` 1.8); os outros dois continuam experimental porque `@shadcn/react` está em 0.3. Adicionei
uma play function ao message-scroller, que não tinha nenhuma.

**#20 (achado importante)** — Com `.dark` no `<html>` (como faz o Storybook), o header novo e o antigo
ficam iguais (≈ rgb 21). **Com `.dark` numa subárvore**, `var(--color-muted)` resolvia no `:root`, no tema
claro, e o header ficava branco (rgb 251) no modo escuro. Troquei por `var(--muted)`/`var(--background)` e
corrigi o mesmo padrão no event-calendar (`--color-primary`, `--color-border`). Ficaram de fora `drawer` e
`scroll-area`, que são shadcn sem alterações e têm o mesmo padrão: avaliar se vale customizá-los.

**#26** — Comparei 60 pares com o shadcn base-nova normalizado. As diferenças são versões mais antigas no
EMITTE, transformações do CLI, canonicalização do Tailwind, lint e JSDoc. O relatório completo está no comentário da issue.

**#22 data-grid**
- `renderExpandedRow` + `DataGridRowExpand` (com `getRowCanExpand`). A tabela passou a usar
  `disabledBehavior="selection"`: linhas desabilitadas continuam focáveis, o que também muda o comportamento
  de linhas não selecionáveis (antes não recebiam foco).
- `DataGridTable` agora é genérico: `<DataGridTable<User> …>` para tipar `row.original`.
- `columnsDraggable`: o arraste é só por ponteiro (teclado continua pelo menu "Move"). O teste usa
  DragEvent sintético. **Validar o arraste real no navegador.**
- Com linhas expansíveis, a virtualização passa a usar `estimatedRowHeight`. Essa combinação não foi testada.
- Auto-size medido não foi implementado (a própria issue já previa isso).

**#24 event-calendar**
- Lint: o override do biome foi removido. Os `!` viraram guards; 2 `void` e 3 superfícies só-ponteiro
  ficaram com `biome-ignore` justificado.
- Teclado: `showDayAddButton` agora também aparece nos cabeçalhos de dia do time-grid, com rótulo que inclui a data
  (novo `labels.addEventOn`). Não existe na visão de recursos.
- Testes novos: resize, arraste entre recursos, ocorrência única (padrão override com
  `recurringEventId`/`originalStart`, que o store já suportava) e fuso horário.
- Story `Settings` portada (idiomas en/pt-BR/de/ja/ar, com RTL no árabe).
- Status `stable`. Continua valendo: as visões são grades de `div` com roles (modelo do reui).

## O que validar manualmente
1. Menubar: troca de menus no hover e com ←/→ (foco no item certo).
2. Navigation menu: `openOnHover` (atrasos, passar do gatilho para o conteúdo, fixar com clique) e o indicador.
3. Data grid: arrastar colunas com o mouse; linha expandida (também com virtualização).
4. Data grid e event-calendar com `.dark` numa subárvore.
5. Event calendar: story `Settings` (RTL em árabe), botões "+" com Tab, atalhos de visão.
