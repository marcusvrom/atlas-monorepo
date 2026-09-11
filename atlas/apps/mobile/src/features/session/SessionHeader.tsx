import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ExercisePrescription } from '@atlas/contracts';
import { layout, radius, spacing } from '@atlas/design-tokens';
import {
  Button,
  CoverImage,
  IconButton,
  MetaChip,
  MetaChipRow,
  Text,
} from '../../design/components';
import { useTheme } from '../../design/theme-provider';
import { t } from '../../i18n';
import { RestTimer } from './RestTimer';

/**
 * ATL-SES-005 — cabeçalho da sessão.
 *
 * Responde de relance as três perguntas que o usuário faz entre uma série e
 * outra: **o que** estou fazendo, **onde** estou no treino, e **quanto falta**
 * de descanso. Antes só a primeira tinha resposta na tela — o progresso não
 * existia em lugar nenhum, e quem estava no terceiro de cinco exercícios não
 * tinha como saber.
 *
 * O anel de descanso substitui o cronômetro quando há descanso correndo, e some
 * quando não há: um anel zerado parado ocuparia o mesmo espaço dizendo nada.
 */
export function SessionHeader({
  exercise,
  dayLabel,
  exerciseIndex,
  exerciseCount,
  setIndex,
  setCount,
  restDeadline,
  restSeconds,
  onBack,
  onGuide,
}: {
  exercise: ExercisePrescription;
  dayLabel: string;
  exerciseIndex: number;
  exerciseCount: number;
  setIndex: number;
  setCount: number;
  restDeadline: number;
  restSeconds: number;
  onBack: () => void;
  onGuide: () => void;
}) {
  const { colors } = useTheme();

  // `restDeadline > Date.now()` durante o render era impuro e, pior, não tinha
  // quem o reavaliasse: o anel só sumia quando algo *outro* re-renderizava o
  // cabeçalho. Aqui o fim do descanso agenda o próprio desaparecimento.
  //
  // O relógio vira estado (`checkedAt`) atualizado só pelo timer — nunca no
  // corpo do efeito. Começa em zero para que um `restDeadline` recém-definido
  // já renderize o anel no primeiro frame; o timeout de duração zero cobre o
  // caso do prazo que chega vencido (sessão retomada depois do descanso).
  const [checkedAt, setCheckedAt] = useState(0);
  useEffect(() => {
    const remaining = Math.max(0, restDeadline - Date.now());
    const timer = setTimeout(() => setCheckedAt(Date.now()), remaining);
    return () => clearTimeout(timer);
  }, [restDeadline]);
  const resting = restDeadline > checkedAt;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { gap: spacing.md },
        top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
        cover: { width: layout.thumbnail, height: layout.thumbnail },
        copy: { flex: 1, gap: spacing.xxs },
        // Trilha de progresso entre exercícios — uma barra por exercício, para
        // o avanço ser contável e não só proporcional.
        track: { flexDirection: 'row', gap: spacing.xxs },
        segment: {
          flex: 1,
          height: spacing.xs,
          borderRadius: radius.pill,
          backgroundColor: colors.border,
        },
        done: { backgroundColor: colors.brand },
        current: { backgroundColor: colors.brandPressed },
        guide: { alignSelf: 'flex-start' },
        restRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
        restCopy: { flex: 1, gap: spacing.xs },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <IconButton icon="back" label={t('sessionExit')} onPress={onBack} />
        <CoverImage
          seed={exercise.exerciseId}
          uri={exercise.thumbnailUrl}
          glyph="dumbbell"
          radius="md"
          style={styles.cover}
        />
        <View style={styles.copy}>
          <Text variant="caption" tone="tertiary">
            {dayLabel}
          </Text>
          <Text variant="title3" weight="bold" numberOfLines={2}>
            {exercise.exerciseName}
          </Text>
        </View>
      </View>

      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityLabel={t('sessionExerciseOf')
          .replace('{current}', String(exerciseIndex + 1))
          .replace('{total}', String(exerciseCount))}
      >
        {Array.from({ length: exerciseCount }, (_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              index < exerciseIndex && styles.done,
              index === exerciseIndex && styles.current,
            ]}
          />
        ))}
      </View>

      <MetaChipRow>
        <MetaChip
          icon="layers"
          label={t('sessionExerciseOf')
            .replace('{current}', String(exerciseIndex + 1))
            .replace('{total}', String(exerciseCount))}
        />
        <MetaChip
          icon="check"
          label={t('sessionSetOf')
            .replace('{current}', String(Math.min(setIndex + 1, setCount)))
            .replace('{total}', String(setCount))}
        />
      </MetaChipRow>

      {resting ? (
        <View style={styles.restRow}>
          <RestTimer deadline={restDeadline} totalSeconds={restSeconds} />
          <View style={styles.restCopy}>
            <Text weight="semibold">{t('restTitle')}</Text>
            <Text variant="footnote" tone="secondary">
              {t('sessionRestInProgress')}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Compacto e alinhado à esquerda de propósito: de largura cheia ele
          competia em peso visual com "Concluir série", que é a ação da tela.
          O guia é consulta, não ação — e como ícone solto ninguém adivinhava
          que a lupa abria o guia de execução. */}
      <Button
        variant="ghost"
        icon="play"
        label={t('dashboardExerciseGuide')}
        onPress={onGuide}
        style={styles.guide}
      />
    </View>
  );
}
