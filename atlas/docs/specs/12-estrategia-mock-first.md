# Spec 12 — Estratégia Mock-First

> **Ponto de atenção formalizado.** Este é o item que o projeto mais arrisca
> fazer errado: mock-first vira desperdício quando o mock é descartável.
> Aqui ele é projetado para **sobreviver** à chegada do backend.

## 1. Objetivo

Ter, antes de qualquer linha de backend, um app **completo e navegável** com
dados falsos, adequado para:

- validação de fluxo e usabilidade com usuários reais,
- apresentação a stakeholders e investidores,
- teste do design system Liquid Glass em device real,
- descoberta antecipada de lacunas no contrato de dados.

## 2. O que torna o mock não-descartável

| Prática | Efeito |
|---|---|
| Mock e HTTP implementam a **mesma interface** (`ports/`) | Trocar transporte não toca em tela |
| Mock valida saída com o **mesmo Zod** do HTTP | Mock impossível de divergir do contrato |
| Mock tem **estado mutável em memória** | Fluxos de escrita são reais: criar ficha, logar série, ver refletir |
| Mock simula **latência e erro** | UI de loading/erro/vazio é construída de verdade, não improvisada depois |
| Mock vira **fixture de teste** na Fase 2 | Custo de manutenção se paga |

Um mock que só devolve JSON estático produz um app que parece pronto e quebra
inteiro na integração. Este não é esse mock.

## 3. Simulação de condições reais

Configurável por env, ajustável em runtime no menu de dev:

```
EXPO_PUBLIC_MOCK_LATENCY_MS=220     # latência base; jitter ±40% aplicado
EXPO_PUBLIC_MOCK_ERROR_RATE=0       # 0.0–1.0, injeta falha aleatória
```

Cenários que **precisam** estar demonstráveis na Fase 0:

- lista vazia (usuário novo, sem ficha)
- carregando (skeleton com shimmer, não spinner)
- erro de rede com retry
- offline: registrar série sem conexão e ver a fila de sync
- paywall: atingir o limite de 2 fichas do plano Free
- conta de coach com 24 alunos, sendo 3 em risco

O último item é o mais importante para stakeholder: a tela vazia de coach não
vende nada. O dataset de demo é curado, não aleatório.

## 4. Dataset de demonstração

`packages/api-client/src/mock/fixtures/` contém:

| Fixture | Conteúdo |
|---|---|
| `muscle-groups.json` | 62 grupos mapeados aos paths do SVG anatômico |
| `exercises.json` | 40 exercícios com ativação muscular ponderada e mídia |
| `users.json` | 1 atleta demo + 1 coach demo + 24 alunos do coach |
| `plans.json` | 3 fichas publicadas (hipertrofia, força, reabilitação) |
| `sessions.json` | 14 semanas de histórico gerado com progressão realista |
| `measurements.json` | 14 semanas de peso/composição com ruído e tendência |

**14 semanas não é arbitrário:** é o mínimo para os gráficos de tendência, o
heatmap de volume e a detecção de estagnação terem o que mostrar. Histórico curto
faz o produto parecer vazio justamente na tela que justifica a assinatura.

Geração determinística por seed (`mock/seed.ts`) — toda demo é idêntica, o que
importa quando o time comercial vai repetir a apresentação.

## 5. Critérios de saída da Fase 0

A Fase 0 termina quando:

- [ ] Todos os fluxos do mapa de navegação (spec 13) são percorríveis
- [ ] Nenhuma tela usa dado hardcoded fora de `packages/api-client/src/mock`
- [ ] Todos os ports declarados em `ports/` têm implementação mock
- [ ] `contracts/openapi.v1.yaml` descreve exatamente os mesmos endpoints que os ports
- [ ] Estados de loading, vazio e erro implementados em todas as telas de dado
- [ ] Rodou em device físico iOS 26 e Android 14 com aprovação visual
- [ ] Teste de usabilidade com ≥ 5 usuários e ≥ 2 profissionais

O quarto item é o que garante que o backend não vá "descobrir" requisitos: o
contrato nasce da UI, que é onde ele é realmente exercitado.

## 6. Transição para a Fase 2

```
1. Backend implementa endpoint conforme contracts/openapi.v1.yaml
2. pnpm contracts:generate                  → tipos HTTP regenerados
3. Implementa o método no Http*Adapter correspondente
4. Teste de contrato: mesma suíte roda contra mock e contra HTTP real
5. Feature flag por domínio: EXPO_PUBLIC_API_MODE=http força tudo,
   ou src/data/api-provider.tsx permite mix por domínio durante a migração
```

O passo 5 permite migrar **um domínio por vez** (catálogo primeiro, sessão por
último) mantendo o app apresentável durante toda a transição.
