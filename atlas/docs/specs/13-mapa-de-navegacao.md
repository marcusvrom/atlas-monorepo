# Spec 13 — Mapa de navegação e telas

Rotas em Expo Router (file-based). Grupo `(tabs)` usa **Native Tabs** para obter
a tab bar de vidro do sistema no iOS 26.

## 1. Árvore de rotas

```
app/
├── _layout.tsx                    Providers: Api, Query, Theme, SafeArea, Gesture
├── (auth)/
│   ├── welcome.tsx
│   ├── sign-in.tsx
│   └── onboarding/                objetivo, dados básicos, avatar
├── (tabs)/
│   ├── _layout.tsx                NativeTabs (vidro do sistema)
│   ├── index.tsx                  HOJE — treino do dia, atalho, resumo
│   ├── plans.tsx                  FICHAS — lista, criar, editar
│   ├── progress.tsx               PROGRESSO — métricas, heatmap, gráficos
│   ├── coach.tsx                  COACH — marketplace (atleta) ou clientes (profissional)
│   └── profile.tsx                PERFIL — avatar, objetivo, plano, ajustes
├── session/
│   └── [id].tsx                   EXECUÇÃO — modo imersivo, controles em vidro
├── exercise/
│   └── [id].tsx                   DETALHE — vídeo, cues, modelo anatômico
├── plan/
│   ├── [id].tsx
│   └── [id]/edit.tsx
├── measurement/new.tsx            (modal, sheet)
├── professional/[id].tsx
├── client/[id].tsx                visão do coach sobre um aluno
└── paywall.tsx                    (modal) contextual por feature
```

## 2. Telas prioritárias da Fase 0

Ordem de construção. As três primeiras carregam a demo inteira.

### T1 — Hoje (`(tabs)/index.tsx`)
Cartão do treino do dia com nome da ficha, volume previsto, duração estimada e
CTA em vidro. Abaixo: sequência da semana (aderência), último PR, atalho para
registro rápido de peso.
Estados: sem ficha ativa (CTA de criação), dia de descanso, treino em andamento.

### T2 — Execução de treino (`session/[id].tsx`)
A tela mais importante do produto. Layout imersivo: fundo com o vídeo/ilustração
do exercício atual, conteúdo rolável, e **barra de controle flutuante em vidro**
fixada embaixo com timer de descanso, série atual e "concluir série".
- Registro de série com feedback ≤ 16 ms (optimistic update, sem esperar rede).
- Timer de descanso roda em worklet, sobrevive a background.
- Swipe horizontal entre exercícios (Gesture Handler + Reanimated).
- Indicador de fila de sync quando offline.

### T3 — Detalhe do exercício (`exercise/[id].tsx`)
Vídeo em loop, cues de execução, erros comuns, e o **modelo anatômico** com
primário/secundário/estabilizador destacados. Histórico do usuário naquele
exercício (progressão de carga e 1RM estimado).

### T4 — Progresso (`(tabs)/progress.tsx`)
Seções dirigidas pelo objetivo atual (spec 00 §11.4). Heatmap anatômico de
volume semanal, gráfico de composição corporal com média móvel de 7 dias,
progressão dos levantamentos principais.

### T5 — Coach: lista de clientes (`(tabs)/coach.tsx` no perfil profissional)
Lista ordenada por `riskScore`. Cada linha: avatar, nome, aderência 7d, último
treino, delta de peso, badge de alerta. Filtros por status.
É a tela que vende o plano Coach — precisa parecer densa e útil na demo.

### T6 — Marketplace (`(tabs)/coach.tsx` no perfil atleta)
Busca por proximidade, filtros de especialidade e modalidade, cards de
profissional com foto, especialidades, faixa de preço e taxa de resposta.

## 3. Padrões de navegação

| Situação | Padrão |
|---|---|
| Detalhe a partir de lista | Push em stack, com transição nativa |
| Criação / edição rápida | Sheet modal (detents 0.6 / 1.0) |
| Paywall | Modal full-screen, sempre contextual à feature bloqueada |
| Execução de treino | Rota full-screen, tab bar oculta, gesto de voltar desabilitado |
| Erro de rede | Inline na seção afetada, nunca tela cheia de erro |

## 4. Estados obrigatórios por tela de dado

Toda tela que consome um port implementa quatro estados. Não é opcional e é
verificado no code review:

1. **Loading** — skeleton com shimmer respeitando o layout final (evita CLS)
2. **Vazio** — ilustração + CTA claro, nunca "Nenhum dado encontrado"
3. **Erro** — mensagem em pt-BR + retry, preservando o que já carregou
4. **Sucesso**
