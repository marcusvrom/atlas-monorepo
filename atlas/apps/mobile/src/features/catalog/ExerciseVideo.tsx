import { useMemo } from 'react';
import type { ExerciseMedia } from '@atlas/contracts';
import { StyleSheet, View } from 'react-native';
import { spacing, radius } from '@atlas/design-tokens';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../../design/theme-provider';
import { Text } from '../../design/components';
import { t } from '../../i18n';
export function ExerciseVideo({ media }: { media: ExerciseMedia | undefined }) {
  const { colors } = useTheme();
  // Os assets desta fase são placeholders. A URL de demo nunca é buscada.
  const source = media && !media.url.includes('.example/') ? media.url : null;
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
    if (source) instance.play();
  });
  const styles = useMemo(
    () =>
      StyleSheet.create({
        frame: {
          minHeight: spacing.huge * 3,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          padding: spacing.lg,
          justifyContent: 'center',
          alignItems: 'center',
        },
        video: { height: spacing.huge * 3, width: '100%' },
      }),
    [colors],
  );
  return source ? (
    <VideoView player={player} style={styles.video} nativeControls={false} />
  ) : (
    <View style={styles.frame}>
      <Text weight="semibold">{t('catalogVideo')}</Text>
      <Text tone="secondary">
        {media?.url.split('/').slice(-2).join('/') ?? t('catalogEmptyTitle')}
      </Text>
    </View>
  );
}
