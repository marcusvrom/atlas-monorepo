import { readFileSync, statSync } from 'node:fs';
import { expect, it } from 'vitest';
import groups from '../../../../packages/api-client/src/mock/fixtures/muscle-groups.json';
import { BODY_PATHS } from './body-paths';
import { describeIntensity, intensityLevel } from './anatomy-scale';
it('covers the 26 authorized regions with independent master assets (ATL-CAT-003)', () => {
  let bytes = 0;
  for (const view of ['anterior', 'posterior'] as const) {
    const filename = 'apps/mobile/assets/anatomy/' + view + '.svg';
    const svg = readFileSync(filename, 'utf8');
    bytes += statSync(filename).size;
    expect(svg).toContain('viewBox="0 0 240 560"');
    expect(svg).not.toMatch(/<g[ >]|(?:fill|stroke)=/);
    for (const group of groups.filter((g) => g.view === view || g.view === 'both')) {
      expect(svg.split('id="' + group.svgPathId + '"')).toHaveLength(2);
      expect(svg).toContain(BODY_PATHS.muscles[group.svgPathId]);
    }
  }
  expect(Object.keys(BODY_PATHS.muscles)).toHaveLength(26);
  expect(bytes).toBeLessThan(90 * 1024);
});
it('provides non-color intensity labels even when colors cannot be distinguished', () => {
  expect([0, 0.2, 0.5, 1].map(intensityLevel)).toEqual([0, 1, 2, 3]);
  expect(new Set([0, 0.2, 0.5, 1].map(describeIntensity)).size).toBe(4);
  expect(intensityLevel(NaN)).toBe(0);
});
