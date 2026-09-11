#!/usr/bin/env node
/**
 * Gera ícone, ícone adaptativo e splash a partir dos tokens de marca.
 *
 * Por que gerar em vez de versionar um PNG feito à mão: a identidade do app
 * vive em `@atlas/design-tokens`, e um bitmap solto no repositório sai de
 * sincronia com ela na primeira troca de paleta. Aqui o asset é derivado — se a
 * marca mudar, `pnpm assets:brand` regenera tudo.
 *
 *   pnpm assets:brand
 *
 * Escreve SVG e converte para PNG (formato exigido pelo Expo) no mesmo passo.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const OUT = 'apps/mobile/assets/brand';

/** Tons da marca. Espelham packages/design-tokens (brand600/brand500/ink0). */
const BRAND = { deep: '#2A1140', mid: '#562AB0', light: '#A78BFA', ink: '#0B0912' };

/**
 * Halter — o mesmo glifo de `design/media/cover-art.ts`, redesenhado no viewBox
 * do ícone. Repetir o desenho aqui é deliberado: o ícone precisa de traço mais
 * grosso que a capa para sobreviver a 48 px na gaveta do Android.
 */
function mark(size, stroke) {
  const s = size / 100;
  return `
    <g stroke="#FFFFFF" stroke-width="${stroke}" stroke-linecap="round" fill="none">
      <path d="M ${34 * s} ${50 * s} H ${66 * s}"/>
      <path d="M ${24 * s} ${36 * s} V ${64 * s}"/>
      <path d="M ${76 * s} ${36 * s} V ${64 * s}"/>
      <path d="M ${14 * s} ${43 * s} V ${57 * s}"/>
      <path d="M ${86 * s} ${43 * s} V ${57 * s}"/>
    </g>`;
}

/** Fundo em gradiente + brilho radial — a mesma composição da arte de capa. */
function backdrop(size, id) {
  return `
    <defs>
      <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${BRAND.deep}"/>
        <stop offset="1" stop-color="${BRAND.mid}"/>
      </linearGradient>
      <radialGradient id="r${id}" cx="30%" cy="24%" r="62%">
        <stop offset="0" stop-color="${BRAND.light}" stop-opacity="0.72"/>
        <stop offset="1" stop-color="${BRAND.light}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#g${id})"/>
    <rect width="${size}" height="${size}" fill="url(#r${id})"/>`;
}

const svg = (size, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`;

const assets = {
  // 1024×1024 — App Store / Play. Sangra até a borda; o sistema arredonda.
  icon: svg(1024, backdrop(1024, 'i') + mark(1024, 46)),
  // Android adaptativo: a marca fica na área segura central (66%), porque o
  // sistema recorta a máscara em círculo, squircle ou gota.
  'adaptive-icon': svg(
    1024,
    `<rect width="1024" height="1024" fill="${BRAND.mid}"/>` +
      `<g transform="translate(171,171) scale(0.666)">${mark(1024, 52)}</g>`,
  ),
  // Splash: marca pequena sobre o fundo sólido do tema. Sem gradiente de
  // propósito — o splash precisa emendar com a primeira tela sem costura.
  splash: svg(
    1024,
    `<rect width="1024" height="1024" fill="${BRAND.ink}"/>` +
      `<g transform="translate(307,307) scale(0.4)">${mark(1024, 60)}</g>`,
  ),
};

await mkdir(OUT, { recursive: true });

for (const [name, source] of Object.entries(assets)) {
  await writeFile(`${OUT}/${name}.svg`, source);
}

// Conversão para PNG. O Expo não aceita SVG nesses campos.
const script = `
import glob, os
from PIL import Image
import cairosvg
for path in glob.glob('${OUT}/*.svg'):
    png = path[:-4] + '.png'
    cairosvg.svg2png(url=path, write_to=png, output_width=1024, output_height=1024)
    print('  ' + png, Image.open(png).size)
`;
try {
  const { stdout } = await run('python3', ['-c', script]);
  process.stdout.write(stdout);
} catch (error) {
  console.error('Conversão para PNG falhou. Instale cairosvg: pip install cairosvg');
  throw error;
}

console.log(`Marca gerada em ${OUT}/.`);
