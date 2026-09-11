import { useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { localDayKey } from '../features/progress/dashboard-math';
/** ATL-UI-012 — refresh when a screen returns or the calendar day changes. */
export function useCurrentDay() {
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(
    useCallback(() => {
      const refresh = () =>
        setNow((previous) => {
          const current = new Date();
          return localDayKey(previous) === localDayKey(current) ? previous : current;
        });
      refresh();
      const timer = setInterval(refresh, 30_000);
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') refresh();
      });
      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, []),
  );
  return now;
}
