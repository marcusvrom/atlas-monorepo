/**
 * Apresentação de números, unidades e datas — ponto único do app.
 *
 * Três regras sustentam este módulo:
 *
 * 1. **Arredondar é só apresentação.** Nenhuma função aqui devolve número; todas
 *    devolvem string. O dado que entra continua intacto no cache, no domínio e
 *    no que sobe para o backend. Uma tela que precisa do valor cru nunca passa
 *    por aqui.
 * 2. **Uma função por significado, não uma com parâmetros.** `formatWeight` e
 *    `formatWorkoutVolume` arredondam diferente porque *carga* e *volume* são
 *    coisas diferentes — 112,3 kg num supino é informação, 112,3 kg num volume
 *    de 15 toneladas é ruído. Um formatador genérico com `precision` empurraria
 *    essa decisão para cada chamada, e ela seria respondida de outro jeito em
 *    cada tela.
 * 3. **A unidade acompanha a função só quando a função escolhe a unidade.**
 *    `formatHydration` decide entre ml e L, `formatDuration` decide entre s,
 *    min e h — então ambas devolvem a unidade junto, senão a tela teria de
 *    refazer a decisão para saber qual rótulo imprimir. As demais devolvem só o
 *    número, e a tela concatena o rótulo de `t()`.
 *
 * Ausência é `—` (travessão), nunca `0` nem string vazia: "não registrado" e
 * "registrado como zero" são estados distintos e o usuário precisa distinguir.
 */

const LOCALE = 'pt-BR';

/** Marca de ausência de dado. Nunca confundir com zero. */
export const ABSENT = '—';

/**
 * Nomes de mês e de dia em pt-BR fixos, em vez de `toLocaleDateString`.
 *
 * O ICU muda a forma abreviada entre plataformas ("set" no Hermes, "set." no
 * navegador, "Set" em algumas builds do Android) e isso vazava como
 * inconsistência visível entre o app e a prévia web — além de deixar o teste
 * refém do ICU da máquina. Treze strings resolvem em definitivo.
 */
const MONTHS_SHORT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const;

const MONTHS_LONG = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

const WEEKDAYS_LONG = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
] as const;

/** Aceita o valor bruto e devolve `null` para tudo que não é número utilizável. */
function usable(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Base de todo número exibido. `maximumFractionDigits` já remove zero final, e
 * o `+ 0` normaliza `-0` — sem ele, um delta de -0,04 kg aparecia como "-0".
 *
 * O arredondamento é "meio para longe do zero", não o `Math.round` puro: este
 * arredonda -1,25 para -1,2 e +1,25 para +1,3, então um par de deltas simétrico
 * aparecia com magnitudes diferentes na mesma tela.
 */
function decimals(value: number, max: number): string {
  const factor = 10 ** max;
  const rounded = (Math.sign(value) * Math.round(Math.abs(value) * factor)) / factor;
  return (rounded + 0).toLocaleString(LOCALE, { maximumFractionDigits: max });
}

// ---------------------------------------------------------------------------
// Carga, peso e medidas
// ---------------------------------------------------------------------------

/**
 * Carga de exercício, em kg. Inteiro quando exato, uma casa quando necessária.
 *
 * Não há mais o encaixe em meio quilo que a versão anterior fazia: a entrada já
 * anda de 0,5 em 0,5 (`step` do `NumericStepper`), então o encaixe não
 * protegia nada no caminho que importa — e destruía valores que **não** vêm da
 * digitação, como a média de uma série ou um delta entre sessões, exibindo
 * 112,5 onde o dado era 112,3. A garantia de "inteiro ou meio quilo" da
 * ATL-UI-012 continua valendo, sustentada pelo passo do controle.
 */
export function formatWeight(kg: number | null | undefined): string {
  const value = usable(kg);
  return value === null ? ABSENT : decimals(value, 1);
}

/**
 * Peso corporal e circunferências. Uma casa decimal no máximo.
 *
 * Separada de `formatWeight` por domínio, não por formato: se um dia a carga
 * voltar ao encaixe em meio quilo, a composição corporal não vai junto.
 */
export function formatBodyMeasurement(value: number | null | undefined): string {
  const usableValue = usable(value);
  return usableValue === null ? ABSENT : decimals(usableValue, 1);
}

/** Altura em centímetros. Inteiro, com uma casa só quando foi mesmo registrada. */
export function formatHeight(cm: number | null | undefined): string {
  const value = usable(cm);
  return value === null ? ABSENT : decimals(value, 1);
}

/** Percentual de gordura corporal. Uma casa decimal no máximo, com o sinal. */
export function formatBodyFat(percent: number | null | undefined): string {
  const value = usable(percent);
  return value === null ? ABSENT : decimals(value, 1) + '%';
}

/**
 * Volume de treino (tonelagem), em kg e sempre inteiro.
 *
 * Volume é a soma de dezenas de séries; a casa decimal é resíduo aritmético, não
 * informação. "15.660" responde a pergunta que o usuário faz; "15.660,5" só
 * ocupa espaço e sugere uma precisão que a balança da academia não tem.
 *
 * **Regra de uso, e ela não é negociável:** este número nunca aparece sem um
 * rótulo que o nomeie ("Carga total levantada"). Duração, séries e exercícios
 * o usuário nomeia sozinho ao ver o valor; tonelagem, não — solta num chip ela
 * é lida como "o peso que vou levantar neste exercício", que é falso e
 * assustador. Onde não couber rótulo, o número não entra. Para o total do dia
 * em card, prefira `formatTonnage`.
 */
export function formatWorkoutVolume(kg: number | null | undefined): string {
  const value = usable(kg);
  return value === null ? ABSENT : decimals(value, 0);
}

/**
 * Tonelagem — a carga somada de um treino ou período, com a unidade embutida.
 *
 * Até uma tonelada sai em quilos ("840 kg"); acima disso, em toneladas
 * ("17,5 t"). A forma compacta anterior ("15,7 mil kg") foi removida por ser
 * ilegível no sentido literal: ninguém levanta "quinze mil quilos", e quem lia
 * isso num chip ao lado de "5 exercícios · 55 min" entendia que **aquele** era
 * o peso do exercício. "17,5 t" pelo menos nomeia uma grandeza que a pessoa
 * reconhece, e a ordem de grandeza deixa claro que é uma soma, não uma barra.
 *
 * Continua sendo um número que **só funciona com rótulo**: ver a regra em
 * `formatWorkoutVolume`.
 */
export function formatTonnage(kg: number | null | undefined): string {
  const value = usable(kg);
  if (value === null) return ABSENT;
  if (Math.abs(value) < 1000) return decimals(value, 0) + ' kg';
  return decimals(value / 1000, 1) + ' t';
}

// ---------------------------------------------------------------------------
// Percentuais
// ---------------------------------------------------------------------------

/**
 * Proporção 0..1 em percentual. Inteiro por padrão.
 *
 * A casa decimal entra só quando o inteiro mentiria: 0,4% arredondado some
 * ("0%", que o usuário lê como "nada"), e 99,7% arredondado vira "100%", que o
 * usuário lê como "terminei". Fora desses extremos, a casa decimal em uma
 * aderência ou numa fatia de macro não muda nenhuma decisão.
 */
export function formatPercentage(ratio: number | null | undefined): string {
  const value = usable(ratio);
  if (value === null) return ABSENT;
  const percent = value * 100;
  const rounded = Math.round(percent);
  const collapses = rounded === 0 && percent !== 0;
  const saturates = rounded === 100 && percent !== 100 && percent < 100;
  return decimals(percent, collapses || saturates ? 1 : 0) + '%';
}

/**
 * Variação já expressa em pontos percentuais, com sinal explícito.
 *
 * O sinal é obrigatório: sem ele "12%" pode ser queda ou alta, e a cor sozinha
 * não pode carregar essa distinção (WCAG 1.4.1).
 */
export function formatPercentageChange(points: number | null | undefined): string {
  const value = usable(points);
  if (value === null) return ABSENT;
  const rounded = Math.round(value);
  return (rounded > 0 ? '+' : rounded < 0 ? '−' : '') + decimals(Math.abs(value), 0) + '%';
}

// ---------------------------------------------------------------------------
// Energia, macros e hidratação
// ---------------------------------------------------------------------------

/** Calorias. Sempre inteiro, com separador de milhar: "2.000". */
export function formatCalories(kcal: number | null | undefined): string {
  const value = usable(kcal);
  return value === null ? ABSENT : decimals(value, 0);
}

/** Calorias com sinal — usado no ajuste de meta, onde o sentido é o dado. */
export function formatCalorieAdjustment(kcal: number | null | undefined): string {
  const value = usable(kcal);
  if (value === null) return ABSENT;
  const rounded = Math.round(value);
  return (rounded > 0 ? '+' : rounded < 0 ? '−' : '') + decimals(Math.abs(value), 0);
}

/**
 * Macronutriente em gramas. Inteiro acima de 10 g; uma casa abaixo disso, onde
 * a fração ainda é diferença relevante na dose.
 */
export function formatMacroGrams(grams: number | null | undefined): string {
  const value = usable(grams);
  if (value === null) return ABSENT;
  return decimals(value, Math.abs(value) < 10 ? 1 : 0);
}

/**
 * Hidratação. Mililitros até 1 L, litros acima disso.
 *
 * O corte existe porque as duas unidades servem a leituras diferentes: o copo
 * que acabou de ser registrado é "250 ml", o total do dia é "2,5 L". Ler
 * "2.500 ml" como total obriga o usuário a dividir de cabeça.
 */
export function formatHydration(milliliters: number | null | undefined): string {
  const value = usable(milliliters);
  if (value === null) return ABSENT;
  if (Math.abs(value) < 1000) return decimals(value, 0) + ' ml';
  return decimals(value / 1000, 2) + ' L';
}

// ---------------------------------------------------------------------------
// Contagens e esforço
// ---------------------------------------------------------------------------

/** Repetições, séries, sessões, dias — qualquer contagem. Sempre inteiro. */
export function formatCount(value: number | null | undefined): string {
  const usableValue = usable(value);
  return usableValue === null ? ABSENT : decimals(usableValue, 0);
}

/**
 * RIR e RPE. Inteiro quando o valor é inteiro, uma casa quando não é.
 *
 * O RPE aceita meio ponto no domínio (7,5 é uma leitura legítima); o RIR é
 * inteiro por contrato. Uma função serve os dois porque a regra é a mesma:
 * nunca inventar casa decimal, nunca esconder a que existe.
 */
export function formatEffort(value: number | null | undefined): string {
  const usableValue = usable(value);
  return usableValue === null ? ABSENT : decimals(usableValue, 1);
}

/** Razão adimensional (ACWR, por exemplo). Duas casas — a faixa útil é estreita. */
export function formatRatio(value: number | null | undefined): string {
  const usableValue = usable(value);
  return usableValue === null ? ABSENT : decimals(usableValue, 2);
}

/** Preço em reais. Duas casas só quando há centavos: "R$ 249" e "R$ 249,90". */
export function formatCurrency(brl: number | null | undefined): string {
  const value = usable(brl);
  if (value === null) return ABSENT;
  return value.toLocaleString(LOCALE, {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

// ---------------------------------------------------------------------------
// Duração
// ---------------------------------------------------------------------------

/**
 * Duração humana a partir de segundos: "45 s", "52 min", "1 h 08 min", "2 h".
 *
 * Os minutos vão com zero à esquerda depois da hora ("1 h 08 min") porque sem
 * ele "1 h 8 min" é lido como "1 hora e oito" com um tropeço — a forma com
 * padding é a que o usuário já conhece de relógio.
 */
export function formatDuration(seconds: number | null | undefined): string {
  const value = usable(seconds);
  if (value === null) return ABSENT;
  const total = Math.max(0, Math.round(value));
  if (total < 60) return total + ' s';
  const minutes = Math.round(total / 60);
  if (minutes < 60) return minutes + ' min';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? hours + ' h' : hours + ' h ' + String(rest).padStart(2, '0') + ' min';
}

/** Mesma apresentação, quando a origem já está em minutos. */
export function formatDurationMinutes(minutes: number | null | undefined): string {
  const value = usable(minutes);
  return value === null ? ABSENT : formatDuration(Math.round(value) * 60);
}

// ---------------------------------------------------------------------------
// Datas
// ---------------------------------------------------------------------------

function asDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Nome abreviado do dia da semana por índice 0..6, com **segunda** em 0.
 *
 * A base é a da ficha de treino ("slot 0 = segunda"), não a do `Date` (domingo
 * em 0). Converter no chamador era exatamente o ponto onde a grade da semana
 * saía deslocada em um dia.
 */
export function formatWeekdayName(slot: number): string {
  if (!Number.isInteger(slot) || slot < 0 || slot > 6) return ABSENT;
  return WEEKDAYS_SHORT[(slot + 1) % 7]!.toUpperCase();
}

/** Data completa no padrão brasileiro: "11/09/2026". */
export function formatDate(value: Date | string | null | undefined): string {
  const date = asDate(value);
  if (!date) return ABSENT;
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
}

/** Dia e mês por extenso abreviado: "11 set". Para eixo e rótulo de gráfico. */
export function formatShortDate(value: Date | string | null | undefined): string {
  const date = asDate(value);
  return date ? date.getDate() + ' ' + MONTHS_SHORT[date.getMonth()] : ABSENT;
}

/** Dia da semana + dia e mês: "qui, 11 set". Para linha de histórico. */
export function formatWeekdayDate(value: Date | string | null | undefined): string {
  const date = asDate(value);
  return date ? WEEKDAYS_SHORT[date.getDay()] + ', ' + formatShortDate(date) : ABSENT;
}

/** Dia da semana abreviado e em caixa alta a partir de uma data: "SEX". */
export function formatWeekdayAbbrev(value: Date | string | null | undefined): string {
  const date = asDate(value);
  return date ? WEEKDAYS_SHORT[date.getDay()]!.toUpperCase() : ABSENT;
}

/**
 * Data por extenso: "sexta-feira, 11 de setembro".
 *
 * Sem o ano de propósito — quem lê isso está olhando o dia de hoje ou de ontem,
 * e o ano só ocuparia a linha.
 */
export function formatFullDate(value: Date | string | null | undefined): string {
  const date = asDate(value);
  if (!date) return ABSENT;
  return (
    WEEKDAYS_LONG[date.getDay()] + ', ' + date.getDate() + ' de ' + MONTHS_LONG[date.getMonth()]
  );
}

/** Dia e mês numéricos: "11/09". Para eixo com pouco espaço. */
export function formatDayMonth(value: Date | string | null | undefined): string {
  const date = asDate(value);
  if (!date) return ABSENT;
  return (
    String(date.getDate()).padStart(2, '0') + '/' + String(date.getMonth() + 1).padStart(2, '0')
  );
}

/**
 * Período entre duas datas: "5 — 11 set", "28 ago — 3 set".
 *
 * O mês aparece uma vez quando as duas pontas caem no mesmo mês. Repetir
 * "5 set — 11 set" gasta a largura do card sem acrescentar informação, e é
 * justamente a largura que falta nos rótulos de gráfico.
 */
export function formatDateRange(
  from: Date | string | null | undefined,
  to: Date | string | null | undefined,
): string {
  const start = asDate(from);
  const end = asDate(to);
  if (!start || !end) return ABSENT;
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  return (
    (sameMonth ? String(start.getDate()) : formatShortDate(start)) + ' — ' + formatShortDate(end)
  );
}
