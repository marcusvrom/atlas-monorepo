import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { SessionSummary, TodayWorkout } from '@atlas/contracts';
import { spacing } from '@atlas/design-tokens';
import {
  Button,
  ErrorState,
  HeroArtwork,
  MetaChip,
  MetaChipRow,
  Text,
} from '../../design/components';
import { formatCount, formatDuration, formatTonnage } from '../../lib/format';
import { plural, t } from '../../i18n';
import { homeHero, plannedSets, sessionsThisWeek, type HomeHeroTarget } from './home-hero';

/**
 * O bloco que responde "o que eu faço agora".
 *
 * Uma peça, um estado, **uma** ação primária. Toda a decisão de qual estado
 * mostrar vive em `home-hero.ts`; aqui só se pinta — o que mantém a regra
 * testável e impede que a tela invente um sexto caso no meio de um `&&`.
 *
 * Três compromissos de acessibilidade que a composição carrega:
 *
 * 1. **O texto não depende da imagem.** Tampa, título e chips vivem sobre o véu
 *    de contraste; se a foto não chegar, a arte vetorial fica no lugar e o
 *    conteúdo continua legível e completo.
 * 2. **A ação é um botão de verdade**, fora da capa — e não a capa inteira
 *    clicável. Capa-botão obriga o leitor de tela a anunciar o cartaz todo como
 *    rótulo, e deixa o alvo de toque ambíguo para quem usa o polegar.
 * 3. **Nada é comunicado só por cor.** Estado em andamento, concluído ou de
 *    retomada aparece na tampa em palavras.
 */
export function HomeHero({
  workout,
  sessions,
  now,
  onStart,
  starting,
  startError,
}: {
  workout: TodayWorkout | null;
  sessions: readonly SessionSummary[];
  now: Date;
  /** Iniciar cria sessão e navega; fica com a tela porque é uma mutação. */
  onStart: () => void;
  starting: boolean;
  startError: boolean;
}) {
  const router = useRouter();
  const model = useMemo(() => homeHero({ workout, sessions, now }), [workout, sessions, now]);
  const weekCount = useMemo(() => sessionsThisWeek(sessions, now), [sessions, now]);
  const { target } = model;
  const completed = useMemo(
    () =>
      target.route === 'sessionSummary'
        ? (sessions.find((item) => item.id === target.sessionId) ?? null)
        : null,
    [target, sessions],
  );

  const go = (target: HomeHeroTarget) => {
    switch (target.route) {
      case 'startWorkout':
        return onStart();
      case 'resumeSession':
      case 'sessionSummary':
        return router.push({ pathname: '/session/[id]', params: { id: target.sessionId } });
      case 'newPlan':
        return router.push('/plan/new');
      case 'catalog':
        return router.push('/exercises');
      case 'progress':
        return router.push('/(tabs)/progress');
    }
  };

  // Os chips mudam com o estado porque a pergunta muda: antes do treino o que
  // importa é o tamanho da tarefa; depois dele, o que foi feito; sem treino
  // marcado, onde a semana está.
  //
  // Nenhum deles carrega tonelagem. Chip não tem rótulo, e número sem rótulo só
  // pode ser algo que o usuário nomeia ao ver — duração, séries e exercícios
  // passam nesse teste; "15,7 mil kg" não passava, e ao lado de "5 exercícios"
  // era lido como o peso do exercício. A carga total continua existindo, com
  // nome, no resumo da sessão e no Progresso.
  const meta =
    completed !== null ? (
      <MetaChipRow>
        <MetaChip onCover icon="clock" label={formatDuration(completed.durationSeconds)} />
        <MetaChip
          onCover
          icon="layers"
          label={formatCount(completed.setCount) + ' ' + t('setsShort')}
        />
        {/* Depois do treino a carga é resultado, e resultado merece aparecer —
            com o rótulo dentro do chip, nunca como número solto. */}
        <MetaChip
          onCover
          icon="bolt"
          label={t('tonnageChip').replace('{value}', formatTonnage(completed.totalVolumeKg))}
        />
      </MetaChipRow>
    ) : workout ? (
      <MetaChipRow>
        <MetaChip
          onCover
          icon="dumbbell"
          label={formatCount(workout.day.exercises.length) + ' ' + t('planExercises')}
        />
        <MetaChip
          onCover
          icon="clock"
          label={formatCount(workout.day.estimatedMinutes) + ' ' + t('minutesShort')}
        />
        <MetaChip
          onCover
          icon="layers"
          label={formatCount(plannedSets(workout.day)) + ' ' + t('setsShort')}
        />
      </MetaChipRow>
    ) : model.kind === 'noPlan' ? null : (
      <MetaChipRow>
        <MetaChip
          onCover
          icon="check"
          label={
            formatCount(weekCount) +
            ' ' +
            plural(weekCount, 'homeHeroWeekSessionsOne', 'homeHeroWeekSessions')
          }
        />
        {model.daysAway !== null && model.daysAway > 0 ? (
          <MetaChip
            onCover
            icon="clock"
            label={
              formatCount(model.daysAway) +
              ' ' +
              plural(model.daysAway, 'homeHeroAwayDaysOne', 'homeHeroAwayDays')
            }
          />
        ) : null}
      </MetaChipRow>
    );

  return (
    <View style={styles.root}>
      <HeroArtwork context={model.context}>
        <View style={styles.body}>
          <Text tone="onAccent" variant="caption" weight="bold">
            {t(model.eyebrow)}
          </Text>
          <Text tone="onAccent" variant="title2" weight="bold" numberOfLines={2}>
            {t(model.title)}
          </Text>
          {/* O nome do dia é o dado mais específico que existe sobre o treino de
              hoje; sem ele o hero diria a mesma frase para qualquer ficha. */}
          <Text tone="onAccent" variant="footnote" numberOfLines={2}>
            {workout && model.kind !== 'celebrate'
              ? workout.day.label + ' · ' + workout.planName
              : t(model.body)}
          </Text>
          {meta}
        </View>
      </HeroArtwork>
      <Button
        testID="today-start"
        label={t(model.actionLabel)}
        busy={model.kind === 'start' && starting}
        onPress={() => go(target)}
      />
      {startError ? <ErrorState message={t('startWorkoutError')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  // Sem altura: o `HeroArtwork` assume a proporção da própria arte.
  body: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg, gap: spacing.sm },
});
