import { Redirect } from 'expo-router';
import { DevScreen } from '../src/dev/DevScreen';
export default function DevRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DevScreen />;
}
