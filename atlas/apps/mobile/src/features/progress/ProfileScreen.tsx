import { ProfilePhotoPicker } from '../avatar/ProfilePhotoPicker';
import { useUpdateProfilePhoto } from '../avatar/hooks';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityLevel, BiologicalSex, CurrentGoal, GoalType } from '@atlas/contracts';
import { useRouter } from 'expo-router';
import { layout, spacing } from '@atlas/design-tokens';
import {
  Badge,
  Button,
  Card,
  Chip,
  CoverImage,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  Text,
} from '../../design/components';
import { CoverScrim } from '../../design/media';
import { t } from '../../i18n';
import { activityLabel, sexLabel } from '../../i18n/enum-labels';
import { useMe, useUpdateGoal, useUpdateProfile } from './hooks';
export function ProfileScreen() {
  const me = useMe(),
    save = useUpdateGoal(),
    saveProfile = useUpdateProfile(),
    photo = useUpdateProfilePhoto(),
    router = useRouter();
  if (me.isPending)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (me.isError)
    return (
      <Screen>
        <ErrorState message={t('profileError')} onRetry={() => void me.refetch()} />
      </Screen>
    );
  const profile = me.data;
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={t('profile')} />
        {/* Hero do perfil: capa própria do usuário atrás do avatar. A semente é
            o id do perfil, então a cor é dele e não muda a cada sessão. */}
        <CoverImage seed={profile.id} glyph="none" radius="xl" style={styles.hero}>
          <CoverScrim />
          <View style={styles.heroBody}>
            <View style={styles.header}>
              {/* A foto é editada aqui mesmo. A tela dedicada `/avatar/edit`
                  existia para o construtor vetorial; com foto, empurrar o
                  usuário para outra rota só para escolher uma imagem era uma
                  navegação a mais sem nada do outro lado. */}
              <ProfilePhotoPicker
                userId={profile.id}
                name={profile.displayName}
                photoUri={profile.photoUri}
                busy={photo.isPending}
                onChange={(uri) => photo.mutate(uri)}
              />
              <Text tone="onAccent" variant="title2" weight="bold">
                {profile.displayName}
              </Text>
              <Text tone="onAccent" variant="subhead">
                {profile.email}
              </Text>
              <View>
                <Badge label={t(profile.planKey)} tone="brand" />
              </View>
            </View>
          </View>
        </CoverImage>
        <Card>
          <Text weight="bold">{t('currentGoal')}</Text>
          <View style={styles.options}>
            {GoalType.options.map((type) => (
              <Chip
                key={type}
                label={t(type)}
                selected={profile.goal?.type === type}
                disabled={save.isPending}
                onPress={() =>
                  save.mutate(
                    CurrentGoal.parse({
                      ...profile.goal,
                      type,
                      targetDate: profile.goal?.targetDate ?? null,
                      targetWeightKg: profile.goal?.targetWeightKg ?? null,
                      targetBodyFatPct: profile.goal?.targetBodyFatPct ?? null,
                      weeklySessionTarget: profile.goal?.weeklySessionTarget ?? 3,
                    }),
                  )
                }
              />
            ))}
          </View>
          {save.isError ? <ErrorState message={t('profileError')} /> : null}
        </Card>
        {/*
          ATL-NUT-001 — entradas da estimativa metabólica.

          Ficam no perfil, ao lado do objetivo, porque é onde o usuário já vai
          quando algo muda. Sem elas a tela de metas mostra `missingInputs` e
          não consegue estimar; com elas, a mesma biometria que o app já
          guardava vira meta calórica.
        */}
        <Card>
          <Text weight="bold">{t('profileBiologicalSex')}</Text>
          <View style={styles.options}>
            {BiologicalSex.options.map((value) => (
              <Chip
                key={value}
                label={t(sexLabel[value])}
                selected={profile.biologicalSex === value}
                disabled={saveProfile.isPending}
                onPress={() =>
                  saveProfile.mutate({
                    displayName: profile.displayName,
                    heightCm: profile.heightCm,
                    birthDate: profile.birthDate,
                    biologicalSex: value,
                    activityLevel: profile.activityLevel,
                    trainingPreferences: profile.trainingPreferences,
                  })
                }
              />
            ))}
          </View>
        </Card>

        <Card>
          <Text weight="bold">{t('profileActivityLevel')}</Text>
          <View style={styles.options}>
            {ActivityLevel.options.map((value) => (
              <Chip
                key={value}
                label={t(activityLabel[value])}
                selected={profile.activityLevel === value}
                disabled={saveProfile.isPending}
                onPress={() =>
                  saveProfile.mutate({
                    displayName: profile.displayName,
                    heightCm: profile.heightCm,
                    birthDate: profile.birthDate,
                    biologicalSex: profile.biologicalSex,
                    activityLevel: value,
                    trainingPreferences: profile.trainingPreferences,
                  })
                }
              />
            ))}
          </View>
          {saveProfile.isError ? <ErrorState message={t('profileError')} /> : null}
        </Card>

        <Button
          label={t('nutritionTitle')}
          variant="ghost"
          onPress={() => router.push('/nutrition')}
        />
        {/* ATL-ONB-002: rever o tour é uma entrada permanente, não um easter
            egg. Quem pulou no primeiro acesso precisa de um caminho de volta. */}
        <Button
          label={t('tourReplay')}
          variant="ghost"
          onPress={() => router.push('/(auth)/tour')}
        />
        <Button label={t('plansCompare')} variant="ghost" onPress={() => router.push('/paywall')} />
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: layout.pageInset, paddingBottom: spacing.huge * 2, gap: layout.sectionGap },
  // Sem altura fixa: o hero do perfil cresce com o conteúdo (nome longo,
  // e-mail longo) em vez de recortar a identidade do usuário.
  hero: {},
  heroBody: { padding: spacing.xl, gap: spacing.md },
  header: { alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.md },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
