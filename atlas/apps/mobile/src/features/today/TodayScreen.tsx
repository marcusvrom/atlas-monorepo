import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { spacing, opacity, layout } from '@atlas/design-tokens';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  InlineMetric,
  ProgressRing,
  Screen,
  SectionHeader,
  Text,
  Icon,
} from '../../design/components';
import { useTodayWorkout, useStartSession } from '../../data/queries/training';
import { useMe } from '../../data/queries/identity';
import { useAdherence } from '../../data/queries/progress';
import { useDashboardSessions } from '../../data/queries/dashboard';
import { Avatar } from '../avatar/Avatar';
import { DailyCheckInCard } from '../check-in/DailyCheckInCard';
import { HydrationCard } from '../nutrition/HydrationCard';
import { formatCount } from '../../lib/format';
import { WeeklyPlan } from './WeeklyPlan';
import { TodayExercises } from './TodayExercises';
import { HomeHero } from './HomeHero';
import { useCurrentDay } from '../../lib/use-current-day';
import { t } from '../../i18n';
import { newId } from '../../lib/id';

/**
 * Home do atleta.
 *
 * A tela responde quatro perguntas, nesta ordem e sem rolagem entre elas:
 *
 * 1. **O que devo fazer agora?** — o `<HomeHero>`, com uma única ação primária.
 * 2. **Há algo em andamento?** — o próprio hero assume o estado de retomada,
 *    que tem prioridade sobre iniciar qualquer outra coisa.
 * 3. **Como está minha semana?** — o resumo de constância, em números, **antes**
 *    de qualquer gráfico.
 * 4. **Qual é a próxima ação importante?** — check-in, hidratação e catálogo,
 *    agrupados abaixo, como secundários declarados.
 *
 * Duas mudanças em relação à versão anterior merecem registro:
 *
 * - **Uma ação primária por estado.** Antes havia até quatro botões de peso
 *   parecido na mesma rolagem (iniciar, check-in, nutrição, catálogo). Agora só
 *   o hero usa `Button` sólido; o resto são linhas de navegação, o que devolve
 *   sentido ao botão que importa.
 * - **Os exercícios do dia aparecem uma vez.** `TodayExercises` e `WeeklyPlan`
 *   mostravam o mesmo treino em dois trilhos consecutivos; o plano da semana
 *   agora só entra quando há mais de um dia para ver.
 */
export function TodayScreen() {
  const router = useRouter(),
    me = useMe(),
    today = useTodayWorkout(),
    sessions = useDashboardSessions(),
    adherence = useAdherence(30),
    start = useStartSession();
  // A data vem do relógio observado, e não de `new Date()` no corpo do render:
  // uma home aberta às 23h58 precisa virar o dia sozinha, senão o hero segue
  // oferecendo o treino de ontem até o app ser reaberto.
  const now = useCurrentDay();
  const hour = now.getHours();

  const begin = () => {
    const workout = today.data;
    if (!workout) return;
    if (workout.inProgressSessionId) {
      router.push({ pathname: '/session/[id]', params: { id: workout.inProgressSessionId } });
      return;
    }
    start.mutate(
      { clientGeneratedId: newId(), planId: workout.planId, dayId: workout.day.id },
      {
        onSuccess: (session) =>
          router.push({ pathname: '/session/[id]', params: { id: session.id } }),
      },
    );
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.page}>
          <View style={styles.header}>
            <View style={styles.greeting}>
              <Text tone="secondary" variant="subhead">
                {t(hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening')}
              </Text>
              {me.isPending ? (
                <LoadingState lines={1} />
              ) : me.isError ? (
                <ErrorState message={t('profileError')} onRetry={() => void me.refetch()} />
              ) : (
                <Text variant="title1" weight="bold">
                  {me.data.displayName}
                </Text>
              )}
            </View>
            {me.data ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('avatarEdit')}
                onPress={() => router.push('/avatar/edit')}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Avatar config={me.data.avatar} size={spacing.xxxl} />
              </Pressable>
            ) : null}
          </View>

          {today.isPending || sessions.isPending ? (
            // O esqueleto tem a altura do hero: sem isso a página saltava um
            // terço de tela quando o treino chegava, e o polegar já estava a
            // caminho do botão.
            <LoadingState lines={4} />
          ) : today.isError ? (
            <ErrorState message={t('todayError')} onRetry={() => void today.refetch()} />
          ) : (
            <HomeHero
              workout={today.data}
              sessions={sessions.data ?? []}
              now={now}
              onStart={begin}
              starting={start.isPending}
              startError={start.isError}
            />
          )}
        </View>

        {today.data ? <TodayExercises workout={today.data} /> : null}

        <View style={styles.page}>
          <View style={styles.section}>
            <SectionHeader title={t('todayOverview')} subtitle={t('todayOverviewHint')} />
            <Card>
              {adherence.isPending ? (
                <LoadingState />
              ) : adherence.isError ? (
                <ErrorState message={t('progressError')} onRetry={() => void adherence.refetch()} />
              ) : (
                <View style={styles.adherence}>
                  <ProgressRing
                    value={adherence.data.rate}
                    label={t('adherenceTitle')}
                    accent="activity"
                    size={spacing.huge + spacing.xl}
                  />
                  {/* Resumo em números antes de qualquer gráfico: a home diz
                      como a semana está; o detalhe mora em Progresso. O
                      percentual **não** se repete aqui — o anel ao lado já o
                      mostra, e ver "65%" duas vezes na mesma linha fazia o
                      usuário procurar a diferença entre os dois números. */}
                  <View style={styles.adherenceMeta}>
                    <InlineMetric
                      label={t('completedSessions')}
                      value={
                        formatCount(adherence.data.completedSessions) +
                        ' / ' +
                        formatCount(adherence.data.plannedSessions)
                      }
                    />
                    <InlineMetric
                      label={t('currentStreak')}
                      value={formatCount(adherence.data.currentStreak)}
                    />
                  </View>
                </View>
              )}
            </Card>
          </View>

          {/* Só entra quando há mais de um dia na ficha: com um único dia, este
              trilho repetia exercício por exercício o que o card acima do hero
              já mostrava. */}
          {today.data ? <WeeklyPlan planId={today.data.planId} /> : null}

          <View style={styles.section}>
            <SectionHeader title={t('homeSecondary')} subtitle={t('homeSecondaryHint')} />
            <DailyCheckInCard />
            {/* ATL-NUT-001 — hidratação e metas do dia entram na home: são as
                duas coisas que se consultam várias vezes ao dia, não uma vez
                por semana. */}
            <HydrationCard />
            <NavigationRow
              icon="flame"
              title={t('nutritionTitle')}
              hint={t('nutritionSubtitle')}
              onPress={() => router.push('/nutrition')}
            />
            <NavigationRow
              icon="dumbbell"
              title={t('todayExplore')}
              hint={t('todayExploreHint')}
              onPress={() => router.push('/exercises')}
            />
          </View>

          {today.data === null && sessions.data?.length === 0 ? (
            <EmptyState
              title={t('todayEmpty')}
              description={t('planEmptyDescription')}
              actionLabel={t('newPlan')}
              onAction={() => router.push('/plan/new')}
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

/**
 * Linha de navegação secundária.
 *
 * Deliberadamente **não** é um `Button`: peso visual de botão sólido é reservado
 * à ação primária do hero. O alvo de toque continua sendo o card inteiro, e o
 * rótulo acessível junta título e dica para que o leitor de tela anuncie o
 * destino sem o usuário precisar varrer os dois textos.
 */
function NavigationRow({
  icon,
  title,
  hint,
  onPress,
}: {
  icon: 'flame' | 'dumbbell';
  title: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title + '. ' + hint}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card>
        <View style={styles.header}>
          <Icon name={icon} />
          <View style={styles.greeting}>
            <Text weight="semibold">{title}</Text>
            <Text variant="footnote" tone="secondary">
              {hint}
            </Text>
          </View>
          <Icon name="arrow" />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // O recuo lateral vive nos blocos, não no ScrollView: os trilhos horizontais
  // precisam sangrar até a borda da tela para sinalizar que há mais para o lado.
  content: { paddingBottom: spacing.huge * 2, gap: layout.sectionGap },
  page: { paddingHorizontal: layout.pageInset, gap: layout.sectionGap },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  greeting: { flex: 1, gap: spacing.xs },
  section: { gap: spacing.md },
  pressed: { opacity: opacity.pressed },
  adherence: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xl },
  adherenceMeta: { flex: 1, minWidth: spacing.huge * 2, gap: spacing.lg },
});
