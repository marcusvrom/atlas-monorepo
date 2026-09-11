import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { glass, layout, radius, spacing } from '@atlas/design-tokens';
import { Button, Screen, Text } from '../../design/components';
import { HeroArtwork, type ArtworkContext } from '../../design/media';
import { useTheme } from '../../design/theme-provider';
import { t } from '../../i18n';

/**
 * Boas-vindas.
 *
 * Reconstruída no formato das telas de entrada das referências: capa sangrando
 * do topo até pouco além da metade, texto e ação assentados embaixo. O anel de
 * progresso que marcava a página saiu — ele media uma tarefa que o usuário não
 * está executando, e a mesma informação cabe em três pontos, que é o que as
 * referências usam.
 *
 * Cada página tem seu próprio contexto editorial, então trocar de página troca
 * a capa inteira: é o que dá sensação de avanço sem animação de transição. A
 * página diz o momento; qual arquivo o representa é decisão de `artwork.ts`.
 */
const PAGES = [
  { title: 'welcomeTitle', body: 'welcomeBody', context: 'onboarding-training' },
  { title: 'welcomeProgressTitle', body: 'welcomeProgressBody', context: 'onboarding-progress' },
  { title: 'welcomeCoachTitle', body: 'welcomeCoachBody', context: 'onboarding-coach' },
] as const satisfies readonly {
  title: Parameters<typeof t>[0];
  body: Parameters<typeof t>[0];
  context: ArtworkContext;
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
        // Sem `flex`: a capa toma a altura da própria arte (ver
        // `HeroArtwork`) e o corpo fica com o resto da tela. Com `flex` a
        // proporção era ignorada e a figura voltava a ser cortada.
        cover: { overflow: 'hidden' },
        body: {
          flex: 1,
          justifyContent: 'center',
          padding: layout.pageInset,
          gap: spacing.lg,
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
        <HeroArtwork context={current.context} radius="none" style={styles.cover} />
        <View style={styles.body}>
          <View style={styles.dots} accessibilityRole="progressbar">
            {PAGES.map((item, index) => (
              <View
                key={item.context}
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
