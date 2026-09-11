# Fase 6 — arte do avatar, modelos gratuitos e tour de features

> Continuação de
> [`sessao-2026-09-11-fase5-avatar-e-metabolismo.md`](sessao-2026-09-11-fase5-avatar-e-metabolismo.md).

---

## Parte 1 — Arte do avatar (ATL-AVT-003)

### O que mudou

A Fase 5 resolveu a **escolha** (swatches em vez de "cabelo 3"), mas o desenho
continuava o mesmo boneco: elipse de cabeça, dois pontos como olhos, sem
orelhas, sem sobrancelha, cabelo em polígonos duros.

Agora a construção tem cabeça com maxilar afilado, orelhas, pescoço **com
sombra sob o queixo**, sobrancelhas espelhadas, nariz, olhos com brilho, oito
cabelos com silhuetas distintas, quatro roupas com decote e cinco acessórios.

### A ferramenta que tornou isso viável

`scripts/preview-avatar.mjs` gera uma folha de contato HTML com todas as peças,
lendo `avatar-parts.ts` direto pelo type-stripping do Node.

Isso não é conveniência: escrever bezier às cegas, recompilar o Expo e navegar
até o editor para ver o resultado é um ciclo de minutos por ajuste. Com a folha
de contato o ciclo virou segundos, e foi ela que expôs os defeitos reais:

| Defeito encontrado olhando | Correção |
|---|---|
| Mecha lateral do cabelo ondulado só existia à esquerda | Espelhada — assimetria lê como erro de render |
| Boné e faixa desenhados a traço | Viraram preenchidos; a contorno pareciam arame flutuando |
| Óculos retangulares | Armação arredondada; o retângulo lia como visor |
| Painel central da jaqueta em tom de pele | Virou camiseta por baixo, em tom escuro da própria cor |
| Curto e raspado praticamente idênticos | Curto ganhou risca lateral |

`avatar-parts.ts` é só dados, sem React, exatamente para permitir isso — e o
cabeçalho documenta as âncoras do viewBox (cabeça 40..88, olhos y≈52, ombros
y 84..118), porque peça nova fora delas flutua sobre a testa.

### Estrutura em camadas

O cabelo virou `{ behind, front }`. É o que faz cabelo longo existir: sem a
camada de trás, qualquer mecha que descesse pelos ombros ficaria por cima do
rosto. A ordem de desenho está documentada no componente.

---

## Parte 2 — Dois modelos gratuitos

### Mudança de modelo de monetização

Antes o paywall era **por peça**: as duas últimas opções de cada categoria eram
premium. Isso dava ao gratuito um construtor quase completo com itens
bloqueados espalhados — nem generoso nem vendável.

Agora: **dois avatares prontos são gratuitos, um feminino e um masculino.**
Montar o seu, peça por peça, é Pro. São nove modelos ao todo, sete deles Pro.

### A exceção que não se negocia

**Tom de pele nunca é pago**, nem nos modelos nem no construtor. Trocar de
modelo preserva o tom de pele do usuário — trocar de look não deveria trocar
quem a pessoa é. Há teste para a regra e outro garantindo que `skinTone` não
entre nos campos que o modelo trava.

### O buraco óbvio, fechado

A regra ingênua ("o usuário escolheu um modelo grátis") permitiria escolher o
grátis, trocar uma peça por uma premium e salvar. `isAvatarAllowed` compara
**todos** os campos do modelo, e a checagem roda no save, não só na grade — a
UI pode mudar; a regra não. Tem teste com esse nome.

### Editor em três modos

**Foto | Modelos | Personalizar.** A separação existe porque o gratuito precisa
de um caminho curto até um avatar que não seja o genérico, e o Pro precisa do
construtor — misturar os dois punha o gratuito diante de uma grade
majoritariamente bloqueada. O modo Personalizar abre com um card explicando o
que o Pro dá, em vez de só mostrar cadeados.

O avatar semente passou a ser o modelo gratuito masculino: o usuário da demo
começa com um avatar que o plano Free de fato permite.

---

## Parte 3 — Onboarding e tour (ATL-ONB-002)

### O problema real

Entre a Fase 4 e a Fase 5 entraram capas geradas, metas metabólicas, hidratação
e modelos de avatar. **Nenhuma aparecia no onboarding**, que seguia com as três
telas genéricas de boas-vindas.

Escrever um onboarding novo resolveria hoje e se repetiria na próxima feature.
Então a entrega é outra: **tornar estruturalmente impossível** que uma feature
entre sem apresentação.

### Três coisas separadas

| Etapa | Pergunta | Tela |
|---|---|---|
| Boas-vindas | "O que é este app?" | `WelcomeScreen` |
| Onboarding | "Quem é você?" — coleta | `OnboardingForm` |
| Tour | "O que o app faz?" — apresenta | `FeatureTourScreen` |

Estavam misturadas. Quem quer ver o produto era interrompido por formulário, e
quem quer usar o produto era interrompido por propaganda.

### O registro e o gate

`feature-tour.ts` é a fonte única: 13 features, cada uma declarando id estável,
chaves i18n, glifo, entitlement, estágio e **as rotas que cobre**.

`scripts/check-tour-coverage.mjs` falha o build quando:

1. uma rota de usuário não tem cobertura nem dispensa justificada;
2. uma feature aponta para rota inexistente;
3. uma dispensa ficou órfã.

Os itens 2 e 3 existem porque registro que só cresce apodrece — sem eles o gate
passaria a mentir depois da primeira rota renomeada. O gate entrou em
`pnpm check:parity`, ao lado dos gates de adapter e de contrato.

**O gate funcionou antes de a tela existir:** a primeira execução acusou
`(auth)/tour` como dispensa órfã, porque eu havia listado a rota antes de
criá-la. E o teste do registro pegou `glyph: 'bolt'` apontando para um ícone que
a arte de capa não sabia desenhar — `bolt` virou glifo de verdade.

### A spec

`docs/specs/14-onboarding-e-tour.md`, normativa, com 13 regras (R1–R13). As que
carregam decisão de produto:

- **R7/R8** — o tour é pulável, e pular conta como visto. Tour que prende é
  obstáculo; reapresentá-lo a quem escolheu não vê-lo desrespeita a escolha.
- **R9** — há entrada permanente no Perfil para rever. Sem ela, "pular" vira
  decisão irreversível tomada nos primeiros trinta segundos no app.
- **R10** — `TOUR_VERSION` faz o tour reaparecer quando entra feature relevante.
  Sem versão, usuário antigo nunca descobre nada novo.
- **R11** — "já vi" é estado do aparelho, não do perfil: a decisão de mostrar a
  primeira tela não pode depender da rede, e o primeiro acesso é justamente
  quando a rede é menos confiável. Falha de storage é tratada como "nunca viu".
- **R12** — o tour fica entre 6 e 12 páginas, com teste falhando nos dois
  extremos. Quando passar de 12, a pergunta não é "como encurtar o texto" — é
  qual feature vira `contextual`.

Mais a task-spec `ATL-ONB-002` e o prefixo `ATL-ONB` na tabela de task-specs.

---

## Verificação

~~~text
pnpm typecheck                  5 successful, 5 total
pnpm lint                       exit=0 (--max-warnings 0)
npx vitest run                  28 arquivos, 147 testes verdes (eram 132)
pnpm check:parity               9 ports · 23 endpoints · 29 rotas, 13 features
prettier --check (tocados)      limpo
~~~

Prévia web percorrida de ponta a ponta: onboarding → tour (10 páginas, pular e
concluir) → app; editor de avatar nos três modos; folha de contato das peças.

## Pendências

1. **Nada foi visto em device.** Continua valendo a lista das fases 4 e 5.
2. **Sem medição do tour.** Quantos terminam, onde abandonam, quais features são
   tocadas depois — nada disso é conhecido. As regras da spec 14 são desenho
   fundamentado, não resultado medido. Instrumentar antes de otimizar conteúdo.
3. **Coach marks ficaram de fora.** Destacar um elemento real da tela com
   recorte e seta é outra mecânica, que quebra a cada mudança de layout. Está
   declarado como fora de escopo na spec, não esquecido.
4. **Tour igual para atleta e profissional.** O registro já comporta um filtro
   por papel; não há base de profissionais que justifique agora.
5. **Só pt-BR.** O registro aponta para chaves i18n, então outro idioma é
   tradução, não refatoração.
6. **A grade de peças renderiza um SVG por swatch.** Agora com mais caminhos por
   avatar que na Fase 5. Na prévia web é instantâneo; medir em aparelho de
   entrada antes de ampliar o catálogo.
