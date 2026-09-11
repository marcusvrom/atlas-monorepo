import { useMemo } from 'react';
import type { ExerciseFilter, ExerciseSummary } from '@atlas/contracts';
import { assessExercise, type ExerciseFit, type FitPreferences } from '@atlas/domain';
import { useMe } from '../../data/queries/identity';

/**
 * Traduz o perfil do usuário em filtro de catálogo.
 *
 * Vive num hook próprio porque três telas precisam da mesma resposta — o
 * catálogo, o seletor de exercício da ficha e o detalhe — e porque a regra de
 * quando **não** personalizar é tão importante quanto a de personalizar:
 *
 * - Sem preferências declaradas (`null`), não há filtro. O app não inventa um
 *   perfil que o usuário não deu.
 * - Com preferências e o interruptor desligado, também não há filtro: o
 *   usuário pediu para ver tudo, e "ver tudo" precisa mesmo mostrar tudo.
 * - O nível **nunca** filtra a listagem. Exercício acima do nível vira alerta
 *   na linha, não desaparecimento: esconder o agachamento de quem é iniciante
 *   é o mesmo que dizer que ele nunca vai agachar.
 */
export function usePersonalizedFilter(enabled: boolean): {
  /** Campos a mesclar no `ExerciseFilter` da consulta. */
  filter: Pick<ExerciseFilter, 'protectedRegions' | 'availableEquipment'>;
  /** Preferências completas, para avaliar cada item já carregado. */
  preferences: FitPreferences | null;
  /** `true` quando há perfil a aplicar — é o que decide mostrar o interruptor. */
  available: boolean;
} {
  const me = useMe();
  const declared = me.data?.trainingPreferences ?? null;

  return useMemo(() => {
    if (!declared) return { filter: {}, preferences: null, available: false };
    const preferences: FitPreferences = {
      experienceLevel: declared.experienceLevel,
      protectedRegions: declared.protectedRegions,
      availableEquipment: declared.availableEquipment,
    };
    if (!enabled) return { filter: {}, preferences, available: true };
    return {
      filter: {
        protectedRegions: declared.protectedRegions.length ? declared.protectedRegions : undefined,
        availableEquipment: declared.availableEquipment ?? undefined,
      },
      preferences,
      available: true,
    };
  }, [declared, enabled]);
}

/** Veredito de um exercício já carregado, para o selo da linha. */
export function useFit(exercise: ExerciseSummary, preferences: FitPreferences | null): ExerciseFit {
  return useMemo(() => assessExercise(exercise, preferences), [exercise, preferences]);
}
