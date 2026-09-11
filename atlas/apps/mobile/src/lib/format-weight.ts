/** ATL-UI-012 — arredondamento somente de apresentação; não altera o dado original. */
export function formatWeight(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const rounded = (Math.sign(value) * Math.round(Math.abs(value) * 2)) / 2;
  return (rounded === 0 ? 0 : rounded).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}
