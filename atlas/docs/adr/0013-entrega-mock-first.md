# ADR-0013 — Entrega mock-first antes do backend

**Status:** Aceito

## Decisão

Construir o app mobile completo e navegável com dados mockados (Fase 0) antes de
iniciar o backend, com a exigência de que o mock **não seja descartável**.

## Contexto

Duas necessidades concretas: validar navegação e usabilidade cedo, e ter algo
apresentável a stakeholders antes de haver infraestrutura. O risco conhecido é
que mock-first produza uma UI que "parece pronta" e desmonte na integração.

## Mitigações que tornam a decisão segura

- Adapters mock e HTTP atrás dos mesmos ports (ADR-0014)
- Mesma validação Zod nos dois caminhos
- Mock com estado mutável, latência e injeção de erro
- Sync engine e outbox exercitados desde a Fase 0, contra o mock
- Critério de saída formal (spec 12, §5) incluindo paridade com o OpenAPI

## Consequências

**Positivas:** feedback de usuário ~10 semanas antes; contrato de API nasce da
necessidade real da UI; demo comercial funciona offline e para sempre;
estados de loading/erro/vazio construídos de verdade.

**Negativas:** decisões de modelagem tomadas sem restrição de banco podem exigir
ajuste na Fase 1 — mitigado pelo modelo de domínio da spec 00 já existir e ser a
referência do mock. Risco de o time tratar a Fase 0 como definitiva e resistir a
refatorar — mitigado por critério de saída explícito.
