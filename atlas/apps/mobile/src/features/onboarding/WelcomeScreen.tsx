import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { glass, layout, radius, spacing } from '@atlas/design-tokens';
import { Button, Screen, Text } from '../../design/components';
import { CoverImage, type CoverGlyph } from '../../design/media';
import { useTheme } from '../../design/theme-provider';
import { t } from '../../i18n';
import trainImage from '../../../assets/marketing/onboarding-train.webp';
import progressImage from '../../../assets/marketing/onboarding-progress.webp';
import coachImage from '../../../assets/marketing/onboarding-coach.webp';

/**
 * Boas-vindas.
 *
 * Reconstruída no formato das telas de entrada das referências: capa sangrando
 * do topo até pouco além da metade, texto e ação assentados embaixo. O anel de
 * progresso que marcava a página saiu — ele media uma tarefa que o usuário não
 * está executando, e a mesma informação cabe em três pontos, que é o que as
 * referências usam.
 *
 * Cada página tem sua própria semente, então trocar de página troca a cor da
 * capa inteira: é o que dá sensação de avanço sem animação de transição.
 */
const PAGES = [
  {
    title: 'welcomeTitle',
    body: 'welcomeBody',
    seed: 'onboarding-train',
    glyph: 'dumbbell',
    asset: trainImage,
  },
  {
    title: 'welcomeProgressTitle',
    body: 'welcomeProgressBody',
    seed: 'onboarding-progress',
    glyph: 'pulse',
    asset: progressImage,
  },
  {
    title: 'welcomeCoachTitle',
    body: 'welcomeCoachBody',
    seed: 'onboarding-coach',
    glyph: 'rings',
    asset: coachImage,
  },
] as const satisfies readonly {
  title: Parameters<typeof t>[0];
  body: Parameters<typeof t>[0];
  seed: string;
  glyph: CoverGlyph;
  asset: number;
}[];

export function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [page, setPage] = useState(0);
  const current = PAGES[page]!;
  const last = page === PAGES.length - 1;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1 },
        cover: { flex: 1.15, overflow: 'hidden' },
        body: {
          flex: 1,
          padding: layout.pageInset,
          gap: spacing.lg,
          justifyContent: 'center',
        },
        dots: { flexDirection: 'row', gap: spacing.sm },
        dot: {
          height: spacing.sm,
          width: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: colors.border,
          borderWidth: glass.borderWidth,
          borderColor: colors.borderStrong,
        },
        dotActive: { width: spacing.xl, backgroundColor: colors.brand },
      }),
    [colors],
  );

  return (
    <Screen edges={['bottom']}>
      <View style={styles.root}>
        <CoverImage
          seed={current.seed}
          glyph={current.glyph}
          asset={current.asset}
          scrim
          radius="none"
          style={styles.cover}
        />
        <View style={styles.body}>
          <View style={styles.dots} accessibilityRole="progressbar">
            {PAGES.map((item, index) => (
              <View
                key={item.seed}
                style={[styles.dot, index === page && styles.dotActive]}
                accessibilityElementsHidden
              />
            ))}
          </View>
          <Text variant="display" weight="bold">
            {t(current.title)}
          </Text>
          <Text tone="secondary">{t(current.body)}</Text>
          <Button
            label={last ? t('start') : t('next')}
            onPress={() => (last ? router.push('/(auth)/sign-in') : setPage(page + 1))}
          />
        </View>
      </View>
    </Screen>
  );
}
