import { useReducer, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AvatarConfig } from '@atlas/contracts';
import { layout, spacing } from '@atlas/design-tokens';
import {
  Button,
  Chip,
  CoverImage,
  ErrorState,
  IconButton,
  SegmentedControl,
  Text,
} from '../../design/components';
import { CoverScrim } from '../../design/media';
import { t } from '../../i18n';
import { useEntitlement, useUpdateAvatar } from './hooks';
import { usePhotoPicker } from './use-photo-picker';
import { Avatar } from './Avatar';
import { AvatarSwatch, ColorSwatch, NoneSwatch } from './AvatarSwatch';
import {
  avatarCategories,
  avatarItems,
  colorFor,
  colorableCategories,
  paletteFor,
  type AvatarCategory,
  type ColorableCategory,
} from './avatar-assets';

type Mode = 'photo' | 'vector';

/**
 * Enquadramento do swatch por categoria. Cabelo e rosto precisam do retrato
 * aproximado para a diferença aparecer num quadrado pequeno; roupa e corpo
 * precisam do avatar inteiro. Sem isso, seis cabelos viram seis quadrados
 * praticamente idênticos.
 */
const framing: Record<AvatarCategory, { zoom: number; offsetY: number }> = {
  skinTone: { zoom: 1.5, offsetY: 8 },
  base: { zoom: 1, offsetY: 0 },
  hair: { zoom: 1.9, offsetY: 16 },
  face: { zoom: 2.4, offsetY: 12 },
  outfit: { zoom: 1.3, offsetY: -12 },
  accessory: { zoom: 1.5, offsetY: 0 },
  background: { zoom: 1, offsetY: 0 },
  frame: { zoom: 1, offsetY: 0 },
};

const isColorable = (category: AvatarCategory): category is ColorableCategory =>
  (colorableCategories as readonly string[]).includes(category);

export function AvatarEditor({ initial }: { initial: AvatarConfig }) {
  const router = useRouter();
  const save = useUpdateAvatar();
  const entitlement = useEntitlement('premiumAvatarItems');
  const { pickFromLibrary, takePhoto } = usePhotoPicker();
  const [draft, change] = useReducer(
    (state: AvatarConfig, patch: Partial<AvatarConfig>) =>
      AvatarConfig.parse({ ...state, ...patch }),
    initial,
  );
  const [mode, setMode] = useState<Mode>(initial.photoUri ? 'photo' : 'vector');
  const [category, setCategory] = useState<AvatarCategory>('skinTone');

  // No modo vetorial a foto é ignorada no preview e no save — os dois modos
  // coexistem, mas apenas um representa o avatar por vez.
  const previewConfig = mode === 'vector' ? { ...draft, photoUri: null } : draft;

  const applyPicked = (uri: string | null) => {
    if (!uri) return;
    change({ photoUri: uri });
    setMode('photo');
  };

  /** Um toque numa peça premium sem direito vira entrada no paywall. */
  const choose = (patch: Partial<AvatarConfig>, requiredFeature: string | null) => {
    if (requiredFeature && !entitlement.allowed) {
      router.push({ pathname: '/paywall', params: { feature: requiredFeature } });
      return;
    }
    change(patch);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Hero: o avatar grande sobre capa gerada, como as demais telas. */}
      <View>
        <CoverImage seed="avatar-editor" glyph="none" radius="xxl" style={styles.hero}>
          <CoverScrim />
          <View style={styles.heroBody}>
            <Avatar config={previewConfig} size={spacing.huge * 2 + spacing.xl} />
            <Text tone="onAccent" variant="title2" weight="bold">
              {t('avatarEdit')}
            </Text>
          </View>
        </CoverImage>
        <View style={styles.heroBack}>
          <IconButton icon="back" label={t('back')} onPress={() => router.back()} />
        </View>
      </View>

      <SegmentedControl
        label={t('avatarMode')}
        value={mode}
        onChange={(value) => setMode(value as Mode)}
        options={[
          { value: 'photo', label: t('avatarPhoto') },
          { value: 'vector', label: t('avatarVector') },
        ]}
      />

      {mode === 'photo' ? (
        <View style={styles.section}>
          <Text tone="secondary" variant="subhead">
            {t('avatarPhotoHint')}
          </Text>
          <Button
            label={t('avatarChoosePhoto')}
            onPress={() => void pickFromLibrary().then(applyPicked)}
          />
          <Button
            label={t('avatarTakePhoto')}
            variant="ghost"
            onPress={() => void takePhoto().then(applyPicked)}
          />
          {draft.photoUri ? (
            <Button
              label={t('avatarRemovePhoto')}
              variant="ghost"
              onPress={() => change({ photoUri: null })}
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            {avatarCategories.map((value) => (
              <Chip
                key={value}
                label={t(value)}
                selected={value === category}
                onPress={() => setCategory(value)}
              />
            ))}
          </ScrollView>

          {/* Grade de peças: cada quadrado é o avatar com aquela peça. */}
          <View style={styles.grid}>
            {avatarItems(category).map((item) =>
              item.isNone ? (
                <NoneSwatch
                  key="none"
                  selected={draft[category] === null}
                  label={t('avatarNone')}
                  onPress={() => change({ [category]: null })}
                />
              ) : (
                <AvatarSwatch
                  key={item.id}
                  config={{ ...previewConfig, [category]: item.id }}
                  selected={draft[category] === item.id}
                  locked={item.requiredFeature !== null && !entitlement.allowed}
                  zoom={framing[category].zoom}
                  offsetY={framing[category].offsetY}
                  label={
                    t(category) +
                    ' ' +
                    (item.index + 1) +
                    (item.requiredFeature ? ' · ' + t('premiumItem') : '')
                  }
                  onPress={() => choose({ [category]: item.id }, item.requiredFeature)}
                />
              ),
            )}
          </View>

          {/* Cor, quando a categoria aceita — independente da forma. */}
          {isColorable(category) ? (
            <View style={styles.section}>
              <Text variant="subhead" weight="semibold">
                {t('avatarColor')}
              </Text>
              <View style={styles.grid}>
                {paletteFor[category].map((color, index) => (
                  <ColorSwatch
                    key={color}
                    color={color}
                    selected={colorFor(draft, category) === color}
                    label={t('avatarColor') + ' ' + (index + 1)}
                    onPress={() => change({ [`${category}Color`]: color })}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      )}

      {save.isError ? <ErrorState message={t('profileError')} /> : null}
      <Button
        label={t('save')}
        busy={save.isPending}
        onPress={() => {
          const finalConfig: AvatarConfig =
            mode === 'vector' ? { ...draft, photoUri: null } : draft;
          const locked = avatarCategories.some((entry) =>
            avatarItems(entry).some(
              (item) => item.id === finalConfig[entry] && item.requiredFeature !== null,
            ),
          );
          if (locked && !entitlement.allowed) {
            router.push({ pathname: '/paywall', params: { feature: 'premiumAvatarItems' } });
            return;
          }
          save.mutate(finalConfig, { onSuccess: () => router.back() });
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: layout.pageInset, paddingBottom: spacing.huge, gap: layout.sectionGap },
  hero: { height: layout.coverHero },
  heroBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  heroBack: { position: 'absolute', top: spacing.md, left: spacing.md },
  section: { gap: spacing.md },
  tabs: { gap: spacing.sm, paddingRight: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
