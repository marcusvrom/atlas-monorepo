import { useEffect, useRef } from 'react';
import type { Feature } from '@atlas/contracts';
import { useMe } from './identity';
import { recordPaywallEvent } from '../paywall-events';
export function usePaywallEvent(feature: Feature) {
  const me = useMe();
  const recorded = useRef(false);
  useEffect(() => {
    if (me.data && !recorded.current) {
      recordPaywallEvent({ feature, plan: me.data.planKey });
      recorded.current = true;
    }
  }, [feature, me.data]);
  return me;
}
