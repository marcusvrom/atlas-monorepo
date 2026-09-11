import type { WellbeingPort } from './wellbeing.port.js';
import type { CatalogPort } from './catalog.port.js';
import type { CoachingPort } from './coaching.port.js';
import type { IdentityPort } from './identity.port.js';
import type { InsightsPort } from './insights.port.js';
import type { MeasurementPort } from './measurement.port.js';
import type { ProgrammingPort } from './programming.port.js';
import type { SessionPort } from './session.port.js';

export type { WellbeingPort } from './wellbeing.port.js';
export type { CatalogPort } from './catalog.port.js';
export type { PlanFilter, ProgrammingPort } from './programming.port.js';
export type { SessionPort } from './session.port.js';
export type { MeasurementPort } from './measurement.port.js';
export type { InsightsPort } from './insights.port.js';
export type { CoachingPort } from './coaching.port.js';
export type { IdentityPort } from './identity.port.js';

/** Superfície completa consumida pelo app. Injetada uma única vez na árvore React. */
export interface ApiClient {
  readonly mode: 'mock' | 'http';
  readonly wellbeing: WellbeingPort;
  readonly catalog: CatalogPort;
  readonly programming: ProgrammingPort;
  readonly session: SessionPort;
  readonly measurement: MeasurementPort;
  readonly insights: InsightsPort;
  readonly coaching: CoachingPort;
  readonly identity: IdentityPort;
}
