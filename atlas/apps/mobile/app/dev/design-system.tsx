import { Redirect } from 'expo-router';
import { DesignSystemScreen } from '../../src/dev/DesignSystemScreen';
export default function DesignSystemRoute() {
  return __DEV__ ? <DesignSystemScreen /> : <Redirect href="/" />;
}
