# Módulo Insights

> **Status:** não implementado (Fase 1). Estrutura a replicar: `src/Modules/Catalog`.

## Responsabilidade
Read models e projeções. Nenhuma escrita de domínio.

## Projeções
- `insights.weekly_muscle_volume` — atualizada em `SessionCompleted`.
  Histórico vem da projeção; a semana corrente é calculada ao vivo (dataset
  pequeno). Agregar o histórico completo em tempo real é o *query killer* do
  sistema. Ver spec 00 §13.2.
- Aderência, 1RM estimado, ACWR, tendência de composição corporal com média
  móvel de 7 dias.

## Alertas
`AdherenceDropped`, `GoalAtRisk` → consumidos por Coaching e Notifications.

## Task-specs
ATL-INS-001..004
