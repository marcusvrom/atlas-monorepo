# Sessão 11/09/2026 — Tier 0: de-riscar a demo

> Autorização: *"Por favor pode começar pelo tier 0, além disso adicione ao
> planejamento também uma melhoria em nossos Dashboard e também na visão de
> profissionais que atendem alunos."*

Ordem de trabalho e justificativa completas em [`docs/roadmap-produto.md`](../roadmap-produto.md).

## 0.1 — Risco nativo

O preview web esconde uma classe inteira de falha. `expo-doctor` apontou
`expo-linking` ausente como peer dependency de `expo-router` — "your app may
crash outside of Expo Go without this dependency". Invisível no navegador,
fatal no device.

- `expo-linking@~57.0.9` adicionado. `expo install` precisa de rede bloqueada
  aqui, então a versão foi resolvida via `npm view` e fixada à mão.
- `expo export` nas duas plataformas para descartar falha de bundling nativo.
- Assets de marca gerados a partir dos tokens (`pnpm assets:brand`): ícone,
  ícone adaptativo e splash em 1024×1024. O app estava usando o logo padrão do
  Expo — o primeiro frame da demo era a marca errada.
- `apps/mobile/.maestro/device-smoke.yaml`: primeiro acesso, tour, tabs, sessão
  (haptics/worklets/SQLite), hidratação, avatar e glass nos três modos.

> Churn no `pnpm-lock.yaml`: além de `expo-linking`, o `patch_hash` de
> `expo-sqlite` mudou de formato porque o pnpm local é mais novo que o que gerou
> o lock. É reescrita de formato, não troca de patch.

## 0.2 — A tela de sessão

Era a tela mais fraca do app e é onde a demo passa o clímax. Um formulário: três
steppers empilhados, sem dizer em que exercício o usuário estava, quantas séries
faltavam, nem o que ele tinha levantado da última vez.

### Domínio antes da tela

`previousBestOneRepMax(previous, exerciseId)` e `recordSetIds(session, previous)`
entraram em `session-summary.ts` com 9 testes. A regra: uma série é recorde se
supera a melhor marca da sessão anterior **e** é a melhor até ali na sessão
atual — sem a segunda metade, toda série acima do histórico viraria recorde e o
selo perderia sentido na terceira repetição.

O recorde é avaliado **antes** de a série entrar na sessão; depois ela já faz
parte da base de comparação e nunca se superaria.

### Composição

| Antes | Agora | Por quê |
| --- | --- | --- |
| `FlashList` de séries + registrador preso em 65% da altura | Coluna única rolável | O cabeçalho rolava, o registrador não, e no meio ficava um bloco fixo de três campos |
| Sem indicação de posição | Trilha segmentada + chips "Exercício 1 de 5" / "Série 2 de 4" | As perguntas entre séries são *onde estou* e *quanto falta* |
| Recorde só no resumo final | Toast + haptic de sucesso no momento + selo na linha da série | Recorde é um momento, não uma estatística |
| Campos pré-preenchidos sem contexto | Chips "Alvo: 7–9 reps" e "Última vez: 102,5 kg × 7" | O dado já era carregado para pré-preencher e nunca era mostrado; alvo prescrito ≠ carga anterior |
| Número solto de 34 pt | Anel que esvazia (`useFrameCallback` + `useAnimatedProps`, UI thread) | Na academia se olha o telefone de relance, de longe: número exige leitura, anel é lido em visão periférica |
| "Concluir" ao lado de "Concluir série" | "Concluir treino", movido para o fim da tela | Ambíguo no pior momento possível |

`ScrollView` e não `FlashList`: a lista é do tamanho da prescrição (3–6 itens) e
virtualizar custava mais em complexidade de layout do que rendia.

### O stepper (ganho que se propagou)

`NumericStepper` usava dois botões de texto ("Diminuir" / "Aumentar") e custava
~140 pt de altura por campo — três campos ocupavam mais de metade do viewport
para ajustar três números. A palavra "Diminuir" não é mais legível que `−`; é só
maior.

Virou rótulo à esquerda + cluster `−` / valor / `+` à direita, 44 pt de alvo de
toque (mínimo das HIG da Apple e do Material), largura do valor fixa para os
botões não dançarem quando o número passa de 9 para 10. ~56 pt por campo, e a
série inteira passou a caber acima da dobra.

Acessibilidade não regrediu: o `accessible` subiu para a raiz com
`accessibilityRole="adjustable"` — um alvo de foco único que responde a
incremento/decremento, que é o contrato que VoiceOver e TalkBack esperam.

Como o componente é do design system, onboarding, nova ficha e editor de
prescrição encolheram junto sem tocar em nenhum deles.

### Bug encontrado pelo lint

`react-hooks/purity` pegou `restDeadline > Date.now()` durante o render do
cabeçalho. Não era só impureza: **não havia quem reavaliasse a expressão**, então
o anel de descanso só sumia quando algo *outro* re-renderizava o cabeçalho. O
relógio virou estado atualizado por um `setTimeout` agendado para o próprio
prazo — o fim do descanso agenda o próprio desaparecimento.

## 0.3 — Placeholders visíveis

`ExerciseVideo` desenhava uma moldura vazia com o caminho do arquivo do mock por
baixo (`supino-reto-barra/front.mp4`), ocupando o melhor espaço da tela de
detalhe. Não lia como "ainda não temos vídeo" — lia como quebrado.

A correção não foi maquiar a moldura. Foi removê-la e **promover conteúdo real**:
os pontos de execução e erros comuns já existiam no catálogo, relegados ao rodapé
numa `FlashList` heterogênea em que cada linha reimprimia o rótulo da sua seção —
a tela dizia "Pontos de execução" três vezes seguidas.

Agora `ExerciseSteps` entrega dois cards com cabeçalho dito uma vez, execução
numerada (é uma sequência: escápulas antes da descida, descida antes da subida) e
erros com marcador de alerta. Quando a API real servir mídia de um CDN de
verdade, o vídeo volta a aparecer sem nenhuma outra mudança.

### Plural

A verificação por screenshot pegou "1 séries registradas" — e a mesma quebra
existia em mais sete pontos, incluindo "1 registros aguardando envio", que é o
caso **mais provável** numa demo com fila offline.

`plural(count, one, many)` em `src/i18n/index.ts`, com a regra correta para
pt-BR: singular só em `n === 1` (zero é plural). Deliberadamente não é ICU
MessageFormat — uma regra de duas formas em um idioma não justifica a
dependência, e este é o ponto único a trocar quando entrar o segundo idioma.
Travado por teste.

## Planejamento registrado

Conforme pedido, as duas frentes entraram no planejamento como itens de primeira
classe do **Tier 1**, antes de qualquer feature nova:

- [`ATL-COA-006`](../agent/task-specs/ATL-COA-006-visao-do-profissional.yaml) —
  visão do profissional. O achado que define o escopo: `ClientOverview` entrega
  **oito sinais** por cliente (aderência 7d/30d, última sessão, deltas de peso e
  massa magra, metas em risco, não lidas, risco) e `ClientPanel` renderiza
  **dois**. O primeiro salto de qualidade da tela do usuário mais importante não
  precisa de contrato novo — é composição sobre dado que já chega.
- [`ATL-DSH-007`](../agent/task-specs/ATL-DSH-007-dashboard-do-atleta.yaml) —
  dashboard do atleta. Tendência acima dos contadores, streak de consistência, e
  **um** insight por vez derivado de função pura em `@atlas/domain` (dois
  insights competindo viram ruído e nenhum é lido).

## Validação

| Gate | Resultado |
| --- | --- |
| `pnpm typecheck` | 5/5 |
| `pnpm lint` | limpo (`--max-warnings 0`) |
| `npx vitest run` | 30 arquivos, 159 testes |
| `pnpm check:parity` | 9 ports, 23 endpoints, 29 rotas / 13 features |
| `expo export` | ios + android |
| Verificação visual | Playwright sobre o preview web, 420 px |
