# 14 — Onboarding e tour de features

> **Normativo.** Código que viola qualquer regra marcada como **R** deve ser
> rejeitado em revisão, mesmo que funcione. Complementa
> [`docs/agent/AGENTS.md`](../agent/AGENTS.md).

## 1. Problema que esta spec resolve

Todo produto acumula features que ninguém descobre. O padrão é conhecido: a
feature entra, a tela existe, o usuário nunca chega nela, e seis meses depois
alguém propõe removê-la por falta de uso — quando o que faltou foi apresentação.

O Atlas já chegou nesse ponto: entre a Fase 4 e a Fase 5 entraram capas
geradas, metas metabólicas, hidratação e modelos de avatar, e **nenhuma delas
aparecia no onboarding**, que continuava com as mesmas três telas genéricas de
boas-vindas.

A resposta desta spec não é "escrever um onboarding bonito". É tornar
**estruturalmente impossível** que uma feature nova entre sem apresentação.

## 2. Separação de responsabilidades

Três coisas distintas, que estavam misturadas:

| Etapa | Pergunta que responde | Onde mora |
|---|---|---|
| **Boas-vindas** | "O que é este app?" | `WelcomeScreen` |
| **Onboarding** | "Quem é você?" — coleta dados | `OnboardingForm` |
| **Tour** | "O que o app faz?" — apresenta features | `FeatureTourScreen` |

**R1 — Onboarding coleta, tour apresenta.** Uma etapa de coleta de dados nunca
explica uma feature, e uma página de tour nunca pede um dado. Misturar as duas
faz o usuário abandonar no meio: quem quer ver o produto é interrompido por um
formulário, e quem quer usar o produto é interrompido por propaganda.

Ordem: boas-vindas → entrar → onboarding → **tour** → app.

## 3. O registro de features

**R2 — `feature-tour.ts` é a fonte única.** O tour, a ajuda e o gate de CI leem
do mesmo registro. Nenhuma superfície mantém a sua própria lista de features.

Cada entrada declara:

| Campo | Obrigatório | Regra |
|---|---|---|
| `id` | sim | Estável. É o que a persistência grava; renomear invalida histórico. |
| `titleKey` / `bodyKey` | sim | Chaves i18n existentes. Nada de string solta (AGENTS R3 de convenção). |
| `glyph` | sim | Um glifo que `coverGlyphPaths` sabe desenhar. |
| `route` | não | Para onde o "ver agora" leva. `null` quando a feature não tem tela própria. |
| `requiredFeature` | sim (pode ser `null`) | Entitlement exigido. Feature paga é anunciada como paga. |
| `stage` | sim | `firstRun` (entra no tour) ou `contextual` (apresentada no lugar). |
| `routes` | sim (pode ser `[]`) | Rotas de `apps/mobile/app` que esta feature cobre. É o que o gate confere. |

**R3 — Toda rota de usuário tem cobertura.** Uma rota nova em
`apps/mobile/app/**` precisa estar em `routes` de alguma feature, ou dispensada
em `TOUR_EXEMPT_ROUTES` com justificativa escrita.

**R4 — Dispensa é exceção justificada, não escape.** `TOUR_EXEMPT_ROUTES` só
aceita layouts, as telas do próprio onboarding e ferramentas de
desenvolvimento. Crescer essa lista em vez de registrar a feature é a forma de
fazer o gate deixar de valer alguma coisa — e revisão deve barrar.

**R5 — Feature paga não é escondida no tour.** `requiredFeature` faz a página
mostrar o selo Pro. Apresentar uma feature sem dizer que é paga e revelar o
paywall só no toque é armadilha, não descoberta.

## 4. O gate de CI

`node scripts/check-tour-coverage.mjs` falha o build quando:

1. Uma rota de usuário não tem cobertura nem dispensa.
2. Uma feature aponta para uma rota que não existe mais.
3. Uma dispensa ficou órfã (a rota foi removida).

Os itens 2 e 3 existem porque um registro que só cresce apodrece: sem eles, o
gate passaria a mentir depois da primeira rota renomeada.

**R6 — O gate roda junto com os demais.** Entra na mesma leva de
`check-adapter-parity` e `check-contract-parity` na Definition of Done.

## 5. Comportamento do tour

**R7 — O tour é pulável a qualquer momento.** Um tour que prende é obstáculo.
Quem pula normalmente já conhece o produto.

**R8 — Pular conta como visto.** Reapresentar o mesmo tour a quem escolheu não
vê-lo desrespeita a escolha.

**R9 — Existe caminho de volta.** O Perfil tem entrada permanente para rever o
tour. Sem isso, "pular" vira uma decisão irreversível tomada no pior momento
possível para tomá-la — os primeiros trinta segundos no app.

**R10 — O tour é versionado.** `TOUR_VERSION` sobe quando entra uma feature
relevante, e o tour reaparece uma vez para quem já o tinha visto. Sem versão,
usuário antigo nunca descobre nada novo.

**R11 — "Já vi" é estado do aparelho.** A persistência é local
(`tour-storage.ts`), não vai para o perfil: a decisão de mostrar a primeira tela
não pode depender da rede, e o primeiro acesso é justamente quando a rede é
menos confiável. Falha de storage é tratada como "nunca viu" — mostrar o tour de
novo incomoda; travar a entrada do app, não.

## 6. Ao adicionar uma feature nova

Checklist obrigatório, na ordem:

1. Registrar a feature em `feature-tour.ts`, com todas as rotas que ela cria.
2. Escrever `titleKey`/`bodyKey` em `pt-BR.json`. **Descrevendo o benefício, não
   a mecânica**: "a tela Hoje mostra o treino do dia" e não "tela de listagem de
   treino diário".
3. Escolher `stage`:
   - `firstRun` quando a feature muda o que o usuário faz no app;
   - `contextual` quando ela só faz sentido depois de outra coisa acontecer
     (medidas, avatar, hidratação).
4. Rodar `node scripts/check-tour-coverage.mjs`.
5. Se a feature for relevante para quem já usa o app, subir `TOUR_VERSION`.

**R12 — O tour de primeiro acesso fica entre 6 e 12 páginas.** Acima disso
ninguém termina; abaixo, não cobre o produto. Quando passar de 12, a pergunta
não é "como encurtar o texto" — é qual feature virou `contextual`. Há teste
falhando nos dois extremos.

## 7. Acessibilidade

**R13 — A página do tour é legível por leitor de tela.** Título e corpo são
texto real, não imagem. A arte de capa é decorativa e fica marcada como tal. Os
pontos de paginação anunciam "etapa X de Y"; não são o único indicador de
progresso.

## 8. O que esta spec NÃO cobre

- **Coach marks / spotlight sobre a interface.** Destacar um elemento real da
  tela com recorte e seta é outra mecânica, com outro custo de manutenção
  (depende de layout e quebra a cada mudança de tela). Fica como possibilidade
  futura; o tour por páginas não depende dela.
- **Onboarding segmentado por persona.** Atleta e profissional veem hoje o
  mesmo tour. Quando a base de profissionais justificar, `stage` ganha um filtro
  por papel — o registro já comporta.
- **Medição.** Quantos usuários terminam o tour, onde abandonam, quais features
  são tocadas depois. Sem analytics não há como saber se o tour funciona, e
  nenhuma regra aqui substitui esse dado.

## 9. Critérios de aceitação

- [ ] `node scripts/check-tour-coverage.mjs` verde.
- [ ] `feature-tour.test.ts` verde (ids únicos, i18n existente, glifos
      desenháveis, sem rota duplicada, dispensas justificadas, tamanho do tour).
- [ ] Onboarding termina no tour, e o tour termina no app.
- [ ] Pular em qualquer página marca como visto e leva ao app.
- [ ] Perfil tem entrada para rever o tour.
- [ ] Toda feature registrada tem título e corpo em pt-BR.
