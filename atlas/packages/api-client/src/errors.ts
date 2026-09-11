/**
 * Erros normalizados. Mock e HTTP produzem exatamente os mesmos códigos —
 * é isso que permite construir a UI de erro na Fase 0 e ela continuar correta
 * na Fase 2. Ver spec 30 §3.
 */

export type ApiErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'validation'
  | 'quotaExceeded'
  | 'conflict'
  | 'network'
  | 'timeout'
  | 'server'
  | 'unknown';

export interface QuotaExceededDetails {
  feature: string;
  limit: number;
  currentPlan: string;
  suggestedUpgrade: string;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number | undefined;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    code: ApiErrorCode,
    message: string,
    options?: { status?: number; details?: Record<string, unknown>; cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'ApiError';
    this.code = code;
    this.status = options?.status;
    this.details = options?.details;
  }

  /** Dispara o paywall contextual. A tela reage ao erro, nunca decide regra de plano. */
  static quotaExceeded(details: QuotaExceededDetails): ApiError {
    return new ApiError('quotaExceeded', `Limite atingido: ${details.feature}`, {
      status: 402,
      details: details as unknown as Record<string, unknown>,
    });
  }

  static notFound(what: string): ApiError {
    return new ApiError('notFound', `${what} não encontrado`, { status: 404 });
  }

  get isRetryable(): boolean {
    return this.code === 'network' || this.code === 'timeout' || this.code === 'server';
  }
}

/**
 * Lançado por método de adapter ainda não implementado.
 * Falha ruidosa é o ponto: nunca retornar undefined ou dado parcial.
 * Ver AGENTS.md R3.
 */
export class NotImplementedError extends ApiError {
  constructor(adapter: string, method: string, taskSpecId?: string) {
    super(
      'unknown',
      `${adapter}.${method}() não implementado${taskSpecId ? ` (ver ${taskSpecId})` : ''}`,
    );
    this.name = 'NotImplementedError';
  }
}
