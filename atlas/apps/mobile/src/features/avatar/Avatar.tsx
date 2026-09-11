import { useMemo } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Ellipse, G } from 'react-native-svg';
import type { AvatarConfig } from '@atlas/contracts';
import { motion, palette, spacing } from '@atlas/design-tokens';
import { t } from '../../i18n';
import {
  EAR,
  EYE,
  HEAD_PATH,
  NECK_PATH,
  NECK_SHADOW_PATH,
  accessories,
  avatarColors,
  avatarFaces,
  basePaths,
  colorFor,
  hairStyles,
  itemIndex,
  outfits,
  shade,
  skinColors,
} from './avatar-assets';

/**
 * ATL-AVT-003 — retrato do próprio usuário.
 *
 * Foto quando existe; senão, a montagem vetorial. Toda decisão de forma e cor
 * vem de `avatar-parts.ts` / `avatar-assets.ts` — este componente só desenha,
 * na ordem certa.
 *
 * A ordem importa, e é ela que faz o cabelo longo funcionar: mechas de trás,
 * ombros, pescoço, orelhas, cabeça, cabelo da frente, rosto, roupa, acessório.
 * Qualquer peça fora dessa sequência aparece atravessando o rosto.
 */
export function Avatar({
  config,
  size = spacing.huge * 2,
  decorative = false,
}: {
  config: AvatarConfig;
  size?: number;
  /** Desliga o rótulo de a11y quando o pai já se anuncia (botão "Editar avatar"). */
  decorative?: boolean;
}) {
  const frameColor = config.frame ? avatarColors[itemIndex(config, 'frame')] : undefined;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        photoWrap: {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: palette.ink200,
          ...(frameColor ? { borderColor: frameColor, borderWidth: spacing.xs } : null),
        },
        photo: { width: '100%', height: '100%' },
      }),
    [size, frameColor],
  );

  // O <View> da foto entende as props de a11y do RN; o <Svg> não — nele elas
  // vazam como atributos desconhecidos no DOM da prévia web. Daí dois conjuntos.
  const viewA11y = decorative
    ? ({
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants',
      } as const)
    : ({ accessibilityRole: 'image', accessibilityLabel: t('avatarLabel') } as const);
  const svgA11y = decorative
    ? ({ 'aria-hidden': true } as const)
    : ({ accessibilityRole: 'image', accessibilityLabel: t('avatarLabel') } as const);

  if (config.photoUri) {
    return (
      <View {...viewA11y} style={styles.photoWrap}>
        <Image
          source={{ uri: config.photoUri }}
          style={styles.photo}
          contentFit="cover"
          transition={motion.duration.base}
          accessible={false}
        />
      </View>
    );
  }

  const skin = skinColors[itemIndex(config, 'skinTone')]!;
  const hair = colorFor(config, 'hair');
  const cloth = colorFor(config, 'outfit');
  const face = avatarFaces[itemIndex(config, 'face')] ?? avatarFaces[0]!;
  const style = hairStyles[itemIndex(config, 'hair')] ?? hairStyles[0]!;
  const outfit = outfits[itemIndex(config, 'outfit')] ?? outfits[0]!;
  const accessory = config.accessory ? accessories[itemIndex(config, 'accessory')] : null;
  const accessoryColor = accessory
    ? accessory.paint === 'hair'
      ? hair
      : accessory.paint === 'outfit'
        ? cloth
        : shade(skin, 0.4)
    : undefined;

  return (
    <Svg viewBox="0 0 128 128" width={size} height={size} {...svgA11y}>
      <Circle cx="64" cy="64" r="62" fill={colorFor(config, 'background')} />

      {/* Mechas atrás da cabeça — cabelo longo só existe por causa desta camada. */}
      {style.behind.map((d) => (
        <Path key={d} d={d} fill={hair} />
      ))}

      <Path d={basePaths[itemIndex(config, 'base')]} fill={skin} />
      <Path d={NECK_PATH} fill={skin} />
      {/* Sombra sob o queixo: sem ela a cabeça parece colada no tronco. */}
      <Path d={NECK_SHADOW_PATH} fill={shade(skin)} />

      <Ellipse cx={EAR.left} cy={EAR.y} rx={EAR.rx} ry={EAR.ry} fill={skin} />
      <Ellipse cx={EAR.right} cy={EAR.y} rx={EAR.rx} ry={EAR.ry} fill={skin} />
      <Path d={HEAD_PATH} fill={skin} />

      {style.front.map((d) => (
        <Path key={d} d={d} fill={hair} />
      ))}

      {/* Sobrancelha desenhada uma vez e espelhada: assimetria lê como bug. */}
      <Path
        d={face.brow}
        stroke={shade(hair, 0.9)}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <G transform="translate(128,0) scale(-1,1)">
        <Path
          d={face.brow}
          stroke={shade(hair, 0.9)}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </G>

      <Ellipse cx={EYE.left} cy={EYE.y} rx={face.eyeRx} ry={face.eyeRy} fill={palette.ink100} />
      <Ellipse cx={EYE.right} cy={EYE.y} rx={face.eyeRx} ry={face.eyeRy} fill={palette.ink100} />
      {/* O brilho é o que separa um olho de um ponto preto. */}
      <Circle cx={EYE.left + 1} cy={EYE.y - 1} r="0.9" fill={palette.white} />
      <Circle cx={EYE.right + 1} cy={EYE.y - 1} r="0.9" fill={palette.white} />

      <Path
        d="M 64 55 q 3 4 -1.5 5"
        stroke={shade(skin, 0.8)}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={face.mouth}
        stroke={shade(skin, 0.55)}
        strokeWidth="2"
        strokeLinecap="round"
        fill={face.mouthFilled ? palette.white : 'none'}
      />

      {outfit.inner ? <Path d={outfit.inner} fill={shade(cloth, 0.6)} /> : null}
      {outfit.paths.map((d) => (
        <Path key={d} d={d} fill={cloth} />
      ))}
      {outfit.neckline ? <Path d={outfit.neckline} fill={skin} /> : null}

      {accessory
        ? accessory.paths.map((d) => (
            <Path
              key={d}
              d={d}
              fill={accessory.paint === 'stroke' ? 'none' : accessoryColor}
              stroke={accessory.paint === 'stroke' ? accessoryColor : 'none'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))
        : null}

      {frameColor ? (
        <Circle cx="64" cy="64" r="61" fill="none" stroke={frameColor} strokeWidth="4" />
      ) : null}
    </Svg>
  );
}
