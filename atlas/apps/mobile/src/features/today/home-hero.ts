import type { SessionSummary, TodayWorkout } from '@atlas/contracts';
import type { ArtworkContext } from '../../design/media';
import type { MessageKey } from '../../i18n';
import { localDayKey } from '../progress/dashboard-math';

/**
 * O que a home diz quando o usuário abre o app.
 *
 * Módulo puro de propósito: a pergunta "o que eu faço agora?" tem exatamente
 * uma resposta por estado, e essa decisão precisa ser verificável sem montar a
 * tela. A `TodayScreen` só pinta o que sai daqui.
 *
 * ## Por que um estado por vez, e não um carrossel de destaques
 *
 * A alternativa considerada era rotacionar chamadas (treino, progresso,
 * check-in, hidratação, coach). Foi descartada: com dois ou três banners a home
 * passa a competir consigo mesma — o usuário que abriu o app na academia perde
 * o botão de começar entre cartazes — e a rotação automática quebra memória
 * muscular, porque o mesmo toque na mesma posição faz coisas diferentes a cada
 * abertura. Hidratação, check-in e catálogo continuam na home, mas como cards
 * secundários de altura menor, abaixo do hero, onde não disputam o olhar.
 *
 * ## Ordem de prioridade
 *
 * Retomar > celebrar > iniciar > convidar de volta > resumo da semana > criar
 * ficha. Retomar vem antes de iniciar por um motivo concreto: uma sessão aberta
 * tem séries registradas dentro, e oferecer "iniciar" naquele momento leva o
 * usuário a criar uma segunda sessão e perder de vista a primeira.
 *
 * ## Tom
 *
 * Nenhum estado culpa o usuário por ausência. "Bom ter você de volta" e "hoje
 * também pode contar" no lugar de "você perdeu 4 dias" — a sequência quebrada é
 * fato do dado, não do texto, e quem voltou já sabe que faltou.
 */

export type HomeHeroKind =
  'resume' | 'celebrate' | 'start' | 'welcomeBack' | 'weekSummary' | 'noPlan';

/** Destino da ação primária. A tela traduz para rota; aqui é só intenção. */
export type HomeHeroTarget =
  | { route: 'resumeSession'; sessionId: string }
  | { route: 'startWorkout' }
  | { route: 'sessionSummary'; sessionId: string }
  | { route: 'newPlan' }
  | { route: 'catalog' }
  | { route: 'progress' };

export interface HomeHeroModel {
  kind: HomeHeroKind;
  /** Contexto editorial — ver `design/media/artwork.ts`. */
  context: ArtworkContext;
  eyebrow: MessageKey;
  title: MessageKey;
  body: MessageKey;
  actionLabel: MessageKey;
  target: HomeHeroTarget;
  /**
   * Dias completos desde o último treino concluído. `null` quando nunca houve
   * treino ou quando o estado não fala de ausência.
   */
  daysAway: number | null;
}

/** Ausência a partir da qual a home muda de tom em vez de cobrar sequência. */
export const AWAY_THRESHOLD_DAYS = 3;

function dayDifference(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((end - start) / 86_400_000);
}

function lastCompleted(sessions: readonly SessionSummary[]): SessionSummary | null {
  let latest: SessionSummary | null = null;
  for (const session of sessions) {
    if (session.status !== 'completed') continue;
    const at = Date.parse(session.completedAt ?? session.startedAt);
    if (!Number.isFinite(at)) continue;
    if (latest === null || at > Date.parse(latest.completedAt ?? latest.startedAt))
      latest = session;
  }
  return latest;
}

function openSession(sessions: readonly SessionSummary[]): SessionSummary | null {
  return sessions.find((session) => session.status === 'inProgress') ?? null;
}

export function homeHero({
  workout,
  sessions,
  now,
}: {
  workout: TodayWorkout | null;
  sessions: readonly SessionSummary[];
  now: Date;
}): HomeHeroModel {
  const open = openSession(sessions);
  const resumeId = workout?.inProgressSessionId ?? open?.id ?? null;

  if (resumeId !== null) {
    return {
      kind: 'resume',
      context: 'active-workout',
      eyebrow: 'homeHeroResumeEyebrow',
      title: 'homeHeroResumeTitle',
      body: 'homeHeroResumeBody',
      actionLabel: 'resumeWorkout',
      target: { route: 'resumeSession', sessionId: resumeId },
      daysAway: null,
    };
  }

  const latest = lastCompleted(sessions);
  const daysSince = latest
    ? dayDifference(new Date(latest.completedAt ?? latest.startedAt), now)
    : null;

  // Concluiu hoje: a home vira confirmação, não uma segunda cobrança. Sem esta
  // regra, quem acabou de treinar reabria o app e via "iniciar treino" de novo.
  if (latest && daysSince === 0) {
    return {
      kind: 'celebrate',
      context: 'workout-completed',
      eyebrow: 'homeHeroDoneEyebrow',
      title: 'homeHeroDoneTitle',
      body: 'homeHeroDoneBody',
      actionLabel: 'homeHeroDoneAction',
      target: { route: 'sessionSummary', sessionId: latest.id },
      daysAway: 0,
    };
  }

  if (workout) {
    const away = daysSince !== null && daysSince >= AWAY_THRESHOLD_DAYS;
    return {
      kind: 'start',
      context: 'active-workout',
      eyebrow: 'todayEyebrow',
      // Quem sumiu por dias e tem treino marcado recebe o acolhimento **e** o
      // botão de começar: o tom muda, a ação não.
      title: away ? 'homeHeroBackTitle' : 'homeHeroStartTitle',
      body: away ? 'homeHeroBackBody' : 'homeHeroStartBody',
      actionLabel: 'startWorkout',
      target: { route: 'startWorkout' },
      daysAway: daysSince,
    };
  }

  if (latest === null) {
    return {
      kind: 'noPlan',
      context: 'empty-plan',
      eyebrow: 'homeHeroPlanEyebrow',
      title: 'todayEmpty',
      body: 'planEmptyDescription',
      actionLabel: 'newPlan',
      target: { route: 'newPlan' },
      daysAway: null,
    };
  }

  if (daysSince !== null && daysSince >= AWAY_THRESHOLD_DAYS) {
    return {
      kind: 'welcomeBack',
      context: 'welcome-back',
      eyebrow: 'homeHeroBackEyebrow',
      title: 'homeHeroBackTitle',
      body: 'homeHeroLightBody',
      actionLabel: 'homeHeroLightAction',
      target: { route: 'catalog' },
      daysAway: daysSince,
    };
  }

  return {
    kind: 'weekSummary',
    context: 'progress-highlight',
    eyebrow: 'homeHeroRestEyebrow',
    title: 'homeHeroRestTitle',
    body: 'homeHeroRestBody',
    actionLabel: 'homeHeroRestAction',
    target: { route: 'progress' },
    daysAway: daysSince,
  };
}

/**
 * Quantos treinos concluídos caem na semana corrente (segunda a domingo).
 * Vive aqui, e não em `dashboard-math`, porque é o número que o hero de resumo
 * mostra — e o hero precisa poder ser testado sem o dashboard inteiro.
 */
export function sessionsThisWeek(sessions: readonly SessionSummary[], now: Date): number {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((now.getDay() + 6) % 7));
  const keys = new Set<string>();
  for (let index = 0; index < 7; index += 1) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    keys.add(localDayKey(day));
  }
  return sessions.filter(
    (session) =>
      session.status === 'completed' &&
      keys.has(localDayKey(new Date(session.completedAt ?? session.startedAt))),
  ).length;
}
