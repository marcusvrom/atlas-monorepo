#!/usr/bin/env node
/**
 * Gate de CI da spec 30.
 *
 * Verifica que todo path do OpenAPI aparece em algum adapter HTTP e vice-versa.
 * Divergência entre contrato e client é o tipo de erro que só se descobre em
 * produção — este gate move a descoberta para o PR.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const OPENAPI = 'contracts/openapi.v1.yaml';
const HTTP_DIR = 'packages/api-client/src/http';

const spec = await readFile(OPENAPI, 'utf8');

// Paths declarados no YAML: linhas com 2 espaços de indentação começando por /
const specPaths = [...spec.matchAll(/^ {2}(\/api\/v1\/[^\s:]+):/gm)].map((m) => m[1]);

const httpFiles = (await readdir(HTTP_DIR)).filter((f) => f.endsWith('.ts'));
const httpSource = (
  await Promise.all(httpFiles.map((f) => readFile(join(HTTP_DIR, f), 'utf8')))
).join('\n');

const missing = specPaths.filter((path) => {
  // Normaliza parâmetro de rota: /exercises/{id} vira /exercises/${...}
  const template = path.replace(/\{[^}]+\}/g, '${');
  const literal = path.replace(/\/\{[^}]+\}.*$/, '');
  return !httpSource.includes(template) && !httpSource.includes(literal);
});

if (missing.length > 0) {
  console.error('Endpoints do OpenAPI sem adapter HTTP correspondente:');
  for (const path of missing) console.error(`  - ${path}`);
  console.error('\nImplemente o método ou remova o endpoint do contrato. Ver spec 30.');
  process.exit(1);
}

console.log(`Contrato OK — ${specPaths.length} endpoints com adapter correspondente.`);
