import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_MULTIPLIER,
  ageFromBirthDate,
  adjustedBodyWeight,
  basalMetabolicRate,
  dailyWaterMl,
  exerciseCalories,
  macroTargets,
  metabolicSummary,
  minutesToTime,
  totalEnergyExpenditure,
  waterSchedule,
} from './metabolism.js';

const adult = { weightKg: 80, heightCm: 180, ageYears: 30 } as const;

describe('taxa metabólica basal', () => {
  it('aplica Mifflin-St Jeor para homem e mulher', () => {
    // 10×80 + 6.25×180 − 5×30 + 5 = 1780
    expect(basalMetabolicRate({ ...adult, sex: 'male' })).toBe(1780);
    // mesma base − 161 = 1614
    expect(basalMetabolicRate({ ...adult, sex: 'female' })).toBe(1614);
  });

  it('coloca "não informado" entre as duas, sem excluir do cálculo', () => {
    const male = basalMetabolicRate({ ...adult, sex: 'male' });
    const female = basalMetabolicRate({ ...adult, sex: 'female' });
    const unspecified = basalMetabolicRate({ ...adult, sex: 'unspecified' });
    expect(unspecified).toBeGreaterThan(female);
    expect(unspecified).toBeLessThan(male);
    expect(unspecified).toBe((male + female) / 2);
  });

  it('não devolve valor negativo com entrada inválida', () => {
    expect(basalMetabolicRate({ weightKg: 0, heightCm: 0, ageYears: 0, sex: 'male' })).toBe(0);
    expect(basalMetabolicRate({ ...adult, ageYears: -5, sex: 'male' })).toBe(0);
  });
});

describe('gasto energético', () => {
  it('multiplica a basal pelo nível de atividade', () => {
    expect(totalEnergyExpenditure(1780, 'moderate')).toBe(round2(1780 * 1.55));
    expect(ACTIVITY_MULTIPLIER.sedentary).toBeLessThan(ACTIVITY_MULTIPLIER.athlete);
  });

  it('calcula o gasto da sessão pelo MET', () => {
    // 8 MET × 80 kg × 0,5 h
    expect(exerciseCalories(8, 80, 30)).toBe(320);
    expect(exerciseCalories(0, 80, 30)).toBe(0);
    expect(exerciseCalories(8, 80, 0)).toBe(0);
  });

  it('NÃO soma as calorias do treino ao gasto de manutenção', () => {
    // O PAL já embute o treino habitual; somar a sessão contaria duas vezes.
    const summary = metabolicSummary({
      ...adult,
      sex: 'male',
      activity: 'moderate',
      goal: 'generalHealth',
    });
    expect(summary.targetKcal).toBe(summary.maintenanceKcal);
  });
});

describe('peso-base para proteína', () => {
  it('usa o peso atual dentro da faixa saudável de IMC', () => {
    expect(adjustedBodyWeight(80, 180)).toBe(80);
  });

  it('aplica o peso corporal ajustado acima de IMC 25', () => {
    // PI = 25 × 1,8² = 81; PCA = 81 + 0,25 × (110 − 81) = 88,25
    expect(adjustedBodyWeight(110, 180)).toBe(88.25);
  });

  it('nunca infla a proteína pelo peso bruto de quem está acima do IMC 25', () => {
    expect(adjustedBodyWeight(110, 180)).toBeLessThan(110);
  });

  it('respeita o peso-alvo informado acima de qualquer regra', () => {
    expect(adjustedBodyWeight(110, 180, 85)).toBe(85);
  });
});

describe('macros', () => {
  it('usa proteína base e sobe ao teto com estímulo alto de hipertrofia', () => {
    const base = macroTargets({ energyKcal: 2500, weightKg: 80, heightCm: 180 });
    const high = macroTargets({
      energyKcal: 2500,
      weightKg: 80,
      heightCm: 180,
      hypertrophyStimulus: 9,
    });
    expect(base.proteinG).toBe(128); // 80 × 1,6
    expect(high.proteinG).toBe(160); // 80 × 2,0
  });

  it('fecha a conta calórica no caminho padrão', () => {
    const macros = macroTargets({ energyKcal: 2500, weightKg: 80, heightCm: 180 });
    expect(macros.energyFromMacrosKcal).toBeCloseTo(2500, 0);
  });

  it('preserva a proteína quando o alvo é baixo demais, em vez de cortá-la', () => {
    const macros = macroTargets({ energyKcal: 600, weightKg: 110, heightCm: 180 });
    expect(macros.carbsG).toBe(0);
    expect(macros.proteinG).toBeGreaterThan(0);
    // O desencontro é exposto, não escondido: a tela precisa poder mostrá-lo.
    expect(macros.energyFromMacrosKcal).toBeGreaterThan(600);
  });

  it('limita o carboidrato quando há teto, sem furar o piso de gordura', () => {
    const macros = macroTargets({
      energyKcal: 2000,
      weightKg: 80,
      heightCm: 180,
      carbCeilingShare: 0.4,
    });
    expect(macros.carbsG * 4).toBeLessThanOrEqual(2000 * 0.4 + 1);
    expect(macros.fatG).toBeGreaterThanOrEqual(80 * 0.8 - 1);
  });

  it('não produz macro negativo em nenhuma combinação', () => {
    for (const energy of [0, 500, 1200, 2000, 4000]) {
      for (const weight of [45, 80, 140]) {
        const macros = macroTargets({ energyKcal: energy, weightKg: weight, heightCm: 170 });
        expect(macros.proteinG).toBeGreaterThanOrEqual(0);
        expect(macros.carbsG).toBeGreaterThanOrEqual(0);
        expect(macros.fatG).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('resumo metabólico', () => {
  it('aplica o ajuste do objetivo sobre a manutenção', () => {
    const cut = metabolicSummary({
      ...adult,
      sex: 'male',
      activity: 'moderate',
      goal: 'fatLoss',
    });
    const bulk = metabolicSummary({
      ...adult,
      sex: 'male',
      activity: 'moderate',
      goal: 'hypertrophy',
    });
    expect(cut.targetKcal).toBe(round2(cut.maintenanceKcal - 500));
    expect(bulk.targetKcal).toBe(round2(bulk.maintenanceKcal + 400));
  });

  it('não manipula energia em reabilitação', () => {
    const rehab = metabolicSummary({
      ...adult,
      sex: 'male',
      activity: 'light',
      goal: 'rehabilitation',
    });
    expect(rehab.goalAdjustmentKcal).toBe(0);
  });

  it('nunca devolve alvo negativo', () => {
    const tiny = metabolicSummary({
      weightKg: 40,
      heightCm: 150,
      ageYears: 80,
      sex: 'female',
      activity: 'sedentary',
      goal: 'fatLoss',
    });
    expect(tiny.targetKcal).toBeGreaterThanOrEqual(0);
  });
});

describe('hidratação', () => {
  it('usa 35 ml por kg', () => {
    expect(dailyWaterMl(80)).toBe(2800);
    expect(dailyWaterMl(0)).toBe(0);
  });

  it('distribui a meta inteira, sem perder mililitro na divisão', () => {
    const schedule = waterSchedule(2800, '07:00', '23:00');
    expect(schedule.length).toBeGreaterThan(1);
    expect(schedule.reduce((sum, item) => sum + item.volumeMl, 0)).toBe(2800);
  });

  it('começa depois de acordar e termina antes de dormir', () => {
    const schedule = waterSchedule(2800, '07:00', '23:00');
    expect(schedule[0]!.time).toBe('07:15');
    expect(schedule.at(-1)!.time <= '22:00').toBe(true);
  });

  it('trata janela que cruza a meia-noite em vez de descartá-la', () => {
    const schedule = waterSchedule(2000, '10:00', '02:00');
    expect(schedule.length).toBeGreaterThan(1);
    expect(schedule.reduce((sum, item) => sum + item.volumeMl, 0)).toBe(2000);
  });

  it('devolve lista vazia sem meta', () => {
    expect(waterSchedule(0, '07:00', '23:00')).toEqual([]);
  });
});

describe('utilitários', () => {
  it('calcula idade sem contar aniversário que ainda não chegou', () => {
    expect(ageFromBirthDate('1990-09-12', '2026-09-11T00:00:00.000Z')).toBe(35);
    expect(ageFromBirthDate('1990-09-11', '2026-09-11T00:00:00.000Z')).toBe(36);
  });

  it('normaliza horário fora da faixa em vez de estourar', () => {
    expect(minutesToTime(1500)).toBe('01:00');
    expect(minutesToTime(-60)).toBe('23:00');
  });

  it('não quebra com data inválida', () => {
    expect(ageFromBirthDate('não é data', '2026-09-11T00:00:00.000Z')).toBe(0);
  });
});

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
