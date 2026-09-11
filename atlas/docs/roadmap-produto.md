# Roadmap de produto — caminho até a demo com stakeholders

> Autorização: pedido do usuário em 11/09/2026 — *"quais features e refinamentos
> recomenda para seguirmos? Preciso dessa aplicação o mais próxima possível de um
> produto final"* e, em seguida, *"pode começar pelo tier 0, além disso adicione ao
> planejamento também uma melhoria em nossos Dashboard e também na visão de
> profissionais que atendem alunos"*.

Este documento não é uma spec normativa. Ele ordena o trabalho e registra **por
que** essa ordem. As specs normativas ficam em `docs/specs/`; as unidades
executáveis, em `docs/agent/task-specs/`.

## Critério de ordenação

O produto não é avaliado por quantidade de features na demo. É avaliado por
**quantos segundos o stakeholder passa sem perceber que é um protótipo**. Isso
inverte a prioridade usual: um placeholder visível na tela principal custa mais
que uma feature ausente, porque a feature ausente ninguém nota e o placeholder
todo mundo nota.

Daí a regra que ordena os tiers abaixo:

1. **Nada pode ler como quebrado** (Tier 0).
2. **A tela que sustenta a tese do produto precisa ser a melhor tela** (Tier 1).
3. **O resto é profundidade** (Tier 2 e 3).

---

## Tier 0 — De-riscar a demo `✅ concluído`

Três frentes, todas entregues nesta rodada.

### 0.1 — Risco nativo
O preview web esconde falhas que só aparecem no device. `expo-doctor` apontou
`expo-linking` ausente como peer dependency de `expo-router` — classe de falha
que derruba o app fora do Expo Go, invisível no navegador. Corrigido, mais
`expo export` nas duas plataformas para descartar falha de bundling nativo,
assets de marca (ícone, ícone adaptativo, splash) gerados a partir dos tokens, e
um smoke de device em Maestro cobrindo primeiro acesso, tour, tabs, sessão
(haptics/worklets/SQLite), hidratação, avatar e glass nos três modos.

### 0.2 — A tela de sessão
Era a tela mais fraca do app e é onde a demo passa o clímax. Era um formulário:
três steppers empilhados, sem dizer em que exercício o usuário estava, quantas
séries faltavam, nem o que ele tinha levantado da última vez.

O que mudou e por quê:

| Mudança | Razão |
| --- | --- |
| Cabeçalho com capa, dia, trilha segmentada de progresso | As três perguntas entre séries: *o que*, *onde estou*, *quanto falta* |
| Recorde anunciado no momento (toast + haptic de sucesso) | `recordSetIds` já sabia identificar o recorde, mas só contava no resumo final — o recorde é um **momento**, não uma estatística |
| Chips "Alvo: 7–9 reps" e "Última vez: 105 kg × 7" | O dado já era carregado para pré-preencher os campos e nunca era mostrado; alvo prescrito e carga anterior são coisas diferentes |
| Descanso como anel que esvazia | Na academia se olha o telefone de relance, de longe; um número exige leitura, um anel é lido em visão periférica |
| Stepper redondo (`−` / valor / `+`) no lugar de "Diminuir"/"Aumentar" | Custava ~140 pt de altura por campo; a palavra "Diminuir" não é mais legível que `−`, só maior. Caiu para ~56 pt e a série inteira passou a caber acima da dobra |
| CTA primeiro, navegação rotulada abaixo, "Concluir treino" no fim da tela | A hierarquia estava invertida: registrar série acontece ~20×/treino, concluir treino acontece 1× |

Ganho colateral: o stepper é do design system, então as outras três telas que o
usam (onboarding, nova ficha, editor de prescrição) encolheram junto.

### 0.3 — Placeholders visíveis
`ExerciseVideo` desenhava uma moldura vazia com o caminho do arquivo do mock por
baixo (`supino-reto-barra/front.mp4`). Não lia como "ainda não temos vídeo" —
lia como quebrado, ocupando o melhor espaço da tela de detalhe.

A correção não foi maquiar a moldura: foi **remover a moldura e promover conteúdo
real**. Os pontos de execução e erros comuns já existiam no catálogo, relegados
ao rodapé numa `FlashList` heterogênea em que *cada linha repetia o rótulo da sua
seção* — a tela dizia "Pontos de execução" três vezes seguidas. Agora são dois
cards com cabeçalho dito uma vez, execução numerada (é uma sequência) e erros com
marcador de alerta. Quando a API real servir mídia de um CDN de verdade, o vídeo
volta a aparecer sem nenhuma outra mudança.

---

## Tier 1 — As duas telas que sustentam a tese `← próximo`

Esta é a prioridade máxima seguinte, e é aqui que entram as duas frentes pedidas
explicitamente. Elas vêm antes de qualquer feature nova.

### 1.1 — Visão do profissional (`ATL-COA-006`)

**Por que primeiro:** o acompanhamento profissional é o diferencial do produto, e
o profissional é quem paga por ele. Hoje a tela que ele usa é a menos trabalhada
do app.

**O achado que define o escopo:** `ClientOverview` — o contrato que já existe,
já está no mock e já está em paridade com o adapter HTTP — carrega **oito
sinais**:

```ts
adherence7d, adherence30d, lastSessionAt, weightDelta30dKg,
leanMassDelta30dKg, goalsAtRisk, unreadMessages, riskScore
```

`ClientPanel` renderiza **dois** deles (nome e objetivo) mais um botão "Abrir".
`riskScore` é usado só para um filtro binário. Ou seja: o primeiro salto de
qualidade da tela principal do usuário mais importante **não precisa de contrato
novo, de backend novo, nem de migração**. É composição sobre dado que já chega.

Escopo proposto:

- **Linha de cliente densa**: aderência 7d/30d como micro-barra, dias desde a
  última sessão, delta de peso/massa magra com sinal, selo de metas em risco e
  badge de mensagens não lidas. O `riskScore` deixa de ser filtro e passa a
  ordenar a lista por padrão — a tela abre já respondendo *"com quem eu falo
  agora?"*.
- **Faixa de triagem no topo**: quantos clientes em risco, quantos sem treinar há
  7+ dias, quantas mensagens pendentes. Cada contador é um filtro.
- **Detalhe do cliente com trajetória, não com lista**: a `ClientScreen` hoje
  repete o mesmo anti-padrão do catálogo (lista achatada de notas + sessões +
  medidas, cada linha reimprimindo seu rótulo). Vira: hero com estado atual,
  gráfico de aderência e de carga, sessões recentes como timeline, notas como
  seção própria.
- **Ação a partir do detalhe**: ajustar prescrição, registrar nota, marcar
  check-in. Sem ação, a tela é um relatório.

**Trade-off assumido:** mensageria real (`unreadMessages` clicável levando a uma
thread) fica fora. O badge mostra o número porque o dado existe; abrir conversa é
Tier 2. Mostrar o contador sem a thread é honesto — é um indicador de atenção,
não um link quebrado.

### 1.2 — Dashboard do atleta (`ATL-DSH-007`)

**O diagnóstico:** `Hoje` é uma boa tela de *hoje* — hero do treino, exercícios em
carrossel, semana programada. `Progresso` é uma boa tela de *contadores* — quatro
tiles com variação percentual. Falta o meio: nenhuma das duas responde *"estou
melhorando?"* acima da dobra.

Escopo proposto:

- **Tendência antes de contador.** O gráfico de carga/volume sobe para o topo de
  `Progresso`, com o período selecionado. Os tiles permanecem, abaixo — eles
  explicam o gráfico, não o substituem.
- **Streak e consistência em `Hoje`.** Sequência de semanas batendo a meta é o
  sinal que mais prevê retenção e hoje não existe em lugar nenhum. Entra na
  faixa do cabeçalho, ao lado do avatar.
- **Um insight redigido, derivado do domínio.** Um cartão único, calculado em
  `@atlas/domain` (função pura, testável, sem rede): estagnação detectada,
  recorde recente, queda de aderência, meta de hidratação em risco. Regra de
  produto: **no máximo um insight por vez** — dois insights competindo viram
  ruído e nenhum é lido.
- **Ponte para o profissional.** Se o atleta tem profissional vinculado, o
  dashboard mostra a última nota dele. É o que faz o diferencial aparecer do
  lado de quem é atendido.

**Trade-off assumido:** o insight é heurístico e determinístico, não modelo. Isso
é deliberado — precisa ser explicável ("sua carga no supino não sobe há 3
semanas"), rodar offline e ser testável por unidade. Modelo preditivo, se fizer
sentido, vem depois de instrumentação.

### 1.3 — Bio dos profissionais no seed
Todos os profissionais do marketplace hoje compartilham a mesma frase
("Acompanhamento individualizado com ajuste semanal de carga"). Numa lista isso
lê como dado falso. Correção barata: variar bio, especialidade e faixa de preço
no `buildSeedData`.

---

## Tier 2 — Profundidade

- **Mensageria atleta ↔ profissional.** Fecha o loop que o Tier 1.1 deixa aberto.
- **Check-in periódico com fotos e medidas**, alimentando o delta que o painel do
  profissional já exibe.
- **Ajuste de prescrição pelo profissional** com versionamento de plano
  (`planVersion` já existe no contrato de sessão).
- **Exportação de relatório** do cliente em PDF — é o artefato que o profissional
  leva para a consulta.

## Tier 3 — Escala e operação

- **Analytics de funil**: conclusão do tour, ativação, retenção por coorte. A
  spec 14 já registra a ausência disso como risco declarado.
- **Observabilidade**: traces do adapter HTTP, métricas de fila offline,
  dashboards de erro por tela.
- **Adapter HTTP contra backend real**, com o gate de paridade (`pnpm check:parity`)
  já em CI servindo de rede de proteção na virada.

---

## O que continua fora

Não por esquecimento:

- Internacionalização além de pt-BR.
- Onboarding segmentado por papel (atleta × profissional).
- Vídeo de execução — depende de biblioteca de mídia que o produto ainda não tem;
  o Tier 0.3 tornou a ausência invisível em vez de fingir presença.
