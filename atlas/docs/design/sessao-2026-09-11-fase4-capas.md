# Sessão de repaginação — Fase 4: capas geradas e composição

> Continuação de [`sessao-2026-09-10-repaginacao.md`](sessao-2026-09-10-repaginacao.md).
> Mesmo formato: **o quê** mudou e **por quê**. Mantém as regras de
> `docs/agent/AGENTS.md` (R4 vidro, R5 tokens, i18n sem string solta).

## Diagnóstico — o que separava o app das referências

Rodadas anteriores já tinham resolvido cor, gradiente, anel de atividade e
heros. Comparando tela a tela com `ui-examples/`, o que sobrava não era paleta:
era **imagem**. Todas as referências constroem a tela em volta de um retângulo
com conteúdo visual — capa de treino, thumbnail de exercício, card de programa,
retrato de pessoa — e usam texto sobreposto, não texto ao lado. O Atlas tinha,
no lugar disso, um quadrado cinza com um ícone de halter.

| Traço da referência | Antes | Agora |
|---|---|---|
| Capa em todo card de conteúdo | ícone em quadrado cinza | arte gerada por semente |
| Chips de metadado (`30 min`, `547 kcal`) | texto corrido | `MetaChip` |
| Trilho "ver tudo" | listas verticais | `Carousel` + `SectionHeader` |
| Selo de reprodução sobre a capa | ausente | `CoverCard showPlay` |
| Gráfico com área em gradiente | linha de 1 px | área + marcador de "agora" |
| Retrato de pessoa | só nome em negrito | `PersonAvatar` com iniciais |

## A decisão central: capa **gerada**, não fotografia

O produto não tem banco de imagens e os `thumbnailUrl` do catálogo apontam para
`cdn.atlas.example`, um host que só existe a partir da fase de integração.
Havia três saídas:

1. **Buscar fotos de banco de imagens.** Descartada: acrescenta megabytes de
   binário ao repositório, cria dependência de licença por imagem, e ainda
   deixaria sem capa qualquer exercício personalizado criado pelo usuário —
   justamente o caso em que não existe foto para buscar.
2. **Deixar o espaço vazio até o CDN existir.** Descartada: é a situação atual,
   e é ela que faz o app parecer inacabado.
3. **Gerar a capa.** Escolhida.

Cada capa é um gradiente de malha determinístico derivado de uma **semente de
domínio** (id do exercício, id do dia, id da sessão, código do músculo): base +
dois focos radiais + banda diagonal + glifo de equipamento. Em vetor, não em
bitmap.

Por que isso é a escolha certa aqui, e não um paliativo:

- **Cobertura total.** Todo exercício tem capa, inclusive os personalizados que
  nunca terão foto no CDN.
- **Zero rede.** A lista desenha sem uma requisição. Uma demo em academia com
  sinal ruim continua igual à demo na mesa do escritório.
- **Nítida em qualquer escala.** O mesmo componente serve o thumbnail de 64 pt
  e o hero de tela cheia sem `@3x` nem recorte.
- **Estável.** Semente é identificador de domínio, nunca índice de lista —
  índice muda quando a lista é filtrada, e a capa trocaria de cor sem o dado ter
  mudado. Na prática o usuário passa a reconhecer "o agachamento é o roxo" sem
  ler o nome.
- **Não bloqueia a fase 2.** `CoverImage` desenha a arte como piso e sobrepõe a
  foto quando ela existe. Quando o CDN entrar no ar, a foto simplesmente aparece
  por cima — sem tocar em nenhuma tela.

As paletas **não foram inventadas**: saem das pranchas de marca em
`ui-examples/` (rampas "Pomp Power" e "Purple", mais Twilight Gaze / Midnight
Whisper / Violet Spell / Enchanted Amethyst). A arte gerada pertence à mesma
família visual das referências.

### Limite honesto

A capa gerada é **arte abstrata de identidade**, não demonstração de execução.
Ela diz "este é o agachamento" pela cor; não mostra como agachar. O vídeo de
execução (`ExerciseVideo`, `media[]`) continua sendo o que ensina o movimento, e
nada aqui substitui isso. Não apresentar a capa como conteúdo instrucional.

---

## Tokens (`packages/design-tokens`)

### `tokens.ts`
- **`coverPalettes`** — seis triplas `[base, meio, luz]` derivadas das pranchas
  de marca das referências. Seis é proposital: o bastante para uma lista rolada
  não repetir visivelmente, pouco o bastante para o conjunto ler como sistema.
- **`cover`** — geometria e opacidade da arte (canvas, focos, banda, glifo,
  véu). Em token porque a mesma composição escala do thumbnail ao hero e não
  pode virar número mágico repetido em cada tela.
- **`cover.onCoverSurface` / `onCoverBorder`** — superfícies sobrepostas à capa.
  **Não vêm do tema**, e isso é o ponto: a arte é escura nos dois temas, então o
  vidro branco do tema claro sumiria sobre ela e levaria junto o texto claro por
  cima. Contraste sobre a capa é problema da capa, não do tema.
- **`chart`** — opacidades da área em gradiente, espessura de linha, raio do
  marcador, opacidade da barra inativa. Consistência entre sparkline, gráfico de
  métrica e colunas de atividade.
- **`motion.pressScale`** — escala do toque, única para botão, card e linha.
  Substitui o `0.97` literal que estava no `Button` (violação de R5).
- **`layout.coverHero/coverCard/coverRow/carouselItem`** — escala fixa de
  alturas. Três alturas fazem telas diferentes rimarem; `aspectRatio` por tela
  produziria um card levemente diferente em cada lugar.

### `themes.ts`
- **`backgroundWash`** — tinta diagonal do fundo, por tema.

---

## Design system (`apps/mobile/src/design`)

### `media/cover-art.ts` (novo, puro)
Hash FNV-1a + xorshift32 → paleta, posição dos focos, ângulo da banda, glifo.
Puro de propósito: testável sem renderizar, e garantidamente estável.
`coverGlyphs` (rodízio do sorteio) é **menor** que o tipo `CoverGlyph`: `trophy`
e `none` existem mas não são sorteados, porque um troféu num exercício qualquer
cairia fora de contexto. Coberto por `cover-art.test.ts` (determinismo,
dispersão sobre todas as paletas, focos dentro do canvas, semente vazia).

### `media/CoverArt.tsx` + `CoverScrim` (novo)
SVG com `preserveAspectRatio="slice"` para preencher qualquer proporção. O véu
de contraste **não** é desenhado dentro do SVG: como a arte é recortada, um
degradê interno seria cortado junto e deixaria de encostar na base do card.
`CoverScrim` é irmão e acompanha o container.

### `media/CoverImage.tsx` (novo)
Arte como piso, foto por cima quando existir. Nunca há retângulo cinza, nunca há
"pop" de layout, e uma URL que falha não vira estado de erro para a tela tratar.

### `lib/media.ts` (novo)
`remoteMediaEnabled` — em modo mock nem tenta a rede: o CDN semeado não existe e
cada linha de lista custaria uma falha. Decisão de transporte, não de tela (R1).

### `media/PersonAvatar.tsx` + `initials.ts` (novo)
Retrato de quem não é o usuário (profissionais, clientes). Foto quando houver,
iniciais sobre capa gerada quando não. `initials` em módulo separado porque a
suíte roda em Node e não carrega os tipos Flow do `react-native` — mesma divisão
de `cover-art.ts` e `sparkline-path.ts`.

### `components/CoverCard.tsx` (novo)
A peça central: capa preenchendo o card, véu no rodapé, texto por cima, chips,
selo de reprodução opcional, toque em spring. Altura vem do chamador.

### `components/MetaChip.tsx`, `SectionHeader.tsx`, `Carousel.tsx` (novos)
O vocabulário de composição das referências. `Carousel` não usa `FlashList` de
propósito: é vitrine de tamanho conhecido definido pela tela; coleção sem limite
continua sendo lista vertical virtualizada.

### `components/Icon.tsx`
Passou a aceitar vários traços por ícone e ganhou 11 nomes
(`play`, `flame`, `trophy`, `target`, `calendar`, `heart`, `scale`, `bolt`,
`layers`, `sparkles`, `camera`, `ruler`). Nomes semânticos, não descritivos da
forma.

### `components/Sparkline.tsx` + `ProgressBar.tsx` + `ProgressRing.tsx`
Área em gradiente e marcador no valor mais recente; barra com gradiente por
`accent`; valor do anel acompanha o diâmetro (fixo em `title1`, encostava no
traço nos anéis de card).

**Correção incidental:** o `<Svg accessible>` do `Sparkline` vazava um atributo
booleano inválido no DOM da prévia web (erro de console em toda tela com
histórico). A acessibilidade foi para um `<View>` em volta, como já era no
`MetricChart`. `pointerEvents` como prop (depreciado no RN 0.86) migrou para o
estilo nos componentes tocados.

### `components/DepthBackground.tsx`
Base aprovada em 10/09 + **tinta diagonal** linear no canto superior. Linear e
não radial de propósito: a rodada de 10/09 recusou os pontos de luz (blobs com
centro visível) — o que faltava era a faixa de cor, não luz pontual. Sem SVG,
sem animação, nada para desligar em "Reduzir movimento".

---

## Telas

| Tela | O quê | Por quê |
|---|---|---|
| **Hoje** | hero de capa com chips e CTA embaixo; exercícios do dia viram trilho; semana vira trilho de capas | a `FlashList` de altura fixa cortava qualquer ficha com mais de 4 exercícios e aninhava rolagem no mesmo eixo da tela |
| **Catálogo** | vitrine "Em destaque" + linhas com miniatura de capa e chips | com 300+ exercícios, o que torna a lista navegável é o par cor + forma, filtrado antes da leitura |
| **Detalhe do exercício** | hero de capa com voltar flutuante | o exercício passa a ter identidade visual própria |
| **Fichas / Ficha** | cards de capa; dias do plano viram capas; selo de ficha ativa no canto | a ficha é a unidade que o usuário escolhe; a cor faz a ponte entre lista, detalhe e "Hoje" |
| **Histórico** | linha compacta com capa, título e chips | quatro linhas de texto por sessão enchiam a tela com 4 itens; agora o histórico volta a ser percorrível |
| **Progresso** | delta em uma linha, com tom por sinal; frase de comparação uma vez, como legenda | "em relação ao período anterior" × 4 tiles gastava três linhas cada e empurrava o número para fora da dobra |
| **Coach** | retrato + nome + credencial numa linha; chips de modalidade/cidade/avaliações | é o que o usuário compara entre profissionais, e estava espalhado por três blocos |
| **Boas-vindas** | capa sangrando do topo, três pontos de página | o anel media uma tarefa que o usuário não está executando |
| **Entrar** | mesma semente da última página de boas-vindas | continuidade visual em vez de corte |
| **Resumo da sessão** | hero de celebração com troféu, semeado pela sessão | duas sessões seguidas não se parecem; a tela não vira carimbo |
| **Paywall** | hero semeado pela feature bloqueada | cada porta de entrada do paywall tem identidade própria |
| **Perfil** | capa do usuário atrás do avatar, sem glifo | o avatar já é o foco; glifo atrás viraria ruído |
| **Componentes visuais** (dev) | vitrine das peças novas | é onde se confere contraste e recorte antes de a mudança chegar às telas |

### Refatoração de apoio
- **`features/today/prescription-summary.ts`** (novo, puro + teste) — a regra de
  resumo de prescrição era duplicada e carrega um limite que precisava ficar
  registrado: **descreve a primeira série**. `varies` sinaliza quando as demais
  divergem (ver ponto 7 de `ATL-UI-012-validacao.md`).
- **`chart-geometry.ts`** — passou a devolver `area` e `head`. A área fecha
  **por trecho contínuo**: um `fill` no próprio traço fecharia os buracos da
  série, desenhando dado que não existe.
- **`WorkoutArtwork.tsx`** removido — superado pelo sistema de capas.
- Pluralização de "dia/dias" nas fichas (`1 dias` era bug visível).
- Catálogo: a lista continua **de onde a vitrine parou**, em vez de repetir os
  seis primeiros exercícios duas vezes seguidas.

---

## Verificação

Prévia web (Expo, Chromium) percorrida de ponta a ponta — onboarding, Hoje,
Catálogo, Detalhe, Fichas, Progresso, Histórico, Coach, Perfil, Paywall,
Componentes visuais — em **420 px e 320 px**, nos **temas escuro e claro**.

~~~text
pnpm typecheck                     5 successful, 5 total
pnpm lint                          exit=0 (--max-warnings 0)
npx vitest run                     26 arquivos, 90 testes verdes (eram 72)
node scripts/check-adapter-parity  Paridade OK — 8 ports
node scripts/check-contract-parity Contrato OK — 20 endpoints
prettier --check (arquivos tocados) All matched files use Prettier code style
~~~

`pnpm format:check` do repositório continua **vermelho, como já estava**: 31
arquivos pré-existentes fora do padrão do Prettier, **nenhum deles tocado nesta
rodada** (verificado com a árvore limpa, no baseline). Deixei assim de
propósito — reformatar o repositório inteiro inflaria este diff com centenas de
linhas sem relação com a interface. Vale uma passada de formatação própria,
em commit separado.

Console da prévia web limpo para os componentes desta rodada. Permanece o aviso
pré-existente `"shadow*" style props are deprecated` vindo de `Card` e
`GradientSurface` — não foi tocado nesta rodada.

### Pendente de validação em dispositivo

A prévia web **não** cobre, e continua valendo o que a
[`ATL-UI-012-validacao.md`](ATL-UI-012-validacao.md) já registra:

1. Vidro nativo (iOS 26) e fallback não-glass em Android — a capa é opaca e não
   passa por `<GlassSurface>`, mas convive com superfícies que passam.
2. "Reduzir movimento" e "Reduzir transparência" no device.
3. Leitor de tela sobre `CoverCard` e `MetaChip` — os rótulos existem, a ordem
   de foco não foi verificada com VoiceOver/TalkBack.
4. Fontes ampliadas (Dynamic Type grande) sobre os chips e o rodapé dos cards.
5. Custo de render dos SVGs de capa numa lista longa em aparelho de entrada.
   Vetor evita rede e memória de bitmap, mas troca isso por rasterização; medir
   antes de prometer fluidez no catálogo completo.
6. Contraste do texto sobre a capa foi conferido por construção (véu terminando
   em 94 % sobre a cor de fundo do tema escuro) e visualmente nos dois temas,
   **não** por medição automatizada — o `contrast.test.ts` cobre os tokens de
   tema, não a composição sobre a arte gerada.
