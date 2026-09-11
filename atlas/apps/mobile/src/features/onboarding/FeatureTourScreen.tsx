import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { glass, layout, radius, spacing } from '@atlas/design-tokens';
import { Badge, Button, Screen, Text } from '../../design/components';
import { CoverArt, CoverScrim, type CoverGlyph } from '../../design/media';
import { useTheme } from '../../design/theme-provider';
import { markTourSeen } from '../../data/tour-storage';
import { t } from '../../i18n';
import { TOUR_VERSION, firstRunFeatures } from './feature-tour';

/**
 * ATL-ONB-002 — tour de primeiro acesso.
 *
 * Apresenta cada feature do produto em uma página própria, com a mesma
 * linguagem visual do resto do app (capa gerada + véu + texto no rodapé).
 *
 * Três decisões de produto embutidas aqui:
 *
 * 1. **Dá para pular a qualquer momento.** Um tour que prende o usuário é um
 *    obstáculo, não uma apresentação — e quem pula normalmente é quem já
 *    conhece o produto.
 * 2. **O conteúdo vem do registro**, não está escrito nesta tela. Feature nova
 *    registrada em `feature-tour.ts` aparece aqui sem ninguém tocar no
 *    componente, que é o ponto da spec 14.
 * 3. **Sair marca como visto**, inclusive ao pular. Reapresentar o mesmo tour
 *    a quem escolheu não vê-lo é desrespeitar a escolha; quem quiser rever tem
 *    a entrada no Perfil.
 */
export function FeatureTourScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scroller = useRef<ScrollView>(null);

  const pages = firstRunFeatures;
  const last = page >= pages.length - 1;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1 },
        page: { width, flex: 1 },
        cover: { flex: 1.1, overflow: 'hidden' },
        // Texto encostado na capa, não centralizado no que sobra: centralizado,
        // ele flutuava no meio de um vazio entre a arte e os botões.
        body: {
          flex: 1,
          padding: layout.pageInset,
          paddingTop: layout.sectionGap,
          gap: spacing.md,
        },
        footer: { padding: layout.pageInset, gap: spacing.md },
        dots: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
        dot: {
          height: spacing.sm,
          width: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: colors.border,
          borderWidth: glass.borderWidth,
          borderColor: colors.borderStrong,
        },
        dotActive: { width: spacing.xl, backgroundColor: colors.brand },
        badgeRow: { flexDirection: 'row' },
      }),
    [colors, width],
  );

  const finish = () => {
    void markTourSeen(TOUR_VERSION);
    router.replace('/(tabs)');
  };

  const advance = () => {
    if (last) {
      finish();
      return;
    }
    const next = page + 1;
    setPage(next);
    scroller.current?.scrollTo({ x: next * width, animated: true });
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.root}>
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          // A página corrente vem da rolagem também, não só do botão: quem
          // arrasta precisa ver os pontos acompanharem.
          onMomentumScrollEnd={(event) =>
            setPage(Math.round(event.nativeEvent.contentOffset.x / width))
          }
          scrollEventThrottle={16}
        >
          {pages.map((feature) => (
            <View key={feature.id} style={styles.page}>
              <View style={styles.cover}>
                <CoverArt seed={'tour-' + feature.id} glyph={feature.glyph as CoverGlyph} />
                <CoverScrim />
              </View>
              <View style={styles.body}>
                {feature.requiredFeature ? (
                  <View style={styles.badgeRow}>
                    <Badge label={t('tourProBadge')} tone="brand" />
                  </View>
                ) : null}
                <Text variant="title1" weight="bold">
                  {t(feature.titleKey as Parameters<typeof t>[0])}
                </Text>
                <Text tone="secondary">{t(feature.bodyKey as Parameters<typeof t>[0])}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View
            style={styles.dots}
            accessibilityRole="progressbar"
            accessibilityLabel={t('tourProgress')
              .replace('{current}', String(page + 1))
              .replace('{total}', String(pages.length))}
          >
            {pages.map((feature, index) => (
              <View
                key={feature.id}
                style={[styles.dot, index === page && styles.dotActive]}
                accessibilityElementsHidden
              />
            ))}
          </View>
          <Button label={last ? t('tourDone') : t('tourNext')} onPress={advance} />
          {last ? null : <Button label={t('tourSkip')} variant="ghost" onPress={finish} />}
        </View>
      </View>
    </Screen>
  );
}
