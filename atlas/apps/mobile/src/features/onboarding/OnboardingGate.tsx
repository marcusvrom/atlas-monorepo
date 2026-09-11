import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useOnboarding } from './hooks';
export function OnboardingGate() {
  const draft = useOnboarding();
  const router = useRouter();
  const segments = useSegments();
  useEffect(() => {
    if (draft.isPending || draft.isError || segments[0] === '(auth)' || segments[0] === 'dev')
      return;
    if (!draft.data) router.replace('/(auth)/welcome');
    else if (draft.data.step !== 'complete') router.replace('/(auth)/onboarding');
  }, [draft.data, draft.isPending, draft.isError, router, segments]);
  return null;
}
