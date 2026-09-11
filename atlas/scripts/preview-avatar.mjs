#!/usr/bin/env node
/**
 * Folha de contato das peças do avatar.
 *
 * Gera um HTML com todas as combinações relevantes (cabelos, rostos, roupas,
 * acessórios, modelos) para conferir o desenho **olhando**, sem subir o app.
 * Escrever bezier às cegas e só descobrir o resultado depois de recompilar o
 * Expo é o caminho mais rápido para um avatar de boneco.
 *
 *   node scripts/preview-avatar.mjs > /tmp/avatar.html
 *
 * Lê os módulos de dados com o type-stripping do Node 22 — por isso
 * `avatar-parts.ts` e `avatar-presets.ts` não importam React nem nada nativo.
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const load = async (file) =>
  import(pathToFileURL(resolve('apps/mobile/src/features/avatar', file)).href);

const parts = await load('avatar-parts.ts');
const presets = await load('avatar-presets.ts').catch(() => null);

const SKIN = ['#F4D3B5', '#E8B894', '#CB926C', '#A56D4D', '#754931', '#442B22'];

/** Escurece um hex — usado na sombra do pescoço, como no componente. */
function shade(hex, factor = 0.78) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.round(v * factor)),
  );
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function avatarSvg({
  base = 0,
  skinTone = 0,
  hair = 0,
  face = 0,
  outfit = 0,
  accessory = null,
  background = 0,
  hairColor = null,
  outfitColor = null,
  backgroundColor = null,
}) {
  // Cores FIXAS por padrão: derivar a cor do índice fazia cabelo roxo cair
  // sobre fundo roxo e a peça sumir, o que é ruído de preview e não defeito de
  // desenho. Aqui se julga forma; cor se julga no app.
  const skin = SKIN[skinTone % SKIN.length];
  const hairFill = hairColor ?? '#2B2119';
  const cloth = outfitColor ?? '#7140D9';
  const bg = backgroundColor ?? '#D8C7FF';
  const style = parts.hairStyles[hair % parts.hairStyles.length];
  const f = parts.avatarFaces[face % parts.avatarFaces.length];
  const fit = parts.outfits[outfit % parts.outfits.length];
  const acc = accessory === null ? null : parts.accessories[accessory % parts.accessories.length];
  const { EAR, EYE } = parts;

  return `<svg viewBox="0 0 128 128" width="96" height="96">
  <circle cx="64" cy="64" r="62" fill="${bg}"/>
  ${style.behind.map((d) => `<path d="${d}" fill="${hairFill}"/>`).join('')}
  <path d="${parts.basePaths[base % parts.basePaths.length]}" fill="${skin}"/>
  <path d="${parts.NECK_PATH}" fill="${skin}"/>
  <path d="${parts.NECK_SHADOW_PATH}" fill="${shade(skin)}"/>
  <ellipse cx="${EAR.left}" cy="${EAR.y}" rx="${EAR.rx}" ry="${EAR.ry}" fill="${skin}"/>
  <ellipse cx="${EAR.right}" cy="${EAR.y}" rx="${EAR.rx}" ry="${EAR.ry}" fill="${skin}"/>
  <path d="${parts.HEAD_PATH}" fill="${skin}"/>
  ${style.front.map((d) => `<path d="${d}" fill="${hairFill}"/>`).join('')}
  <path d="${f.brow}" stroke="${shade(hairFill, 0.9)}" stroke-width="2" stroke-linecap="round" fill="none"/>
  <g transform="translate(128,0) scale(-1,1)"><path d="${f.brow}" stroke="${shade(hairFill, 0.9)}" stroke-width="2" stroke-linecap="round" fill="none"/></g>
  <ellipse cx="${EYE.left}" cy="${EYE.y}" rx="${f.eyeRx}" ry="${f.eyeRy}" fill="#191525"/>
  <ellipse cx="${EYE.right}" cy="${EYE.y}" rx="${f.eyeRx}" ry="${f.eyeRy}" fill="#191525"/>
  <circle cx="${EYE.left + 1}" cy="${EYE.y - 1}" r="0.9" fill="#fff"/>
  <circle cx="${EYE.right + 1}" cy="${EYE.y - 1}" r="0.9" fill="#fff"/>
  <path d="M 64 55 q 3 4 -1.5 5" stroke="${shade(skin, 0.8)}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  <path d="${f.mouth}" stroke="${shade(skin, 0.55)}" stroke-width="2" stroke-linecap="round" fill="${f.mouthFilled ? '#FFFFFF' : 'none'}"/>
  ${fit.inner ? `<path d="${fit.inner}" fill="${shade(cloth, 0.6)}"/>` : ''}
  ${fit.paths.map((d) => `<path d="${d}" fill="${cloth}"/>`).join('')}
  ${fit.neckline ? `<path d="${fit.neckline}" fill="${skin}"/>` : ''}
  ${
    acc
      ? acc.paths
          .map((d) => {
            const filled = acc.paint !== 'stroke';
            const c = acc.paint === 'hair' ? hairFill : cloth;
            return `<path d="${d}" fill="${filled ? c : 'none'}" stroke="${filled ? 'none' : '#2B2119'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
          })
          .join('')
      : ''
  }
</svg>`;
}

const section = (title, items) =>
  `<h2>${title}</h2><div class="row">${items
    .map((i) => `<figure>${avatarSvg(i.config)}<figcaption>${i.label}</figcaption></figure>`)
    .join('')}</div>`;

const blocks = [
  section(
    'Cabelos',
    parts.hairStyles.map((_, hair) => ({ config: { hair, skinTone: 1 }, label: 'hair ' + hair })),
  ),
  section(
    'Rostos',
    parts.avatarFaces.map((_, face) => ({ config: { face, skinTone: 2 }, label: 'face ' + face })),
  ),
  section(
    'Roupas',
    parts.outfits.map((_, outfit) => ({
      config: { outfit, skinTone: 1 },
      label: 'outfit ' + outfit,
    })),
  ),
  section(
    'Ombros',
    parts.basePaths.map((_, base) => ({ config: { base, skinTone: 3 }, label: 'base ' + base })),
  ),
  section(
    'Acessórios',
    [null, ...parts.accessories.map((_, i) => i)].map((accessory) => ({
      config: { accessory, skinTone: 1, hair: 1 },
      label: accessory === null ? 'nenhum' : 'acc ' + accessory,
    })),
  ),
  section(
    'Tons de pele',
    SKIN.map((_, skinTone) => ({ config: { skinTone, hair: 3 }, label: 'tom ' + skinTone })),
  ),
];

if (presets) {
  blocks.push(
    section(
      'Modelos',
      presets.avatarPresets.map((p) => ({
        config: {
          base: Number(p.config.base.split('-')[1]),
          skinTone: Number(p.config.skinTone.split('-')[1]),
          hair: Number(p.config.hair.split('-')[1]),
          face: Number(p.config.face.split('-')[1]),
          outfit: Number(p.config.outfit.split('-')[1]),
          accessory: p.config.accessory ? Number(p.config.accessory.split('-')[1]) : null,
          background: Number(p.config.background.split('-')[1]),
          hairColor: p.config.hairColor,
          outfitColor: p.config.outfitColor,
          backgroundColor: p.config.backgroundColor,
        },
        label: `${p.id}${p.requiredFeature ? ' 🔒' : ' ✅'}`,
      })),
    ),
  );
}

process.stdout.write(`<!doctype html><meta charset="utf-8"><style>
  body { background:#0B0912; color:#F9F6FF; font:14px system-ui; padding:24px; }
  h2 { font-size:15px; margin:28px 0 10px; color:#A094B2; text-transform:uppercase; letter-spacing:.08em; }
  .row { display:flex; flex-wrap:wrap; gap:14px; }
  figure { margin:0; text-align:center; }
  figcaption { font-size:11px; color:#70617F; margin-top:4px; }
</style>${blocks.join('')}`);
