import { describe, expect, it } from 'vitest';
import { initials } from './initials';

describe('iniciais', () => {
  it('usa primeiro e último nome', () => expect(initials('Renata Alves')).toBe('RA'));
  it('ignora partículas do meio em nome composto', () =>
    expect(initials('Ana Paula dos Santos')).toBe('AS'));
  it('aceita nome único', () => expect(initials('Diego')).toBe('D'));
  it('não quebra com string vazia ou só espaços', () => {
    expect(initials('')).toBe('');
    expect(initials('   ')).toBe('');
  });
});
