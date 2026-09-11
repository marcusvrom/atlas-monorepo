# Fase 5 — montagem do avatar e mesclagem com o healthapp

> Continuação de [`sessao-2026-09-11-fase4-capas.md`](sessao-2026-09-11-fase4-capas.md).
> Duas frentes independentes na mesma rodada: refazer a montagem do avatar e
> trazer do `marcusvrom/healthapp` (AiraFit) as features que fazem sentido num
> app de treino.

---

## Parte 1 — Montagem do avatar (ATL-AVT-002)

### O problema

A montagem escolhia peça por **número**. Cada opção era um chip escrito
"cabelo 3"; para saber o que era o cabelo 3, só tocando e olhando o preview —
oito toques para ver oito cabelos, e nenhuma forma de comparar dois sem
alternar entre eles.

Havia três defeitos estruturais por trás disso:

| Defeito | Efeito |
|---|---|
| Cor derivada do índice da forma (`avatarColors[itemIndex(config,'outfit')]`) | As 8 "roupas" eram 2 formas repetidas em 4 cores. Querer a regata na cor da camiseta era impossível. |
| `accessoryPaths[0] = ''` | "Sem acessório" existia disfarçado de acessório e renderizava `<Path d="">`. O contrato já dizia `accessory: string \| null`. |
| Rosto por número mágico (`face === 1 ? 3 : 2`) espalhado no componente | Acrescentar um rosto exigia editar o render. |

E um bug de dado que só apareceu ao ver a grade: o avatar semente usava ids de
outra numeração (`hair-short-02`, `base-01`), então **nenhum item aparecia
selecionado** e tudo caía no fallback de índice 0. Estava assim antes; os chips
apenas não deixavam isso visível.

### O que mudou

- **`AvatarSwatch`** (novo) — cada opção renderiza o avatar inteiro com aquela
  peça aplicada. A grade fica comparável de relance. O recorte é por categoria
  (`framing`): aproxima o rosto para cabelo, afasta para roupa — sem isso, seis
  cabelos viram seis quadrados praticamente idênticos.
- **`ColorSwatch` / `NoneSwatch`** — cor como círculo cheio (não precisa de
  contexto para ser avaliada) e "nenhum" como opção própria.
- **Cor separada da forma** — `hairColor`, `outfitColor`, `backgroundColor` no
  contrato (Zod + OpenAPI no mesmo PR). Anuláveis com default `null`, e `null`
  cai na cor derivada do índice, que é **exatamente** o comportamento anterior:
  avatar já salvo renderiza idêntico depois da migração. Há teste para isso.
- **Peças reais** — 4 formas de roupa distintas (camiseta, regata, moletom,
  jaqueta) em vez de 2 repetidas; 6 cabelos; rostos como registros explícitos
  (`avatarFaces`) em vez de condicionais no render; paleta de cabelo própria,
  porque roxo de marca não serve de cabelo.
- **Premium com selo** sobre o swatch, e paywall no toque — o tom de pele
  **nunca** é premium, e há teste garantindo isso.
- **Seed corrigido** para ids do catálogo.
- Hero da tela no mesmo idioma visual da Fase 4 (capa + voltar flutuante).

---

## Parte 2 — Mesclagem com o `healthapp` (ATL-NUT-001)

### Como a escolha foi feita

O `healthapp` é Angular + Node/TypeORM: stack diferente, então o que veio foi
**regra de negócio**, não código. Ele tem 29 controllers; a maior parte é um
segundo produto inteiro (nutrição completa, social, protocolos clínicos).

Trouxe o que se encaixa num app de treino **e** resolve algo que o Atlas já
quase fazia: o app já guardava peso, altura, nascimento e objetivo, e nunca
transformava isso num número acionável.

| Do healthapp | Trouxe? | Por quê |
|---|---|---|
| `CalculationService` (TMB, GET, MET, PCA, macros) | **Sim** | Usa biometria que o Atlas já coleta e vira meta do dia. |
| `WaterService` (meta + lembretes) | **Sim** | Pequeno, diário, e as referências de UI já pediam o anel de água. |
| `Food` / `Meal` / `Recipe` / `diet-plan` | Não | Produto inteiro à parte; sem isso a meta ainda é útil, com isso o escopo dobra. |
| `BloodTest` / `Hormone` / `ClinicalProtocol` / `Medication` | Não | Clinicamente sensível. Exige revisão profissional e enquadramento legal que esta rodada não tem. |
| `Community` / `Feed` / `Group` / `Friendship` / `Ranking` | Não | Segundo produto. Gamificação (XP, missões, desafios) é o candidato mais forte para a próxima rodada. |
| `Copilot` | Não | Feature de IA própria, com decisões de custo e privacidade que precisam ser tomadas antes. |

### `@atlas/domain/metabolism.ts` (novo, puro, 26 testes)

TMB (Mifflin-St Jeor), GET por PAL, MET, peso corporal ajustado (PCA), macros e
hidratação. Versionado (`METABOLISM_VERSION`) como as demais fórmulas do
pacote: um alvo calórico registrado hoje precisa continuar reproduzível.

Três decisões que valem registro:

1. **As calorias do treino NÃO entram na meta.** O multiplicador de atividade já
   embute o treino habitual; somar a sessão contaria o mesmo esforço duas vezes.
   Isso veio comentado na fonte, é contraintuitivo, e tem teste próprio.
2. **`diabetico` não virou objetivo.** O healthapp amarrava a via low-carb a um
   objetivo clínico. Trazer aquele rótulo transformaria uma estimativa em
   alegação clínica, então a regra veio como parâmetro de cálculo
   (`carbCeilingShare`) e quem decide aplicá-lo é um profissional, fora do
   módulo.
3. **O piso de proteína vence.** Quando proteína + gordura mínima não cabem num
   alvo muito baixo, o carboidrato zera e os macros somam mais que a meta — e
   `energyFromMacrosKcal` **expõe** o desencontro, que a tela mostra. Cortar
   proteína para a conta fechar é exatamente o que não se deve fazer num
   déficit.

O mapeamento de objetivos é deliberado, não automático: `strength` ganha
superávit menor que `hypertrophy` (o alvo é carga, não massa) e `rehabilitation`
fica em zero — não é hora de manipular energia.

### Fronteira e transporte

- **Contrato** `schemas/nutrition.ts` — `DailyTargets`, `HydrationDay`,
  `LogWaterInput`, `BiologicalSex`, `ActivityLevel`. Mais 3 endpoints e 5
  schemas no `openapi.v1.yaml`, no mesmo PR (DoD).
- **`UserProfile`** ganhou `biologicalSex` e `activityLevel`, anuláveis com
  default `null` — o perfil existia antes delas.
- **`NutritionPort`** com adapter mock (usa `@atlas/domain`) e HTTP (o backend
  roda a mesma fórmula) em paridade. Gates de CI passam: 9 ports, 23 endpoints.
- `logWater` carrega `clientGeneratedId`: reenvio é no-op (R7), com teste de
  contrato.

Duas garantias embutidas no contrato, para que nenhuma versão futura da tela as
perca:

- **`disclaimerKey`** — a estimativa nunca aparece sem o aviso de que não é
  prescrição.
- **`missingInputs`** — sem peso ou nascimento a estimativa fica incompleta, e a
  tela **pede o dado** em vez de exibir um número redondo. Inventar uma média e
  apresentá-la como se fosse do usuário seria pior que não mostrar nada.

### Telas

- **`/nutrition`** — hero com a meta calórica, macros em tiles (com a fatia de
  calorias que cada um representa), hidratação e o aviso obrigatório.
- **`HydrationCard`** — anel + dois botões de volume fixo. Volume fixo porque
  hidratação só é registrada se custar um toque; um campo numérico transformaria
  "bebi água" numa tarefa e a série do dia morreria por abandono.
- **Hoje** — hidratação e atalho para as metas: são as duas coisas que se
  consultam várias vezes ao dia.
- **Perfil** — sexo biológico e nível de atividade, ao lado do objetivo. Mudar
  qualquer um invalida `nutrition` no cache; o objetivo também, porque define o
  ajuste calórico.

### Correção incidental

O botão `ghost` usava `colors.surface` — o mesmo fundo do `<Card>`. Dentro de um
card ele sumia e virava um rótulo solto. Ganhou contorno; afeta o app todo, para
melhor.

---

## Verificação

~~~text
pnpm typecheck                     5 successful, 5 total
pnpm lint                          exit=0 (--max-warnings 0)
npx vitest run                     27 arquivos, 132 testes verdes (eram 90)
node scripts/check-adapter-parity  Paridade OK — 9 ports
node scripts/check-contract-parity Contrato OK — 23 endpoints
prettier --check (arquivos tocados) limpo
~~~

Prévia web percorrida: editor de avatar (grade de peças, cor, premium),
`/nutrition` com registro de dois copos e o anel avançando, Hoje e Perfil.
Console limpo para os componentes desta rodada.

### Pendente de validação

1. **Nada foi visto em device.** Continua valendo a lista da Fase 4 (vidro
   nativo, reduce motion, leitor de tela, Dynamic Type).
2. **A grade do avatar renderiza um SVG por swatch** — 6 a 8 avatares completos
   por categoria. Na prévia web é instantâneo; medir em aparelho de entrada
   antes de aumentar o catálogo.
3. **Os números metabólicos não foram revisados por nutricionista.** As fórmulas
   são as do healthapp, que é do mesmo dono, mas o Atlas passa a exibi-las a
   atletas: vale uma revisão profissional antes de qualquer publicação, e o
   aviso da tela não substitui isso.
4. **A janela de hidratação é fixa em 07:00–23:00.** O healthapp coletava
   `wakeUpTime`/`sleepTime` no `HealthProfile`; esses campos não vieram nesta
   rodada, então o cronograma usa um padrão. Enquanto isso, os lembretes ainda
   não são notificações — são apenas a distribuição sugerida.
5. **`hypertrophyStimulus` não está ligado.** O domínio aceita o parâmetro (a
   proteína sobe ao teto a partir de 8), mas nada no Atlas ainda calcula esse
   estímulo a partir da ficha. É o próximo fio solto natural.
