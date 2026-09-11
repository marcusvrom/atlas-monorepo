# Módulo Programming

> **Status:** não implementado (Fase 1). Estrutura a replicar: `src/Modules/Catalog`.

## Agregados
`WorkoutPlan` (raiz) → `WorkoutDay` → `ExercisePrescription` → `SetPrescription`

## Invariantes
- Plano publicado é **imutável**. Ajuste gera nova versão (`CreateRevision`), e o
  histórico do aluno permanece consistente com a versão que ele executou.
- Publicar exige ao menos um dia, e nenhum dia vazio.
- Implementação de referência do agregado está em `docs/specs/00-produto-e-dominio.md` §8.1.

## Endpoints
`POST/GET /api/v1/workout-plans`, `/{id}/publish`, `/{id}/revisions`,
`/{id}/activate`, `/today`

## Task-specs
ATL-PRG-001..005
