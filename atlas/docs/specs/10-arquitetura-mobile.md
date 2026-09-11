# Spec 10 — Arquitetura Mobile

## 1. Stack e justificativa

| Camada | Escolha | Versão alvo |
|---|---|---|
| Runtime | React Native | 0.86 |
| Framework | Expo SDK | 57 |
| React | | 19.2.3 |
| Navegação | Expo Router (file-based) + Native Tabs | SDK 57 |
| Estado de servidor | TanStack Query | v5 |
| Estado de UI | Zustand | v5 |
| Animação | Reanimated + Worklets | 4.5 / 0.10 |
| Gestos | Gesture Handler | 2.32 |
| Listas | FlashList | v2 |
| Imagens | expo-image | SDK 57 |
| Persistência local | expo-sqlite (dados) + MMKV (preferências) | SDK 57 |
| Vetor / anatomia | react-native-svg (+ Skia para gradientes) | — |
| Validação | Zod | v4 |
| Vidro nativo | expo-glass-effect | SDK 57 |
| Fallback de vidro | expo-blur + LinearGradient | SDK 57 |

### 1.1 Por que React Native + Expo, e não Flutter

Esta é uma **revisão do ADR-0007 original**, que recomendava Flutter. O
requisito de Liquid Glass inverte a decisão, e vale registrar o porquê:

- Liquid Glass no iOS 26 é `UIVisualEffectView` com material dinâmico do
  sistema — ele **amostra o conteúdo por trás em tempo real**, responde a
  scroll, a wallpaper e ao modo claro/escuro. Não é um blur com opacidade.
- Flutter renderiza em canvas próprio (Impeller). Ele pode *imitar* o vidro com
  shaders, mas não consegue o material do sistema, nem herda automaticamente as
  atualizações que a Apple fizer no visual. Numa UI cujo diferencial declarado é
  ser "Liquid Glass bem modernizado", imitar é o pior dos mundos: custo alto e
  resultado sempre meio errado.
- React Native com Fabric monta `UIView` real. `expo-glass-effect` expõe
  `GlassView`/`GlassContainer` sobre a API nativa, e o Expo Router expõe tab bar
  de sistema com vidro real.
- Custo aceito: precisão de renderização entre iOS e Android é menor que no
  Flutter, e a paridade visual em Android precisa ser **projetada como uma
  linguagem própria**, não como cópia degradada do iOS. Ver spec 11.

### 1.2 Configuração de performance obrigatória

- **New Architecture** (Fabric + TurboModules) ligada — padrão em SDK 57, não desligar.
- **Hermes** com bytecode pré-compilado.
- `react-native-worklets` em *bundle mode* para evitar a regressão de memória
  em Android documentada no SDK 56/57.
- Nenhuma animação na JS thread. Toda transição de vidro, sheet e gesto roda em
  worklet na UI thread.
- `enableFreeze()` de `react-native-screens` ativo — telas fora de foco não
  re-renderizam (crítico com 5 tabs vivas).

## 2. Camadas do app

```
app/                      Rotas (Expo Router). Só composição e layout.
  ├── _layout.tsx         Providers globais
  ├── (tabs)/             Tabs nativas com vidro
  └── [modais e stacks]
src/
  ├── design/             Design system. Único lugar que conhece "vidro".
  │   ├── glass/          GlassSurface, capability detection
  │   ├── components/     Button, Card, Screen, Sheet, Metric...
  │   └── theme.ts
  ├── features/           Um diretório por feature. Componentes + hooks locais.
  │   ├── training/
  │   ├── catalog/
  │   ├── progress/
  │   └── coaching/
  ├── data/               Camada de acesso a dado. NENHUMA tela importa daqui
  │   ├── api-provider.tsx    Injeta o ApiClient (mock|http) na árvore
  │   ├── query-client.ts
  │   └── queries/            Hooks TanStack Query por domínio
  ├── offline/            SQLite, outbox, sync engine
  ├── lib/                Utilitários puros
  └── i18n/
```

**Regra de dependência:** `app/ → features/ → data/ → @atlas/api-client`.
Nunca o inverso. `design/` não depende de `data/` nem de `features/`.

## 3. Camada de dados (ports & adapters)

Detalhe completo em [spec 30](30-contrato-de-integracao.md) e no ADR-0014.
Resumo do fluxo:

```
Tela
 └─ useTodayWorkout()                     (src/data/queries/training.ts)
     └─ useApi().programming.getToday()   (port, @atlas/api-client)
         ├─ MockProgrammingAdapter        (Fase 0)
         └─ HttpProgrammingAdapter        (Fase 2)
              └─ valida com @atlas/contracts antes de devolver
```

O `ApiClient` é montado uma vez em `api-provider.tsx` a partir de
`EXPO_PUBLIC_API_MODE` e injetado por Context. Trocar de mock para HTTP não
toca em tela, hook nem tipo.

## 4. Offline-first (implementar na Fase 2, projetar na Fase 0)

Mesmo em modo mock, a estrutura já existe:

- `src/offline/db.ts` — schema SQLite com as mesmas entidades do contrato.
- `src/offline/outbox.ts` — fila de operações pendentes.
- `src/offline/sync.ts` — no modo mock, roda contra o adapter mock e exercita
  toda a lógica de reconciliação. Isso significa que o sync é **testado desde a
  Fase 0**, e não descoberto na integração.

`performed_set` é append-only e idempotente por `clientGeneratedId` — decisão que
elimina a maior parte da complexidade de conflito. Ver spec 00, §12.3.

## 5. Orçamento de performance

| Métrica | Alvo | Como medir |
|---|---|---|
| TTI (cold start → tab Hoje) | ≤ 2,0 s | `expo-dev-client` + Perf Monitor |
| Frame rate em scroll de catálogo | ≥ 58 fps | RN DevTools, 1000 itens |
| Frame rate em transição de vidro | 60 fps constante | Instruments (iOS) |
| Tamanho do bundle JS | ≤ 3,5 MB | `npx expo export` |
| Memória em sessão de treino | ≤ 220 MB | Instruments / Android Profiler |
| Registro de série (mock) | ≤ 16 ms até feedback visual | otimistic update |

Regressão de qualquer métrica acima de 15% bloqueia merge.
