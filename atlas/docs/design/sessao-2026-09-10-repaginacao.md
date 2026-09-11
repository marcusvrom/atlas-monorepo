# Sessão de repaginação de UX/UI — 2026-09-10

> Registro de intenção desta rodada de redesign. Cada item documenta **o quê**
> mudou e **por quê**, para preservar o histórico e a rationale das decisões.
> Mantém as diretrizes do produto (Liquid Glass, tema escuro padrão, tokens como
> fonte única) e as regras do `docs/agent/AGENTS.md`.

## Objetivo da rodada

Modernizar a experiência sem trair a identidade "liquid glass": fundos mais
agradáveis e vivos, transições confortáveis entre telas, micro-animações de
toque, e trocar o avatar para permitir **foto da galeria ou da câmera**
(coexistindo com o construtor vetorial premium, que foi preservado).

## Decisões de produto (confirmadas com o dono)

- **Avatar**: foto vira o padrão/primário; o construtor vetorial permanece como
  alternativa opcional, preservando a monetização `premiumAvatarItems`.
- **Escopo visual**: fundações (refletem em todo o app) + polish das telas de
  maior tráfego.
- **Fase 2 (ampliação)**: o dono pediu para seguir a linguagem visual das
  referências em `ui-examples/` e liberou alterar componentes e o app como um
  todo. Ver seção "Fase 2" abaixo.

---

## Fundações visuais (afetam todas as telas)

### `packages/design-tokens/src/tokens.ts`
- **O quê**: novo `motion.ambient` (`drift`, `driftSlow`) e `motion.spring.soft`.
- **Por quê**: o fundo precisa "respirar" com durações longas (16–26 s) que não
  cabem na escala de resposta a toque. Mantidos como token para respeitar R5
  (nada de valor mágico em componente).

### `packages/design-tokens/src/themes.ts`
- **O quê**: nova cor `depthBlobC` (matiz fria/ciano) nos temas claro e escuro.
- **Por quê**: dar um terceiro ponto de luz à aurora do fundo, com mais
  profundidade e algo a mais para o vidro refratar.

### `apps/mobile/src/design/components/DepthBackground.tsx`
- **O quê**: fundo reescrito como "aurora" — 3 blobs que derivam devagar na UI
  thread (Reanimated) + tinta diagonal sutil sobre o gradiente base.
- **Por quê**: backgrounds mais agradáveis e vivos sem ruído. Todo movimento é
  desligado com "Reduzir movimento" (a composição estática continua legível).

### `apps/mobile/src/design/components/Screen.tsx`
- **O quê**: conteúdo entra com `FadeIn` curto ao montar.
- **Por quê**: suavizar a troca de telas — nunca um corte seco. Respeita
  "Reduzir movimento".

### `apps/mobile/src/design/components/Button.tsx`
- **O quê**: micro-interação de toque (escala em spring) + haptic leve nas ações
  de peso (solid/danger). Migrado para `Animated.Pressable`.
- **Por quê**: conforto tátil e feedback, no mesmo padrão já usado no
  `GlassButton`. Ghost fica silencioso para não poluir formulários.

### `apps/mobile/app/_layout.tsx`
- **O quê**: transição padrão do Stack = `slide_from_right` com duração de
  sistema e fundo transparente.
- **Por quê**: navegação entre telas com continuidade; fundo transparente deixa
  a aurora da próxima tela aparecer na transição, sem flash preto.

---

## Avatar por foto (galeria/câmera)

Decisão: foto e avatar vetorial **coexistem**. A foto é o padrão/primário; o
construtor vetorial (item premium `premiumAvatarItems`) foi **preservado** como
modo alternativo. O paywall dos itens premium continua intacto.

### `packages/contracts/src/schemas/identity.ts` + `contracts/openapi.v1.yaml`
- **O quê**: novo campo `photoUri` em `AvatarConfig` (`string | null`, opcional
  com default `null`). Atualizado nos dois lugares (Zod + OpenAPI) no mesmo PR,
  como exige o DoD.
- **Por quê**: guardar a URI local da foto (file://, ph://, content://). Opcional
  para não quebrar avatares/fixtures já persistidos — o teste
  `avatar-assets.test.ts` valida esse fallback.

### `packages/api-client/src/mock/seed.ts`
- **O quê**: `photoUri: null` no avatar semente.
- **Por quê**: manter o tipo `UserProfile` completo; usuário demo começa sem foto.

### `apps/mobile/package.json` + `app.json`
- **O quê**: dependência `expo-image-picker` + config plugin com textos de
  permissão; `NSPhotoLibraryUsageDescription` no Info.plist (câmera já existia).
- **Por quê**: acesso a galeria e câmera. Requer `pnpm install` e um dev build
  (o app já usa módulos nativos, então não roda em Expo Go).

### `apps/mobile/src/features/avatar/use-photo-picker.ts` (novo)
- **O quê**: hook `usePhotoPicker` — `pickFromLibrary()` e `takePhoto()`,
  concentrando permissão, recorte 1:1 e tratamento de erro (toast). Retorna a URI
  ou `null`.
- **Por quê**: a tela só lida com a URI; permissão/erro num só lugar.

### `apps/mobile/src/features/avatar/Avatar.tsx`
- **O quê**: quando `photoUri` existe, renderiza a foto (circular, via
  `expo-image`) com a moldura por cima; senão, o SVG vetorial de antes.
- **Por quê**: a foto passa a representar o perfil, mantendo moldura premium.

### `apps/mobile/src/features/avatar/AvatarEditor.tsx`
- **O quê**: editor repaginado. Preview grande dentro de `GlassSurface`;
  `SegmentedControl` "Foto" / "Ilustração"; no modo Foto, ações "Escolher da
  galeria" / "Tirar foto" / "Remover foto"; no modo Ilustração, o construtor de
  chips com o paywall preservado. No save, o modo decide se `photoUri` é mantido
  ou zerado.
- **Por quê**: foto em primeiro plano, simples, sem perder a customização premium.

### `apps/mobile/src/features/progress/ProfileScreen.tsx`
- **O quê**: cabeçalho centralizado; avatar agora é tocável (atalho para trocar a
  foto) com dica de affordance; hierarquia de texto (nome/email/dica).
- **Por quê**: descoberta da troca de foto direto do perfil, com mais respiro.

### `apps/mobile/src/i18n/pt-BR.json`
- **O quê**: chaves novas (`avatarMode`, `avatarPhoto`, `avatarVector`,
  `avatarPhotoHint`, `avatarChoosePhoto`, `avatarTakePhoto`, `avatarRemovePhoto`,
  `avatarPhotoPermission`, `avatarPhotoError`, `avatarTapHint`).
- **Por quê**: R3 de convenção — nenhuma string solta em componente.

---

## Correção incidental — rotas tipadas

Ao instalar `expo-image-picker`, o watcher do Expo regenerou os tipos de
`typedRoutes`, revelando 13 chamadas pré-existentes de `router.push/replace`
com string concatenada (`'/plan/' + id`) — incompatíveis com typed routes.
Convertidas para a forma tipada `{ pathname: '/plan/[id]', params: { id } }` em
`TodayScreen`, `PlanScreen`, `PlanEditScreen`, `PlanEditor`, `NewPlanScreen`,
`PlansScreen`, `ClientPanel`, `MarketplaceScreen`. Não faziam parte do redesign,
mas eram necessárias para manter o typecheck verde (DoD).

---

## Fase 2 — linguagem visual das referências (`ui-examples/`)

Leitura das referências (apps fitness): tema escuro premium, **superfícies de
destaque com gradiente**, **anéis de atividade coloridos**, **tiles com
ícone/barra de progresso** e **cabeçalho com saudação + avatar**. Elevei o
design system para todas as telas herdarem, depois apliquei nas telas de tráfego.

**Decisão de acessibilidade:** texto claro sobre os gradientes vibrantes
(brand/violet/mint/warm) fica em ~3:1 — ok só para texto grande. Por isso os
**heros usam o gradiente `slate`** (escuro, ~15:1, legível para qualquer texto) e
a vibração vem do **anel colorido, do CTA e dos accents** — leitura fiel e
acessível das referências, que são predominantemente escuras com pops de cor.

### `packages/design-tokens/src/tokens.ts`
- **O quê**: `gradients` (brand/mint/violet/warm/slate, cada um `[cor, cor]` +
  `angle`) e `progressAccent` (mapa semântico: activity→mint, strength→violet,
  energy→warm, primary→brand). Tipos `GradientName`/`ProgressAccent`.
- **Por quê**: única fonte autorizada de gradiente (R5) — nenhum componente
  inventa par de cor.

### `apps/mobile/src/design/components/GradientSurface.tsx` (novo)
- **O quê**: superfície opaca de destaque (hero) com gradiente + verniz branco
  sutil, cantos xl e sombra. Não é vidro (dispensa `<GlassSurface>`).
- **Por quê**: os blocos que devem saltar sobre a aurora, como nas referências.

### `apps/mobile/src/design/components/ProgressRing.tsx`
- **O quê**: traço em **gradiente** (via `accent`), valor centralizado e
  **animação de preenchimento** na montagem (UI thread, respeita reduce motion).
- **Por quê**: "activity ring" das referências. Compatível com usos atuais; a
  legenda que antes vinha embutida passou a ser responsabilidade da tela.

### `apps/mobile/src/design/components/MetricTile.tsx`
- **O quê**: mantém o uso simples e ganha `accent` (ponto de cor no rótulo) e
  `progress` opcional (barra fina com gradiente do tom).
- **Por quê**: os tiles de calorias/água/peso das referências.

### `apps/mobile/src/design/components/Text.tsx`
- **O quê**: novo tom `onAccent` (near-white nos dois temas).
- **Por quê**: texto sobre `GradientSurface` escura, tokenizado (sem hex solto).

### `apps/mobile/src/features/today/TodayScreen.tsx`
- **O quê**: cabeçalho "saudação + avatar" (avatar tocável → editar); **hero
  slate** do treino de hoje com stats inline e CTA; card de aderência com **ring
  colorido** + tiles de sessões/sequência.
- **Por quê**: a home passa a comunicar estado num relance, no idioma visual das
  referências.

### `apps/mobile/src/features/progress/ProfileScreen.tsx`
- **O quê**: cabeçalho vira **hero slate** com avatar grande, e-mail, **badge do
  plano** e dica de troca de foto.
- **Por quê**: identidade e plano com mais presença; entrada para o avatar.

### `apps/mobile/src/features/progress/AdherenceSection.tsx`
- **O quê**: ring com `accent="activity"` + legenda própria centralizada.
- **Por quê**: preservar a informação após o ring deixar de renderizar legenda.

### `apps/mobile/src/features/progress/ProgressScreen.tsx`
- **O quê**: hierarquia do header (objetivo em tom secundário). As seções herdam
  os componentes elevados.

### `apps/mobile/src/i18n/pt-BR.json`
- **O quê**: chaves `coachStarter`/`coachPro` (badge de plano no perfil).

---

## Fase 3 — demais telas + fundo mais vibrante

O dono liberou "continuar com tudo" e pediu um **fundo menos chapado, mais
parecido com os exemplos** de `ui-examples/`.

### Fundo (`DepthBackground` + `themes.ts`)
- **O quê**: o fundo deixou de usar círculos de borda dura e passou a **mesh de
  aurora com gradientes radiais suaves** (SVG `RadialGradient`), somado a um
  **wash diagonal de cor** (menta → azul/violeta, canto a canto) e uma **vinheta**
  leve. As cores de aurora do tema (`depthBlobA/B/C`) tiveram a saturação
  aumentada (ex.: brand 0.28 → 0.55) e o C virou violeta.
- **Por quê**: reproduzir a assinatura "gradient app" das referências (escuro com
  banda de cor viva) sem perder profundidade nem legibilidade das superfícies.
  Prévia rasterizada conferida antes de fechar. Movimento respeita reduce motion.

### Telas (o quê + por quê)
- **Planos** (`PlansScreen`/`PlanScreen`/`NewPlanScreen`): cards com título
  title3, badge de plano ativo, hero slate no detalhe, rótulo de objetivo no novo.
- **Sessão** (`WorkoutSession`): título+volume em hero slate, `RestTimer` dentro
  de um `Card` para destaque (lógica de gesto/FlashList intacta).
- **Resumo da sessão** (`SessionSummary`): hero de celebração com o volume em
  `display` + tiles de duração/recordes/comparação com accents.
- **Catálogo** (`ExerciseRow`/`ExerciseDetailScreen`): badge de dificuldade
  colorido (verde/amarelo/vermelho) e hero slate no detalhe.
- **Coach** (`ClientPanel`/`ClientScreen`/`MarketplaceScreen`/`ProfessionalScreen`):
  badges de risco/avaliação/aceitando clientes, heros e tiles de métrica.
- **Entradas** (`WelcomeScreen`/`SignInScreen`/`PaywallScreen`): ring com accent
  por página; hero no sign-in; paywall com hero da feature e card Pro em destaque
  (slate + selo "Recomendado" — texto de corpo longo exige contraste alto, por
  isso não usei o gradiente vibrante atrás dele).

### i18n
- Novas chaves: `coachStarter`, `coachPro`, `recommended`.

---

## Verificação (DoD)

- `pnpm typecheck` (turbo, 5 pacotes) — **limpo** (fases 1, 2 e 3).
- `pnpm lint` (eslint, `--max-warnings 0`) — **limpo**.
- `pnpm test:unit` (vitest) — **61/61 verde**, incluindo o `contract.test`
  (paridade Zod ↔ OpenAPI com o novo `photoUri`).
- `prettier --check` nos arquivos tocados — **limpo**.
- Pendências para o dono validar no device: `pnpm install`; testar galeria e
  câmera (iOS + Android); conferir fallback não-glass e "Reduzir movimento";
  conferir os heros/rings/gradientes no device (iOS 26 com vidro e Android).
