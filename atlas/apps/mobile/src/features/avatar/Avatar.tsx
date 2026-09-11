import { useMemo } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Ellipse, G } from 'react-native-svg';
import type { AvatarConfig } from '@atlas/contracts';
import { motion, palette, spacing } from '@atlas/design-tokens';
import { t } from '../../i18n';
import {
  accessoryPaths,
  avatarColors,
  avatarFaces,
  basePaths,
  colorFor,
  hairPaths,
  itemIndex,
  outfitPaths,
  skinColors,
} from './avatar-assets';

/**
 * Retrato do próprio usuário.
 *
 * Foto quando existe; senão, a montagem vetorial. Toda decisão de cor e forma
 * vem de `avatar-assets.ts` — este componente só desenha. Era aqui que moravam
 * os números mágicos do rosto (`face === 1 ? 3 : 2`) e a cor derivada do índice
 * da peça; ambos viraram dado.
 *
 * `decorative` desliga o rótulo de acessibilidade: quando o avatar aparece
 * dentro de um botão que já se anuncia ("Editar avatar"), repetir "Seu avatar"
 * faz o leitor de tela ler a mesma coisa duas vezes.
 */
export function Avatar({
  config,
  size = spacing.huge * 2,
  decorative = false,
}: {
  config: AvatarConfig;
  size?: number;
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

  const skin = skinColors[itemIndex(config, 'skinTone')];
  const face = avatarFaces[itemIndex(config, 'face')] ?? avatarFaces[0]!;
  const accessory = config.accessory ? accessoryPaths[itemIndex(config, 'accessory')] : null;

  return (
    <Svg viewBox="0 0 128 128" width={size} height={size} {...svgA11y}>
      <Circle cx="64" cy="64" r="62" fill={colorFor(config, 'background')} />
      <G>
        <Path d={basePaths[itemIndex(config, 'base')]} fill={skin} />
        {/* Pescoço */}
        <Path d="M 55 68 L 73 68 L 76 86 Q 64 96 52 86 Z" fill={skin} />
        <Ellipse cx="64" cy="49" rx="24" ry="31" fill={skin} />
        <Path d={hairPaths[itemIndex(config, 'hair')]} fill={colorFor(config, 'hair')} />
        <Ellipse cx="54" cy="51" rx={face.eyeRx} ry={face.eyeRy} fill={palette.ink100} />
        <Ellipse cx="74" cy="51" rx={face.eyeRx} ry={face.eyeRy} fill={palette.ink100} />
        <Path
          d={face.mouth}
          stroke={palette.ink200}
          strokeWidth="2"
          strokeLinecap="round"
          fill={face.mouthFilled ? palette.white : 'none'}
        />
        <Path
          d={outfitPaths[itemIndex(config, 'outfit')]}
          fill={colorFor(config, 'outfit')}
          stroke={colorFor(config, 'outfit')}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {accessory ? (
          <Path d={accessory} fill="none" stroke={palette.ink900} strokeWidth="2" />
        ) : null}
      </G>
      {frameColor ? (
        <Circle cx="64" cy="64" r="61" fill="none" stroke={frameColor} strokeWidth="4" />
      ) : null}
    </Svg>
  );
}
