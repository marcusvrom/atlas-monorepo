# Proposta de extensão de contrato — PRs 2 e 5

Status: aprovada pelo usuário em 09/09/2026 (autorização para continuidade da Fase 0). PR 2 em implementação; PR 5 mantém entrega separada.

## PR 5 — edição de ficha

- `UpdatePlanInput`: reutiliza `CreatePlanInput` (name, goal) e acrescenta
  `days: WorkoutDay[]`. Dias e séries usam os schemas existentes, sem tipos
  paralelos. Rascunhos podem conter dias vazios; publicar não pode.
- `ProgrammingPort.updatePlan(id, input): Promise<WorkoutPlan>`.
  `PUT /api/v1/workout-plans/{id}`. Somente draft é editável. published/archived
  devolve ApiError conflict; a tela oferece revisão.
- `ProgrammingPort.revisePlan(id): Promise<WorkoutPlan>`.
  `POST /api/v1/workout-plans/{id}/revisions`. Origem deve estar publicada.
  Cria nova ficha draft/inativa, novo ID, version = origem.version + 1 e cópia
  independente dos dias/séries. Preserva a origem publicada e seu histórico.
  Publicar/ativar a revisão usa os métodos existentes.
- Publicação valida ao menos um dia e exercícios em cada dia.
- As três representações evoluem juntas: Zod, adapters mock/HTTP e OpenAPI.
  O app continua usando exclusivamente o mock. Nenhum endpoint de backend será
  implementado nesta fase.

Arquivos: packages/contracts/src/schemas/programming.ts; export de schemas se
necessário; packages/api-client/src/ports/programming.port.ts;
packages/api-client/src/mock/programming.mock.ts;
packages/api-client/src/http/programming.http.ts; contracts/openapi.v1.yaml;
testes de contrato e hooks/telas do editor. Um conjunto separado para o PR 5.

## Lacuna adicional identificada no PR 2

IdentityPort permite atualizar objetivo/avatar, mas não os dados básicos
coletados no onboarding. Proposta: `UpdateProfileInput` derivado de UserProfile
com displayName, heightCm e birthDate; método updateProfile(input) e
`PATCH /api/v1/me`. Persistência do andamento do onboarding é local: o estado
precisa ter schema Zod aprovado antes de gravar/leitura em SQLite. Proposta:
`OnboardingDraft` com step (profile/goal/availability/baseline), profile
(UpdateProfileInput), goal (CurrentGoal nullable) e baseline
(RecordMeasurementInput nullable). Campos opcionais podem ser nulos conforme
os contratos existentes; os guardrails continuam vindo de validateGoal().

Os arquivos de Identity, os dois adapters e o OpenAPI seriam alterados no
conjunto do PR 2, separadamente do editor.

## Limites que precisam de decisão antes do PR 10

ProfessionalSummary não contém bio, política de cancelamento ou avaliações
individuais. ClientOverview não contém escopo, notas ou histórico detalhado.
Esses dados não serão inventados em telas ou adicionados silenciosamente às
fixtures. É necessário aprovar uma extensão específica antes dessa parte.
