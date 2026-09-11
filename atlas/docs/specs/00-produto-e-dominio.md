# Plataforma de Treino & Acompanhamento — Especificação Completa

> **Codinome de trabalho:** `Atlas`
> **Formato:** pacote de specs em 4 camadas (Produto → Domínio → Técnica → Execução), pensado para ser consumido tanto por humanos quanto por agentes de código em fluxo spec-driven.
> **Versão:** 1.0 — baseline arquitetural

---

## 0. Sumário

1. [Visão de produto e personas](#1-visão-de-produto-e-personas)
2. [Escopo e faseamento](#2-escopo-e-faseamento)
3. [Modelo freemium e monetização](#3-modelo-freemium-e-monetização)
4. [Spec de domínio — bounded contexts](#4-spec-de-domínio--bounded-contexts)
5. [Modelo de dados](#5-modelo-de-dados)
6. [Arquitetura de solução](#6-arquitetura-de-solução)
7. [Decisões arquiteturais (ADRs)](#7-decisões-arquiteturais-adrs)
8. [Estrutura de projeto .NET](#8-estrutura-de-projeto-net)
9. [Contratos de API](#9-contratos-de-api)
10. [Eventos de domínio e integração](#10-eventos-de-domínio-e-integração)
11. [Subsistemas críticos](#11-subsistemas-críticos)
12. [Frontend e camada visual](#12-frontend-e-camada-visual)
13. [Performance e escalabilidade](#13-performance-e-escalabilidade)
14. [Observabilidade](#14-observabilidade)
15. [Segurança, LGPD e compliance](#15-segurança-lgpd-e-compliance)
16. [DevOps e infraestrutura como código](#16-devops-e-infraestrutura-como-código)
17. [Estimativa de custo AWS](#17-estimativa-de-custo-aws)
18. [Riscos e trade-offs consolidados](#18-riscos-e-trade-offs-consolidados)
19. [Backlog inicial em formato de spec executável](#19-backlog-inicial-em-formato-de-spec-executável)

---

## 1. Visão de produto e personas

### 1.1 Proposta de valor

Uma plataforma que unifica três coisas hoje fragmentadas: **(a)** planejamento e log de treino, **(b)** evolução corporal mensurável, **(c)** acesso sob demanda a profissionais qualificados (personal trainer, fisioterapeuta, nutricionista esportivo) com acompanhamento contínuo, não apenas uma consulta pontual.

O diferencial competitivo frente a apps de log puro (Hevy, Strong) é o marketplace com relação contínua; frente a marketplaces de aula (Cambly, GetNinjas) é que o produto **funciona sozinho e bem** mesmo sem contratar ninguém — o marketplace é upsell natural, não pré-requisito.

### 1.2 Personas

| Persona | Descrição | Job-to-be-done principal |
|---|---|---|
| **Atleta autônomo (Free)** | Treina sozinho, quer estrutura e histórico | "Quero saber se estou progredindo" |
| **Atleta assistido (Pro)** | Contratou um profissional | "Quero seguir um plano feito para mim e ser cobrado" |
| **Paciente em reabilitação** | Vindo de lesão/cirurgia, sob orientação de fisio | "Quero executar certo e reportar dor/limitação" |
| **Profissional independente (Coach)** | Personal/fisio autônomo, 10–60 alunos | "Quero escalar atendimento sem virar planilha ambulante" |
| **Profissional de alto volume (Studio)** | Box/estúdio, múltiplos coaches | "Quero padronizar programas e medir retenção" |
| **Operação/Admin (interno)** | Curadoria de catálogo, verificação de CREF/CREFITO, disputas | "Quero garantir qualidade e conformidade" |

### 1.3 Requisitos não funcionais (RNF) de topo

| ID | Requisito | Alvo |
|---|---|---|
| RNF-01 | Latência de API (p95) em endpoints de leitura | ≤ 200 ms |
| RNF-02 | Latência de gravação de série durante treino (p95) | ≤ 150 ms |
| RNF-03 | Funcionamento **offline-first** durante a sessão de treino | 100% das operações de log |
| RNF-04 | Disponibilidade mensal | 99,9% (core), 99,5% (vídeo) |
| RNF-05 | Cold start do app até tela de treino do dia | ≤ 2,5 s (P50, 4G) |
| RNF-06 | RPO / RTO | 5 min / 1 h |
| RNF-07 | Suporte a dados sensíveis de saúde | LGPD art. 11 — base legal explícita |
| RNF-08 | Escala alvo ano 1 | 300k MAU, 25k coaches, pico 4k sessões simultâneas de treino |

**Premissa assumida** (não estava no enunciado, registro para validação): mercado inicial Brasil, mobile-first, iOS + Android + Web (web prioritariamente para o profissional).

---

## 2. Escopo e faseamento

Faseamento por **redução de risco**, não por ordem de features bonitas. O maior risco do produto não é técnico — é o marketplace de dois lados vazio (*cold start problem*). Por isso o Fase 1 entrega valor completo ao usuário solo.

### Fase 1 — "App que se sustenta sozinho" (MVP, ~3 meses)
- Cadastro, perfil, objetivo, avatar
- Catálogo de exercícios com vídeo + modelo anatômico
- Criação de ficha de treino (manual + templates)
- Execução de treino com log de séries, carga, RPE, offline-first
- Registro de métricas corporais (peso, %BF, medidas, massa magra estimada)
- Dashboards de evolução (volume, 1RM estimado, frequência, composição corporal)
- Freemium com limites (ver §3)

### Fase 2 — "Marketplace" (~2,5 meses)
- Onboarding de profissional + verificação de registro (CREF/CREFITO)
- Busca geográfica + filtros + ranking
- Contratação, checkout, split de pagamento
- Vínculo coach↔aluno, prescrição de ficha, aprovação/ajuste
- Chat assíncrono, feedback em série/execução

### Fase 3 — "Acompanhamento profundo" (~2 meses)
- Videochamada 1:1 e sessão guiada em tempo real
- Painel do profissional com N clientes, alertas de aderência/risco de churn
- Metas com checkpoints, relatórios PDF
- Módulo fisioterapia: escala de dor, ROM, protocolos por fase de reabilitação

### Fase 4 — "Escala e inteligência"
- Integrações wearables (Apple Health, Health Connect, Garmin)
- Recomendação de ajuste de carga/volume (auto-regulação por RPE/RIR)
- Gamificação social, desafios, ranking entre alunos do mesmo coach
- Studio/multi-coach, white-label

---

## 3. Modelo freemium e monetização

### 3.1 Matriz de features

| Capacidade | Free | Pro (B2C) | Coach Starter | Coach Pro |
|---|---|---|---|---|
| Fichas de treino ativas | 2 | Ilimitado | — | — |
| Histórico de treino | 90 dias | Ilimitado | Ilimitado | Ilimitado |
| Exercícios do catálogo | Completo | Completo | Completo | Completo |
| Exercícios customizados | 5 | Ilimitado | Ilimitado | Ilimitado |
| Vídeo de execução | ✔ | ✔ | ✔ | ✔ |
| Modelo anatômico interativo | Estático | Interativo + heatmap de volume | ✔ | ✔ |
| Métricas corporais | Peso + 3 medidas | Todas + composição corporal + fotos de progresso | ✔ | ✔ |
| Dashboards | Básico (7/30 dias) | Avançado, comparativos, export CSV/PDF | ✔ | ✔ |
| Avatar | Base | Itens premium, molduras, temas | ✔ | ✔ |
| Contratar profissional | ✔ (marketplace aberto) | ✔ com desconto de plataforma | — | — |
| Alunos ativos | — | — | até 15 | ilimitado |
| Biblioteca de templates próprios | — | — | 10 | ilimitado |
| Videochamada integrada | — | — | 5 h/mês | 40 h/mês |
| Relatórios white-label | — | — | — | ✔ |
| Taxa de plataforma sobre serviço | — | — | 18% | 12% |

**Racional do gate:** os limites escolhidos travam **profundidade e continuidade**, nunca a experiência inicial. Limitar o catálogo de exercícios ou o vídeo de execução destruiria a percepção de qualidade no dia 1; limitar histórico a 90 dias cria dor exatamente no momento em que o usuário já está engajado (mês 4) — é o gate com melhor razão conversão/atrito.

### 3.2 Fluxos de receita

1. **Assinatura B2C (Pro)** — via In-App Purchase obrigatório (Apple/Google, 15–30%).
2. **Assinatura B2B (Coach)** — cobrada na **web**, fora do IAP, via Stripe/Pagar.me. Reduz take rate das lojas.
3. **Take rate sobre serviços** — serviços prestados por pessoa física fora do app (consultoria, acompanhamento) são elegíveis a pagamento externo pelas diretrizes de ambas as lojas. **Isso precisa de validação jurídica antes do lançamento** — é o principal risco regulatório de receita.
4. **Cosméticos de avatar** — bens digitais → obrigatoriamente IAP.

> ⚠️ **Trade-off crítico de monetização:** misturar bens digitais (avatar) e serviços humanos (coaching) no mesmo app aumenta o risco de rejeição na review. Mitigação: separar rigorosamente os fluxos de checkout no código (`IPaymentGateway` com resolução por `ProductKind`) e nunca linkar de dentro do app para checkout web de bens digitais.

---

## 4. Spec de domínio — bounded contexts

Modelagem em DDD tático. Cada contexto é um **módulo isolado** com seu próprio schema no banco, comunicação por eventos ou por interfaces públicas explícitas (sem `JOIN` cross-schema).

```
┌──────────────────────────────────────────────────────────────────────┐
│                          ATLAS PLATFORM                              │
├──────────────┬──────────────┬──────────────┬─────────────┬───────────┤
│  Identity &  │   Exercise   │   Workout    │    Body      │ Marketplace│
│   Profile    │   Catalog    │  Programming │ Measurement  │ & Matching │
├──────────────┼──────────────┼──────────────┼─────────────┼───────────┤
│  Coaching    │   Training   │   Billing &  │  Messaging  │  Insights  │
│ Relationship │   Session    │ Subscription │  & Realtime │ & Analytics│
└──────────────┴──────────────┴──────────────┴─────────────┴───────────┘
                  ┌──────────────────────────────┐
                  │  Shared Kernel: UserId,       │
                  │  Money, Measure, DateRange    │
                  └──────────────────────────────┘
```

### 4.1 Identity & Profile
**Responsabilidade:** identidade, papéis (`Athlete`, `Professional`, `Admin` — não excludentes), preferências, avatar, objetivo atual.

- Agregados: `UserAccount`, `AthleteProfile`, `ProfessionalProfile`, `Avatar`
- Regra: um usuário pode ser atleta **e** profissional simultaneamente (coach que também treina). O modelo **não** deve usar herança de `User` — usa composição de perfis.
- `ProfessionalProfile` tem máquina de estados: `Draft → PendingVerification → Verified → Suspended`. Só `Verified` aparece na busca.
- `CurrentGoal`: `{ type: Hypertrophy | FatLoss | Strength | Endurance | Rehabilitation | GeneralHealth, targetDate, targetMetrics[] }` — o objetivo dirige quais estatísticas são destacadas no dashboard (ver §11.4).

### 4.2 Exercise Catalog
**Responsabilidade:** fonte da verdade dos exercícios, mídia de execução e mapeamento anatômico.

- Agregados: `Exercise`, `MuscleGroup`, `Equipment`, `ExerciseVariation`
- `Exercise` contém `MuscleActivation[]` = `{ muscleId, role: Primary|Secondary|Stabilizer, activationWeight: 0.0–1.0 }`. O peso de ativação é o que alimenta o **heatmap anatômico de volume semanal** — não basta marcar "peito", é preciso saber quanto.
- Catálogo curado (interno) + custom (usuário/coach). Exercícios custom **nunca** entram no catálogo global sem revisão de admin.
- Mídia: vídeo curto em loop (6–12 s), 2 ângulos, + `ExecutionCue[]` textual + `CommonMistake[]`.
- É um contexto **read-heavy e quase imutável** → candidato natural a cache agressivo e CDN (ver §13).

### 4.3 Workout Programming
**Responsabilidade:** a "ficha". Estrutura prescritiva, sem dados de execução.

- Agregados: `WorkoutPlan` (raiz) → `WorkoutDay` → `ExercisePrescription` → `SetPrescription`
- `WorkoutPlan` é **versionado e imutável após publicação**. Ajuste de coach gera nova versão; o histórico do aluno permanece consistente com a versão que ele executou. Isso é o que permite responder "meu treino mudou o quê no mês passado?".
- `SetPrescription` suporta prescrição por: reps fixas, faixa de reps, tempo, distância, RIR/RPE alvo, %1RM, progressão automática (`+2,5 kg a cada semana concluída`).
- Suporta técnicas: `Straight`, `Superset`, `Dropset`, `RestPause`, `Cluster`, `AMRAP`, `EMOM`, `Isometric` (relevante para fisio).
- Origem: `SelfCreated | FromTemplate | PrescribedByProfessional`.

### 4.4 Training Session
**Responsabilidade:** o que **realmente aconteceu**. Contexto de maior volume de escrita.

- Agregados: `TrainingSession` → `PerformedExercise` → `PerformedSet`
- `PerformedSet`: `{ weight, reps, rpe, rir, tempo, restSeconds, isWarmup, isFailure, painLevel?, notes }`
- `painLevel` (0–10, EVA) só é coletado quando o usuário tem objetivo `Rehabilitation` ou o exercício está flagueado por um fisio — evita poluir a UX do público geral.
- **Idempotência obrigatória:** cada `PerformedSet` carrega um `clientGeneratedId` (UUID v7 gerado no device). Sincronização offline reenviando o mesmo lote não pode duplicar. Chave única `(sessionId, clientGeneratedId)`.
- Emite `SessionCompleted` → alimenta Insights, Coaching e Gamificação.

### 4.5 Body Measurement
**Responsabilidade:** série temporal de composição corporal.

- Agregado: `MeasurementEntry` = `{ takenAt, source: Manual|Smartscale|Wearable|ProfessionalAssessment, weightKg, bodyFatPct, leanMassKg, skinfolds{}, circumferences{}, photos[] }`
- Suporta **protocolos de dobras cutâneas** (Pollock 3/7, Faulkner, Guedes) com cálculo server-side determinístico e versionado — o mesmo dado bruto precisa produzir o mesmo resultado 3 anos depois.
- Massa magra derivada, nunca inserida diretamente: `leanMass = weight × (1 − bodyFat)`.
- **Guardrail de saúde (obrigatório, não opcional):** metas de peso são validadas contra faixas seguras. O sistema recusa metas que impliquem IMC < 17,5 ou déficit projetado > 1% do peso corporal por semana, e nunca renderiza mensagens de reforço negativo. Avaliação profissional (`ProfessionalAssessment`) sempre sobrescreve auto-relato em rankings de confiabilidade.

### 4.6 Marketplace & Matching
**Responsabilidade:** descoberta de profissionais, oferta de serviços, contratação.

- Agregados: `ServiceOffering`, `SearchableProfessional` (read model), `Booking`
- `ServiceOffering`: `{ modality: Online|InPerson|Hybrid, specialty[], pricePerMonth, trialAvailable, capacity, cancellationPolicy }`
- Busca combina: proximidade geográfica (PostGIS/OpenSearch geo), especialidade compatível com o objetivo do atleta, disponibilidade de agenda, rating, taxa de resposta e retenção histórica de alunos.
- Ranking não é só rating — é score composto (§11.2). Rating puro cria winner-takes-all e mata a oferta de novos coaches.

### 4.7 Coaching Relationship
**Responsabilidade:** o vínculo contínuo. É aqui que mora o valor recorrente.

- Agregados: `CoachingEngagement`, `Goal`, `CheckIn`, `ProfessionalNote`
- Estados: `Trial → Active → Paused → Ended`
- **Consentimento granular:** o atleta escolhe o que compartilha (`ShareScope`: treinos, medidas, fotos, dor, wearables). Coach não vê nada fora do escopo — e isso é enforced no repositório, não na UI.
- `CoachDashboard` é um read model denormalizado: para N alunos, retorna aderência 7/30d, último treino, delta de peso, metas em risco, mensagens não lidas. **Nunca** montado via N+1 sobre agregados.

### 4.8 Billing & Subscription
- Agregados: `Subscription`, `Entitlement`, `Payout`, `Invoice`
- `Entitlement` é o **contrato público** do módulo: o resto do sistema pergunta `IEntitlementService.HasAsync(userId, Feature.UnlimitedPlans)`, nunca `subscription.Plan == "Pro"`. Isso desacopla feature-gating de plano comercial e permite grandfathering, cupons, trials e experimentos de pricing sem tocar em 40 lugares.
- Split de pagamento coach↔plataforma via Stripe Connect ou Pagar.me Split.

### 4.9 Messaging & Realtime
- Chat assíncrono coach↔aluno, comentário ancorado em série/exercício específico, videochamada.
- Separado do core: falha aqui não pode derrubar o log de treino.

### 4.10 Insights & Analytics
- Read models e projeções: volume por grupo muscular, 1RM estimado (Epley/Brzycki), tonelagem, frequência, aderência, tendência de composição corporal com suavização (média móvel de 7 dias — peso diário cru é ruído e gera ansiedade no usuário).
- Detecção de estagnação e de risco de overtraining (ACWR — acute:chronic workload ratio).

---

## 5. Modelo de dados

### 5.1 Diagrama lógico (núcleo)

```
user_account ──1:1── athlete_profile ──1:N── body_measurement_entry
     │                     │
     │                     └──1:N── goal
     │
     ├──0:1── professional_profile ──1:N── service_offering
     │                     │
     │                     └──1:N── coaching_engagement ──N:1── athlete_profile
     │
     └──1:1── avatar ──N:M── avatar_item

workout_plan (versionado) ──1:N── workout_day ──1:N── exercise_prescription
                                                              │
exercise ──1:N── muscle_activation ──N:1── muscle_group      │
   │                                                          │
   └──────────────────────────────────────────────────────────┘

training_session ──1:N── performed_exercise ──1:N── performed_set
        │
        └──N:1── workout_plan_version (nullable — treino livre)
```

### 5.2 Decisões de modelagem relevantes

**a) Séries temporais particionadas.** `performed_set` é a tabela de maior crescimento: 300k MAU × 3 treinos/semana × 25 séries ≈ **97M linhas/mês**. Particionamento declarativo por `RANGE (performed_at)` mensal, com índice local `(athlete_id, exercise_id, performed_at DESC)`. Partições > 18 meses migram para S3 + Athena via política automatizada.

```sql
CREATE TABLE session.performed_set (
    id                  uuid        NOT NULL DEFAULT uuidv7(),
    session_id          uuid        NOT NULL,
    athlete_id          uuid        NOT NULL,
    exercise_id         uuid        NOT NULL,
    client_generated_id uuid        NOT NULL,
    set_order           smallint    NOT NULL,
    weight_kg           numeric(6,2),
    reps                smallint,
    duration_seconds    integer,
    rpe                 numeric(3,1),
    rir                 smallint,
    is_warmup           boolean     NOT NULL DEFAULT false,
    pain_level          smallint,           -- 0..10, nullable
    performed_at        timestamptz NOT NULL,
    CONSTRAINT pk_performed_set PRIMARY KEY (id, performed_at),
    CONSTRAINT uq_performed_set_idem UNIQUE (session_id, client_generated_id, performed_at),
    CONSTRAINT ck_pain_range CHECK (pain_level BETWEEN 0 AND 10)
) PARTITION BY RANGE (performed_at);

CREATE INDEX ix_perfset_athlete_ex_time
    ON session.performed_set (athlete_id, exercise_id, performed_at DESC)
    INCLUDE (weight_kg, reps);
```

**b) UUID v7 em vez de v4.** Ordenação temporal aproximada → localidade de escrita no B-tree, menos page splits, índices ~30% menores em bloat. Diferença mensurável em tabela de 100M+ linhas.

**c) Ativação muscular como tabela, não JSON.** Precisa ser agregável em `GROUP BY` para o heatmap semanal:

```sql
CREATE TABLE catalog.muscle_activation (
    exercise_id       uuid NOT NULL REFERENCES catalog.exercise(id),
    muscle_group_id   smallint NOT NULL REFERENCES catalog.muscle_group(id),
    role              smallint NOT NULL,          -- 1=Primary 2=Secondary 3=Stabilizer
    activation_weight numeric(3,2) NOT NULL CHECK (activation_weight BETWEEN 0 AND 1),
    PRIMARY KEY (exercise_id, muscle_group_id)
);
```

**d) Geolocalização.** `professional_profile.service_area geography(Point,4326)` + índice GiST. Aurora PostgreSQL com PostGIS habilitado. Fonte da verdade no Postgres; OpenSearch como índice de busca (ver §11.2).

**e) Schema-per-module.** Cada bounded context tem seu schema (`identity`, `catalog`, `programming`, `session`, `marketplace`, `coaching`, `billing`). Uma única instância física, isolamento lógico enforced por migrations separadas e por convenção de que nenhum módulo lê schema alheio. Isso é o que torna a extração futura para microserviço um refactor de dias, não de trimestres.

**f) Fotos de progresso.** Nunca no banco. S3 com bucket dedicado, criptografia KMS com chave própria, URLs pré-assinadas de vida curta (5 min), e política de retenção separada por serem dado sensível de altíssima sensibilidade.

---

## 6. Arquitetura de solução

### 6.1 Visão macro

```
                          ┌──────────────┐
   Mobile (Flutter)  ────▶│  CloudFront  │◀──── Web Coach (Angular)
   Watch companion   ────▶└──────┬───────┘
                                 │
                          ┌──────▼───────┐
                          │ API Gateway  │  (HTTP API + WAF + Cognito authorizer)
                          └──────┬───────┘
                                 │
                  ┌──────────────▼───────────────┐
                  │   ALB → ECS Fargate          │
                  │   atlas-api (modular         │
                  │   monolith .NET 9)           │
                  └───┬────────┬────────┬────────┘
                      │        │        │
        ┌─────────────▼─┐  ┌───▼────┐  ┌▼─────────────┐
        │ Aurora PG     │  │ Redis  │  │ EventBridge  │
        │ Serverless v2 │  │ Elasti │  │   Bus        │
        │ + PostGIS     │  │ Cache  │  └──┬───────────┘
        └───────────────┘  └────────┘     │
                                     ┌────▼─────┐
                                     │   SQS    │
                                     └────┬─────┘
                                          │
                  ┌───────────────────────▼────────────────────┐
                  │  ECS Fargate — workers                     │
                  │  • projections   • notifications           │
                  │  • media pipeline• payouts • analytics ETL │
                  └────────────────────────────────────────────┘

  S3 (mídia, fotos) ─▶ MediaConvert ─▶ S3 HLS ─▶ CloudFront
  OpenSearch (busca de profissionais)   Chime SDK / LiveKit (vídeo)
  Step Functions (onboarding coach, ciclo de billing, ETL)
```

### 6.2 Estilo arquitetural: Modular Monolith → Microserviços seletivos

**Decisão:** iniciar como **monolito modular** em ECS Fargate, com módulos que já respeitam fronteiras de contexto, comunicação interna assíncrona via outbox + EventBridge, e schema-per-module.

**Justificativa:** com ~6–10 engenheiros e um domínio ainda em descoberta, microserviços desde o dia 1 pagam custo operacional alto (tracing distribuído, consistência eventual, versionamento de contrato, N pipelines) para resolver problemas de escala organizacional que ainda não existem. O modular monolith mantém o custo de mudança de fronteira baixo — que é exatamente o que muda mais nos primeiros 18 meses.

**Critérios objetivos de extração** (definidos agora para evitar decisão por vibe depois):
1. Perfil de escala divergente ≥ 5× do resto (ex.: ingestão de wearables).
2. Requisito de isolamento de falha (ex.: vídeo não pode derrubar o core).
3. Time dedicado com cadência de deploy própria.
4. Requisito de runtime diferente (ex.: inferência ML em Python).

Candidatos já previstos à extração: `Media Pipeline`, `Realtime/Video`, `Analytics ETL`, `Recommendation Engine`.

### 6.3 Arquitetura interna de cada módulo (Clean Architecture)

```
Module/
├── Domain/            → Entidades, VOs, eventos de domínio. Zero dependências.
├── Application/       → Use cases (Command/Query handlers), ports (interfaces)
├── Infrastructure/    → EF Core, Dapper, adapters, integrações
└── Presentation/      → Minimal API endpoints, DTOs, validators
```

Regra de dependência: `Presentation → Application → Domain`, `Infrastructure → Application`. Enforced por teste de arquitetura (NetArchTest) rodando no CI — não por disciplina.

**CQRS pragmático:** commands via EF Core (change tracking, invariantes de agregado); queries via **Dapper com SQL explícito**. Motivo: as telas mais quentes (dashboard do coach, histórico de exercício, heatmap muscular) são agregações que EF gera mal, e o custo de manter SQL à mão nesses ~15 casos é menor que o custo de debugar planos de execução gerados.

---

## 7. Decisões arquiteturais (ADRs)

| # | Decisão | Alternativas | Racional | Trade-off aceito |
|---|---|---|---|---|
| ADR-01 | Modular Monolith .NET 9 em ECS Fargate | Microserviços; Lambda | Velocidade de mudança de fronteira; custo operacional baixo | Blast radius maior de deploy; disciplina de fronteira depende de CI |
| ADR-02 | ECS Fargate | EKS; Lambda; App Runner | Sem gestão de control plane; suporta conexões longas e workers; previsível | Menos flexível que EKS; sem scale-to-zero |
| ADR-03 | Aurora PostgreSQL Serverless v2 + PostGIS | DynamoDB; RDS provisioned; Timescale | Domínio é altamente relacional; geo nativo; escala de ACU automática | Custo por ACU-hora maior que RDS fixo em carga estável |
| ADR-04 | Postgres particionado para séries de treino | Timestream; InfluxDB | Evita segundo datastore e queries federadas; volume é grande mas não extremo | Manutenção de partições (automatizada via `pg_partman`) |
| ADR-05 | OpenSearch para busca de profissionais | Postgres puro; Algolia | Geo + facetas + ranking customizado + typo tolerance | Consistência eventual; custo fixo de cluster |
| ADR-06 | Cognito para autenticação | Keycloak; Auth0 | Integra nativo com API Gateway; social login; MFA pronto | Customização de fluxo limitada; migração futura é dolorosa |
| ADR-07 | Flutter para mobile | React Native; nativo × 2 | Renderização própria (Skia) → modelo anatômico e animações idênticos nas plataformas; Impeller | Ecossistema Dart menor; ponte nativa para HealthKit/Health Connect é trabalho manual |
| ADR-08 | Angular para web do profissional | React; Blazor | Alinhado ao stack já dominado; forms complexos e tabelas densas são o forte do Angular | Bundle maior; overkill para landing pages |
| ADR-09 | Outbox pattern + EventBridge | Publicação direta; SNS | Garante atomicidade estado↔evento; schema registry; replay | Latência adicional (polling 1–2 s) |
| ADR-10 | LiveKit Cloud para vídeo | Chime SDK; Twilio; Agora | SDK Flutter maduro, gravação, custo previsível por participante-minuto | Fornecedor fora da AWS → egress e um contrato a mais |
| ADR-11 | Modelo anatômico em SVG vetorial, não 3D | Three.js/model 3D; sprites | Peso ~80 KB vs vários MB; interativo, acessível, tematizável, sem GPU | Menos "wow"; sem rotação livre |
| ADR-12 | Offline-first com SQLite local + sync por lote | Online-only; CRDT | Academia tem sinal ruim — é requisito, não conforto | Complexidade de reconciliação; exige idempotência ponta a ponta |

---

## 8. Estrutura de projeto .NET

```
atlas-platform/
├── src/
│   ├── Atlas.Api/                             # Host: DI, middlewares, health, OTel
│   │   ├── Program.cs
│   │   ├── Extensions/ModuleRegistration.cs
│   │   └── appsettings.{Environment}.json
│   │
│   ├── Atlas.SharedKernel/                    # VOs e primitivas. Sem deps externas.
│   │   ├── Domain/{Entity,AggregateRoot,ValueObject,DomainEvent}.cs
│   │   ├── Results/{Result,Error,ErrorType}.cs
│   │   └── Types/{UserId,Money,Weight,Percentage,DateRange}.cs
│   │
│   ├── Atlas.SharedInfrastructure/            # Outbox, OTel, Redis, S3, Auth
│   │   ├── Outbox/
│   │   ├── Caching/{CacheKeys,HybridCacheExtensions}.cs
│   │   └── Messaging/{EventBridgePublisher,SqsConsumer}.cs
│   │
│   └── Modules/
│       ├── Identity/
│       │   ├── Atlas.Identity.Domain/
│       │   ├── Atlas.Identity.Application/
│       │   ├── Atlas.Identity.Infrastructure/
│       │   └── Atlas.Identity.Presentation/
│       ├── Catalog/          (mesma estrutura)
│       ├── Programming/
│       ├── Session/
│       ├── BodyMeasurement/
│       ├── Marketplace/
│       ├── Coaching/
│       ├── Billing/
│       └── Insights/
│
├── workers/
│   ├── Atlas.Worker.Projections/
│   ├── Atlas.Worker.Notifications/
│   └── Atlas.Worker.Media/
│
├── tests/
│   ├── Atlas.Architecture.Tests/              # NetArchTest — fronteiras de módulo
│   ├── Atlas.{Module}.UnitTests/
│   ├── Atlas.IntegrationTests/                # Testcontainers: PG + Redis + LocalStack
│   └── Atlas.Load.Tests/                      # k6
│
├── infra/                                     # Terraform
│   ├── modules/{network,ecs,aurora,redis,opensearch,cdn,observability}/
│   └── envs/{dev,staging,prod}/
│
├── contracts/                                 # OpenAPI + JSON Schema dos eventos
│   ├── openapi.v1.yaml
│   └── events/*.schema.json
│
└── docs/
    ├── adr/
    └── specs/                                 # este documento e derivados
```

### 8.1 Exemplo — agregado com invariantes de domínio

```csharp
namespace Atlas.Programming.Domain.Plans;

public sealed class WorkoutPlan : AggregateRoot<WorkoutPlanId>
{
    private readonly List<WorkoutDay> _days = [];

    public UserId OwnerId { get; private set; }
    public UserId? PrescribedBy { get; private set; }
    public PlanName Name { get; private set; }
    public int Version { get; private set; }
    public PlanStatus Status { get; private set; }
    public GoalType TargetGoal { get; private set; }
    public IReadOnlyList<WorkoutDay> Days => _days.AsReadOnly();

    private WorkoutPlan() { }   // EF

    public static Result<WorkoutPlan> Create(
        UserId ownerId, PlanName name, GoalType goal, UserId? prescribedBy = null)
    {
        var plan = new WorkoutPlan
        {
            Id            = WorkoutPlanId.New(),
            OwnerId       = ownerId,
            Name          = name,
            TargetGoal    = goal,
            PrescribedBy  = prescribedBy,
            Version       = 1,
            Status        = PlanStatus.Draft
        };
        plan.Raise(new WorkoutPlanCreated(plan.Id, ownerId, prescribedBy));
        return plan;
    }

    public Result AddDay(DayOfWeekSlot slot, string label)
    {
        if (Status is not PlanStatus.Draft)
            return PlanErrors.PublishedPlanIsImmutable;      // versionamento, não mutação

        if (_days.Any(d => d.Slot == slot))
            return PlanErrors.SlotAlreadyUsed(slot);

        if (_days.Count >= WorkoutPlanLimits.MaxDaysPerPlan)
            return PlanErrors.TooManyDays;

        _days.Add(WorkoutDay.Create(Id, slot, label));
        return Result.Success();
    }

    public Result Publish()
    {
        if (_days.Count == 0)                 return PlanErrors.EmptyPlan;
        if (_days.Any(d => d.IsEmpty))        return PlanErrors.EmptyDay;
        if (Status is PlanStatus.Published)   return PlanErrors.AlreadyPublished;

        Status = PlanStatus.Published;
        Raise(new WorkoutPlanPublished(Id, OwnerId, PrescribedBy, Version, TargetGoal));
        return Result.Success();
    }

    /// <summary>Cria a próxima versão preservando o histórico da anterior.</summary>
    public Result<WorkoutPlan> CreateRevision(UserId revisedBy)
    {
        if (Status is not PlanStatus.Published)
            return PlanErrors.OnlyPublishedCanBeRevised;

        var revision = new WorkoutPlan
        {
            Id           = WorkoutPlanId.New(),
            OwnerId      = OwnerId,
            Name         = Name,
            TargetGoal   = TargetGoal,
            PrescribedBy = revisedBy,
            Version      = Version + 1,
            Status       = PlanStatus.Draft
        };
        revision._days.AddRange(_days.Select(d => d.CloneFor(revision.Id)));
        revision.Raise(new WorkoutPlanRevisionStarted(revision.Id, Id, Version + 1));
        return revision;
    }
}
```

### 8.2 Exemplo — endpoint com feature gating por entitlement

```csharp
namespace Atlas.Programming.Presentation;

internal sealed class CreateWorkoutPlanEndpoint : IEndpoint
{
    public void Map(IEndpointRouteBuilder app) => app
        .MapPost("/api/v1/workout-plans", Handle)
        .RequireAuthorization()
        .WithTags("WorkoutPlans")
        .Produces<WorkoutPlanResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status402PaymentRequired);

    private static async Task<IResult> Handle(
        CreateWorkoutPlanRequest request,
        ICurrentUser currentUser,
        IEntitlementService entitlements,
        ICommandDispatcher dispatcher,
        CancellationToken ct)
    {
        var activeCount = await dispatcher.QueryAsync(
            new CountActivePlansQuery(currentUser.Id), ct);

        var quota = await entitlements.GetQuotaAsync(
            currentUser.Id, Feature.ActiveWorkoutPlans, ct);

        if (quota.IsExceededBy(activeCount))
            return TypedResults.Problem(
                statusCode: StatusCodes.Status402PaymentRequired,
                title:      "plan_quota_exceeded",
                detail:     $"Seu plano permite {quota.Limit} fichas ativas.",
                extensions: new Dictionary<string, object?>
                {
                    ["upgradeTo"]   = quota.SuggestedUpgrade,
                    ["currentPlan"] = quota.CurrentPlanKey
                });

        var result = await dispatcher.SendAsync(
            new CreateWorkoutPlanCommand(currentUser.Id, request.Name, request.Goal), ct);

        return result.Match(
            plan => TypedResults.Created($"/api/v1/workout-plans/{plan.Id}", plan),
            ApiResults.Problem);
    }
}
```

> O `402` com `upgradeTo` no corpo é intencional: o cliente renderiza o paywall contextual **sem hardcodar regra de plano**. Toda a política de monetização vive em um lugar só.

### 8.3 Exemplo — query analítica (heatmap de volume semanal)

```csharp
public sealed class MuscleVolumeQueryHandler(IDbConnectionFactory factory)
    : IQueryHandler<MuscleVolumeQuery, IReadOnlyList<MuscleVolumeDto>>
{
    private const string Sql = """
        SELECT  mg.id                                        AS MuscleGroupId,
                mg.code                                      AS Code,
                SUM(ps.weight_kg * ps.reps * ma.activation_weight) AS WeightedVolume,
                COUNT(*) FILTER (WHERE ma.role = 1)          AS PrimarySets
        FROM    session.performed_set ps
        JOIN    catalog.muscle_activation ma ON ma.exercise_id = ps.exercise_id
        JOIN    catalog.muscle_group      mg ON mg.id = ma.muscle_group_id
        WHERE   ps.athlete_id   = @AthleteId
          AND   ps.performed_at >= @From
          AND   ps.performed_at <  @To
          AND   ps.is_warmup    = false
        GROUP BY mg.id, mg.code
        ORDER BY WeightedVolume DESC;
        """;

    public async Task<IReadOnlyList<MuscleVolumeDto>> HandleAsync(
        MuscleVolumeQuery q, CancellationToken ct)
    {
        await using var conn = await factory.OpenAsync(ct);
        var rows = await conn.QueryAsync<MuscleVolumeDto>(
            new CommandDefinition(Sql, new { q.AthleteId, q.From, q.To },
                                  cancellationToken: ct));
        return rows.AsList();
    }
}
```

Este resultado alimenta diretamente o preenchimento do SVG anatômico (§12.2) e a detecção de desequilíbrio (ex.: push:pull fora da faixa 0,8–1,2).

---

## 9. Contratos de API

REST versionado em path (`/api/v1`), erros em RFC 9457 (Problem Details), paginação por cursor em toda coleção temporal.

### 9.1 Principais recursos

```http
# --- Identidade e perfil ---
POST   /api/v1/auth/register
GET    /api/v1/me
PATCH  /api/v1/me/goal
PUT    /api/v1/me/avatar
GET    /api/v1/me/entitlements                 # fonte da verdade do paywall no client

# --- Catálogo ---
GET    /api/v1/exercises?muscle=chest&equipment=barbell&q=supino
GET    /api/v1/exercises/{id}                  # inclui media, cues, activation[]
GET    /api/v1/muscle-groups                   # + metadados do SVG
POST   /api/v1/exercises/custom

# --- Programação ---
POST   /api/v1/workout-plans
GET    /api/v1/workout-plans?status=published
POST   /api/v1/workout-plans/{id}/days
POST   /api/v1/workout-plans/{id}/publish
POST   /api/v1/workout-plans/{id}/revisions
POST   /api/v1/workout-plans/{id}/assign       # coach → aluno

# --- Sessão de treino ---
POST   /api/v1/sessions                        # inicia (idempotente por clientId)
POST   /api/v1/sessions/{id}/sets:batch        # sync offline em lote
POST   /api/v1/sessions/{id}/complete
GET    /api/v1/sessions?cursor=&limit=20

# --- Métricas corporais ---
POST   /api/v1/measurements
GET    /api/v1/measurements/series?metric=leanMass&from=&to=&smoothing=ma7
POST   /api/v1/measurements/photos:presign

# --- Insights ---
GET    /api/v1/insights/muscle-volume?period=7d
GET    /api/v1/insights/exercise/{id}/progression
GET    /api/v1/insights/adherence?period=30d

# --- Marketplace ---
GET    /api/v1/professionals/search?lat=&lng=&radiusKm=15&specialty=physio&modality=hybrid
GET    /api/v1/professionals/{id}
POST   /api/v1/engagements                     # contratação
POST   /api/v1/engagements/{id}/cancel

# --- Coaching (perfil profissional) ---
GET    /api/v1/coach/clients?status=active&sort=risk
GET    /api/v1/coach/clients/{athleteId}/overview
POST   /api/v1/coach/clients/{athleteId}/goals
POST   /api/v1/coach/clients/{athleteId}/notes
GET    /api/v1/coach/alerts                    # aderência caindo, meta em risco

# --- Billing ---
POST   /api/v1/billing/checkout-session
POST   /api/v1/billing/webhooks/{provider}     # idempotente por event id
GET    /api/v1/coach/payouts
```

### 9.2 Contrato de sincronização offline (o mais crítico)

```jsonc
// POST /api/v1/sessions/{id}/sets:batch
// Idempotency-Key: <uuid do lote>
{
  "sets": [
    {
      "clientGeneratedId": "018f3a...",   // UUIDv7 gerado no device
      "exerciseId": "018e91...",
      "setOrder": 1,
      "weightKg": 80.0,
      "reps": 8,
      "rpe": 8.5,
      "isWarmup": false,
      "performedAt": "2026-09-09T18:22:31.443Z",
      "deviceClockSkewMs": 1240              // para reconciliação de relógio
    }
  ]
}

// 207 Multi-Status
{
  "accepted":  ["018f3a..."],
  "duplicated":["018f3b..."],               // já existia → no-op, não é erro
  "rejected":  [{ "clientGeneratedId":"018f3c...", "reason":"exercise_not_found" }]
}
```

O `207` com particionamento de resultado evita o pior cenário do sync: um item inválido invalidando o lote inteiro e travando a fila do device para sempre.

---

## 10. Eventos de domínio e integração

### 10.1 Catálogo de eventos

| Evento | Publisher | Consumidores | Efeito |
|---|---|---|---|
| `SessionCompleted` | Session | Insights, Coaching, Gamification, Notifications | Recalcula projeções, dispara alerta ao coach, XP |
| `MeasurementRecorded` | BodyMeasurement | Insights, Coaching | Atualiza série suavizada, avalia progresso da meta |
| `WorkoutPlanPublished` | Programming | Coaching, Notifications | Notifica aluno de novo plano |
| `EngagementStarted` | Marketplace | Coaching, Billing, Messaging | Cria vínculo, assina, abre canal |
| `SubscriptionChanged` | Billing | Identity, todos os módulos (via cache invalidation) | Recalcula entitlements |
| `ProfessionalVerified` | Identity | Marketplace | Indexa no OpenSearch |
| `AdherenceDropped` | Insights | Coaching, Notifications | Alerta de risco de churn |
| `GoalAtRisk` | Insights | Coaching | Sugere revisão de plano |

### 10.2 Outbox transacional

Publicação direta em EventBridge dentro do `SaveChanges` é uma armadilha clássica: commit no banco e falha no publish (ou o inverso) corrompem o estado do sistema silenciosamente.

```csharp
public sealed class OutboxInterceptor : SaveChangesInterceptor
{
    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result,
        CancellationToken ct = default)
    {
        if (eventData.Context is not { } ctx) return result;

        var messages = ctx.ChangeTracker
            .Entries<IHasDomainEvents>()
            .SelectMany(e =>
            {
                var events = e.Entity.DomainEvents.ToArray();
                e.Entity.ClearDomainEvents();
                return events;
            })
            .Select(OutboxMessage.From)
            .ToList();

        if (messages.Count > 0)
            ctx.Set<OutboxMessage>().AddRange(messages);   // mesma transação

        return result;
    }
}
```

Publisher separado (worker) com `SELECT ... FOR UPDATE SKIP LOCKED`, backoff exponencial e DLQ após 5 tentativas. Ordenação garantida **por agregado**, não globalmente — suficiente para o domínio e muito mais barato.

### 10.3 Consistência

- **Forte** dentro do agregado (transação única).
- **Eventual** entre módulos, com janela alvo < 3 s.
- Onde a UX não tolera eventual (ex.: usuário registra série e imediatamente vê o total do treino), a projeção é calculada **read-through no client** e reconciliada quando o evento chega. Nunca esperar a projeção server-side numa tela quente.

---

## 11. Subsistemas críticos

### 11.1 Avatar personalizado

**Abordagem:** avatar vetorial composicional em camadas, não imagem raster nem 3D.

```
Avatar = { base, skinTone, hair, face, outfit, accessory, frame, background }
```

- Cada item é um SVG no S3/CloudFront com `layerOrder` e `anchorPoints`, versionado.
- Composição no client (Flutter renderiza SVG nativamente) → **zero custo de servidor** e customização instantânea sem round-trip.
- Composição server-side apenas para thumbnails cacheáveis (ranking, chat, relatório PDF): worker gera PNG 128px e cacheia por `hash(avatarConfig)` no CloudFront. Cache hit ratio esperado > 95%.
- Itens premium são `Entitlement`, não flags no perfil — reutiliza o mesmo motor de monetização.
- Evolução opcional (Fase 4): o avatar reflete progresso real (definição muscular por grupo em função de volume acumulado). **Cuidado deliberado:** isso precisa ser opt-in e nunca representar o corpo de forma que reforce insatisfação corporal. Recomendo tratar como conquista estilizada, não como espelho.

### 11.2 Matching geográfico e ranking

**Pipeline:**

1. `ProfessionalVerified` / `ServiceOfferingUpdated` → projeção para OpenSearch.
2. Documento indexado com `geo_point`, especialidades, modalidade, faixa de preço, disponibilidade agregada, métricas de qualidade.
3. Query combina filtro geo + `function_score`.

```json
{
  "query": {
    "function_score": {
      "query": {
        "bool": {
          "filter": [
            { "geo_distance": { "distance": "15km", "location": { "lat": -22.21, "lon": -49.94 } } },
            { "term": { "status": "verified" } },
            { "term": { "acceptingClients": true } },
            { "terms": { "specialties": ["hypertrophy", "physiotherapy"] } }
          ]
        }
      },
      "functions": [
        { "gauss": { "location": { "origin": "-22.21,-49.94", "scale": "8km", "decay": 0.5 } }, "weight": 3 },
        { "field_value_factor": { "field": "retentionRate90d", "modifier": "sqrt", "missing": 0.5 }, "weight": 2.5 },
        { "field_value_factor": { "field": "responseRate",     "modifier": "sqrt", "missing": 0.5 }, "weight": 2 },
        { "field_value_factor": { "field": "rating",           "modifier": "log1p", "missing": 3.5 }, "weight": 2 },
        { "gauss": { "joinedAt": { "origin": "now", "scale": "30d", "decay": 0.7 } }, "weight": 1.2 }
      ],
      "score_mode": "sum",
      "boost_mode": "replace"
    }
  }
}
```

**Racional do ranking:** `retentionRate90d` (quantos alunos permanecem) tem peso maior que `rating` porque é muito mais difícil de gamear e correlaciona melhor com resultado real. O boost temporal em `joinedAt` é um **subsídio explícito de cold start** — sem ele, novos profissionais nunca recebem a primeira chance e a oferta estagna.

**Trade-off:** OpenSearch adiciona ~US$ 180/mês e consistência eventual na busca. A alternativa (PostGIS puro com `ST_DWithin`) funciona bem até ~50k profissionais, mas não entrega facetas, typo tolerance e ranking composto sem SQL grotesco. Decisão: **começar com PostGIS na Fase 2, migrar para OpenSearch quando busca passar de 5% do tráfego ou o catálogo passar de 5k profissionais.** A interface `IProfessionalSearchService` isola a troca.

### 11.3 Modelo anatômico visual

Estrutura de dados que sustenta a UI:

```csharp
public sealed record MuscleGroup(
    short  Id,
    string Code,              // "pectoralis_major"
    string DisplayName,       // "Peitoral maior"
    string SvgPathId,         // id do <path> no SVG do corpo
    BodyView View,            // Anterior | Posterior | Both
    short? ParentId);         // agrupamento: "chest" → "pectoralis_major/minor"
```

- Dois SVGs mestres (anterior e posterior), cada `<path>` com `id` = `SvgPathId`. Cerca de 60 grupos mapeados.
- Três modos de renderização, todos sobre o mesmo asset:
  1. **Exercício** — primário em cor forte, secundário em tom médio, estabilizador em contorno.
  2. **Heatmap de volume semanal** — escala de cor por `WeightedVolume` normalizado (§8.3). É a tela que responde "estou negligenciando alguma coisa?".
  3. **Reabilitação** — sobreposição de nível de dor por região reportado nos check-ins.
- Acessibilidade: cada `<path>` recebe `role="img"` + `aria-label`, e a escala de cor usa luminância variável (não só matiz) para daltonismo.

### 11.4 Estatísticas dirigidas por objetivo

O dashboard não é fixo — o `CurrentGoal` define quais métricas são primárias. Isso evita a armadilha de mostrar 40 gráficos e nenhum insight.

| Objetivo | Métricas primárias | Métricas secundárias | Alertas |
|---|---|---|---|
| **Hipertrofia** | Volume semanal por grupo (séries efetivas), progressão de carga, heatmap de equilíbrio | Tonelagem, densidade, frequência/grupo | Grupo < 10 séries/sem; estagnação de carga 3 sem |
| **Emagrecimento** | Peso (média móvel 7d), % gordura, massa magra (preservação!) | Gasto estimado, aderência, medidas | Perda > 1%/sem; queda de massa magra |
| **Força** | 1RM estimado por levantamento principal, intensidade média (%1RM) | Volume em zona 85%+, PRs | ACWR > 1,5 (risco de lesão) |
| **Resistência** | Duração, densidade, FC de recuperação | Volume total, cadência | Queda de performance com volume estável |
| **Reabilitação** | Dor (EVA) por sessão, amplitude de movimento, aderência ao protocolo | Carga tolerada, simetria bilateral | Dor > 4 durante execução → bloqueia progressão e notifica fisio |

**Cálculos padronizados e versionados** (`ICalculationStrategy` com `Version`, para que resultados históricos não mudem quando a fórmula evoluir):

```
1RM estimado (Epley)     = weight × (1 + reps/30)
1RM estimado (Brzycki)   = weight × 36 / (37 − reps)      # melhor para reps ≤ 10
Volume ponderado         = Σ (weight × reps × activationWeight)
Séries efetivas          = COUNT(sets WHERE RIR ≤ 3 AND role = Primary)
Massa magra              = weight × (1 − bodyFat)
ACWR                     = volume_7d / (volume_28d / 4)
Aderência                = sessões realizadas / sessões prescritas (janela móvel)
```

### 11.5 Painel do profissional (N clientes)

Read model denormalizado, atualizado por evento, materializado em tabela própria:

```sql
CREATE TABLE coaching.coach_client_overview (
    coach_id            uuid NOT NULL,
    athlete_id          uuid NOT NULL,
    display_name        text,
    avatar_thumb_url    text,
    goal_type           smallint,
    adherence_7d        numeric(4,3),
    adherence_30d       numeric(4,3),
    last_session_at     timestamptz,
    weight_delta_30d    numeric(5,2),
    lean_mass_delta_30d numeric(5,2),
    goals_at_risk       smallint,
    unread_messages     integer,
    risk_score          numeric(4,3),      -- churn/estagnação, 0..1
    refreshed_at        timestamptz,
    PRIMARY KEY (coach_id, athlete_id)
);
CREATE INDEX ix_cco_risk ON coaching.coach_client_overview (coach_id, risk_score DESC);
```

Um coach com 60 alunos carrega o painel em **uma query indexada**, não em 60 chamadas. `risk_score` combina aderência em queda, ausência de log, meta estagnada e silêncio no chat — ordena a atenção do profissional pelo que mais importa.

### 11.6 Videochamada e sessão guiada

- **Assíncrono é o default.** A maior parte do valor está em chat + revisão de vídeo enviado pelo aluno + ajuste de ficha. Videochamada é premium e minoritária.
- Vídeo 1:1 via LiveKit: token JWT emitido pelo backend com escopo de sala, TTL de 15 min, permissões por papel.
- Gravação opt-in bilateral, retenção 30 dias, armazenamento criptografado — dado extremamente sensível.
- **Modo "sessão guiada":** coach acompanha em tempo real o log do aluno via WebSocket, comentando série a série. Custo de infraestrutura ~1/20 do vídeo e, para musculação, frequentemente mais útil.
- Isolamento: sala de vídeo indisponível **não** pode impedir treino. Circuit breaker + degradação para chat.

---

## 12. Frontend e camada visual

### 12.1 Stack

| Superfície | Stack | Justificativa |
|---|---|---|
| Mobile (atleta + coach) | Flutter 3.x + Riverpod + Drift (SQLite) | Renderização própria → SVG anatômico e animações idênticos; offline robusto |
| Web (coach/studio/admin) | Angular 20 (standalone, signals) + Nx | Formulários e tabelas densas; stack já dominada; SSR para SEO dos perfis públicos |
| Design system | Tokens compartilhados (JSON) → Dart theme + CSS custom properties | Fonte única de verdade visual entre plataformas |

### 12.2 Componente do modelo anatômico (contrato)

```dart
class AnatomicalModel extends StatelessWidget {
  const AnatomicalModel({
    required this.view,               // anterior | posterior
    required this.activations,        // Map<String muscleCode, double 0..1>
    this.colorScale = ColorScale.volume,
    this.onMuscleTap,
    super.key,
  });
  // Renderiza o SVG mestre e aplica fill por path id a partir de `activations`.
  // Um único asset serve exercício, heatmap e dor — só a escala de cor muda.
}
```

### 12.3 Estratégia offline-first (mobile)

```
Camada local (Drift/SQLite)
  ├─ catalog_cache        → catálogo completo, sync incremental por ETag
  ├─ active_plans         → fichas ativas, pré-carregadas
  ├─ session_draft        → sessão em andamento (source of truth durante o treino)
  └─ outbox_queue         → operações pendentes de sync

Sync engine
  ├─ trigger: retorno de conectividade, foreground, fim de sessão
  ├─ envio em lotes de 50 com Idempotency-Key
  ├─ resolução de conflito: last-write-wins por campo, exceto performed_set
  │                         (append-only, nunca conflita por design)
  └─ backoff exponencial com jitter, teto de 5 min
```

**Decisão-chave:** `performed_set` ser **append-only e idempotente** elimina 90% da complexidade de sincronização. Não existe "editar série no servidor durante o sync" — só inserir. Edições posteriores são operações explícitas do usuário, com timestamp próprio.

### 12.4 Assets de mídia

- Vídeos de execução: MP4 H.265 6–12 s, sem áudio, ~400 KB, servidos via CloudFront com `Cache-Control: max-age=31536000, immutable` (URL contém hash de conteúdo).
- Pré-carregamento inteligente: ao abrir a ficha do dia, faz prefetch dos vídeos daquele treino.
- Vídeos enviados pelo aluno (avaliação de execução pelo coach): S3 presigned upload → MediaConvert → HLS multi-bitrate.

---

## 13. Performance e escalabilidade

### 13.1 Estratégia de cache em camadas

| Camada | Conteúdo | TTL | Invalidação |
|---|---|---|---|
| CDN (CloudFront) | Mídia, SVGs, avatar thumbs, catálogo público | 1 ano (immutable) | Hash na URL |
| Client (SQLite) | Catálogo, fichas ativas, últimas 20 sessões | Sync incremental | ETag / `updatedSince` |
| Distribuído (Redis) | Entitlements, perfil de coach, resultado de busca, projeções quentes | 5–60 min | Por evento (`SubscriptionChanged` → `DEL entitlement:{userId}`) |
| In-process (HybridCache) | Catálogo de músculos, equipamentos, config | 15 min | TTL |

`HybridCache` do .NET 9 dá L1 + L2 com stampede protection nativo — evita a implementação artesanal de lock distribuído.

### 13.2 Padrões de acesso e otimizações

**Hot path #1 — gravação de série durante treino.** Ocorre a cada 40–90 s por usuário ativo. Otimizações: insert em lote, sem leitura prévia, sem trigger, sem projeção síncrona. Alvo: p95 ≤ 150 ms incluindo rede móvel.

**Hot path #2 — abrir treino do dia.** Servido do cache local em 100% dos casos; requisição de rede só para validar versão. Alvo: renderização ≤ 300 ms sem rede.

**Hot path #3 — dashboard do coach.** Read model pré-agregado (§11.5), uma query. Alvo p95 ≤ 200 ms para 100 alunos.

**Query killer a evitar:** agregação de volume muscular sobre o histórico completo em tempo real. Solução: projeção incremental por semana (`insights.weekly_muscle_volume`) atualizada no `SessionCompleted`, com histórico consultado da projeção e a semana corrente calculada ao vivo (dataset pequeno).

### 13.3 Escalabilidade

- **Aurora Serverless v2:** 0,5–16 ACU em dev, 2–64 em prod. Réplicas de leitura para queries analíticas com `ApplicationIntent=ReadOnly` na connection string dos handlers de query.
- **ECS Fargate:** target tracking em 65% CPU + scaling por profundidade de fila SQS nos workers. Warm pool para o pico previsível de 18h–21h (pico de academia é altamente sazonal no dia — vale um scheduled scaling, mais barato que reagir).
- **Particionamento** já descrito em §5.2.
- **Backpressure:** rate limiting no API Gateway (usage plans por tier) + `System.Threading.RateLimiting` por usuário nos endpoints de escrita.

### 13.4 Metas de carga (k6)

| Cenário | Carga | Critério de aceite |
|---|---|---|
| Sync de sessão | 4.000 VUs, lotes de 25 sets | p95 < 400 ms, erro < 0,1% |
| Busca de profissionais | 500 rps | p95 < 250 ms |
| Dashboard do coach | 200 rps, 60 alunos | p95 < 200 ms |
| Reconexão em massa (fim do horário de pico) | 10k syncs em 60 s | sem DLQ, sem 5xx |

---

## 14. Observabilidade

### 14.1 Instrumentação

OpenTelemetry como padrão único (traces, métricas, logs correlacionados), exportando via ADOT Collector (sidecar) para CloudWatch + X-Ray, com Grafana Cloud opcional para dashboards.

```csharp
builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r
        .AddService("atlas-api", serviceVersion: BuildInfo.Version)
        .AddAttributes([new("deployment.environment", env.EnvironmentName)]))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation(o =>
        {
            o.RecordException = true;
            o.Filter = ctx => !ctx.Request.Path.StartsWithSegments("/health");
        })
        .AddNpgsql()
        .AddRedisInstrumentation()
        .AddAWSInstrumentation()
        .AddOtlpExporter())
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddRuntimeInstrumentation()
        .AddMeter(AtlasMetrics.MeterName)
        .AddOtlpExporter());
```

### 14.2 Métricas de negócio como cidadãs de primeira classe

Métricas técnicas dizem se o sistema está de pé; métricas de negócio dizem se ele está funcionando. Ambas no mesmo painel.

```csharp
public static class AtlasMetrics
{
    public const string MeterName = "Atlas";
    private static readonly Meter Meter = new(MeterName, BuildInfo.Version);

    public static readonly Counter<long> SessionsCompleted =
        Meter.CreateCounter<long>("atlas.sessions.completed", "session");

    public static readonly Histogram<double> SyncBatchLatency =
        Meter.CreateHistogram<double>("atlas.sync.batch.latency", "ms");

    public static readonly Counter<long> SyncConflicts =
        Meter.CreateCounter<long>("atlas.sync.conflicts", "conflict");

    public static readonly Counter<long> PaywallHits =
        Meter.CreateCounter<long>("atlas.paywall.hit", "hit");   // tag: feature, plan

    public static readonly UpDownCounter<long> ActiveEngagements =
        Meter.CreateUpDownCounter<long>("atlas.coaching.engagements.active", "engagement");
}
```

### 14.3 SLOs e alertas

| SLO | Alvo | Janela | Alerta |
|---|---|---|---|
| Disponibilidade da API core | 99,9% | 30d | Burn rate 14,4× em 1 h → page |
| Latência de sync p95 | < 400 ms | 1 h | 3 janelas consecutivas → ticket |
| Taxa de erro de sync | < 0,5% | 1 h | > 2% → page (dados de treino perdidos = usuário perdido) |
| Idade da projeção | < 30 s | contínuo | > 5 min → page |
| Profundidade da DLQ | 0 | contínuo | > 10 → page |
| Sucesso de webhook de billing | > 99,5% | 24 h | falha → ticket + retry manual |

**Logs estruturados** (Serilog → JSON → CloudWatch) com `TraceId`, `UserId` **pseudonimizado** e `ModuleName`. Regra rígida: nenhum dado de saúde, peso, medida, foto ou mensagem em log — nunca, nem em nível `Debug`. Isso é enforced por um `ILogEventEnricher` que faz scrub de propriedades marcadas com `[SensitiveData]`.

---

## 15. Segurança, LGPD e compliance

### 15.1 Classificação de dados

| Categoria | Exemplos | Tratamento |
|---|---|---|
| **Sensível (LGPD art. 5º II)** | Peso, % gordura, dor, lesões, fotos de progresso, laudos | Base legal = consentimento específico e destacado; criptografia com chave KMS dedicada; log de acesso; retenção definida |
| Pessoal | Nome, e-mail, geolocalização | Base legal = execução de contrato |
| Comportamental | Uso do app, aderência | Legítimo interesse, com opt-out |
| Público | Catálogo, perfil público do profissional | — |

### 15.2 Controles obrigatórios

1. **Consentimento granular e revogável** por escopo de compartilhamento com cada profissional (`ShareScope`). Revogação corta acesso imediatamente e é auditada.
2. **Autorização enforced no repositório**, não no controller:
   ```csharp
   // Todo acesso a dados de atleta por um coach passa por aqui.
   public async Task<Result<AthleteData>> GetForCoachAsync(
       UserId coachId, UserId athleteId, ShareScope required, CancellationToken ct)
   {
       var engagement = await _engagements.GetActiveAsync(coachId, athleteId, ct);
       if (engagement is null)               return CoachingErrors.NoActiveEngagement;
       if (!engagement.Scope.Includes(required)) return CoachingErrors.ScopeNotGranted;
       // ...
   }
   ```
3. **Trilha de auditoria imutável** para todo acesso profissional a dado sensível de aluno (tabela append-only + export para S3 Object Lock).
4. **Verificação de credencial profissional**: upload de registro CREF/CREFITO/CRN + validação, com Step Functions orquestrando OCR, checagem em base pública quando disponível e revisão humana. Perfil não verificado nunca é indexado na busca.
5. **Direitos do titular**: export completo (JSON + mídia) e exclusão em até 15 dias, implementados como workflow assíncrono desde a Fase 1 — retrofitar isso depois é caro.
6. **Retenção**: sessões e medidas por 5 anos após encerramento da conta (justificativa: registro de acompanhamento de saúde), fotos por 2 anos, gravações de vídeo por 30 dias.
7. **Segurança de aplicação**: OWASP ASVS L2, WAF (rate limit, geo, SQLi/XSS rules), Secrets Manager com rotação, tráfego interno só em subnets privadas, IAM por task role com menor privilégio, SAST (SonarQube) + SCA (Dependabot/Trivy) + DAST no pipeline, certificate pinning no mobile.

### 15.3 Responsabilidade sobre orientação

- Disclaimer explícito: a plataforma é ferramenta de organização e comunicação, não presta serviço de saúde. A prescrição é de responsabilidade do profissional habilitado.
- Termos separados para atleta e para profissional, com aceite versionado e registrado.
- Nenhuma recomendação automatizada de carga, dieta ou protocolo é apresentada como prescrição — apenas como sugestão baseada em histórico, sempre revisável e com origem indicada.
- **Guardrails de saúde** (§4.5) aplicados no domínio, não na UI: metas fora de faixa segura são rejeitadas por invariante de agregado, e a plataforma nunca exibe linguagem que reforce restrição extrema ou insatisfação corporal. Em contexto de reabilitação, dor reportada acima do limiar bloqueia progressão automática e escala para o fisioterapeuta.

---

## 16. DevOps e infraestrutura como código

### 16.1 Terraform — organização

```
infra/
├── modules/
│   ├── network/        # VPC, subnets, NAT, endpoints (S3/ECR/Secrets via PrivateLink)
│   ├── ecs-service/    # task def, service, autoscaling, ALB target group, alarms
│   ├── aurora/         # cluster, PostGIS, param groups, backup, PI
│   ├── redis/          # ElastiCache, cluster mode disabled em dev
│   ├── opensearch/
│   ├── media-pipeline/ # S3, MediaConvert, CloudFront, OAC
│   ├── messaging/      # EventBridge bus, regras, SQS + DLQ
│   └── observability/  # log groups, dashboards, alarms, SLO
└── envs/
    ├── dev/       terragrunt.hcl
    ├── staging/
    └── prod/
```

Remote state em S3 + DynamoDB lock. `terraform plan` obrigatório como comentário no PR; `apply` em prod exige aprovação manual e roda em ambiente com OIDC (sem chave de longa duração).

### 16.2 Pipeline

```
PR aberto
 ├─ build + testes unitários (< 5 min, gate obrigatório)
 ├─ testes de arquitetura (NetArchTest — fronteiras de módulo)
 ├─ testes de integração (Testcontainers: Postgres + Redis + LocalStack)
 ├─ SAST + SCA + secret scanning
 ├─ terraform plan (comentário no PR)
 └─ preview de contrato OpenAPI (breaking change detection)

Merge em main
 ├─ build de imagem (multi-stage, distroless, SBOM)
 ├─ push ECR com tag = git sha
 ├─ deploy automático em staging
 ├─ smoke tests + k6 smoke
 └─ aguarda aprovação → deploy blue/green em prod (CodeDeploy)
      └─ rollback automático por alarme de erro/latência em 10 min
```

**Migrations de banco:** aplicadas por task ECS dedicada antes do deploy, **sempre expand/contract** — nunca uma migration que quebre a versão anterior. Rollback de código nunca deve exigir rollback de schema.

**Feature flags:** AWS AppConfig (ou Unleash). Todo módulo novo entra atrás de flag; rollout progressivo por percentual e por coorte.

---

## 17. Estimativa de custo AWS

Cenário: 300k MAU, ~90k usuários ativos semanais, 25k coaches.

| Serviço | Configuração | US$/mês (est.) |
|---|---|---|
| ECS Fargate (API) | 6–14 tasks, 1 vCPU / 2 GB | 320 |
| ECS Fargate (workers) | 4 tasks | 130 |
| Aurora PG Serverless v2 | 4–20 ACU médio ~7 | 780 |
| Aurora réplica leitura | 1 instância | 190 |
| ElastiCache Redis | cache.r7g.large × 2 | 240 |
| OpenSearch | 3 × t3.medium.search | 190 |
| S3 | 8 TB + requests | 210 |
| CloudFront | 20 TB egress (BR) | 1.700 |
| API Gateway | 400M requests | 400 |
| EventBridge + SQS | 200M eventos | 90 |
| MediaConvert | 400 h/mês | 150 |
| CloudWatch + X-Ray | logs 400 GB, traces amostrados 10% | 420 |
| Secrets, KMS, WAF, Route53 | — | 160 |
| **Subtotal AWS** | | **≈ 4.980** |
| LiveKit Cloud | 15k participante-hora | 450 |
| **Total** | | **≈ 5.430** |

**Custo por MAU ≈ US$ 0,018.** O maior item é egress de CDN — otimizações de maior impacto, nesta ordem: (1) compressão agressiva de vídeo (H.265/AV1 reduz ~40%), (2) cache local no device com sync incremental, (3) avaliar Cloudflare R2 + CDN para mídia estática (zero egress fee) — economia potencial de ~US$ 1.200/mês, ao custo de multi-cloud.

**Otimizações de compute:** Savings Plan de 1 ano em Fargate (−25%), Graviton (`ARM64`) em todas as tasks (−20% e melhor perf/watt em .NET 9), Aurora I/O-Optimized se o custo de I/O passar de 25% do total do cluster.

---

## 18. Riscos e trade-offs consolidados

| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| R-01 | Marketplace vazio (cold start de dois lados) | Alta | Crítico | Fase 1 entrega valor solo completo; recrutamento manual de 50 coaches âncora por região antes do lançamento do marketplace; subsídio de ranking para novos |
| R-02 | Rejeição na App Store por pagamento externo | Média | Alto | Separação rígida de fluxos; parecer jurídico prévio; IAP para bens digitais sem exceção |
| R-03 | Custo do catálogo de mídia (60+ exercícios × 2 ângulos × qualidade) | Alta | Médio | Produção em lote (2 dias de estúdio cobrem ~300 exercícios); licenciar biblioteca existente na Fase 1 e substituir gradualmente |
| R-04 | Perda de dados de treino no sync offline | Média | Crítico | Append-only + idempotência + outbox local persistente + alerta em taxa de erro > 2%; um treino perdido custa um usuário |
| R-05 | Responsabilidade sobre lesão de usuário | Baixa | Crítico | Disclaimers, guardrails de domínio, verificação de credencial, seguro de responsabilidade civil |
| R-06 | Aurora Serverless escalando descontroladamente (custo) | Média | Médio | Teto de ACU + alarme de billing + revisão semanal de slow queries |
| R-07 | Vazamento de dado sensível de saúde | Baixa | Crítico | KMS dedicado, autorização no repositório, auditoria, pentest semestral, scrub de logs |
| R-08 | Complexidade do modular monolith degradando para big ball of mud | Média | Alto | Testes de arquitetura no CI como gate bloqueante; revisão trimestral de fronteiras |
| R-09 | Dependência de Cognito dificultando evolução de auth | Média | Médio | Toda a app fala com `IIdentityProvider`, nunca com o SDK direto |
| R-10 | Churn de coach por take rate | Alta | Alto | Take rate decrescente por volume; ferramentas que economizam tempo real (o painel é o produto, não o pagamento) |

---

## 19. Backlog inicial em formato de spec executável

Formato pensado para consumo direto por agente de código: cada item carrega contexto, contrato, critérios de aceite e limites explícitos.

```yaml
spec_id: ATL-CAT-001
title: Catálogo de exercícios com ativação muscular
context_module: Catalog
depends_on: [ATL-INF-001, ATL-IDN-001]

goal: >
  Expor consulta e detalhe de exercícios do catálogo curado, incluindo mídia de
  execução e mapeamento de ativação muscular ponderada, com cache multicamada.

domain:
  aggregates:
    - Exercise (root)
    - MuscleGroup
  invariants:
    - Todo Exercise tem >= 1 MuscleActivation com role=Primary
    - Soma dos activationWeight de role=Primary <= 1.0
    - Exercise custom pertence a um owner e nunca aparece na busca global

api:
  - method: GET
    path: /api/v1/exercises
    query: [q, muscleGroup, equipment, difficulty, cursor, limit]
    response: CursorPage<ExerciseSummaryDto>
    cache: { layer: redis, ttl: 3600s, key: "catalog:ex:{hash(query)}" }
  - method: GET
    path: /api/v1/exercises/{id}
    response: ExerciseDetailDto   # media[], cues[], commonMistakes[], activations[]
    cache: { layer: redis, ttl: 86400s }

persistence:
  schema: catalog
  tables: [exercise, muscle_group, muscle_activation, exercise_media, equipment]
  seed: 300 exercícios curados + 62 grupos musculares mapeados ao SVG

acceptance_criteria:
  - Busca por "supino" retorna variações ordenadas por relevância em p95 < 150ms
  - Detalhe inclui activations com role e weight para renderizar o SVG
  - Exercício custom de outro usuário retorna 404 (não 403 — evita enumeração)
  - Cache invalidado por evento ExerciseUpdated
  - Cobertura de testes >= 80% em Domain e Application

out_of_scope:
  - Criação de exercício custom (ATL-CAT-002)
  - Upload de mídia pelo usuário (ATL-MED-001)
```

### 19.1 Sequenciamento da Fase 1

| Sprint | Specs | Entregável verificável |
|---|---|---|
| 1 | ATL-INF-001..003 | Terraform base, pipeline, health check em staging |
| 2 | ATL-IDN-001..003 | Cadastro, login, perfil, objetivo |
| 3 | ATL-CAT-001..003 | Catálogo navegável com vídeo e SVG anatômico |
| 4–5 | ATL-PRG-001..005 | Criação, edição, publicação e versionamento de ficha |
| 6–7 | ATL-SES-001..004 | Execução de treino offline-first com sync |
| 8 | ATL-BDY-001..003 | Registro de medidas, cálculo de composição corporal |
| 9 | ATL-INS-001..004 | Dashboards por objetivo, heatmap muscular |
| 10 | ATL-AVT-001..002 | Avatar composicional |
| 11 | ATL-BIL-001..003 | Freemium, entitlements, paywall contextual, IAP |
| 12 | ATL-QA-001 | Hardening, k6, pentest, beta fechado |

---

## Anexo A — Glossário técnico do domínio

| Termo | Definição |
|---|---|
| **RPE** | Rate of Perceived Exertion, escala 1–10 de esforço percebido |
| **RIR** | Reps in Reserve — repetições que restariam até a falha |
| **1RM** | Carga máxima para uma repetição; estimada por fórmula a partir de séries submáximas |
| **Séries efetivas** | Séries próximas o suficiente da falha para gerar estímulo hipertrófico (RIR ≤ 3) |
| **Tonelagem** | Σ (carga × repetições) da sessão |
| **ACWR** | Acute:Chronic Workload Ratio — razão de carga aguda/crônica, proxy de risco de lesão |
| **EVA** | Escala Visual Analógica de dor, 0–10 |
| **ROM** | Range of Motion — amplitude articular, métrica-chave em reabilitação |
| **Aderência** | Sessões realizadas ÷ prescritas em janela móvel |

## Anexo B — Pontos que precisam de decisão sua

1. **Mercado e idioma inicial** — assumi Brasil/pt-BR. Multi-idioma muda a modelagem do catálogo (i18n de nomes de exercício e cues).
2. **Fisioterapia como módulo de primeira classe ou extensão** — assumi extensão do modelo de treino. Se for núcleo do produto, o domínio de protocolos por fase de reabilitação cresce bastante e vale contexto próprio.
3. **Wearables no MVP ou Fase 4** — assumi Fase 4. Antecipar muda a arquitetura de ingestão (volume alto, streaming).
4. **Take rate e modelo de pagamento ao profissional** — assumi split. Se for repasse manual/PIX, remove Stripe Connect e adiciona conciliação.
5. **Produção do catálogo de mídia** — próprio, licenciado ou híbrido. É o maior custo não-técnico da Fase 1.
