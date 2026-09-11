# Módulo Marketplace

> **Status:** não implementado (Fase 1). Estrutura a replicar: `src/Modules/Catalog`.

## Agregados
`ServiceOffering`, `SearchableProfessional` (read model), `Booking`

## Decisões
- Fase 2 usa **PostGIS** (`ST_DWithin` + índice GiST). Migrar para OpenSearch
  quando a busca passar de 5% do tráfego ou o catálogo de 5k profissionais.
  A interface `IProfessionalSearchService` isola a troca.
- Ranking por score composto, **não** por rating puro: `retentionRate90d` pesa
  mais porque é difícil de gamear e correlaciona com resultado real. Boost
  temporal em `joinedAt` é subsídio explícito de cold start. Ver spec 00 §11.2.

## Task-specs
ATL-MKT-001..004
