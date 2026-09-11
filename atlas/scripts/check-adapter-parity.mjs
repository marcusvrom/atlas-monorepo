#!/usr/bin/env node
/**
 * Gate de CI do ADR-0014.
 *
 * Verifica que cada método declarado em um port existe nos DOIS adapters.
 * Sem isto, "mock e HTTP implementam a mesma interface" é só uma intenção
 * escrita num documento.
 *
 * Análise textual de propósito: rodar sem depender de toolchain de tipos
 * mantém o gate rápido e utilizável em pre-commit.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const PORTS_DIR = 'packages/api-client/src/ports';
const ADAPTER_DIRS = ['packages/api-client/src/mock', 'packages/api-client/src/http'];

const methodPattern = /^\s{2}(\w+)\s*[(<]/gm;

async function collectPortMethods() {
  const files = (await readdir(PORTS_DIR)).filter((f) => f.endsWith('.port.ts'));
  const ports = new Map();

  for (const file of files) {
    const source = await readFile(join(PORTS_DIR, file), 'utf8');
    const methods = [...source.matchAll(methodPattern)]
      .map((match) => match[1])
      .filter((name) => name !== 'constructor');
    if (methods.length > 0) ports.set(file.replace('.port.ts', ''), new Set(methods));
  }
  return ports;
}

async function collectAdapterSources() {
  const sources = [];
  for (const dir of ADAPTER_DIRS) {
    const files = await readdir(dir);
    for (const file of files.filter((f) => f.endsWith('.ts'))) {
      sources.push({ dir, file, content: await readFile(join(dir, file), 'utf8') });
    }
  }
  return sources;
}

const ports = await collectPortMethods();
const adapters = await collectAdapterSources();
const failures = [];

for (const [portName, methods] of ports) {
  for (const dir of ADAPTER_DIRS) {
    const relevant = adapters
      .filter((a) => a.dir === dir)
      .map((a) => a.content)
      .join('\n');

    for (const method of methods) {
      const declared = new RegExp(`\\b(async\\s+)?${method}\\s*[(<]`).test(relevant);
      if (!declared) failures.push(`${dir}: falta "${method}" (port ${portName})`);
    }
  }
}

if (failures.length > 0) {
  console.error('Paridade de adapters quebrada:\n' + failures.map((f) => `  - ${f}`).join('\n'));
  console.error('\nVer ADR-0014 e AGENTS.md R3.');
  process.exit(1);
}

console.log(`Paridade OK — ${ports.size} ports verificados nos dois adapters.`);
