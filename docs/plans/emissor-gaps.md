# Plano: cobrir o Emissor (protótipo 24) com o fma-ui

Objetivo: o `emitte.emissor.frontend` passar a usar **só** componentes e blocos deste registro,
como já planejado para o painel contábil ([`painel-contabil-gaps.md`](painel-contabil-gaps.md)).

Fonte: o protótipo navegável "Emitte Standalone (24)" (23 entradas de menu, ~40 modais, drawers e
fluxos), conferido contra o app real em `69099c618`. O documento lista **o que falta aqui** e
**onde o protótipo diverge do padrão**; o mapeamento tela a tela, com capturas, fica num documento
visual à parte (fora do repositório, porque mostra o produto).

Todos os itens foram revisados um a um e combinados em 2026-10-20: a seção "A implementar" é o
escopo fechado. O critério aplicado na revisão: só vira componente ou bloco o que tem uso real e
repetido no app; o que só telas novas usariam, ou o que se compõe com o que já existe, vira story ou
orientação de uso.

## Princípio e decisões

Valem os do plano do painel: o fma-ui é a regra de UI e o app se adapta; o protótipo é fonte de
*necessidades*, não de *referência visual*; blocks genéricos (nada de domínio fiscal em nomes ou
APIs); tema sóbrio sem tokens extras; textos padrão em inglês traduzidos por props de i18n;
formulários só com as primitivas (react-hook-form/zod no app). Primitivas vendorizadas só mudam
quando não houver composição razoável, e com teste de regressão contra re-vendorização.

O que o protótipo traz e **não** se replica: gradientes em banners, cards e cabeçalhos de diálogo
(plano "Ouro"/"Platina", sucesso verde, promo azul→verde); borda colorida lateral ou superior em
cards (stat cards, extensões, avisos); fundo tingido em card de métrica; botão sólido de cor fixa
por plano; `animate-pulse` em botão de play; cores próprias por categoria, por tipo de documento e
por tipo de benefício; emoji como ícone (🔒, 🗑️); ícone sem rótulo acessível (olho, download);
rótulo que só existe no `title`; botão desabilitado sem motivo.

## Validação contra o app real

| No protótipo | No app hoje | Leitura |
| --- | --- | --- |
| Produtos: cards de diagnóstico, drawer "Corrigir", análise | Existem (`pages/Produtos/components/product-diagnostics`, `features/cadastros/produtos/diagnostico`). Os cards **filtram** a lista (`isSelected` + `onClick`); o drawer usa `RadioCard` agrupado por CST com botão "Detalhes" **dentro** do card | O protótipo regrediu os cards para estáticos. Correção automática (switch + confirmação) e a fila de análise são novas |
| Listas e formulários de NF-e, NFC-e, NFS-e, CT-e, MDF-e | Existem (MUI v4). Emissão em abas livres, painéis montados, "Avançar" sem validar, "Salvar rascunho" sempre, validação ao emitir | Mesmas necessidades; "em homologação"/"em contingência" no app é um **aviso**, não um botão |
| Planos (anual/mensal, 3 planos) | Existe (`pages/Planos`: abas, tabela, tabela mobile) | Confirma B22 |
| Listas editáveis | `useFieldArray` em 13 arquivos (parcelas/duplicatas, destinatários de e-mail, rastreio e exportação do item, documentos referenciados, defensivos agrícolas, fatura, boleto) | Confirma B23 |
| Copiar para a área de transferência | 15 arquivos (copia-e-cola do Pix, chave de acesso) | Confirma C14 |
| Ajuda ao lado de campos | `HelpTooltip` (7 usos, só hover) e `ModalHelpStatus` | Confirma A13 |
| Termos de compra | `components/checkout/.../terms-checkbox`: um checkbox controlado | O aceite não precisa de componente próprio |
| QR Code | Pix nos Planos, checkout externo e nota duplicata: o backend devolve o QR **como imagem** + o texto copia-e-cola | Ninguém gera QR no navegador; o que se repete é a apresentação (imagem + código + copiar) |
| Busca de cliente/produto/entidade | `AutoComplete` em 112 arquivos | Necessidade real, resolvida por composição (story) |
| Extensões e carrinho, Recebimentos/SmartTEF, Eventos fiscais (NT 2025.002), Imóveis (NFS-e de locação), CIOT com lista e emissão próprias, solicitação de acesso do contador, Assistente IA, dashboard de diagnóstico, seleção em lote nas listas | **Não existem** (o CIOT hoje é só um modal no MDF-e) | Necessidades novas; entram pelo que pedem de UI |

## A implementar

### Componentes novos (`src/core`)

| ID | Nome | Necessidade → direção |
| -- | ---- | --------------------- |
| C14 | `copy-button` | Copiar um valor longo demais para digitar: protocolo, token de ativação, chave de acesso, copia-e-cola do Pix, nº de série (B9). No registro o mesmo botão já existe **quatro vezes**, cada um de um jeito: `CodeBlockCopyButton` (o mais completo: `value`, `timeout`, `onCopy`/`onCopyError`, `labels`; trata a falha, mas ela só vira `data-copy-failed`, sem rótulo, ícone nem anúncio), `ColorPickerCopy` e `ErrorDetails` do `error-pages` (voltam em 1,5 s, ignoram a falha) e o `CopyValueButton` da story do `panel-card` (timer sem limpeza, ignora a falha). Nos quatro o "Copiado" só troca o `aria-label` do botão focado, o que leitores de tela em geral não anunciam. → `CopyButton`, partindo da API do `CodeBlockCopyButton` (ícone, `ghost`/`icon-sm`) com `value` (texto ou função), rótulos traduzíveis (`copy`/`copied`/`failed`), ✓ temporário com timer limpo ao desmontar, sucesso e falha anunciados numa região `aria-live` à parte, `onCopy`/`onCopyError` e `tooltip` opcional; hook `useCopyToClipboard` exportado no mesmo arquivo para outros gatilhos (item de menu "Copiar chave de acesso"). `code-block`, `color-picker` e `error-pages` passam a usá-lo sem mudar a API deles (todos ganham feedback e anúncio de falha), e a story do `panel-card` também. Stories: valor simples, ao lado de valor truncado, falha e `QrCode` (imagem do QR vinda do servidor com `alt` + código + copiar + status "aguardando leitura" com `spinner` em `role="status"`). |

### Ajustes em itens existentes

| ID | Item | Necessidade → direção |
| --- | ---- | --------------------- |
| A12 | `RadioCard` / `CheckboxCard` (só stories) | Opção com ação secundária ("Detalhes" da classificação, que abre um diálogo) e opções agrupadas por título (CST), no drawer "Corrigir". Hoje o botão fica **dentro** do `<label>` (interativo aninhado; o app real contorna com `stopPropagation`). → **Sem mudar a API** das primitivas (um slot `action` incharia as duas por uma tela): composição documentada em stories no `radio-group` (e citada no `checkbox`). `ChoiceCardWithAction`: wrapper `relative`, o `RadioCard` com `pe-*` e o `Button` como irmão posicionado no canto, com `aria-describedby` no título da opção; `play` verifica que "Detalhes" não seleciona. `ChoiceCardGroups`: `FieldSet` + `FieldLegend` dentro do `RadioGroup`. Reavaliar um slot se o padrão se repetir. |
| A13 | `field` → `FieldHelp` | Explicar um campo ou uma coluna sem ocupar espaço: ~39 "?" no protótipo (Gerar boleto, Operação pessoal, Reforma Tributária, CIB, % de copropriedade, "Status ⓘ" das listas), que lá são só ícone sem comportamento; no app, `HelpTooltip` abre só no hover (sem teclado nem toque, `<span>` sem nome) e o "Status ⓘ" abre um modal próprio. → Parte nova e aditiva do `field`, extraída do padrão que o `panel-card` já tem (botão `ghost` `icon-xs` + `popover`): botão de ícone ⓘ que abre `popover` (toque, clique e teclado; tooltip não serve no celular nem para duas frases), com `label` obrigatório e traduzível que nomeia o assunto ("Mais informações: CIB"). Fica **ao lado** do `FieldLabel` ou do cabeçalho de coluna, nunca dentro (seriam interativos aninhados). O `panel-card` passa a usá-lo no lugar do ⓘ próprio; hoje o rótulo dele é fixo (`labels.help`), e na migração passa a nomear o assunto com o título do card ("Mais informações: Notas emitidas"), sem quebrar quem já passa `labels.help`. Stories: com `FieldLabel`, com `switch` e no cabeçalho do `data-grid` (composição, sem mudar o `DataGridColumnHeader`). |
| A14 | `data-grid` → `DataGridSelectionBar` | Ações em lote nas listas de NF-e e CT-e (emitir MDF-e/CIOT com as notas selecionadas). O grid já seleciona e mantém a seleção entre páginas; falta mostrar o que está selecionado. O protótipo usa uma barra azul-escura própria, não anuncia a contagem e não avisa que parte da seleção está em outras páginas. → Parte aditiva (como `DataGridRowActions`) que lê a tabela pelo contexto: aparece com seleção, "N selecionados" em `role="status"` e "(M em outras páginas)" quando for o caso, ações como `children`, "Limpar seleção", rótulos pelos `labels` do grid, superfície `muted`. Story com `play`: selecionar, trocar de página, conferir contagem e anúncio, limpar. |
| A18 | `sheet` → `size` | Painéis laterais com conteúdo denso: Corrigir produto e Histórico de eventos (~620px), filtros (~420px), carrinho (~390px). Hoje o lado direito/esquerdo para em 384px (`data-[side=right]:sm:max-w-sm`), e um `className` de largura do consumidor **perde** (o seletor de atributo é mais específico e o `tailwind-merge` não o remove). Bug existente: o `filter-toolbar` passa `sm:max-w-md` ao painel de filtros e ele abre com 384px (medido no Storybook). → Prop `size` para `left`/`right`: `sm` (padrão, 384px, igual a hoje), `md` (~448px), `lg` (~640px); o limite passa a ser sobrescrevível por `className`. O `filter-toolbar` usa `size="md"` (corrige o bug). Sem efeito em `top`/`bottom`. O `sheet` vira `customized`. **Testes de regressão** (um `pnpm add:shadcn sheet` não pode apagar a prop sem ninguém notar): story `Sizes` com `play` medindo a largura de cada `size` e verificando que um `className` de largura do consumidor é respeitado; a story do `filter-toolbar` confere que o painel abre com a largura `md`; e um teste unit em `tests/` que renderiza o `Sheet` com cada `size` e checa o atributo/classe aplicado, falhando se a prop sumir. O uso de `size` no `filter-toolbar` também quebra o type-check se a prop for removida. |

### Blocks novos (`src/blocks`)

- **B22 `pricing-plans`** — *Necessidade*: a tela de planos, em que o usuário escolhe um entre os
  planos fixos disponibilizados (o app tem `pages/Planos`: abas anual/mensal, tabela e tabela mobile
  separadas). *Referência*: o Pricing 4 do shadcnblocks (gratuito, com variante react-aria) tem a
  estrutura certa, mas a licença não deixa claro se pode ser republicado num registro público, então
  serve só de referência; o bloco é nosso. *Direção*: **selecionar e depois confirmar** — período
  (anual/mensal) com `toggle-group` controlado; os planos são um `RadioGroup` de cards (`RadioCard`):
  nome, descrição, preço e período, preço equivalente ("R$ 718,80 por ano"), destaque por `badge`
  ("Mais popular") e borda `primary` (não um card escuro), lista de recursos incluídos/não incluídos
  com ícone **e** texto acessível ("não incluído"); um resumo com o plano escolhido e "Continuar"
  (`order-summary`, B13), que pode seguir para os add-ons do `plan-builder` (B14). Só planos fixos: o
  "monte seu plano" continua no `plan-builder`. Empilha no mobile (uma lista só, sem tabela mobile à
  parte). Preços, períodos e recursos vêm do app.
- **B23 `collection-field`** — *Necessidade*: montar uma lista **com edição inline** dentro de um
  formulário: adiciona-se um item e ele é editado ali mesmo. No app são 13 `useFieldArray`, cada um
  com a própria UI; no protótipo, formas de pagamento da NFC-e (total/pago/restante), parcelas padrão
  do imóvel, contratantes do CIOT.
  *Fora do escopo*: a lista de **edição prévia**, em que o item só entra no array já preenchido
  (pelo fluxo de salvamento) e é editado num diálogo, sendo exibido depois em tabela ou lista; essa
  é composição de `data-grid`/`item` + `dialog`/`use-dialog-promise`.
  *Direção* (só UI; linhas, estado e validação no app via `fields`/`append`/`remove`):
  `CollectionField` (rótulo/`FieldLegend`, descrição, erro do array, vazio com o `empty` compacto (por `className`; o `empty` não tem `size`),
  "Adicionar" rotulado, `minItems` — sem "Remover" quando só resta o mínimo, como o rastreio que
  nasce com um lote — e `maxItems`; anuncia "Lote 2 adicionado/removido" e leva o foco ao primeiro
  campo do item novo, ou ao "Adicionar" depois de remover) e `CollectionFieldItem` com dois layouts:
  `row` para poucos campos (forma + valor, razão social + e-mail: em linha no largo, "Remover" no
  fim) e `group` para itens com vários campos. Itens com vários campos precisam ficar inconfundíveis
  em telas pequenas, quando os campos empilham: o app resolve isso no rastreio do "Editar item do
  pedido" (`ModalEditaItemPedido/.../rastreio`) com um `fieldset` por lote (bordas pontilhadas em
  cima e embaixo, "Excluir" na legenda, destaque no hover). Aqui: `FieldSet` por item com legenda
  numerada visível ("Lote 2"), que também nomeia o "Remover" ("Remover lote 2"), e superfície/borda
  **estática** por item (não depende de hover, que não existe no toque; e hover com `bg-muted` fere a
  regra 11). `CollectionFieldSummary` opcional para listas que fecham um valor: total, alocado e
  **restante** com hierarquia tipográfica e texto, não só cor. Stories: formas de pagamento (`row` +
  resumo), rastreio de lotes (`group`, `minItems` 1) e destinatários de e-mail.

### Stories de composição (sem componente novo)

| Story | Onde | O que mostra |
| --- | --- | --- |
| Abas de formulário | `tabs` | Emissão (NF-e, NFC-e, NFS-e, CT-e, MDF-e, CIOT): `Tabs` dentro de um `Form`, painéis montados (`shouldForceMount` + `hidden`) para manter os valores; rodapé Voltar · Salvar rascunho · Avançar (só troca de aba) · Emitir; ao emitir com erro, as abas com problema ganham `badge` `destructive-dot` + descrição acessível e o foco vai à primeira; aba condicional (Local de entrega) |
| Diálogo em fases | `dialog` | Os ~12 diálogos confirmar → processando → sucesso/erro: `use-dialog-promise` (B10) + ícone de status (`empty`/`icon-stack`) + `spinner` + `progress` + `timeline` (etapas feito/atual/pendente), status em `role="status"`, sem gradiente, `prefers-reduced-motion`. Exemplo: cancelar recebimento (aceite obrigatório, etapas, sucesso, erro de prazo com saída alternativa). Reavaliar um bloco se o padrão se repetir no app real |
| Escolher entidade | `combobox` | Cliente, tomador, contratante, transportador, condutor, veículo: grupo "Recentes", itens de duas linhas (nome + documento · cidade/UF), "Cadastrar novo" no fim da lista e, escolhido, `card` com `description-list` + Editar/Remover; vazio com texto de orientação. Busca e cadastro no app |
| Acceptance | `checkbox` | Aceite como `Checkbox` obrigatório num formulário com react-hook-form + zod (como `field.react-hook-form.stories.tsx`; o registro não tem `Form` e o `FieldError` daqui recebe `errors`): botão habilitado; ao enviar sem aceite, foco no checkbox e `FieldError` ("Aceite os termos de compra para continuar"); link "termos de compra" no rótulo sem marcar o checkbox |
| ChoiceCardWithAction, ChoiceCardGroups | `radio-group` | A12 |
| QrCode | `copy-button` | Parte do C14 |

## O que já está coberto

O app troca pelo equivalente daqui e adota a API e o visual do registro.

| Necessidade no protótipo | No fma-ui |
| --- | --- |
| Cards de diagnóstico de produtos que filtram a lista (Total = todos) | `stat-cards` `StatCardGroup` + `StatCardToggle` `selectionMode="single"` (story `FilterSingle`) |
| "Recebimentos sem nota: 2" (card âmbar tingido) | `StatCardButton`/`StatCardToggle` com `tone="warning"`, sem fundo tingido |
| Total recebido com quebra por forma; notas autorizadas no mês com meta | `panel-card` + `Stat`/`StatGrid` + `progress` (story `WithStats`) |
| Assinatura atual (faixa dourada/prateada) | `panel-card` story `CurrentPlan` |
| "Você ainda não tem um plano", recurso bloqueado, onboarding de cobrança e de recebimentos | `feature-promo` (ou `alert` com `AlertAction` quando for só um aviso) |
| Banner "65 produtos com erro · Ver diagnóstico" | `alert` `warning` com `AlertAction` |
| Carrossel de novidades com pontos e autoplay | `carousel` (A8) |
| Donut, legenda e filtros do card | `chart` + `panel-card` (toolbar como slot) |
| Notificações no header | `notification-center` (B2) |
| Faixa "solicitação de acesso aguardando", aviso de homologação/contingência, seletor de empresa | `app-header` + `glance` (B1, C9) — aguardam a [issue #99](https://github.com/fmartins-andre/fma-ui/issues/99) |
| Título + ações da página, voltar + status (Editar CIOT) | `page-header` (breadcrumb como "voltar", `badge` de status ao lado do título) |
| Busca, filtros em painel lateral, chips | `filter-toolbar` (B6) |
| Menu de ações da linha com grupos e itens destrutivos | `DataGridRowActions` (A5) + `dropdown-menu` `variant="destructive"` |
| Status ponto + texto; tipo de documento; categoria | `badge` `*-dot`, `muted-outline` (A9) |
| Seleção entre opções ricas (evento a registrar, já tem maquininha?, recebimento a cancelar) | `RadioCard` / `CheckboxCard` (A11) |
| Confirmações, inclusive com três saídas ("encerrar ambos / só o MDF-e / cancelar") | `use-dialog-promise` + `confirm-dialog` (B10) |
| Switch que pede confirmação antes de mudar (correção automática) | `switch` controlado + `use-dialog-promise` (B10) |
| Formulário longo em seções e abas (Configurações) | `settings-form` (B8) + `tab-nav`/`tabs` |
| Assistentes lineares: Registrar evento e dados bancários da Cobrança (2 etapas em diálogo), jornada do SmartTEF (5 etapas) | `form-wizard` (B11) como está: story `InDialog`; o progresso "Etapa 1 de 2" vem do `FormWizardFooter` (`labels.progress`); em diálogo estreito, sem `FormWizardSteps`; na jornada, o `FormWizardSteps` já reduz para números + título atual |
| Serviços adicionais com switch e barra fixa de total (Turbine sua assinatura) | `plan-builder` `PlanResourceAddon` (B14) + `order-summary` (B13) |
| Resumo de contratação (valor, fidelidade, total) | `order-summary` (B13) + `description-list` (C4) |
| Valores em reais (frete, seguro, desconto, valor por forma de pagamento), percentuais (copropriedade, alíquotas), quantidade e preço do item da nota (4 e 8 casas), quantidades inteiras (usuários, maquininhas) | `masked-input` preset `decimal` (`prefix: "R$ "`, `postfix: "%"`, `maximumFractionDigits`, `min`/`max`; zero casas para quantidades) ou `select` quando a faixa é curta; o app troca `react-intl-currency-input` e as próprias máscaras decimais por ele |
| Detalhes rótulo/valor (contador, classificação, emissão) | `description-list` |
| Seções recolhíveis da aba Avançado | `accordion` |
| Seleção dependente (adquirente → modelo) e listas agrupadas | `select`/`combobox` com grupos |
| Histórico de eventos (status, protocolo, rejeição, ações) | `timeline` + `badge` + `alert` + `item` (composição no app) |
| Catálogo de extensões e carrinho | Composição (ver "Uso no app") |

## Uso no app (correções sem código novo)

| Onde | Hoje no protótipo | Com o registro |
| --- | --- | --- |
| Produtos, cards de diagnóstico | Estáticos, "Total" com anel fixo (parece selecionado), borda esquerda colorida + gradiente, rótulo colorido em caixa alta | `StatCardToggle` único que filtra (Total = todos); `tone` só no ícone e no valor; rótulo em `muted-foreground` |
| Produtos, barra "Última análise" | Card avulso com link, botão e switch | `PageHeaderDescription` + ações do `page-header`; switch com confirmação (B10) |
| Produtos, coluna Ação | "Corrigir" primário em cada linha | `button` `outline` `sm` (um primário por tela) ou ação da linha |
| Produtos, drawer "Corrigir" | Largura própria; "Detalhes" dentro do rádio; "manter cadastro" em roxo | `sheet` `size="lg"` (A18); stories do A12; `CheckboxCard` sem cor própria |
| Editar produto | Faixas tingidas com botão arredondado | `alert` `success`/`destructive` + `AlertAction`; excluir com `confirm-dialog` |
| Analisar produtos | Fila animada de pílulas | Diálogo em fases (story) com `progress` |
| Extensões, cards do catálogo | Borda superior verde/cinza; "Requer plano" botão que navega; "Clique aqui e saiba mais" com triângulo de play; "Adicionado" que remove sem avisar; estado repetido três vezes no card ativo; categoria some quando ativo; cada "Adicionar" abre o carrinho | `card` + `icon-tile` neutro + `badge` `muted-outline` da categoria e `badge` de estado separados; ação por estado: disponível = `Button` "Adicionar ao carrinho" (só atualiza a contagem anunciada no botão do carrinho), no carrinho = `ToggleButton` pressionado "No carrinho", contratado = texto "Desde 12/03/2025", bloqueado = motivo em texto ("Requer assinatura") sem botão (o aviso da página leva a "Ver planos"); "Ver como funciona" (link-botão com `aria-haspopup="dialog"`) abre `dialog` + `aspect-ratio` com a mesma ação; seções com `h2` + contagem em `badge` |
| Extensões, carrinho | Painel próprio, −/+ sem rótulo, botão travado até o aceite, spinner no lugar do botão | `sheet` `size="md"`; itens com quantidade em `masked-input` `decimal` sem casas, "Remover" rotulado; `order-summary` + `alert` `info` para a cobrança; aceite como na story `Acceptance`; "Finalizar compra" com `isPending`; `empty`; resultado num diálogo em fases |
| Listas de notas | "NF-e em homologação" como botão destrutivo sólido | Aviso de ambiente (`glance`/`badge` `warning`, B1) |
| Listas de notas | Olho/download só com ícone | `aria-label` + `tooltip` |
| Cards e avisos em geral | Borda lateral/superior colorida, fundo tingido, gradientes | `alert`, `badge`, `stat-cards`, `panel-card` |
| Diálogos de sucesso | Cabeçalho com gradiente verde | Diálogo em fases (story): ícone de status + texto |
| Assinaturas | CTA verde num plano e azul nos outros; plano escuro | B22 |
| Configurações | "Desativar minha conta" como botão comum no topo | Seção de risco no fim do `settings-form`, `destructive` + `confirm-dialog` |
| Datas | `input type="date"` nativo | `date-picker` |
| Botões desabilitados (Finalizar compra, Salvar, Próximo, Continuar, Cancelar recebimento, Retificar, Tentar novamente, aba "Envolvidos · bloqueada") | Apagados sem motivo; no `AcaoBloqueada` o motivo só aparece no hover | **Regra**: `isDisabled` em botão só durante `isPending`. "Falta algo" → botão habilitado + validação do formulário (react-hook-form + zod no app: obrigatório, tamanho mínimo) com `FieldError` e foco no campo. "Não pode" → motivo visível: esconder a ação e explicar em texto/`alert`, ou manter a ação e explicar num diálogo (B10) com o caminho. Nunca só `title` |
| Campos calculados e travados (total da nota, alíquotas sugeridas, retificação do CIOT) | Visual próprio de leitura; cadeado com motivo só no `title` | `isDisabled` quando necessário, com o motivo visível em texto ou `alert` (ex.: aviso de retificação no topo da aba); a aba bloqueada continua acessível |
| Ícones | Emoji (🔒, 🗑️) | `lucide-react` |

## Fica no app

Regras fiscais (CST, cClassTrib, monofasia, eventos da NT 2025.002), cálculo de preço e
proporcional, integração TEF/Fiserv/POS, polling de status, Assistente IA, chat flutuante,
vídeos e textos de marca, e o painel "Cenários" (só do protótipo).

## Descartados na revisão

| ID | Proposta | Por quê |
| --- | --- | --- |
| C11 | `number-field` (−/+) | Só o carrinho de Extensões e a contratação do SmartTEF usariam, duas telas que não existem no app; quantidade usa `masked-input` `decimal` sem casas ou `select` |
| C12 | `acceptance` | Um `Checkbox` obrigatório no `Form` resolve (story `Acceptance`); o `FeaturePromoAcceptance` continua só no `feature-promo` |
| C13 | `qr-code` | O app recebe o QR pronto do servidor; o padrão virou a story `QrCode` do C14 |
| A15 | `button` `disabledReason` | Mexeria na primitiva vendorizada mais usada; virou a regra de botões desabilitados em "Uso no app" |
| A16 | read-only visível | `isDisabled` quando necessário, com motivo visível |
| A17 | `form-wizard` não linear | A emissão não é um wizard; virou a story "abas de formulário" |
| B18 | `offer-card` | Só Extensões usaria; composição em "Uso no app" |
| B19 | `cart-sheet` | Idem; composição em "Uso no app" |
| B20 | `process-dialog` | Composição; story "diálogo em fases" |
| B21 | `entity-picker` | Composição; story "escolher entidade" |

## Ordem de execução

Um PR por item contra `main`; `gh stack` só quando um depende de outro ainda não mergeado.

1. **Fundação**: C14, A13, A18, A12.
2. **Fluxos**: A14; stories de abas de formulário (`tabs`), diálogo em fases (`dialog`), escolher
   entidade (`combobox`) e `Acceptance` (`checkbox`).
3. **Restante**: B22, B23.

Pronto = `pnpm lint && pnpm type-check && pnpm test && pnpm --filter @fma-ui/ui build`, story com
`play` cobrindo a interação principal, registro regenerado no mesmo commit.

## Progresso

| Item | Branch | PR |
| --- | --- | --- |
| Plano | `docs/emissor-plan` | #138 |
