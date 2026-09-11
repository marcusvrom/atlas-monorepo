# Schemas de evento

Contratos dos eventos de integração publicados no EventBridge.

## Regras

1. **Versionamento no `$id` e no campo `version`.** Consumidores filtram por
   `eventType` + `version`. Evolução compatível adiciona campo opcional; evolução
   incompatível cria `v2` e ambos convivem até todos os consumidores migrarem.
2. **Payload autocontido.** Se o consumidor precisa consultar o publisher para
   entender o evento, o evento está mal modelado — daí `muscleVolumes` já vir
   agregado em `SessionCompleted`.
3. **Ordenação garantida por agregado, não globalmente.** É suficiente para o
   domínio e muito mais barato.
4. **Nenhum dado sensível de saúde no envelope de evento.** Peso, medidas, dor e
   fotos ficam no datastore de origem; o evento carrega ids.

## Catálogo

| Evento | Publisher | Consumidores |
|---|---|---|
| `atlas.session.completed` | Session | Insights, Coaching, Gamification, Notifications |
| `atlas.measurement.recorded` | BodyMeasurement | Insights, Coaching |
| `atlas.plan.published` | Programming | Coaching, Notifications |
| `atlas.engagement.started` | Marketplace | Coaching, Billing, Messaging |
| `atlas.subscription.changed` | Billing | Identity + invalidação de cache de entitlements |
| `atlas.professional.verified` | Identity | Marketplace (indexação) |
| `atlas.adherence.dropped` | Insights | Coaching, Notifications |

Schemas ainda não escritos são task-specs da Fase 1.
