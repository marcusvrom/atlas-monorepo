import messages from './pt-BR.json';
export function t(key: keyof typeof messages): string {
  return messages[key];
}
