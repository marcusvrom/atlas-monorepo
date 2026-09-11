# Instruções para agentes de código — Atlas

> Este arquivo é normativo. Código que viola qualquer regra abaixo deve ser
> rejeitado em revisão, independentemente de funcionar.

## 1. Antes de escrever qualquer código

1. Localize a task-spec correspondente em `docs/agent/task-specs/*.yaml`.
   Se não existir, **pare e peça a spec** — não infira requisito.
2. Leia os ADRs referenciados na spec. Eles contêm o "porquê"; a spec contém o "o quê".
3. Confirme em qual estágio de entrega você está (`mock-first`, `backend`,
   `integration`). Isso muda o que é permitido tocar.

## 2. Regras invioláveis

### R1 — Telas nunca falam com transporte
Nenhum arquivo em `apps/mobile/app/**` ou `apps/mobile/src/features/**` pode
importar `fetch`, `axios`, URL de API, ou qualquer coisa de `src/mock`.
Tela consome **hooks de query**, hooks consomem **ports**, ports têm adapters.

### R2 — O contrato é o Zod, não o TypeScript
Todo dado que cruza a fronteira (mock ou HTTP) é validado pelo schema em
`@atlas/contracts`. Tipos são **derivados** com `z.infer`, nunca escritos à mão.
Um mock que não passa no schema é um bug de mesma severidade que um 500.

### R3 — Mock e HTTP implementam a mesma interface
Adicionar um método em um port obriga a implementar nos **dois** adapters.
Adapter incompleto lança `NotImplementedError`, nunca retorna `undefined`.

### R4 — Nada de Liquid Glass direto
Nenhum componente importa `expo-glass-effect` fora de
`src/design/glass/`. Telas usam `<GlassSurface>` e derivados. Isso garante
fallback e acessibilidade em um lugar só. Ver ADR-0015.

### R5 — Nada de valor mágico de estilo
Cores, espaçamentos, raios, tipografia e parâmetros de vidro vêm de
`@atlas/design-tokens`. Nenhum hex, nenhum `padding: 13`.

### R6 — Fronteira de módulo no backend
Um módulo .NET nunca referencia o projeto de outro módulo, exceto
`Atlas.SharedKernel`. Comunicação por evento ou por interface pública em
`Application/PublicApi`. Enforced por `Atlas.Architecture.Tests`.

### R7 — Escrita de dado de treino é idempotente
Toda operação de escrita de série carrega `clientGeneratedId` (UUIDv7 gerado no
device). Reenvio é no-op, nunca duplicação. Ver spec 00, §12.3.

### R8 — Dado sensível não vai para log
Peso, medidas, dor, fotos, mensagens: nunca em log, analytics ou crash report,
em nenhum nível. Use o helper `redact()`.

## 3. Convenções

| Tema | Regra |
|---|---|
| Idioma do código | Inglês (identificadores, tipos, commits) |
| Idioma da UI | pt-BR, sempre via `t()` — nenhuma string solta em componente |
| Idioma da doc | pt-BR |
| Commits | Conventional Commits, escopo = pacote (`feat(mobile): ...`) |
| Componentes | Function components, `.tsx`, um componente por arquivo |
| Estado servidor | TanStack Query. Nunca `useEffect` + `useState` para dado remoto |
| Estado local complexo | `useReducer` ou Zustand. Nunca Redux |
| Estilo | StyleSheet.create + tokens. Nunca inline object recriado no render |
| Listas | `FlashList`. Nunca `map()` em lista de tamanho não-limitado |
| Imagens | `expo-image`. Nunca `Image` do RN |
| Animação | Reanimated 4 na UI thread. Nunca `Animated` da API antiga |
| Testes | Vitest (pacotes puros), Maestro (fluxo E2E), xUnit (backend) |

## 4. Definition of Done

Uma task só está pronta quando:

- [ ] Todos os `acceptance_criteria` da task-spec verificáveis e verificados
- [ ] `pnpm typecheck` e `pnpm lint` limpos
- [ ] Mock adapter e HTTP adapter em paridade (se tocou em port)
- [ ] Fallback não-glass testado (Android + iOS com reduce transparency)
- [ ] Nenhum `TODO` sem ID de task-spec associado
- [ ] Se a task alterou contrato: `contracts/openapi.v1.yaml` atualizado no mesmo PR
