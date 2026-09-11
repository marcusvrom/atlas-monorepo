#!/usr/bin/env node
/**
 * Gate de CI da spec 14.
 *
 * Verifica que **toda rota de usuário tem cobertura no registro de features**
 * (`feature-tour.ts`) ou dispensa explícita em `TOUR_EXEMPT_ROUTES`.
 *
 * Sem isto, "atualizar o onboarding quando entrar uma feature" é uma boa
 * intenção escrita num documento — e boas intenções não sobrevivem à terceira
 * sprint. Aqui a feature nova sem apresentação quebra o build, que é o único
 * lembrete que funciona.
 *
 * Também confere o inverso: uma feature apontando para uma rota que não existe
 * mais (renomeada, removida) falha — senão o registro apodrece em silêncio.
 */
import { readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const APP_DIR = 'apps/mobile/app';
const REGISTRY = 'apps/mobile/src/features/onboarding/feature-tour.ts';

const { featureTour, TOUR_EXEMPT_ROUTES } = await import(
  pathToFileURL(new URL(REGISTRY, pathToFileURL(process.cwd() + '/')).pathname).href
);

/** Todos os arquivos de rota, como id sem extensão e com "/" normalizado. */
async function collectRoutes(dir) {
  const routes = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...(await collectRoutes(full)));
    } else if (entry.name.endsWith('.tsx')) {
      routes.push(
        relative(APP_DIR, full)
          .replace(/\.tsx$/, '')
          .split(sep)
          .join('/'),
      );
    }
  }
  return routes;
}

const routes = await collectRoutes(APP_DIR);
const covered = new Map();
for (const feature of featureTour) {
  for (const route of feature.routes) {
    covered.set(route, feature.id);
  }
}

const failures = [];

for (const route of routes) {
  if (TOUR_EXEMPT_ROUTES[route] !== undefined) continue;
  if (!covered.has(route)) {
    failures.push(
      `rota sem apresentação: "${route}"\n` +
        `      registre-a em alguma feature de ${REGISTRY} (campo "routes"),\n` +
        `      ou dispense-a em TOUR_EXEMPT_ROUTES com a justificativa.`,
    );
  }
}

const existing = new Set(routes);
for (const [route, featureId] of covered) {
  if (!existing.has(route)) {
    failures.push(`feature "${featureId}" aponta para rota inexistente: "${route}"`);
  }
}

for (const route of Object.keys(TOUR_EXEMPT_ROUTES)) {
  if (!existing.has(route)) {
    failures.push(`dispensa obsoleta em TOUR_EXEMPT_ROUTES: "${route}" não existe mais`);
  }
}

if (failures.length > 0) {
  console.error('Cobertura de onboarding quebrada:\n' + failures.map((f) => `  - ${f}`).join('\n'));
  console.error('\nVer docs/specs/14-onboarding-e-tour.md.');
  process.exit(1);
}

const firstRun = featureTour.filter((feature) => feature.stage === 'firstRun').length;
console.log(
  `Onboarding OK — ${routes.length} rotas, ${featureTour.length} features registradas ` +
    `(${firstRun} no tour de primeiro acesso).`,
);
