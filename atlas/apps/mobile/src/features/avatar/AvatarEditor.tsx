import { useReducer, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AvatarConfig } from '@atlas/contracts';
import { spacing } from '@atlas/design-tokens';
import { Button, Chip, Divider, ErrorState, SegmentedControl, Text } from '../../design/components';
import { GlassSurface } from '../../design/glass/GlassSurface';
import { t } from '../../i18n';
import { useEntitlement, useUpdateAvatar } from './hooks';
import { usePhotoPicker } from './use-photo-picker';
import { Avatar } from './Avatar';
import { avatarCategories, avatarItems, type AvatarCategory } from './avatar-assets';

type Mode = 'photo' | 'vector';

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
  const [category, setCategory] = useState<AvatarCategory>('base');

  // No modo vetorial a foto é ignorada no preview e no save — os dois modos
  // coexistem, mas apenas um representa o avatar por vez.
  const previewConfig = mode === 'vector' ? { ...draft, photoUri: null } : draft;

  async function applyPicked(uri: string | null) {
    if (uri) {
      change({ photoUri: uri });
      setMode('photo');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Button label={t('back')} variant="ghost" onPress={() => router.back()} />
      <Text variant="title1" weight="bold">
        {t('avatarEdit')}
      </Text>

      <GlassSurface radius="xxl" style={styles.previewCard}>
        <Avatar config={previewConfig} size={spacing.huge * 3} />
      </GlassSurface>

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
          <View style={styles.options}>
            {avatarCategories.map((value) => (
              <Chip
                key={value}
                label={t(value)}
                selected={value === category}
                onPress={() => setCategory(value)}
              />
            ))}
          </View>
          <Divider />
          <View style={styles.options}>
            {avatarItems(category).map((item) => (
              <Chip
                key={item.id}
                selected={draft[category] === item.id}
                label={
                  t(category) +
                  ' ' +
                  (item.index + 1) +
                  (item.requiredFeature ? ' · ' + t('premiumItem') : '')
                }
                onPress={() => {
                  if (item.requiredFeature && !entitlement.allowed) {
                    router.push({
                      pathname: '/paywall',
                      params: { feature: item.requiredFeature },
                    });
                    return;
                  }
                  change({ [category]: item.id });
                }}
              />
            ))}
          </View>
        </View>
      )}

      {save.isError ? <ErrorState message={t('profileError')} /> : null}
      <Button
        label={t('save')}
        busy={save.isPending}
        onPress={() => {
          const finalConfig: AvatarConfig =
            mode === 'vector' ? { ...draft, photoUri: null } : draft;
          const locked = avatarCategories.some((category) =>
            avatarItems(category).some(
              (item) => item.id === finalConfig[category] && item.requiredFeature !== null,
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
  content: { padding: spacing.lg, paddingBottom: spacing.huge, gap: spacing.lg },
  previewCard: { alignItems: 'center', padding: spacing.xl },
  section: { gap: spacing.md },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
