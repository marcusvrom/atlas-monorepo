# Módulo Identity

> **Status:** não implementado (Fase 1). Estrutura a replicar: `src/Modules/Catalog`.

## Agregados
- `UserAccount`, `AthleteProfile`, `ProfessionalProfile`, `Avatar`

## Invariantes
- Um usuário pode ser atleta **e** profissional ao mesmo tempo. NÃO usar herança
  de `User` — composição de perfis.
- `ProfessionalProfile` tem máquina de estados
  `Draft → PendingVerification → Verified → Suspended`. Só `Verified` aparece na busca.
- `CurrentGoal` dirige quais estatísticas o dashboard destaca (spec 00 §11.4).

## Endpoints
`POST /api/v1/auth/register`, `GET /api/v1/me`, `PATCH /api/v1/me/goal`,
`PUT /api/v1/me/avatar`, `GET /api/v1/me/entitlements`

## Task-specs
ATL-IDN-001..003, ATL-AVT-001..002
