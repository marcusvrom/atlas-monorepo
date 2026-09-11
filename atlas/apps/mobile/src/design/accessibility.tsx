import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { useDemoSettings } from '../dev/demo-settings';
const defaults = { highContrast: false, reduceMotion: false, reduceTransparency: false };
const Preferences = createContext(defaults);
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [values, update] = useReducer(
    (state: typeof defaults, patch: Partial<typeof defaults>) => ({ ...state, ...patch }),
    defaults,
  );
  const demo = useDemoSettings();
  useEffect(() => {
    let active = true;
    void Promise.all([
      Platform.OS === 'ios'
        ? AccessibilityInfo.isDarkerSystemColorsEnabled()
        : (AccessibilityInfo.isHighTextContrastEnabled?.() ?? Promise.resolve(false)),
      AccessibilityInfo.isReduceMotionEnabled(),
      AccessibilityInfo.isReduceTransparencyEnabled?.() ?? Promise.resolve(false),
    ]).then(([highContrast, reduceMotion, reduceTransparency]) => {
      if (active) update({ highContrast, reduceMotion, reduceTransparency });
    });
    const contrast = AccessibilityInfo.addEventListener(
      Platform.OS === 'ios' ? 'darkerSystemColorsChanged' : 'highTextContrastChanged',
      (highContrast) => update({ highContrast }),
    );
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', (reduceMotion) =>
      update({ reduceMotion }),
    );
    const transparency = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      (reduceTransparency) => update({ reduceTransparency }),
    );
    return () => {
      active = false;
      contrast.remove();
      motion.remove();
      transparency.remove();
    };
  }, []);
  return (
    <Preferences.Provider
      value={{
        highContrast: values.highContrast || (__DEV__ && demo.highContrast),
        reduceMotion: values.reduceMotion || (__DEV__ && demo.reduceMotion),
        reduceTransparency: values.reduceTransparency || (__DEV__ && demo.reduceTransparency),
      }}
    >
      {children}
    </Preferences.Provider>
  );
}
export function useAccessibilityPreferences() {
  return useContext(Preferences);
}
