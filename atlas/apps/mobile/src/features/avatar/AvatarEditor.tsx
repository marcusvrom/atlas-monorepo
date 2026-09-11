import { useReducer, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AvatarConfig } from '@atlas/contracts';
import { layout, spacing } from '@atlas/design-tokens';
import {
  Button,
  Card,
  Chip,
  CoverImage,
  ErrorState,
  IconButton,
  SectionHeader,
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
  FREE_CATEGORY,
  PRESET_FIELDS,
  avatarCategories,
  avatarItems,
  avatarPresets,
  colorFor,
  colorableCategories,
  isAvatarAllowed,
  paletteFor,
  type AvatarCategory,
  type ColorableCategory,
} from './avatar-assets';

type Mode = 'photo' | 'preset' | 'custom';

/**
 * Enquadramento do swatch por categoria. Cabelo e rosto precisam do retrato
 * aproximado para a diferença aparecer num quadrado pequeno; roupa e ombros
 * precisam do avatar inteiro. Sem isso, oito cabelos viram oito quadrados
 * praticamente idênticos.
 */
const framing: Record<AvatarCategory, { zoom: number; offsetY: number }> = {
  skinTone: { zoom: 1.5, offsetY: 8 },
  base: { zoom: 1.1, offsetY: -6 },
  hair: { zoom: 1.8, offsetY: 14 },
  face: { zoom: 2.3, offsetY: 10 },
  outfit: { zoom: 1.3, offsetY: -14 },
  accessory: { zoom: 1.7, offsetY: 8 },
  background: { zoom: 1, offsetY: 0 },
  frame: { zoom: 1, offsetY: 0 },
};

const isColorable = (category: AvatarCategory): category is ColorableCategory =>
  (colorableCategories as readonly string[]).includes(category);

/**
 * ATL-AVT-003 — montagem do avatar.
 *
 * Três modos, cada um com um trabalho: **Foto** (o padrão de quem tem uma),
 * **Modelo** (dois avatares prontos, grátis) e **Personalizar** (peça por peça,
 * Pro). A separação existe porque o usuário gratuito precisa de um caminho
 * curto até um avatar que não seja o genérico, e o usuário Pro precisa do
 * construtor completo — misturar os dois deixava o gratuito diante de uma
 * grade majoritariamente bloqueada.
 */
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
  const [mode, setMode] = useState<Mode>(initial.photoUri ? 'photo' : 'preset');
  const [category, setCategory] = useState<AvatarCategory>(FREE_CATEGORY);

  // No modo vetorial a foto é ignorada no preview e no save — os modos
  // coexistem, mas apenas um representa o avatar por vez.
  const previewConfig = mode === 'photo' ? draft : { ...draft, photoUri: null };
  const entitled = entitlement.allowed;

  const applyPicked = (uri: string | null) => {
    if (!uri) return;
    change({ photoUri: uri });
    setMode('photo');
  };

  const toPaywall = () =>
    router.push({ pathname: '/paywall', params: { feature: 'premiumAvatarItems' } });

  /** Um toque numa peça premium sem direito vira entrada no paywall. */
  const choose = (patch: Partial<AvatarConfig>, requiredFeature: string | null) => {
    if (requiredFeature && !entitled) {
      toPaywall();
      return;
    }
    change(patch);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          { value: 'preset', label: t('avatarPresets') },
          { value: 'custom', label: t('avatarCustom') },
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
      ) : mode === 'preset' ? (
        <View style={styles.section}>
          <SectionHeader title={t('avatarPresets')} subtitle={t('avatarPresetsHint')} />
          <View style={styles.grid}>
            {avatarPresets.map((preset) => {
              // O tom de pele do usuário é preservado ao trocar de modelo: ele
              // nunca é pago, e trocar de look não deveria trocar quem você é.
              const config = { ...preset.config, skinTone: draft.skinTone };
              const locked = preset.requiredFeature !== null && !entitled;
              return (
                <AvatarSwatch
                  key={preset.id}
                  config={AvatarConfig.parse({ ...draft, ...config, photoUri: null })}
                  selected={PRESET_FIELDS.every((field) => draft[field] === preset.config[field])}
                  locked={locked}
                  label={t(preset.gender === 'feminine' ? 'avatarFeminine' : 'avatarMasculine')}
                  onPress={() => choose(config, preset.requiredFeature)}
                />
              );
            })}
          </View>

          <SectionHeader title={t('skinTone')} subtitle={t('avatarSkinToneAlwaysFree')} />
          <View style={styles.grid}>
            {avatarItems(FREE_CATEGORY).map((item) => (
              <AvatarSwatch
                key={item.id}
                config={AvatarConfig.parse({ ...previewConfig, skinTone: item.id })}
                selected={draft.skinTone === item.id}
                zoom={framing.skinTone.zoom}
                offsetY={framing.skinTone.offsetY}
                label={t('skinTone') + ' ' + (item.index + 1)}
                onPress={() => change({ skinTone: item.id })}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          {!entitled ? (
            <Card>
              <Text weight="bold">{t('avatarCustomLockedTitle')}</Text>
              <Text tone="secondary" variant="subhead">
                {t('avatarCustomLockedBody')}
              </Text>
              <Button label={t('proLearn')} onPress={toPaywall} />
            </Card>
          ) : null}

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
                  onPress={() => choose({ [category]: null }, item.requiredFeature)}
                />
              ) : (
                <AvatarSwatch
                  key={item.id}
                  config={AvatarConfig.parse({ ...previewConfig, [category]: item.id })}
                  selected={draft[category] === item.id}
                  locked={item.requiredFeature !== null && !entitled}
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
                    onPress={() =>
                      choose(
                        { [`${category}Color`]: color },
                        entitled ? null : 'premiumAvatarItems',
                      )
                    }
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
          const finalConfig: AvatarConfig = mode === 'photo' ? draft : { ...draft, photoUri: null };
          // A checagem final não confia no que a grade deixou tocar: uma
          // configuração fora dos modelos gratuitos exige direito, ponto.
          if (!isAvatarAllowed(finalConfig, entitled)) {
            toPaywall();
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
