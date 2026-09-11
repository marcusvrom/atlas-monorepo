import { describe, expect, it } from 'vitest';
import messages from './pt-BR.json';
import { plural } from './index';

/**
 * A regra que estas asserções travam é `n === 1`, não `n > 1`. Em pt-BR zero é
 * plural ("0 séries registradas"), e foi por assumir o contrário em linha que a
 * tela de sessão imprimia "1 séries registradas" na primeira série de todo
 * treino.
 */
describe('plural', () => {
  it('usa o singular apenas em 1', () => {
    expect(plural(1, 'sessionSetDone', 'sessionSetsDone')).toBe('série registrada');
    expect(plural(2, 'sessionSetDone', 'sessionSetsDone')).toBe('séries registradas');
  });

  it('trata zero como plural', () => {
    expect(plural(0, 'sessionSetDone', 'sessionSetsDone')).toBe('séries registradas');
  });

  it('cada par singular/plural em uso existe e é distinto', () => {
    const pairs: [keyof typeof messages, keyof typeof messages][] = [
      ['sessionSetDone', 'sessionSetsDone'],
      ['sessionPendingOne', 'sessionPending'],
      ['sessionRejectedOne', 'sessionRejected'],
      ['activitySessionCountOne', 'activitySessionCount'],
      ['planSetsOne', 'planSets'],
      ['planExercisesOne', 'planExercises'],
      ['dashboardEffectiveSetsOne', 'dashboardEffectiveSets'],
      ['completedSessionsOne', 'completedSessions'],
    ];
    for (const [one, many] of pairs) {
      expect(messages[one], one).toBeTruthy();
      expect(messages[many], many).toBeTruthy();
      expect(messages[one], one).not.toBe(messages[many]);
    }
  });
});
