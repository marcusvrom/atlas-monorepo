import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { t } from '../i18n';
export async function notifyAfterRest(seconds: number) {
  if (seconds <= 0) return;
  try {
    if (Platform.OS === 'android')
      await Notifications.setNotificationChannelAsync('rest', {
        name: t('restTitle'),
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    const current = await Notifications.getPermissionsAsync();
    const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
    if (!permission.granted) return;
    await Notifications.cancelScheduledNotificationAsync('atlas-rest');
    await Notifications.scheduleNotificationAsync({
      identifier: 'atlas-rest',
      content: { title: t('restDone'), body: t('restReady'), sound: 'default' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        channelId: 'rest',
      },
    });
  } catch {
    /* ATL-UI-003: falha de permissão não interrompe o treino; o timer visual continua. */
  }
}
