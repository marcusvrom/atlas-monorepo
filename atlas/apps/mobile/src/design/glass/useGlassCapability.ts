import { useAccessibilityPreferences } from '../accessibility';
import { useEffect, useState } from 'react';
import { useDemoSettings } from '../../dev/demo-settings';
import { AccessibilityInfo, Platform } from 'react-native';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

import { resolveCapability, type GlassCapability } from './resolve-capability';
export type { GlassCapability } from './resolve-capability';

/**
 * Resolve, em um único lugar, as três condições independentes que decidem se o
 * vidro pode ser usado. Espalhar essas checagens garante que alguma tela vai
 * esquecer uma delas. Ver ADR-0015.
 *
 *  1. Plataforma e versão de OS (iOS 26+)
 *  2. Disponibilidade real da API (algumas builds de iOS 26 não a expõem)
 *  3. Preferência de acessibilidade do usuário
 */
export function useGlassCapability(forceCapability?: GlassCapability): GlassCapability {
  const settings = useDemoSettings();
  const preferences = useAccessibilityPreferences();
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    let mounted = true;
    (AccessibilityInfo.isReduceTransparencyEnabled?.() ?? Promise.resolve(false)).then(
      (enabled) => {
        if (mounted) setReduceTransparency(enabled);
      },
    );

    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const requested = forceCapability ?? (__DEV__ ? settings.capability : 'native');
  const available =
    Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  return resolveCapability(
    requested,
    reduceTransparency || preferences.reduceTransparency,
    available,
  );
}
