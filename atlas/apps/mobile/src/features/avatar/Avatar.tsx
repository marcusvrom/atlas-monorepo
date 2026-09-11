import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Ellipse, G } from 'react-native-svg';
import type { AvatarConfig } from '@atlas/contracts';
import { palette, radius, spacing } from '@atlas/design-tokens';
import { t } from '../../i18n';
import {
  accessoryPaths,
  avatarColors,
  basePaths,
  hairPaths,
  itemIndex,
  mouthPaths,
  outfitPaths,
  skinColors,
} from './avatar-assets';
export function Avatar({
  config,
  size = spacing.huge * 2,
}: {
  config: AvatarConfig;
  size?: number;
}) {
  // Foto tem prioridade: quando o usuário enviou uma da galeria/câmera, é ela
  // que representa o perfil. O construtor vetorial fica como fallback.
  if (config.photoUri) {
    const frameColor = config.frame ? avatarColors[itemIndex(config, 'frame')] : undefined;
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={t('avatarLabel')}
        style={[
          styles.photoWrap,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            ...(frameColor ? { borderColor: frameColor, borderWidth: spacing.xs } : null),
          },
        ]}
      >
        <Image
          source={{ uri: config.photoUri }}
          style={styles.photo}
          contentFit="cover"
          transition={200}
          accessible={false}
        />
      </View>
    );
  }

  const skin = skinColors[itemIndex(config, 'skinTone')];
  const face = itemIndex(config, 'face');
  return (
    <Svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      accessibilityRole="image"
      accessibilityLabel={t('avatarLabel')}
    >
      <Circle cx="64" cy="64" r="62" fill={avatarColors[itemIndex(config, 'background')]} />
      <G>
        <Path d={basePaths[itemIndex(config, 'base')]} fill={skin} />
        <Path d="M 55 68 L 73 68 L 76 86 Q 64 96 52 86 Z" fill={skin} />
        <Ellipse cx="64" cy="49" rx="24" ry="31" fill={skin} />
        <Path d={hairPaths[itemIndex(config, 'hair')]} fill={palette.ink200} />
        <Ellipse
          cx="54"
          cy="51"
          rx={face === 1 ? 3 : 2}
          ry={face === 4 ? 1 : 2}
          fill={palette.ink100}
        />
        <Ellipse
          cx="74"
          cy="51"
          rx={face === 1 ? 3 : 2}
          ry={face === 4 ? 1 : 2}
          fill={palette.ink100}
        />
        <Path
          d={mouthPaths[face]}
          stroke={palette.ink200}
          strokeWidth="2"
          fill={face === 2 ? palette.white : 'none'}
        />
        <Path
          d={outfitPaths[itemIndex(config, 'outfit')]}
          fill={avatarColors[itemIndex(config, 'outfit')]}
        />
        <Path
          d={accessoryPaths[itemIndex(config, 'accessory')]}
          fill="none"
          stroke={palette.ink900}
          strokeWidth="2"
        />
      </G>
      {config.frame ? (
        <Circle
          cx="64"
          cy="64"
          r="61"
          fill="none"
          stroke={avatarColors[itemIndex(config, 'frame')]}
          strokeWidth="4"
        />
      ) : null}
    </Svg>
  );
}

const styles = StyleSheet.create({
  photoWrap: { overflow: 'hidden', backgroundColor: palette.ink200, borderRadius: radius.pill },
  photo: { width: '100%', height: '100%' },
});
