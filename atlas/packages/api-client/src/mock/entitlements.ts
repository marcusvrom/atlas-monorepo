import { Entitlement, Feature } from '@atlas/contracts';
import type { MockStore } from './store.js';
export function mockEntitlements(store: MockStore): Entitlement[] {
  const plan = store.config.plan ?? store.me.planKey;
  return Feature.options.map((feature) => {
    const previous = store.me.entitlements.find((item) => item.feature === feature);
    const used =
      feature === 'activeWorkoutPlans'
        ? store.plans.filter((item) => item.status !== 'archived').length
        : feature === 'customExercises'
          ? store.exercises.filter((item) => item.isCustom).length
          : (previous?.used ?? 0);
    const limit =
      plan === 'free'
        ? feature === 'activeWorkoutPlans'
          ? 2
          : feature === 'customExercises'
            ? 5
            : 0
        : null;
    return Entitlement.parse({ feature, used, limit });
  });
}
