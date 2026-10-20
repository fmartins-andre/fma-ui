# Plano: cobrir o Painel Contábil v2 com o fma-ui

Objetivo: o `emitte.painel-contabil-v2.frontend` passar a usar **só** componentes e blocos deste
registro, sobrando para o app apenas dados, regras de negócio e arranjo.

Este documento lista **o que falta aqui**, não o mapeamento das telas do app. A análise cobriu o
app inteiro (layout, ~70 rotas, 504 `.tsx`) em `32ff742`.

## Princípio

**O fma-ui é a regra de UI; os apps se adaptam a ele.** O painel é fonte de *necessidades*, não de
*referência visual*. Para cada item:

1. Identificar o problema que o app resolve (o quê, para quem, em que contexto).
2. Desenhar a solução **consistente com o que já existe aqui**: mesmos tokens, variantes, tamanhos,
   espaçamentos, API react-aria, composição por partes, estados de loading/vazio/erro, a11y.
3. Generalizar: a solução deve servir a qualquer app da nova geração, não só ao painel.
4. Onde o app diverge do nosso padrão (cor, hierarquia, animação, comportamento), **o app muda**.

Exemplos do que *não* se replica: sidebar em `bg-primary`, ícones com `animate-bounce`/`ping`,
badges com cores fixas por tela, slider com o logo da marca no thumb, painéis com gradiente,
variantes `tertiary`/`success`/`warning` sólidas em botão, hover com `bg-muted`.

Cada item abaixo traz a **necessidade** (o que o app precisa) e a **direção** (como resolver aqui).
O desenho detalhado de cada um é feito no próprio PR.

## Decisões

- **Formulários**: o registro entrega só as primitivas (`field`, inputs react-aria). A integração
  com react-hook-form/zod fica no app. Todo input novo funciona controlado (`value`/`onChange`)
  dentro de `Field` + `FieldError`.
- **Blocks genéricos**: nada de domínio contábil em nomes ou APIs. As stories mostram o cenário do
  painel como exemplo, usando dados genéricos plausíveis.
- **Tema sóbrio**: os tokens extras do app (`primary-dark`, `primary-lighter`, `secondary-*`,
  `muted-light`...) não entram; o app usa só os tokens semânticos atuais.
- **Textos padrão em inglês, traduzidos por i18n**: todo texto embutido tem default em inglês,
  como os componentes existentes, e é sobrescrevível por prop (padrão `i18n`/`labels` do
  `data-grid`, ou uma prop de rótulo). O app passa as traduções pt-BR onde precisar. As stories
  mostram o uso em pt-BR passando essas props.
- **Fora de escopo por ora**: temas das outras marcas (safeweb, efacil, iob) e o host do iframe de
  integração (`cross-origin-iframe`).

## O que já está coberto

O app troca pelo nosso equivalente e **adota a API e o visual daqui** (react-aria: `isDisabled`,
sem `asChild`, `LinkButton` no lugar de `Button asChild > Link`).

| Necessidade no app                                         | No fma-ui                                    |
| ---------------------------------------------------------- | -------------------------------------------- |
| accordion, alert-dialog, avatar, card, carousel, chart, collapsible, popover, scroll-area, separator, sheet, skeleton, switch, tabs, textarea, toggle, tooltip, input-otp, label | componentes homônimos |
| botões de ação primária, secundária, discreta e destrutiva | `button` (`default`/`secondary`/`outline`/`ghost`/`destructive`) |
| badges de status coloridos                                 | `badge` `*-light` / `*-outline`              |
| badges de status neutro                                    | **falta** — A9                               |
| avisos inline de status                                    | `alert` (`info`/`success`/`warning`/`destructive`) |
| tabelas com paginação server-side, colunas fixas, skeleton, clique na linha | `data-grid` (com `i18n`)    |
| paginação de listas                                        | `DataGridPagination` (tabelas), `pagination` (listas avulsas, ex.: notificações) |
| seleção simples, com busca e múltipla                      | `select` (com busca), `combobox`             |
| data, intervalo e mês/ano de referência                    | `date-picker` (`granularity="month"` para mês/ano) |
| CPF, CNPJ, CPF/CNPJ, CEP, telefone, moeda                  | `masked-input` + `input-masks` (validade de cartão: A4) |
| navegação lateral do app                                   | `sidebar` + `app-sidebar` (A1)               |
| trilha de navegação                                        | `breadcrumb` (+ B3)                          |
| carregando (texto, bloco, botão)                           | `skeleton`, `spinner`                        |
| estado vazio / "nenhum resultado"                          | `empty` + `icon-stack`                       |
| toasts, inclusive de progresso                             | `sonner`                                     |
| consumo de cota (notas/certificados disponíveis)           | `progress`                                   |
| filtros rápidos ligáveis                                   | `toggle-group` (multi)                       |
| linhas de lista com mídia, título, descrição e ações       | `item`                                       |
| painel lateral de filtros                                  | `sheet` `side="right"` (+ B6)                |

## Componentes novos (`src/core`)

| ID | Nome               | Necessidade → direção |
| -- | ------------------ | --------------------- |
| C1 | `password-input`   | Campos de senha com mostrar/ocultar (login, nova senha, certificado A1). → `input-group` + botão de ícone com rótulo acessível; sem depender do toggle nativo do navegador. |
| C2 | `password-rules`   | Mostrar ao usuário quais regras de senha já foram cumpridas. → Lista de regras com estado neutro/cumprida/não cumprida via ícone + texto (não só cor), helper puro `evaluatePasswordRules`, anúncio para leitor de tela. |
| C3 | `file-upload`      | Enviar um arquivo (certificado `.pfx`) arrastando ou selecionando; outros apps vão querer múltiplos arquivos, imagens com preview e progresso. → Estado e validação no hook `use-file-upload` do reui (ver abaixo); área de drop e seletor com react-aria `DropZone` + `FileTrigger`; partes `FileUpload`, `FileUploadDropzone`, `FileUploadTrigger`, `FileUploadList`/`FileUploadItem` (ícone `file-type` ou thumbnail, nome, tamanho, `progress` opcional, remover com rótulo acessível); erros em `FieldError`. Visual nosso, sem copiar os exemplos do reui. |
| C4 | `description-list` | Pares rótulo/valor em resumos de compra, plano, certificado e entidade selecionada. → `<dl>` semântico com layouts em linha e empilhado, tipografia e espaçamento do `card`. |
| C7 | `credit-card`      | Mostrar o cartão salvo e pré-visualizar ao vivo o que está sendo digitado (frente e verso). → Portar a apresentação do `react-credit-cards-2` (MIT): proporção de cartão, chip, logo e cor da bandeira, número/titular/validade posicionados, virar para o verso ao focar o CVV. Em Tailwind e componente react, sem o CSS global da lib; detecção da bandeira com `credit-card-type` (a mesma dependência da lib). Cores de bandeira entram como conteúdo, como no `file-type`; cartão sem bandeira usa tokens. Tamanho por `className`, textos pt-BR, `focused` controlado. `source: "third-party"` com `origin`. |
| C8 | `loading-overlay`  | Bloquear a interação durante uma operação longa (salvar, trocar status). → Overlay de escopo (container ou página) com `spinner` e rótulo, `aria-busy`, sem animação de marca. |
| C9 | `glance` ✅      | Informação rápida com mais contexto a um clique (avisos de conta, saldo, contagem de pendências). → **Feito** (branch `feat/glance`): gatilho compacto (ícone + rótulo/valor, ou só ícone com `GlanceIndicator`) em `tone` semântico como o `alert`, sem animação; popover com dialog (`GlanceHeader`/`Media`/`Title`/`Description`/`Footer`), foco e Escape do react-aria. |
| C10 | `tab-nav`        | Navegar entre as subpáginas de uma área — **padrão único**, substituindo o menu vertical lateral do app (detalhes do cliente: 6 subpáginas; minha conta: 5) e as "abas" de fundo `primary` de `/dashboard/notas-fiscais`, certificados digitais e notas adicionais. São menus de rota com cara de abas, não abas: não há painéis. → `<nav>` com links react-aria (`aria-current="page"` pela rota, `RouterProvider`), com o visual das nossas `tabs` (`tabsListVariants`: `default` segmentado em `muted`, `line`), ícone opcional, `TabNavSeparator` opcional entre grupos, rolagem horizontal mantendo o item atual visível. Vai no slot de navegação do `page-header` (B3). Stories `Default`, `Line`, `WithIcons`, `Grouped`, `Overflow`. |

**C3 com o reui `use-file-upload` (validado).** O item `@reui/use-file-upload`
(`https://reui.io/r/use-file-upload.json`) é um `registry:hook` headless, sem dependências, sob
MIT (itens gratuitos do reui; o `event-calendar` já veio de lá). Os 10 exemplos do site são só
composições com Button/Alert/Progress/Badge, não um componente. Serve de base, com estas condições:

- Entra como `src/hooks/use-file-upload.ts` com `source: "third-party"` e `origin` apontando para o
  reui, via `pnpm add:registry`, com as correções abaixo e testes unit próprios.
- Bugs a corrigir: `return` dentro do laço de duplicados descarta o lote inteiro (deveria ser
  `continue`); `maxFiles` e duplicados comparam com `state.files` da closure (desatualizado em
  adições seguidas); `onFilesChange` chamado dentro do updater do `setState` (roda duas vezes no
  StrictMode); preview criado para todo arquivo mas revogado só para imagens (vaza object URL);
  `maxSize` validado duas vezes.
- Adaptações ao nosso padrão: mensagens de erro sobrescrevíveis (i18n), retornando
  código + arquivo em vez de só string; modo controlado (`value`/`onChange`) além de
  `initialFiles`, como os demais inputs; `isDisabled`; os handlers de drag DOM saem, porque o drop
  passa a ser do `DropZone` do react-aria (teclado, colar e anúncios para leitor de tela, que o
  reui não tem).
- O hook não faz upload. Progresso e "tentar de novo" ficam como estado por arquivo controlado
  pelo consumidor.
- Primeira entrega cobre o caso do painel (um arquivo, `accept=".pfx,.p12"`) e lista com
  progresso; galeria, avatar e imagens ordenáveis (com o nosso `sortable`) ficam como stories
  posteriores.

## Ajustes em itens existentes

| ID  | Item          | Necessidade → direção |
| --- | ------------- | --------------------- |
| A1  | `app-sidebar` | Itens com estado de acesso (bloqueado por pagamento/plano, em breve, novo, sem permissão), externos; card de consumo do plano no rodapé; menu do usuário no header. → **Em discussão na [issue #99](https://github.com/fmartins-andre/fma-ui/issues/99)**: modelo de estado, comportamento de clique, linguagem visual, sidebar recolhida, a11y. Também cobre `external`, seção sem título, `footer` como slot, `user` opcional e `logo` com `href`. |
| A2  | `slider`      | Escolher quantidades em degraus com atalhos para valores comuns. → `marks` com rótulo (clicável leva o valor à marca) e formatador do valor exibido; thumb padrão. |
| A3  | `checkbox`    | Grupos de opções marcáveis. → Exportar `CheckboxGroup` (react-aria). |
| A4  | `input-masks` | Validade de cartão. → Modo `mm/yy` no preset `date` (ou preset `card-expiry`). |
| A5  | `data-grid`   | Ações por linha sem disparar o clique da linha; pré-carregar o detalhe ao passar o mouse. → `DataGridRowActions` (menu com `dropdown-menu`, estado "sem ações"); `onRowHover` opcional. |
| A8  | `carousel`    | Banners rotativos que avançam sozinhos (topo de Certificados digitais e Notas adicionais). → Prop `autoplay` (`boolean \| { delay }`) com comportamento acessível por padrão: botão pausar/retomar rotulado (WCAG 2.2.2), pausa com hover e foco dentro do carrossel, desligado com `prefers-reduced-motion`, slide atual anunciado sem interromper (`aria-live="off"` enquanto roda). Implementado com a API do embla (timer + `scrollNext`), sem dependência nova; o `plugins` atual continua para outros casos. Story `Autoplay` com `play` cobrindo pausa por botão e por foco. |
| A9  | `badge`       | Status neutro (inativo, pendente, indefinido, já lido) e status como ponto + texto (itens de `select` de status, listas densas). → Variantes `muted` e `muted-outline`, e a família `*-dot` (`primary-dot`, `success-dot`, `warning-dot`, `info-dot`, `destructive-dot`, `muted-dot`): sem fundo nem borda, texto `foreground` e ponto na cor semântica via `before:` (não depende só da cor: o texto é o rótulo). Sem token novo; hover de badge-link com `accent` (regra 11). Stories `Semantic` e `Dot`. Substitui o antigo C5 (`status-dot`). |
| A10 | i18n          | ~~Trocar os defaults para pt-BR~~ — **descartado**: os defaults ficam em inglês e a tradução entra pelas props de i18n de cada componente. |
| A11 | `field` + `checkbox`/`radio-group` | Escolher entre poucas opções ricas, em cards com ícone, título e descrição (módulos do cliente, meio de pagamento, tipo de pessoa). → Sem componente novo: é o padrão "choice card" do shadcn (`FieldLabel` envolvendo um `Field`), cujo CSS já está no nosso `field` e é o que o reui `c-checkbox-14` usa. Falta torná-lo válido com react-aria: hoje `Checkbox`/`Radio` renderizam o próprio `<label>`, que fica aninhado no `FieldLabel` (HTML inválido) — por isso o controle vira o próprio card: partes `CheckboxCard` e `RadioCard` nos itens existentes, com a superfície em `choiceCardClassName` do `field`; o hover usa `bg-muted/50` e passa a `accent` (regra 11), o que torna o `field` `customized`. Seleção única com `RadioGroup`, múltipla com `CheckboxGroup` (A3); indicador no formato do controle (quadrado para checkbox), não redondo como no reui. Stories `ChoiceCard` nos três componentes, com `icon-tile`. |

Uso de A9 no app (~12 pontos, hoje `muted` ou `tertiary`): cliente cancelado; nota fiscal sem
autorização/cancelamento; status padrão de certificados e DAS a vencer, certificados comprados
(compra e agendamento pendente), DAS MEI, faturas do plano e notas adicionais; tipo de documento
nas últimas notas; notificação lida. A família `*-dot` substitui o `DotStatus` do seletor de
situação do cliente (ativo/bloqueado/cancelado).

## Blocks novos (`src/blocks`)

Cada bloco: `meta.json`, stories por cenário (incluindo os do painel), textos padrão em inglês sobrescrevíveis (i18n),
tokens de interação da regra 11, sem estado de servidor (tudo por props/callbacks).

### Shell

- **B1 `app-header`** — *Necessidade*: topbar com acesso ao usuário, notificações e avisos de conta
  (plano gratuito, fatura em atraso, pendência financeira, saldo de cashback) que levam a uma ação.
  *Direção*: header do `SidebarInset` com `SidebarTrigger`, slot de título/breadcrumb e slot de
  ações, onde entram `glance`s (C9). Onde fica o menu do usuário (header ou rodapé da sidebar, que
  já tem `NavUser`) e como tratar o saldo de cashback ficam para a
  [issue #99](https://github.com/fmartins-andre/fma-ui/issues/99). Story `AppShell` com
  `app-sidebar` + `app-header` + conteúdo.
- **B2 `notification-center`** — *Necessidade*: ver e tratar notificações recentes sem sair da tela,
  e uma página com todas. *Direção*: `NotificationMenu` montado sobre o `glance` (C9): gatilho só
  ícone com `GlanceIndicator` e contagem no `aria-label`; painel com `item`s, ações "marcar como
  lida"/"apagar", vazio e "ver todas". `NotificationList` para a página (data, status A9, ações,
  `pagination`, loading e vazio). Urgentes usam B10.

### Página

- **B3 `page-header`** — *Necessidade*: todas as telas têm breadcrumb + título + ações. *Direção*:
  `breadcrumb`, `h1` com skeleton, descrição, slot de ações e slot de navegação (`tab-nav`, C10);
  empilha no mobile.
- **B4 `stat-cards`** — *Necessidade*: totais no topo de listas e painéis (clientes por situação,
  notas por status, saldos por período); em listas, os totais às vezes **filtram** a listagem.
  *Direção*: `Stat` (rótulo, valor formatado pelo app, ícone em `icon-tile` `soft`, descrição,
  `isLoading`, `isUnavailable`; `tone` semântico tinge ícone **e** valor; `size="lg"` para um
  saldo em destaque), sem superfície, para vários valores num card; `StatGrid` (colunas
  `auto-fit`). Cards: `StatCard` (estático), `StatCardButton` (`onPress` ou gatilho de
  `DialogTrigger`), `StatCardLink` (navega) e `StatCardGroup` + `StatCardToggle` (filtro:
  `ToggleButtonGroup` com `selectionMode` `single` = rádios ou `multiple` = checkboxes,
  controlado por `selectedKeys`, mapeável num search param). Borda colorida e ícone sólido do app
  não entram; variação (↑/↓) só se aparecer, via `StatDescription` + `badge`.
- **B5 `panel-card`** (antes `dashboard-card`) — *Necessidade*: cards de painel com título, ajuda,
  hora da atualização, filtros e conteúdo (gráfico, mini tabela, totais) com loading, vazio e erro.
  *Direção*: `card` com cabeçalho padronizado (ícone, título, `status` em `badge`, descrição, ajuda
  num botão ⓘ que abre `popover` — toque e teclado —, "Atualizado em…" via `Intl` + `i18n`,
  `isRefreshing` com spinner sem tirar o conteúdo da tela, toolbar como slot) e corpo que alterna
  loading/vazio (`empty`)/erro (`isError` + `onRetry`)/conteúdo; rodapé é o `CardFooter`. O card com
  vários valores e seletor de período (resumo de cashback) e o de saldo com alerta e ação são
  composições com B4 (`StatGrid`/`Stat size="lg"`), nas stories. A toolbar é só um slot: controles
  específicos de cada card (ex.: anterior/próxima nos cards de certificados e DAS a vencer de
  `/dashboard/gestao-mei`) ficam no app, compostos com `button`.
- **B6 `filter-toolbar`** — *Necessidade*: listas com busca, filtros rápidos, filtros avançados,
  filtros ativos visíveis e atualizar. *Direção*: bloco genérico (serve ao `data-grid` e a qualquer
  lista) de partes controladas uma a uma (`value`/`onChange`, cada uma mapeável num search param):
  `FilterToolbar` (layout que empilha no mobile), `FilterSearch` (dispara no Enter e ao limpar;
  `debounceMs` opcional), `FilterQuickToggles` (`toggle-group`), `FilterSheet` (`sheet` com os
  `Field`s como children, "Aplicar"/"Limpar", contagem no gatilho; o rascunho fica no app),
  `FilterChips` (removíveis um a um + "Limpar filtros") e `FilterRefresh`. A célula de entidade
  (avatar + nome + documento) fica no app: só uma tabela a usa. Status usa `badge`; ações, A5.
- **B7** — *removido*: o menu vertical lateral das áreas com subpáginas sai do padrão; todas
  passam a usar o `tab-nav` (C10) no cabeçalho (B3).
- **B8 `settings-form`** — *Necessidade*: formulários de edição longos em seções, salvando só quando
  há mudança. *Direção*: seções com título e descrição empilhados acima dos campos (o app tem
  sidebar, então a largura fica para os campos, em grade de duas colunas quando cabe) e barra de salvar fixa no fim da tela
  com estado (sem alterações / não salvas / salvando), Descartar opcional (`onReset`) e Salvar;
  props `isDirty`, `isPending`, `onSubmit`. Aviso ao sair com alterações fica no app.
- **B9** — *absorvido pelo B5*: mostrar o estado de um recurso (certificado digital, plano atual)
  com detalhes e ações é um `panel-card` com `status` (`badge`) no cabeçalho, `description-list`
  no corpo, problema num `alert` dentro do card (nunca recolorindo o card), ausência como
  `emptyState` com a ação que adiciona, e ações no `CardFooter` (remover via `confirm-dialog`).
  Valor longo (nº de série) trunca com botão de copiar. Stories no B5. O status de integração de
  módulo já é um `alert`.

### Fluxos

- **B10 `use-dialog-promise` + `confirm-dialog`** — *Necessidade*: confirmações, avisos e diálogos
  pequenos com entrada e validação, aguardados com `await` (22 usos no app). Hoje a promise só
  devolve `boolean`, o que gera contornos: promise paralela com variável de closure para obter a
  data do vencimento do DAS; `closeDialog({ resolveWith: true })` sem dizer qual das três opções
  de "usar cashback" foi escolhida; checkbox do diálogo de assinatura gravando num store global;
  Escape bloqueado porque cancelar e dispensar dão o mesmo resultado. *Direção*, em camadas:
  1. **Hook `use-dialog-promise`** (`registry:hook`, sem dependências): `useDialogPromise<D, V>()`
     devolve um controlador `{ data, isPending, dialogProps, open(data), confirm(value | () =>
     Promise<V>), cancel(), bind() }`. `open` devolve `Promise<DialogResult<V>>`, uma união
     `{ status: "confirmed"; value } | { status: "cancelled" } | { status: "dismissed" }`
     (Escape/clique fora), o que libera o Escape em todos os diálogos. `confirm` assíncrono mantém
     o diálogo aberto com `isPending` e não fecha em erro. Testes unit + `expectTypeOf`.
  2. **O diálogo é JSX declarativo e independente**: um componente do app recebe o controlador
     (ou `bind()`) e usa `alert-dialog`, `dialog` ou `sheet` com `isOpen`/`onOpenChange`; título,
     corpo, validação (inclusive react-hook-form no app) e botões são livres. Renderizado fora dos
     menus de ação das tabelas, sobrevive ao fechamento do menu.
  3. **`ConfirmDialog`** (componente): o sim/não pronto sobre o hook (`title`, `description`,
     `tone`, rótulos sobrescrevíveis, ação destrutiva).
  4. **Depois, se aparecer uso real**: `confirm()` + `<ConfirmHost />` para disparar de qualquer
     lugar (notificações urgentes, sair com alterações), com store interno via
     `useSyncExternalStore` (como o `sonner`), sem zustand, devolvendo o mesmo `DialogResult`.

  Stories: o sim/não, um diálogo com data validada, um com várias saídas (`action` no `value`), e
  ação assíncrona com erro.
- **B11 `form-wizard`** — *Necessidade*: cadastros em etapas, em diálogo (cliente, 4 etapas) e em
  página (contador, 7 etapas). *Direção*: `stepper` + painéis + rodapé Voltar/Próximo/Concluir;
  `step` controlado e `onNext` assíncrono que pode barrar o avanço; funciona em `dialog` e em `card`.
- **B12 `auth`** — *Necessidade*: login, esqueci a senha, redefinir com código e cadastro.
  *Direção*: só a estrutura — `AuthLayout` (área de marca como slot + coluna com logo e card, no
  padrão dos blocos de login do shadcn), `AuthCard`, `AuthSubmit` e `ResendCode` (reenvio com
  contagem); os campos são do app (C1, C2, `input-otp`) e aparecem nas stories de login, esqueci a
  senha e redefinição em **duas etapas** (o servidor valida o código, depois a nova senha). Cadastro
  na story `SignUp`, em etapas com B11.
- **B13 `order-summary`** — *Necessidade*: resumo de compra com itens, benefício aplicável
  (brinde, saldo de cashback), descontos e total antes de confirmar. *Direção*: por partes
  (`OrderSummaryLine`, `OrderSummaryOption` com `switch`) numa `description-list`, total e CTA por
  props; card sticky na coluna lateral em telas grandes e, menores, barra fixa embaixo com total + CTA
  que abre os detalhes num sheet; descontos e total com hierarquia tipográfica (não só cor); stories
  de aplicar saldo e de entidade selecionada.
- **B14 `plan-builder`** — *Necessidade*: montar um plano escolhendo quantidades por recurso e ver o
  preço em tempo real; comprar pacotes por quantidade. *Direção*: um bloco para os dois casos.
  `PlanBuilder` é só o layout (recursos à esquerda, `summary` = `order-summary` B13 à direita) com
  `isCalculating`, que vira skeleton em cada `PlanPrice`; `PlanResource` é o card (ícone,
  título, descrição, `slider` controlado com marcas A2, `hint`, add-ons como filhos e `accordion`
  "o que está incluso" opcional); `PlanResourceAddon` é o switch de add-on (validador
  tributário). Preço, debounce, regras de estoque e avisos ficam no app. O estoque vira a prop
  `limit` do `slider` (core): escala e marcas até `maxValue`, valor parado no limite, trecho
  acima tracejado e marcas acima desabilitadas, `description` lida com o valor — sem diálogo de
  "quantidade indisponível". Stories `CustomPlan` (confirma via B10), `QuantityPurchase` (notas
  adicionais) e `Blocked`.
- **B15 `payment-card`** — *Necessidade*: ver/remover o cartão salvo e cadastrar outro. *Direção*:
  C7 + `description-list` + remover via B10; formulário com pré-visualização ao vivo e máscaras (A4).
  Campos prontos (`TextField` react-aria controláveis, ligados à prévia por valor e foco): número
  com máscara por bandeira, nome (um campo; `part="first"`/`"last"` para gateways que separam),
  validade `MM/YY` e código do tamanho da bandeira. Validação pela lib `credit-card-validation`
  (C7), no app; react-hook-form via `Controller`.
- **B16 `feature-promo`** — *Necessidade*: telas de recurso bloqueado/oferta (notas adicionais,
  radar, contratar plano, suporte, onboarding de cobrança). *Direção*: bloco de partes sobre uma
  superfície de card: título (`h2`), parágrafos, lista de benefícios com `icon-tile`, ações e mídia
  opcional. `layout="split"` (mídia ao lado, some com o card estreito) ou `"centered"`; grade
  opcional de largura total para choice cards (A11), `item`s com `href` (atalhos como "onde usar o
  saldo") ou cards que explicam opções. `FeaturePromoAcceptance` (checkbox card) trava os botões das
  ações até o aceite, via contexto. Sem gradientes ou imagens de fundo: a mídia é um painel com
  moldura.
- **B17 `error-pages`** — *Necessidade*: página não encontrada, sem permissão e erro inesperado
  com nova tentativa. *Direção*: sobre `empty` + `icon-stack`, em página inteira ou dentro do
  layout; detalhes técnicos em `collapsible`.

## Fica no app (fora do registro)

- Integração react-hook-form/zod e o renderizador por config.
- `cross-origin-iframe` (protocolo `emitte-host-service`) — reavaliar depois.
- Guardas de rota, dados de usuário/plano, hooks de API, SEO, Intercom, Clarity, assets e textos de
  marca.
- Ícones `@fmartins.andre/emitte-icons`: os blocks recebem ícones como `ReactNode`; o registro não
  depende do pacote.

## Progresso

Implementados (um PR por item):

| Item | Branch |
| --- | --- |
| C9 `glance` | `feat/glance` |
| A9 `badge` neutro e `*-dot` | `feat/badge-neutral-dot` |
| A3 `CheckboxGroup` | `feat/checkbox-group` |
| A4 máscara `mm/yy` | `feat/mask-card-expiry` |
| C1 `password-input` | `feat/password-input` |
| C2 `password-rules` | `feat/password-rules` (sobre C1) |
| C4 `description-list` | `feat/description-list` |
| C8 `loading-overlay` | `feat/loading-overlay` |
| A5 `DataGridRowActions` + `onRowHover` | `feat/data-grid-row-actions` |
| C10 `tab-nav` | `feat/tab-nav` |
| B3 `page-header` | `feat/page-header` (sobre C10) |
| B10 `use-dialog-promise` + `confirm-dialog` | `feat/dialog-promise` |
| B2 `notification-center` | `feat/notification-center` |
| B6 `filter-toolbar` | `feat/filter-toolbar` |
| B4 `stat-cards` | `feat/stat-cards` |
| B5 `panel-card` (+ B9) | `feat/dashboard-card` (sobre B4) |
| C3 `file-upload` + `use-file-upload` | `feat/file-upload` |
| A11 `CheckboxCard` / `RadioCard` | `feat/choice-card` |
| A2 `slider` com `marks` | `feat/slider-marks` |
| B8 `settings-form` | `feat/settings-form` |
| B11 `form-wizard` | `feat/form-wizard` |
| B12 `auth` | `feat/auth` |
| B13 `order-summary` | `feat/order-summary` |
| B14 `plan-builder` (+ `limit` no `slider`) | `feat/plan-builder` |
| C7 `credit-card` + lib `credit-card-validation` | `feat/credit-card` |
| B15 `payment-card` | `feat/payment-card` (sobre C7) |
| B16 `feature-promo` | `feat/feature-promo` |

## Ordem de execução

Um PR por item contra `main`; `gh stack` só quando um item depende de outro ainda não mergeado
(dependências entre parênteses).

1. **Fundação**: A9, C1, C2, C4, C8, A3, A4, A5, C10, B10, B3 (C10).
2. **Shell**: A1, B1 (A1, C9), B2 (C9, B10). Ao fim, o app já troca o layout inteiro.
3. **Listas e painéis**: B4, B5 (B4; inclui B9), B6 (A5).
4. **Formulários e fluxos**: C3, A11 (A3), A2, B8, B11, B12 (C1, C2, B11), B13 (C4), B14 (A2, B10).
5. **Restante**: C7, B15 (C7, A4, B10), B16 (A11), B17, A8.

Pronto = `pnpm lint && pnpm type-check && pnpm test && pnpm --filter @fma-ui/ui build`, story com
`play` cobrindo a interação principal, registro regenerado no mesmo commit.
