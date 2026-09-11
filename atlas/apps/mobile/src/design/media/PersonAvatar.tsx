import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette, radius, spacing } from '@atlas/design-tokens';
import { Text } from '../components/Text';
import { CoverImage } from './CoverImage';
import { initials } from './initials';

/**
 * Retrato de uma pessoa que não é o usuário — profissionais no marketplace,
 * clientes no painel do coach.
 *
 * Não é o `Avatar` do próprio usuário: aquele é editável, tem moldura premium
 * e um construtor vetorial atrás. Este é só identificação — foto quando houver,
 * senão as iniciais sobre a capa gerada com a semente do id. O resultado é que
 * cada pessoa tem uma cor constante em toda a aplicação, o que é o que faz uma
 * lista de nomes parecer uma lista de pessoas.
 */
export function PersonAvatar({
  id,
  name,
  uri,
  size = spacing.xxl + spacing.lg,
  style,
}: {
  id: string;
  name: string;
  uri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { width: size, height: size, borderRadius: radius.pill },
        center: {
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        },
        initials: { color: palette.ink900 },
      }),
    [size],
  );

  return (
    <CoverImage
      seed={'person-' + id}
      uri={uri}
      glyph="none"
      radius="pill"
      style={[styles.root, style]}
    >
      <View style={styles.center}>
        <Text
          variant={size >= spacing.huge ? 'title2' : 'subhead'}
          weight="bold"
          style={styles.initials}
        >
          {initials(name)}
        </Text>
      </View>
    </CoverImage>
  );
}
