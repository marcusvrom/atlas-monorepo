# Módulo Session

> **Status:** não implementado (Fase 1). Estrutura a replicar: `src/Modules/Catalog`.

## Agregados
`TrainingSession` → `PerformedExercise` → `PerformedSet`

## Invariantes críticas
- `PerformedSet` é **append-only** e idempotente por
  `(session_id, client_generated_id)`. Reenvio é no-op, nunca duplicação.
- `sets:batch` devolve **207** com resultado particionado (aceito / duplicado /
  rejeitado). Um item inválido nunca invalida o lote — senão a fila de sync do
  device trava para sempre.
- `painLevel` só é coletado em contexto de reabilitação.

## Persistência
Tabela particionada por `RANGE (performed_at)` mensal. ~97M linhas/mês na escala
alvo. DDL em `docs/specs/00-produto-e-dominio.md` §5.2 (a).

## Task-specs
ATL-SES-001..004
