import { describe, expect, it } from 'vitest';
import {
  ABSENT,
  formatBodyFat,
  formatBodyMeasurement,
  formatCalorieAdjustment,
  formatCalories,
  formatCompactNumber,
  formatCount,
  formatCurrency,
  formatDate,
  formatDateRange,
  formatDayMonth,
  formatFullDate,
  formatDuration,
  formatDurationMinutes,
  formatEffort,
  formatHeight,
  formatHydration,
  formatMacroGrams,
  formatPercentage,
  formatPercentageChange,
  formatRatio,
  formatShortDate,
  formatWeekdayAbbrev,
  formatWeekdayDate,
  formatWeekdayName,
  formatWeight,
  formatWorkoutVolume,
  formatWorkoutVolumeCompact,
} from './format';

const ABSENCES = [null, undefined, NaN, Infinity, -Infinity] as const;

describe('carga e peso', () => {
  it.each([
    [80, '80'],
    [80.5, '80,5'],
    [80.0, '80'],
    [112.349, '112,3'],
    [112.35, '112,4'],
    [15660.3, '15.660,3'],
    [0, '0'],
    [-0.04, '0'],
    [-1.25, '-1,3'],
  ])('formata carga %s como %s', (value, expected) => expect(formatWeight(value)).toBe(expected));

  it.each(ABSENCES)('marca ausência em vez de zero para %s', (value) =>
    expect(formatWeight(value)).toBe(ABSENT),
  );

  it('não altera a precisão do dado original', () => {
    const measurement = { weightKg: 81.37 };
    expect(formatWeight(measurement.weightKg)).toBe('81,4');
    expect(measurement.weightKg).toBe(81.37);
  });

  it('mantém peso corporal e altura em no máximo uma casa', () => {
    expect(formatBodyMeasurement(72.5)).toBe('72,5');
    expect(formatBodyMeasurement(72.50000001)).toBe('72,5');
    expect(formatHeight(178)).toBe('178');
    expect(formatHeight(178.5)).toBe('178,5');
    expect(formatBodyFat(18.0)).toBe('18%');
    expect(formatBodyFat(18.46)).toBe('18,5%');
  });
});

describe('volume de treino', () => {
  it('apresenta volume sempre inteiro, com separador de milhar', () => {
    expect(formatWorkoutVolume(15660.3)).toBe('15.660');
    expect(formatWorkoutVolume(72.5)).toBe('73');
    expect(formatWorkoutVolume(0)).toBe('0');
  });

  it('compacta sem perder a ordem de grandeza', () => {
    expect(formatCompactNumber(840)).toBe('840');
    expect(formatCompactNumber(1000)).toBe('1 mil');
    expect(formatWorkoutVolumeCompact(15660.3)).toBe('15,7 mil');
    expect(formatCompactNumber(1_240_000)).toBe('1,2 mi');
    expect(formatCompactNumber(-2500)).toBe('-2,5 mil');
  });
});

describe('percentuais', () => {
  it('usa inteiro por padrão', () => {
    expect(formatPercentage(0.75)).toBe('75%');
    expect(formatPercentage(0.7545)).toBe('75%');
    expect(formatPercentage(1)).toBe('100%');
    expect(formatPercentage(0)).toBe('0%');
  });

  it('abre uma casa apenas quando o inteiro mentiria', () => {
    expect(formatPercentage(0.004)).toBe('0,4%');
    expect(formatPercentage(0.997)).toBe('99,7%');
  });

  it('sempre carrega o sinal da variação', () => {
    expect(formatPercentageChange(12.4)).toBe('+12%');
    expect(formatPercentageChange(-8)).toBe('−8%');
    expect(formatPercentageChange(0)).toBe('0%');
    expect(formatPercentageChange(null)).toBe(ABSENT);
  });
});

describe('energia, macros e hidratação', () => {
  it('apresenta calorias inteiras com milhar', () => {
    expect(formatCalories(2000)).toBe('2.000');
    expect(formatCalories(1847.6)).toBe('1.848');
  });

  it('marca o sentido do ajuste de meta', () => {
    expect(formatCalorieAdjustment(350)).toBe('+350');
    expect(formatCalorieAdjustment(-500)).toBe('−500');
  });

  it('abre casa decimal só em macro de dose pequena', () => {
    expect(formatMacroGrams(182.4)).toBe('182');
    expect(formatMacroGrams(8.35)).toBe('8,4');
  });

  it('troca de unidade no litro', () => {
    expect(formatHydration(250)).toBe('250 ml');
    expect(formatHydration(999)).toBe('999 ml');
    expect(formatHydration(2500)).toBe('2,5 L');
    expect(formatHydration(1999.999)).toBe('2 L');
    expect(formatHydration(3250)).toBe('3,25 L');
  });
});

describe('preço', () => {
  it('esconde centavos quando não existem', () => {
    expect(formatCurrency(249)).toBe('R$\u00a0249');
    expect(formatCurrency(249.9)).toBe('R$\u00a0249,90');
    expect(formatCurrency(null)).toBe(ABSENT);
  });
});

describe('contagens e esforço', () => {
  it('mantém contagens inteiras', () => {
    expect(formatCount(12)).toBe('12');
    expect(formatCount(1200)).toBe('1.200');
  });

  it('preserva meio ponto de RPE sem inventar casa no RIR', () => {
    expect(formatEffort(8)).toBe('8');
    expect(formatEffort(7.5)).toBe('7,5');
    expect(formatEffort(2)).toBe('2');
  });

  it('mantém duas casas na razão de carga', () => {
    expect(formatRatio(1.3333333)).toBe('1,33');
    expect(formatRatio(1)).toBe('1');
  });
});

describe('duração', () => {
  it.each([
    [45, '45 s'],
    [60, '1 min'],
    [52 * 60, '52 min'],
    [68 * 60, '1 h 08 min'],
    [120 * 60, '2 h'],
    [95 * 60 + 30, '1 h 36 min'],
    [0, '0 s'],
  ])('formata %s segundos como %s', (value, expected) =>
    expect(formatDuration(value)).toBe(expected),
  );

  it('aceita origem já em minutos', () => {
    expect(formatDurationMinutes(68)).toBe('1 h 08 min');
    expect(formatDurationMinutes(0)).toBe('0 s');
    expect(formatDurationMinutes(null)).toBe(ABSENT);
  });
});

describe('datas', () => {
  const day = new Date(2026, 8, 11);

  it('usa o padrão brasileiro', () => {
    expect(formatDate(day)).toBe('11/09/2026');
    expect(formatDayMonth(day)).toBe('11/09');
  });

  it('escreve a data por extenso sem o ano', () => {
    expect(formatFullDate(day)).toBe('sexta-feira, 11 de setembro');
    expect(formatFullDate(new Date(2026, 2, 1))).toBe('domingo, 1 de março');
  });

  it('usa a base da ficha — segunda em zero — no nome do dia da semana', () => {
    expect(formatWeekdayName(0)).toBe('SEG');
    expect(formatWeekdayName(6)).toBe('DOM');
    expect(formatWeekdayName(7)).toBe(ABSENT);
    expect(formatWeekdayName(-1)).toBe(ABSENT);
    expect(formatWeekdayAbbrev(day)).toBe('SEX');
  });

  it('abrevia mês e dia da semana em pt-BR', () => {
    expect(formatShortDate(day)).toBe('11 set');
    expect(formatWeekdayDate(day)).toBe('sex, 11 set');
    expect(formatShortDate(new Date(2026, 5, 3))).toBe('3 jun');
  });

  it('não repete o mês quando o período cabe nele', () => {
    expect(formatDateRange(new Date(2026, 8, 5), day)).toBe('5 — 11 set');
    expect(formatDateRange(new Date(2026, 7, 28), new Date(2026, 8, 3))).toBe('28 ago — 3 set');
  });

  it('não quebra com data inválida ou ausente', () => {
    expect(formatDate('não é data')).toBe(ABSENT);
    expect(formatShortDate(null)).toBe(ABSENT);
    expect(formatDateRange(day, undefined)).toBe(ABSENT);
  });
});
