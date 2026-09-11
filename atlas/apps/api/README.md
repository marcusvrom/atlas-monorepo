# Atlas.Api — Modular Monolith .NET 9

Backend da plataforma. Estrutura de módulos por bounded context, com fronteiras
verificadas em teste de arquitetura no CI. Ver `docs/specs/00-produto-e-dominio.md`
seções 4, 6 e 8, e ADR-0001.

## Estado atual

O módulo **Catalog** existe como **implementação de referência completa** das
quatro camadas. Os demais módulos são pastas com um `MODULE.md` descrevendo
agregados, invariantes e endpoints — deliberadamente não implementados: o
projeto está na Fase 0 (mock-first), e o backend começa na Fase 1.

Um agente de código deve replicar a estrutura de `Modules/Catalog` para cada
módulo novo, seguindo a task-spec correspondente em `docs/agent/task-specs/`.

## Regra de fronteira

Um módulo NUNCA referencia o projeto de outro módulo, exceto
`Atlas.SharedKernel`. Comunicação por evento (outbox → EventBridge) ou por
interface pública em `Application/PublicApi`. Isso é enforced por
`tests/Atlas.Architecture.Tests` — quebrar a regra quebra o build.

## Camadas de cada módulo

```
Domain/          Entidades, VOs, eventos. Zero dependências externas.
Application/     Use cases, ports, PublicApi (contrato para outros módulos)
Infrastructure/  EF Core (writes), Dapper (reads), adapters
Presentation/    Minimal API endpoints, DTOs, validators
```

Dependência: `Presentation → Application → Domain`, `Infrastructure → Application`.

## CQRS pragmático

- **Commands** via EF Core: change tracking e invariantes de agregado.
- **Queries** via Dapper com SQL explícito nas ~15 telas quentes (dashboard do
  coach, histórico de exercício, heatmap muscular). EF gera plano ruim para
  essas agregações e o custo de manter SQL à mão é menor que o de depurá-las.

## Rodar

```bash
dotnet restore
dotnet run --project src/Atlas.Api
# http://localhost:5080/swagger
```
