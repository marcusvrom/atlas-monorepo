import { z } from 'zod';
import { ApiError, type ApiErrorCode } from '../errors.js';

export interface HttpClientConfig {
  baseUrl: string;
  /** Provedor de token. Assíncrono para permitir refresh transparente. */
  getAccessToken?: () => Promise<string | null>;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  /** Enviado como header Idempotency-Key. Ver spec 30 §5. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

/**
 * Cliente HTTP base. Responsabilidades: montar URL, autenticar, aplicar timeout,
 * normalizar erro e VALIDAR a resposta com o mesmo schema Zod usado pelo mock.
 *
 * A validação não é paranoia: é o que garante que uma mudança silenciosa no
 * backend falhe aqui, com mensagem clara, em vez de virar `undefined` três
 * componentes adiante.
 */
export class HttpClient {
  constructor(private readonly config: HttpClientConfig) {}

  async request<T>(
    path: string,
    schema: z.ZodType<T>,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = new URL(path, this.config.baseUrl);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.config.defaultHeaders,
    };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

    const token = await this.config.getAccessToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 15000);
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    let response: Response;
    try {
      const init: RequestInit = {
        method: options.method ?? 'GET',
        headers,
        signal: controller.signal,
      };
      if (options.body !== undefined) init.body = JSON.stringify(options.body);
      response = await fetch(url.toString(), init);
    } catch (cause) {
      const aborted = cause instanceof Error && cause.name === 'AbortError';
      throw new ApiError(aborted ? 'timeout' : 'network', 'Falha de conexão', { cause });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return schema.parse(undefined);

    const payload: unknown = await response.json();
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new ApiError('validation', 'Resposta fora do contrato', {
        status: response.status,
        details: { issues: parsed.error.issues },
      });
    }
    return parsed.data;
  }
}

/** Problem Details (RFC 9457) → ApiError de domínio. */
async function toApiError(response: Response): Promise<ApiError> {
  let problem: Record<string, unknown> = {};
  try {
    problem = (await response.json()) as Record<string, unknown>;
  } catch {
    /* corpo vazio ou não-JSON */
  }

  const code = statusToCode(response.status);
  const title = typeof problem.title === 'string' ? problem.title : response.statusText;
  const detail = typeof problem.detail === 'string' ? problem.detail : title;

  return new ApiError(code, detail, { status: response.status, details: problem });
}

function statusToCode(status: number): ApiErrorCode {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 402) return 'quotaExceeded';
  if (status === 409) return 'conflict';
  if (status === 422 || status === 400) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}
