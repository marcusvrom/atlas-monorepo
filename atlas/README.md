# Atlas — Plataforma de Treino & Acompanhamento

Monorepo da plataforma. Contém especificações, app mobile (Expo/React Native),
API (.NET 9) e contratos compartilhados.

## Princípio de entrega

O projeto é construído em **três estágios**, nesta ordem, e a arquitetura foi
desenhada para que a passagem entre eles **não exija reescrita de tela**:

| Estágio | O que existe | Como valida |
|---|---|---|
| **Fase 0 — Mock-first** | App completo navegável com dados falsos | Apresentação a stakeholders, teste de usabilidade |
| **Fase 1 — Backend** | API .NET implementando o mesmo contrato | Testes de contrato verdes |
| **Fase 2 — Integração** | `EXPO_PUBLIC_API_MODE=http` | Mesmas telas, dados reais |

A troca entre mock e HTTP é **uma variável de ambiente**. Nenhuma tela sabe de
onde o dado vem. Ver [ADR-0014](docs/adr/0014-ports-and-adapters-data-layer.md).

## Estrutura

```
atlas/
├── apps/
│   ├── mobile/            Expo SDK 57 (RN 0.86) — app do atleta e do coach
│   └── api/               .NET 9 modular monolith
├── packages/
│   ├── contracts/         Zod schemas — fonte única de verdade dos dados
│   ├── domain/            Cálculos puros (1RM, volume, ACWR, aderência)
│   ├── design-tokens/     Tokens visuais compartilhados
│   └── api-client/        Ports + adapters (mock | http)
├── contracts/             OpenAPI e schemas de evento
├── docs/
│   ├── specs/             Especificações funcionais e técnicas
│   ├── adr/               Decisões arquiteturais
│   └── agent/             Instruções e task-specs para agentes de código
└── infra/                 Terraform
```

## Começando

```bash
# pré-requisitos: Node >= 22.13, pnpm 10, Xcode 26 (para Liquid Glass nativo)
pnpm install
cp .env.example apps/mobile/.env
pnpm mobile            # inicia em modo mock
```

Para o efeito Liquid Glass nativo é necessário **iOS 26+** (device ou simulador).
Em Android, iOS < 26 ou com "Reduzir transparência" ativo, o app degrada
automaticamente para o fallback definido em
[`docs/specs/11-design-system-liquid-glass.md`](docs/specs/11-design-system-liquid-glass.md).

## Documentos de entrada

Leia nesta ordem:

1. [`docs/agent/AGENTS.md`](docs/agent/AGENTS.md) — regras obrigatórias para gerar código aqui
2. [`docs/specs/00-produto-e-dominio.md`](docs/specs/00-produto-e-dominio.md) — produto, domínio, backend
3. [`docs/specs/10-arquitetura-mobile.md`](docs/specs/10-arquitetura-mobile.md)
4. [`docs/specs/12-estrategia-mock-first.md`](docs/specs/12-estrategia-mock-first.md)
