import messages from './pt-BR.json';

export type MessageKey = keyof typeof messages;

export function t(key: MessageKey): string {
  return messages[key];
}

/**
 * Escolhe entre singular e plural pela contagem.
 *
 * pt-BR só precisa de duas formas, e a regra é `n === 1`, não `n > 1` — "0
 * séries" é plural. Sem isto a tela imprimia "1 séries registradas" na primeira
 * série de todo treino, que é justamente a que mais aparece.
 *
 * Deliberadamente não é ICU MessageFormat: uma única regra de duas formas em um
 * idioma não justifica a dependência. Quando entrar o segundo idioma, este é o
 * ponto único a trocar.
 */
export function plural(count: number, one: MessageKey, many: MessageKey): string {
  return count === 1 ? messages[one] : messages[many];
}
