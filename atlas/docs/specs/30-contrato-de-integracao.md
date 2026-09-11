# Spec 30 — Contrato de integração frontend ↔ backend

## 1. Fonte única de verdade

```
contracts/openapi.v1.yaml          ← contrato HTTP (backend gera, frontend consome)
        │
        ├─→ packages/contracts/     Zod schemas (runtime + tipos derivados)
        │        ↑
        │        └── usado por MOCK e por HTTP. Esta é a chave de tudo.
        │
        └─→ apps/api/               anotações de endpoint devem bater com o YAML
```

Divergência entre os três é erro de build, não de runtime: o CI compara os
endpoints declarados nos ports com os paths do OpenAPI.

## 2. Ports (interfaces de domínio)

Definidos em `packages/api-client/src/ports/`. Um port por bounded context.
Assinaturas são orientadas a **caso de uso**, não a endpoint HTTP — isso permite
que o backend evolua (agregar duas chamadas em uma) sem quebrar a UI.

```ts
export interface ProgrammingPort {
  getTodayWorkout(): Promise<TodayWorkout | null>;
  listPlans(filter?: PlanFilter): Promise<Page<WorkoutPlanSummary>>;
  getPlan(id: WorkoutPlanId): Promise<WorkoutPlan>;
  createPlan(input: CreatePlanInput): Promise<WorkoutPlan>;
  publishPlan(id: WorkoutPlanId): Promise<WorkoutPlan>;
}
```

## 3. Erros

Formato único, independente de transporte. O mock produz os mesmos erros do HTTP.

```ts
class ApiError extends Error {
  code: ApiErrorCode;   // 'unauthorized' | 'not_found' | 'quota_exceeded' | ...
  status?: number;
  details?: Record<string, unknown>;
}
```

`quota_exceeded` carrega `{ feature, limit, currentPlan, suggestedUpgrade }` e é
o que dispara o paywall contextual. Nenhuma tela decide regra de plano — ela
apenas reage ao erro. Ver spec 00, §8.2.

## 4. Paginação

Cursor opaco em toda coleção temporal. O client nunca constrói cursor.

```ts
type Page<T> = { items: T[]; nextCursor: string | null };
```

## 5. Idempotência

Toda escrita relevante aceita `idempotencyKey`. O mock **também** implementa a
deduplicação — é assim que o comportamento de reenvio é testado antes de existir
backend.

## 6. Regra de evolução de contrato

| Mudança | Permitida sem versionar? |
|---|---|
| Adicionar campo opcional na resposta | Sim |
| Adicionar endpoint | Sim |
| Adicionar campo obrigatório no request | Não |
| Remover ou renomear campo | Não |
| Estreitar tipo (string → enum) | Não |

Quebra de contrato exige `/api/v2` e período de convivência de 90 dias. Apps
móveis não atualizam sincronizadamente — assumir que atualizam é o erro clássico.
