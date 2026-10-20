# Plano: cobrir o Emissor (protótipo 24) com o fma-ui

Objetivo: o `emitte.emissor.frontend` passar a usar **só** componentes e blocos deste registro,
como já planejado para o painel contábil ([`painel-contabil-gaps.md`](painel-contabil-gaps.md)).

Fonte: o protótipo navegável "Emitte Standalone (24)" (23 entradas de menu, ~40 modais, drawers e
fluxos), conferido contra o app real em `69099c618`. O documento lista **o que falta aqui** e
**onde o protótipo diverge do padrão**; o mapeamento tela a tela, com capturas, fica num documento
visual à parte (fora do repositório, porque mostra o produto).

## Princípio e decisões

Valem os do plano do painel: o fma-ui é a regra de UI e o app se adapta; o protótipo é fonte de
*necessidades*, não de *referência visual*; blocks genéricos (nada de domínio fiscal em nomes ou
APIs); tema sóbrio sem tokens extras; textos padrão em inglês traduzidos por props de i18n;
formulários só com as primitivas (react-hook-form/zod no app).

O que o protótipo traz e **não** se replica: gradientes em banners, cards e cabeçalhos de diálogo
(plano "Ouro"/"Platina", sucesso verde, promo azul→verde); borda colorida lateral ou superior em
cards (stat cards, extensões, avisos); fundo tingido em card de métrica; botão sólido de cor fixa
por plano; `animate-pulse` em botão de play; cores próprias por categoria, por tipo de documento e
por tipo de benefício; emoji como ícone (🔒, 🗑️); ícone sem rótulo acessível (olho, download);
rótulo que só existe no `title`.

## Validação contra o app real

| No protótipo | No app hoje | Leitura |
| --- | --- | --- |
| Produtos: cards de diagnóstico, drawer "Corrigir", análise | Existem (`pages/Produtos/components/product-diagnostics`, `features/cadastros/produtos/diagnostico`). Os cards **filtram** a lista (`isSelected` + `onClick`); o drawer usa `RadioCard` agrupado por CST com botão "Detalhes" **dentro** do card | O protótipo regrediu os cards para estáticos. Correção automática (switch + confirmação) e a fila de análise são novas |
| Listas e formulários de NF-e, NFC-e, NFS-e, CT-e, MDF-e | Existem (MUI v4) | Mesmas necessidades; "em homologação"/"em contingência" no app é um **aviso**, não um botão |
| Planos (anual/mensal, 3 planos) | Existe (`pages/Planos`: abas, tabela, tabela mobile) | Mesma necessidade |
| Termos de compra | `components/checkout/.../terms-checkbox` | Confirma o aceite como peça comum (C12) |
| QR Code | 10 arquivos (Pix no checkout, cobrança, planos) | Confirma C13 |
| Copiar para a área de transferência | 15 arquivos | Confirma C14 |
| Busca de cliente/produto/entidade | `AutoComplete` em 112 arquivos | Confirma B21 |
| Listas editáveis (formas de pagamento, documentos) | `useFieldArray` em 13 arquivos | Confirma B23 |
| Extensões e carrinho, Recebimentos/SmartTEF, Eventos fiscais (NT 2025.002), Imóveis (NFS-e de locação), CIOT com lista e emissão próprias, solicitação de acesso do contador, Assistente IA, dashboard de diagnóstico | **Não existem** (o CIOT hoje é só um modal no MDF-e) | Necessidades novas; entram no plano pelo que pedem de UI |

## O que já está coberto

O app troca pelo equivalente daqui e adota a API e o visual do registro.

| Necessidade no protótipo | No fma-ui |
| --- | --- |
| Cards de diagnóstico de produtos que filtram a lista (Total = todos) | `stat-cards` `StatCardGroup` + `StatCardToggle` `selectionMode="single"` (story `FilterSingle`) |
| "Recebimentos sem nota: 2" (card âmbar tingido) | `StatCardButton`/`StatCardToggle` com `tone="warning"`, sem fundo tingido |
| Total recebido com quebra por forma; notas autorizadas no mês com meta | `panel-card` + `Stat`/`StatGrid` + `progress` (stories `WithStats`) |
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
| Cadastro em etapas num diálogo (dados bancários) | `form-wizard` (B11) — ajustes em A17 |
| Serviços adicionais com switch e barra fixa de total (Turbine sua assinatura) | `plan-builder` `PlanResourceAddon` (B14) + `order-summary` (B13) |
| Resumo de contratação (valor, fidelidade, total) | `order-summary` (B13) + `description-list` (C4) |
| Detalhes rótulo/valor (contador, classificação, emissão) | `description-list` |
| Seções recolhíveis da aba Avançado | `accordion` |
| Seleção dependente (adquirente → modelo) e listas agrupadas | `select`/`combobox` com grupos |
| Histórico de eventos (status, protocolo, rejeição, ações) | `timeline` + `badge` + `alert` + `item` (composição, story no app) |

## Componentes novos (`src/core`)

| ID | Nome | Necessidade → direção |
| -- | ---- | --------------------- |
| C11 | `number-field` | Quantidades com −/+ (carrinho, maquininhas), quantidade e preço por item da nota (4 e 8 casas), percentuais (copropriedade, alíquotas), valores em reais (frete, desconto, valor por forma de pagamento). O app usa `react-intl-currency-input` e máscaras decimais. → `NumberField` do react-aria (formatação por `Intl` com `formatOptions` — moeda, percentual, casas —, `minValue`/`maxValue`/`step`, teclado e roda), botões de incremento opcionais no `input-group` com rótulos traduzíveis, tamanho `sm` para células de tabela. Funciona controlado dentro de `Field`. Stories: quantidade, moeda, percentual e itens editáveis numa `table` com rodapé de totais. |
| C12 | `acceptance` | Aceitar termos ou confirmar que entendeu antes de liberar a ação: carrinho, compra de recurso, contratação, cancelar recebimento/nota ("Entendi que a nota será cancelada"). Hoje só existe preso ao `feature-promo`. → Extrair o mecanismo do `FeaturePromoAcceptance`: `Acceptance` (estado, controlado ou não) com `AcceptanceCheckbox` (checkbox simples ou `CheckboxCard`) e as ações do escopo desabilitadas até o aceite (via `ButtonContext`/`LinkContext`, como hoje). O `feature-promo` passa a usá-lo, sem mudar a API dele. |
| C13 | `qr-code` | Ativar a maquininha lendo um QR Code; o app já mostra QR de Pix. → SVG gerado a partir do texto (dependência pequena e sem dependências próprias, a escolher no PR), `size`, rótulo acessível obrigatório e o código em texto ao lado para digitar (com C14). |
| C14 | `copy-button` | Copiar token, protocolo, chave de acesso, nº de série. → Botão de ícone que copia `value`, troca o ícone por ✓ por alguns segundos e anuncia "Copiado" (`aria-live`); rótulos traduzíveis. |

## Ajustes em itens existentes

| ID | Item | Necessidade → direção |
| --- | ---- | --------------------- |
| A12 | `RadioCard` / `CheckboxCard` | Opção com ação secundária ("Detalhes" da classificação, que abre um diálogo) e opções agrupadas por título (CST). Hoje o botão fica **dentro** do `<label>` (interativo aninhado; o app real contorna com `stopPropagation`). → Slot `action` renderizado fora do rótulo, posicionado no card, com foco próprio; grupos com `FieldSet` + `FieldLegend` dentro do `RadioGroup` (story). |
| A13 | `field` | Os "?" ao lado de rótulos (gerar boleto, operação pessoal, Reforma Tributária, CIB, % de copropriedade) e de cabeçalhos de coluna (Status). → `FieldHelp`: botão ⓘ com rótulo acessível que abre `popover` (toque e teclado), o mesmo do `panel-card`; reaproveitável no cabeçalho do `data-grid`. |
| A14 | `data-grid` | Ações em lote nas listas de NF-e e CT-e (emitir MDF-e/CIOT com as notas selecionadas). → `DataGridSelectionBar`: aparece com seleção, mostra "N selecionados" (anunciado), as ações como filhos e "Limpar seleção"; i18n pelos `labels` do grid. Sem barra azul-escura própria: superfície `muted`/`card` do tema. |
| A15 | `button` (+ `tabs`, `tooltip`) | Ação ou aba indisponível **com motivo** ("Não é possível retificar: …", certificado vencido, aba "Envolvidos · bloqueada", recurso que exige plano). O protótipo usa `title`/hover, e o react-aria não mostra tooltip em elemento desabilitado. → `disabledReason`: o controle fica `aria-disabled` (focável, não executa) e o motivo vira tooltip + descrição acessível. |
| A16 | `input`, `textarea`, `input-group`, `select` | Campos calculados (total da nota, pago, troco, alíquotas sugeridas) e campos travados após a emissão (retificação do CIOT). Hoje `isReadOnly` não muda nada visualmente. → Estilo de leitura (`data-readonly`: fundo `muted`, sem cara de editável) e padrão "travado com motivo" (ícone de cadeado + `FieldDescription`/A13), nunca só `title`. |
| A17 | `form-wizard` | Emissão por abas que o usuário percorre em qualquer ordem, com "Salvar rascunho"; assistentes curtos em diálogo ("Etapa 1 de 2 · Selecione o evento"); jornada de contratação com progresso compacto. → `isNonLinear` (etapas clicáveis em qualquer ordem, com erro marcado na etapa); slot de ação secundária no rodapé, à esquerda do Avançar (separado do `children`, que é o Cancelar); `stepsVariant="progress"` (texto "Etapa N de M · título" + barra de pontos) para diálogo e jornada. O rótulo final já é `labels.finish` ("Emitir nota"). |
| A18 | `sheet` | Painéis laterais com conteúdo denso: corrigir produto e histórico de eventos (~620px), filtros (~420px), carrinho (~390px). Hoje o lado direito para em `max-w-sm`. → Prop `size` (`sm` atual, `md`, `lg`). |

## Blocks novos (`src/blocks`)

### Foco: Extensões e Produtos

- **B18 `offer-card`** — *Necessidade*: catálogo de recursos contratáveis (extensões) em que cada
  card mostra o que é, quanto custa e o que dá para fazer **agora**: adicionar, já está no
  carrinho, já contratado ou indisponível (sem plano). Na tela "sem plano" isso falha hoje:
  - "Requer plano" é um botão com rótulo de **estado** que, ao clicar, navega para Assinaturas;
    repetido em 5 cards, além do banner que já diz a mesma coisa e já tem o botão;
  - "Clique aqui e saiba mais" com um triângulo de play parece um disclosure, mas abre um
    vídeo num diálogo; "clique aqui" não diz o destino (WCAG 2.4.4);
  - a borda superior cinza/verde e o ícone tingido carregam o estado só pela cor;
  - o card ativo diz "Ativa" no badge, "Ativa desde…" no rodapé e "Contratada" no botão;
  - "Adicionado" é um botão que **remove** ao clicar, sem `aria-pressed`, e cada "Adicionar"
    abre o carrinho por cima da lista;
  - o badge de categoria (cor por categoria, caixa alta) some quando o card fica ativo.

  *Direção*: partes sobre `card`. `OfferCard` com `status` (`available` | `selected` |
  `owned` | `locked`); `OfferCardHeader` (`icon-tile` neutro, título, `badge` `muted-outline`
  da categoria e, separado, o `badge` de status); `OfferCardDescription`; `OfferCardPrice`
  (valor e período formatados pelo app, mesmo comportamento do `PlanPrice`); `OfferCardDetails`
  ("Ver como funciona", link-botão com ícone de vídeo e `aria-haspopup="dialog"`, que abre o
  `OfferDialog`: mídia 16:9, descrição, benefícios, preço e a mesma ação do card);
  `OfferCardAction` decide pela `status`: `available` = "Adicionar ao carrinho"; `selected` =
  `ToggleButton` pressionado "No carrinho" (com `aria-pressed`, remover pelo carrinho ou pelo
  toggle); `owned` = texto "Contratado desde …" sem botão; `locked` = motivo como texto/`badge`
  ("Requer assinatura") e, opcionalmente, um `LinkButton` `variant="link"` com **ação**
  ("Ver planos") — omitido quando a página já mostra o aviso. `OfferSection` (título `h2`,
  contagem, descrição, grade responsiva). Adicionar não abre o carrinho: atualiza o contador do
  botão do carrinho (anunciado). Stories: catálogo com plano, sem plano (o caso do foco), estados
  lado a lado e o diálogo de detalhes.
- **B19 `cart-sheet`** — *Necessidade*: revisar o que vai contratar, mudar quantidades, entender
  como será cobrado (avulso, somado à fatura mensal ou proporcional até o fim do plano anual) e
  aceitar os termos. *Direção*: `sheet` (A18) com gatilho que mostra a contagem; `CartItem`
  (título, categoria, quantidade com C11 ou "1 unidade", preço por linha e "remover" com rótulo);
  resumo e aviso de cobrança com `order-summary` (B13) + `alert` `info`; aceite com C12; finalizar
  com `isPending` no botão (sem trocar o botão por um spinner); vazio com `empty`. O resultado
  ("link de pagamento gerado") é um B20.
- **Produtos** — sem bloco novo; é adoção (ver "Uso no app"). Precisa de A12 (Detalhes dentro
  da opção), A18 (largura do painel), B20 (análise em andamento) e do B10 para confirmar a
  correção automática.

### Fluxos

- **B20 `process-dialog`** — *Necessidade*: o protótipo tem ~12 diálogos que passam por fases:
  confirmar → processando (às vezes com etapas: "verificando prazo na SEFAZ", "enviando à
  maquininha", "emitindo assinatura / adicionando à cobrança / liberando recurso") → sucesso ou
  erro (com saída alternativa: "Emitir nota de devolução"). Cada um inventa um cabeçalho com
  gradiente e ícone animado. *Direção*: sobre `dialog` + `use-dialog-promise` (B10).
  `ProcessDialog` com `status` (`idle` | `running` | `success` | `error`); `ProcessStatus`
  (ícone em `empty`/`icon-stack` com tom semântico ou `spinner`, título, descrição; anunciado
  com `role="status"`); `ProcessSteps` (lista de etapas feito/atual/pendente, com texto e não
  só ícone); `progress` para contagem ("129 de 266 produtos"). Fechar é permitido durante o
  processamento quando o trabalho continua no servidor (avisa por `sonner`), e
  `prefers-reduced-motion` desliga animações. Stories: cancelar recebimento (com C12 e erro de
  prazo), emissão concluída, análise de produtos, contratação.
- **B21 `entity-picker`** — *Necessidade*: escolher cliente, tomador, contratante, transportador,
  condutor ou veículo: buscar por nome/documento, ver recentes, cadastrar um novo e conferir os
  dados do escolhido (com editar e remover). *Direção*: `combobox` com grupo "Recentes", itens de
  duas linhas (nome + documento · cidade/UF), ação "Cadastrar novo" no fim da lista (não um botão
  solto ao lado) e, escolhido, um card com `description-list` + Editar/Remover; vazio com texto
  de orientação. Busca e cadastro ficam no app (callbacks).
- **B22 `pricing-plans`** — *Necessidade*: comparar planos e assinar, com período anual/mensal.
  *Direção*: período com `toggle-group` (ou `tabs`) controlado; `PricingPlan` (nome, descrição,
  preço e período, preço equivalente, CTA, destaque via `badge` "Mais popular" + borda `primary`,
  não um card escuro), lista de recursos incluídos/não incluídos com ícone **e** texto acessível
  ("não incluído"); empilha no mobile (o app hoje tem tabela e tabela mobile separadas).
- **B23 `collection-field`** — *Necessidade*: montar uma lista dentro de um formulário: formas de
  pagamento com valor até fechar o total (NFC-e, NF-e), parcelas padrão do imóvel, contratantes do
  CIOT, documentos e seguros do MDF-e. *Direção*: linha de inclusão (campos + Adicionar), itens
  com remover/editar, vazio, e resumo opcional (total, pago, **restante** com hierarquia, não só
  cor). O estado é do app (`useFieldArray`); o bloco é só a UI. Explicar antes de construir.

## Uso no app (correções sem código novo)

| Onde | Hoje no protótipo | Com o registro |
| --- | --- | --- |
| Produtos, cards de diagnóstico | Estáticos, "Total" com anel fixo (parece selecionado), borda esquerda colorida + gradiente, rótulo colorido em caixa alta | `StatCardToggle` único que filtra (Total = todos); `tone` só no ícone e no valor; rótulo em `muted-foreground` |
| Produtos, barra "Última análise" | Card avulso com link, botão e switch | `PageHeaderDescription` + ações do `page-header`; switch com confirmação (B10) |
| Produtos, coluna Ação | "Corrigir" primário em cada linha | `button` `outline` `sm` (um primário por tela) ou ação da linha |
| Editar produto | Faixas tingidas com botão arredondado | `alert` `success`/`destructive` + `AlertAction`; excluir com `confirm-dialog` |
| Analisar produtos | Fila animada de pílulas | B20 com `progress` |
| Listas de notas | "NF-e em homologação" como botão destrutivo sólido | Aviso de ambiente (`glance`/`badge` `warning`, B1) |
| Listas de notas | Olho/download só com ícone | `aria-label` + `tooltip` |
| Cards e avisos em geral | Borda lateral/superior colorida, fundo tingido, gradientes | `alert`, `badge`, `stat-cards`, `panel-card` |
| Diálogos de sucesso | Cabeçalho com gradiente verde | B20 |
| Assinaturas | CTA verde num plano e azul nos outros; plano escuro | B22 |
| Configurações | "Desativar minha conta" como botão comum no topo | Seção de risco no fim do `settings-form`, `destructive` + `confirm-dialog` |
| Datas | `input type="date"` nativo | `date-picker` |
| Ícones | Emoji (🔒, 🗑️) | `lucide-react` |

## Fica no app

Regras fiscais (CST, cClassTrib, monofasia, eventos da NT 2025.002), cálculo de preço e
proporcional, integração TEF/Fiserv/POS, polling de status, Assistente IA, chat flutuante,
vídeos e textos de marca, e o painel "Cenários" (só do protótipo).

## Ordem de execução

Um PR por item contra `main`; `gh stack` só quando um depende de outro ainda não mergeado.

1. **Fundação**: C11, C12 (refatora o `feature-promo`), C14, A13, A15, A16, A18, A12.
2. **Foco**: B18 (A15), B19 (C11, C12, A18).
3. **Fluxos**: B20 (B10), A17, A14, B21.
4. **Restante**: C13 (C14), B22, B23.

Cada item é explicado e combinado antes de construir, como no plano do painel.
