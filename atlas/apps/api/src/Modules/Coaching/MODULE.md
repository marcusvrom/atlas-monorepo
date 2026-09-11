# Módulo Coaching

> **Status:** não implementado (Fase 1). Estrutura a replicar: `src/Modules/Catalog`.

## Agregados
`CoachingEngagement`, `Goal`, `CheckIn`, `ProfessionalNote`

## Invariantes de privacidade
- `ShareScope` granular. Coach não vê nada fora do escopo, e isso é enforced no
  **repositório**, não na UI. Ver spec 00 §15.2.
- Revogação de consentimento corta acesso imediatamente e é auditada.
- Todo acesso profissional a dado sensível vai para trilha append-only.

## Read model
`coaching.coach_client_overview` — um coach com 60 alunos carrega o painel em
**uma query indexada**, nunca em 60 chamadas. Ver spec 00 §11.5.

## Task-specs
ATL-COA-001..005
