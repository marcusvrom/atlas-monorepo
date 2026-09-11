# Ambiente dev

ATL-INF-001. Provisionar nesta ordem:

1. `network`
2. `aurora` (com PostGIS habilitado no parameter group)
3. `redis`
4. `messaging`
5. `ecs-service`
6. `observability`

Migrations rodam por task ECS dedicada ANTES do deploy da aplicação, sempre em
padrão expand/contract: rollback de código nunca deve exigir rollback de schema.
