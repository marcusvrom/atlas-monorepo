# Rodada de refinamento de UX/UI — 11 set 2026

> Escopo: clareza visual, hierarquia da home, reaproveitamento contextual das
> imagens editoriais, legibilidade e interação dos gráficos, formatação numérica
> e acessibilidade. Sem reformulação visual arbitrária: identidade, tokens,
> arquitetura e componentes compartilhados preservados.

## 1. Auditoria — o que estava errado

| # | Problema | Onde | Evidência |
|---|---|---|---|
| 1 | Quatro botões de peso parecido competiam na mesma rolagem (iniciar, check-in, nutrição, catálogo) — nenhum lia como "a" ação | `TodayScreen` | 4 `Button` sólidos/ghost no mesmo scroll |
| 2 | Mesmo treino aparecia em três blocos seguidos: hero, `TodayExercises` e `WeeklyPlan` | `TodayScreen` | ficha de 1 dia repetia o dia no trilho da semana |
| 3 | A home tratava usuário recorrente igual ao de primeira sessão; nenhum estado para retomada, retorno após ausência ou treino recém-concluído | `TodayScreen` | um único caminho `today.data ? hero : empty` |
| 4 | Aderência aparecia duas vezes no mesmo card (anel + métrica) | `TodayScreen` | "65% … 65%" lado a lado na prévia web |
| 5 | Imagens editoriais importadas diretamente em cada tela, com semente e glifo decididos localmente | 4 telas | `import x from '../../../assets/marketing/*.webp'` |
| 6 | `formatWeight` encaixava **todo** kg em meio quilo — inclusive volume agregado e deltas, que não vêm de digitação | 12 call sites | `15660.3 → "15.660,5"` |
| 7 | Números crus espalhados: `Math.round`, `toLocaleString`, `toLocaleDateString` em 20+ pontos de tela | app inteiro | minutos como `3300`, kcal sem milhar, datas dependentes do ICU da plataforma |
| 8 | Gráfico de métrica não era selecionável, não tinha alternativa textual útil, repetia unidade e imprimia data em todo tick | `MetricChart` | `accessibilityLabel` só com o último valor |
| 9 | Série vazia desenhava eixo e área vazios | `MetricChart`, `ActivityTimeline` | 7 colunas rentes ao chão = "gráfico quebrado" |
| 10 | Variação percentual comunicada por cor + sinal, sem palavra | `DashboardOverview` | falha WCAG 1.4.1 |
| 11 | Remover exercício de uma ficha não pedia confirmação (remover *dia* pedia) | `PlanExerciseRow` | perda silenciosa de prescrição inteira |
| 12 | Texto sobre capa caía a **4,37:1** sobre o pixel mais claro que a arte produz | `cover.scrim` | abaixo de AA — ver §6 |

## 2. Decisões de UX

**Uma ação primária por estado.** Só o hero da home usa `Button` sólido. Check-in,
hidratação, nutrição e catálogo viraram uma seção "Também por aqui" com linhas de
navegação. O botão que importa voltou a significar alguma coisa.

**Retomar vence iniciar.** Sessão aberta tem séries dentro; oferecer "iniciar"
naquele momento cria uma segunda sessão e esconde a primeira.

**Nenhum estado culpa o usuário.** Ausência de dias muda o *tom*, não a ação:
"Bom ter você de volta" com o treino já montado, ou "Hoje também pode contar".
Sequência quebrada é fato do dado; não precisa virar texto.

**Destaques rotativos (Opção C) — recusada.** Dois ou três banners fazem a home
competir consigo mesma, e rotação automática quebra memória muscular: o mesmo
toque na mesma posição faria coisas diferentes a cada abertura. O hero é um só e
muda por **estado**, que é previsível. Registrado em `home-hero.ts`.

**Ilustrar estado vazio só onde o vazio é começo de jornada** (primeira ficha,
primeiro registro de progresso) — nunca em "filtro sem resultado", para não
apagar a diferença entre "ainda não há nada" e "sua busca não achou nada".

## 3. Estratégia de imagens (Opção A + Opção B)

Registro em `apps/mobile/src/design/media/artwork.ts`: a tela declara um
**contexto semântico**, nunca um arquivo. Onze contextos sobre quatro imagens:

| Imagem | Significado | Contextos |
|---|---|---|
| `onboarding-train.webp` | começar algo | `onboarding-training`, `empty-plan` |
| `onboarding-progress.webp` | acumular evidência | `onboarding-progress`, `progress-highlight`, `workout-completed` |
| `onboarding-coach.webp` | alguém do seu lado | `onboarding-coach`, `sign-in`, `welcome-back`, `coach-highlight` |
| `home-workout.webp` | o treino de hoje | `active-workout` |
| — (só vetor) | metas metabólicas | `nutrition-targets` |

`welcome-back` usa a arte de coach, e **não** a de treino, porque na home ela
conviveria com `active-workout`: duas fotos iguais empilhadas leem como falha de
carregamento. Um teste trava isso (`artwork.test.ts`).

`HeroArtwork` resolve véu, fallback vetorial, falha de carga e acessibilidade num
lugar só. Padrão é decorativo (WCAG 1.1.1): a arte apoia um texto que já está na
tela, e descrevê-la faria o leitor de tela anunciar duas vezes. `alt` existe para
quando a imagem **for** a informação.

A regra editorial (`artwork.ts`) é livre de `require`, então é testável em Node;
`artwork-assets.ts` carrega o binário e não decide nada.

## 4. Formatação numérica

`apps/mobile/src/lib/format.ts` — uma função por significado, nenhuma com
parâmetro de precisão. Todas devolvem string; a precisão interna nunca é tocada.

| Domínio | Função | Regra | Exemplo |
|---|---|---|---|
| Carga | `formatWeight` | máx. 1 casa | `112.349 → 112,3` |
| Peso/medidas | `formatBodyMeasurement`, `formatHeight`, `formatBodyFat` | máx. 1 casa | `18.46 → 18,5%` |
| Carga somada (tonelagem) | `formatWorkoutVolume`, `formatTonnage` | inteiro / troca para t acima de 1.000 kg | `15660.3 → 15.660` / `17,5 t` |
| Percentual | `formatPercentage` | inteiro; 1 casa só se o inteiro mentir | `0.004 → 0,4%`, `0.997 → 99,7%` |
| Variação | `formatPercentageChange` | sinal obrigatório | `-8 → −8%` |
| Calorias | `formatCalories`, `formatCalorieAdjustment` | inteiro com milhar | `2000 → 2.000` |
| Macros | `formatMacroGrams` | inteiro; 1 casa abaixo de 10 g | `8.35 → 8,4` |
| Hidratação | `formatHydration` | ml até 1 L, depois L | `2500 → 2,5 L` |
| Duração | `formatDuration`, `formatDurationMinutes` | humana | `4080 s → 1 h 08 min` |
| Contagem/esforço | `formatCount`, `formatEffort`, `formatRatio` | inteiro / 1 casa / 2 casas | `7.5 → 7,5` |
| Datas | `formatDate`, `formatShortDate`, `formatWeekdayDate`, `formatFullDate`, `formatDateRange`, `formatDayMonth`, `formatWeekdayName`, `formatWeekdayAbbrev` | pt-BR | `11/09/2026`, `11 set`, `5 — 11 set` |
| Preço | `formatCurrency` | centavos só quando existem | `249 → R$ 249` |

Três decisões que valem registro:

1. **O encaixe em meio quilo saiu do formatador.** A ATL-UI-012 exige kg inteiro
   ou meio — isso continua verdade, garantido pelo `step={0.5}` do
   `NumericStepper`, que é por onde carga entra. No formatador o encaixe
   destruía valores que não vêm de digitação (médias, deltas, volume agregado),
   exibindo 112,5 onde o dado era 112,3.
2. **Datas são montadas à mão, não por `toLocaleDateString`.** O ICU abrevia mês
   diferente entre Hermes, navegador e Android ("set" / "set." / "Set"), o que
   vazava como inconsistência entre app e prévia web e deixava o teste refém do
   ICU da máquina. Números continuam no `Intl` — ali o comportamento é estável.
3. **Arredondamento é "meio para longe do zero".** `Math.round` puro manda
   −1,25 para −1,2 e +1,25 para +1,3: um par de deltas simétrico aparecia com
   magnitudes diferentes lado a lado.

### Correção de rumo: a forma "mil kg" foi um erro

A primeira versão desta rodada apresentava volume de treino como `15,7 mil kg`.
Está errado, e o usuário apontou: **ninguém levanta quinze mil quilos**. Pior, no
hero da home o número aparecia num chip sem rótulo, ao lado de "5 exercícios ·
55 min" — o que o leitor entende é que *aquele* é o peso do exercício. O número
estava certo e a leitura era falsa, que é o pior tipo de métrica.

A forma compacta (`formatCompactNumber`, `formatWorkoutVolumeCompact`) foi
**removida** do app. No lugar entrou uma regra explícita, registrada em
`formatWorkoutVolume`:

> Tonelagem nunca aparece sem um rótulo que a nomeie. Duração, séries e
> exercícios o usuário nomeia sozinho ao ver o valor; tonelagem, não. Onde não
> couber rótulo, o número não entra.

Como isso se traduziu:

| Onde | Antes | Agora | Por quê |
|---|---|---|---|
| Hero, antes do treino | `15,7 mil kg` | `17 séries` | Descreve o tamanho da tarefa que vai começar, não uma soma abstrata (`plannedSets`, aquecimento fora) |
| Hero, treino concluído | `17,5 mil kg` | `17,5 t no total` | Depois do treino a carga é resultado; o rótulo vai dentro do chip |
| Linha do histórico | `17,5 mil kg` | `17,5 t no total` | Era o único número que diferenciava um Legs de um Push na lista — tirá-lo deixava todas as linhas idênticas |
| Tile do dashboard | `Volume total · kg` → `108,8 mil` | `Carga total levantada` → `108,8 t` | Rótulo nomeia, unidade é plausível |
| Resumo da sessão | número grande = `17.548 kg` | número grande = `55 min`; carga num tile nomeado | "55 min" é conquista reconhecível na hora; tonelagem precisava de uma aula antes de virar orgulho |
| Gráfico de atividade | opção "Volume", `15.660` | opção "Carga", `17,5 t` | — |
| Distribuição muscular | manchete = `37,9 t` | manchete = `100%` (participação) | Séries efetivas contam só o músculo principal: um sinergista mostrava "0 séries efetivas" ao lado de 25 t. A participação relativa é o que a barra desenha e nunca se contradiz |

Em toda tela onde a tonelagem aparece, uma linha explica o jargão uma única vez:
**"Soma de peso × repetições de todas as séries."**

Ausência é `—` em toda parte, nunca `0`: "não registrado" e "registrado como
zero" são estados distintos.

## 5. Gráficos

- **Unidade no título** (`Peso corporal (kg)`), não repetida em cada número. O
  tooltip repete porque precisa ser compreensível sozinho no leitor de tela.
- **Seleção por toque e teclado**: faixas de toque cobrem a largura inteira, com
  corte no meio do caminho entre pontos vizinhos (`touchBands`) — todo pixel é
  alvo válido e seleciona o ponto mais próximo. Cada faixa é um `Pressable`
  nomeado, o que dá foco visível na web pela mesma via.
- **Seleção destaca sem apagar**: guia vertical + anel; os demais pontos ficam.
  Saída explícita com "Limpar seleção".
- **Eixo com três âncoras no máximo** (`axisTicks`): sete datas num eixo de
  300 pt se sobrepõem e viram borrão.
- **Alternativa textual** (`describeSeries`): o que mede, período, sentido,
  unidade e extremos — e os extremos só entram quando não são as pontas, senão o
  leitor de tela ouve o mesmo número três vezes.
- **Sem dado, sem eixo**: o lugar explica o que falta e por que registrar ajuda.
- **Cada métrica com sua formatação** no gráfico de atividade: volume inteiro,
  duração humana, séries como contagem. Antes os três passavam pelo mesmo
  formatador de kg.
- **Sentido também em palavras** no dashboard: `+22% acima do período anterior`.

## 6. Contraste sobre capa — correção de token

O teste novo mediu o **pixel mais claro que a arte vetorial consegue produzir**
(tom claro da paleta sob `glowOpacity` e `bandOpacity`, derivado dos tokens, não
chutado) sob a parada mais fraca do véu que pode ficar atrás de texto: **4,37:1**,
abaixo de AA, exatamente na faixa onde a tampa do card cai com título de duas
linhas.

`cover.scrim` teve a parada do meio elevada de `0.18` para `0.30` — pior caso vai
a 5,5:1. O topo não mudou, então a capa não escureceu como imagem.

**Limite conhecido e deliberado:** uma *fotografia* clara pode ser mais clara que
qualquer arte gerada, e nenhum degradê vertical sustenta AA sobre branco sem
escurecer o card a ponto de a foto deixar de ser foto. Ali a garantia é de
direção de arte — imagem editorial escura na metade inferior — e está registrada
como requisito em `artwork.ts`.

## 7. Arquivos tocados

**Novos:** `lib/format.ts` (+teste), `design/media/artwork.ts` (+teste),
`design/media/artwork-assets.ts`, `design/media/HeroArtwork.tsx`,
`features/today/home-hero.ts` (+teste), `features/today/HomeHero.tsx`,
`features/progress/chart-summary.ts` (+teste),
`features/progress/chart-geometry.test.ts`.

**Removidos:** `lib/format-weight.ts` (+teste) — substituído pelos formatadores
semânticos.

**Alterados:** 36 arquivos de tela e componente, `i18n/pt-BR.json` (+47 chaves),
`design-tokens/tokens.ts` (véu), `design/tests/contrast.test.ts`.

## 8. Fora de escopo (não implementado)

- `format:check` do repositório já estava vermelho na base, em arquivos não
  tocados por esta rodada (`offline/sync-engine.ts`,
  `features/session/session-summary.ts` e outros 42). Os arquivos desta entrega
  estão formatados; a dívida anterior ficou como estava, para não afogar o diff.
- Tema claro não é alcançável em build de produção (`__DEV__ ? settings.theme :
  'dark'`, spec 11 §6). O contraste do tema claro continua coberto por teste de
  token, não por captura de tela.
- Não há gate automático de luminância das imagens editoriais: decodificar webp
  exigiria dependência nova no CI. O requisito está documentado; a verificação é
  de revisão.
- `WellbeingSection` e `CheckInTrend` receberam só a correção de formatação; a
  interação de seleção do `MetricChart` ainda não foi estendida a eles.
- "Séries efetivas" continua contando apenas o músculo principal, o que produz
  `0 séries efetivas · 25,5 t no total` para sinergistas. É verdade e agora está
  legível (a manchete virou a participação relativa), mas a métrica em si
  mereceria uma revisão de domínio — contar contribuição parcial — que está fora
  desta rodada de UI.
