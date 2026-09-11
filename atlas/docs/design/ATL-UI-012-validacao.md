# ATL-UI-012 — Interface e acompanhamento

Validação em 10–11/09/2026. Estágio: mock-first. Implementação local; não há PR publicado. O repositório ainda está sem commit inicial e os arquivos estão não rastreados.

## Entrega

Fundo com gradiente linear simples e paleta Atlas preservada. Hero de hoje mantido, semana navegável, prescrição do dia, resumo por período, calendário, histórico paginado, distribuição muscular e evolução de peso. Check-in com campos aprovados, rascunho persistido e acompanhamento semanal. Não houve implementação de backend.

## Critérios, um por um

| Critério da task | Evidência e limite |
| --- | --- |
| Gradiente simples e hero | DepthBackground usa somente gradiente linear. Hoje revisado visualmente. |
| Resumo 7/30/90 e comparação | DashboardOverview e summarizePeriod; testes de períodos iguais, ausência de base, sessões não concluídas e datas futuras. Dashboard carregado na web. |
| Calendário e dias únicos | calendarWeek e WeekCalendar; testes de calendário local e deduplicação de dias. |
| Dias reais e prescrição | Semana carregou Push/Pull/Legs; clique em Push abriu sua prescrição na web. |
| Séries, reps/tempo, RIR, descanso e guia | PrescriptionRow e DayWorkoutScreen; dados visíveis conferidos. Resumo usa a primeira série prescrita; variações entre séries exigem consulta da ficha completa. |
| Volume muscular e detalhe | MuscleDistribution com barras, kg e séries efetivas; adapter filtra treinos concluídos e valida Zod. Detalhe anatômico implementado; interação nativa ainda não validada. |
| Peso, média, tendência, datas e unidade | MetricChart e CompositionSection; gráfico exibido na web, geometria coberta pelos testes existentes. |
| Histórico paginado e resumo integral | Histórico abre rota de sessão. Teste de 75 sessões em duas páginas e de cursor repetido passou. Fluxo de abertura de sessão pelo histórico não retestado nesta rodada. |
| Campos aprovados do check-in | Schemas e formulário: horas, qualidade 1–5, energia 1–5; dor 0–10 condicional a reabilitação. Fluxo sem dor verificado na web; fluxo de reabilitação pendente de teste manual. |
| Rascunho, retomada e sete dias | Salvo rascunho fictício, recarregada página, campos restaurados e check-in concluído. Persistência confirmada novamente no dia seguinte. Sem logs de payloads. |
| Loading, vazio, erro e sucesso | Ramos implementados nas seções novas e revisados em código. Vazio e sucesso do check-in observados. Não foi executada a matriz de falhas de cada seção/dispositivo. |
| Zod, adapters e OpenAPI | Quatro testes de check-in em mock/HTTP passaram; paridades 8 ports e 20 endpoints. HTTP testado com transporte simulado, sem backend. |
| Comandos e limites | Saídas completas na pasta evidencias-ATL-UI-012. E2E indisponível por ausência do Maestro. |

## Saídas reais resumidas

~~~text
pnpm typecheck
Tasks: 5 successful, 5 total

pnpm lint
exit=0

pnpm test
Test Files 22 passed (22)
Tests 72 passed (72)
'maestro' não é reconhecido como um comando interno
ou externo, um programa operável ou um arquivo em lotes.
exit=1

node scripts/check-adapter-parity.mjs
Paridade OK — 8 ports verificados nos dois adapters.

node scripts/check-contract-parity.mjs
Contrato OK — 20 endpoints com adapter correspondente.

expo export --platform ios
Exported: .expo/dashboard-ios
exit=0

expo export --platform android
Exported: .expo/dashboard-android
exit=0
~~~

## Pontos de atenção para apresentação

1. Não marcar a Definition of Done completa: faltam Maestro, dispositivos Android/iOS, vidro nativo, leitor de tela, fontes ampliadas e matriz de erros.
2. Testes visuais web: dashboard em 320 e 390 pixels; tema claro/sólido e escuro/desfoque. Export nativo não é instalação nem execução em aparelho.
3. Mídias e anatomia continuam demonstrativas. Não apresentar gráficos como avaliação clínica ou prescrição automática.
4. O histórico remoto mock e alguns dados de perfil/ficha são em memória. Check-in e dados offline têm persistência local; isso não equivale a uma conta sincronizada real.
5. Sync offline possui pendências anteriores: recuperação após encerramento do app, ordenação de conclusão frente a séries em retry e cenários de relógio devem ser validados antes de prometer robustez operacional.
6. O adapter de indicadores usa janela móvel por instante, enquanto resumo/calendário usam dias locais. Uma sessão exatamente na borda do período pode aparecer em apenas um desses indicadores; alinhar semântica antes da fase de integração.
7. Prescrição resumida mostra a primeira série; não assumir que todas as séries de qualquer ficha têm os mesmos parâmetros.
8. Nenhum PR foi criado nesta entrega. Organizar baseline e diffs por task antes de publicação no repositório remoto.

## SQLite na web

Foi reproduzido erro de cache: SQLite code 14, unable to open database file. A implementação web do Expo limita seu pool a seis arquivos, incluindo bancos e journals. O patch versionado em patches/expo-sqlite.patch eleva para 32 e expande instalações existentes, sem apagar bancos. A camada web serializa operações e usa journal DELETE; nativo mantém sua configuração. Reavaliar o patch ao atualizar Expo. A documentação do Expo classifica suporte SQLite web como alpha: https://docs.expo.dev/versions/latest/sdk/sqlite/.

Após o patch, cache de ficha, onboarding e persistência de check-in funcionaram na prévia. Nenhum TODO novo sem task foi encontrado nas seções auditadas.
