import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { layout, opacity, spacing } from '@atlas/design-tokens';
import { Button, PersonAvatar, Text } from '../../design/components';
import { t } from '../../i18n';
import { usePhotoPicker } from './use-photo-picker';

/**
 * Foto de perfil — escolher, trocar, remover.
 *
 * Substitui o construtor de avatar vetorial inteiro. O que se perdeu foi a
 * customização de boneco; o que se ganhou foi a jornada parar de ter uma etapa
 * de brincar de vestir antes do primeiro treino, e o retrato passar a
 * identificar a pessoa de verdade — que é a única função que ele tem no
 * produto.
 *
 * O fallback não é um espaço vazio nem um ícone genérico: `PersonAvatar` cai
 * para as iniciais sobre a capa semeada pelo id, então cada pessoa tem uma cor
 * constante em todo o app, com ou sem foto. Ninguém fica obrigado a enviar uma
 * imagem para a tela parecer completa.
 */
export function ProfilePhotoPicker({
  userId,
  name,
  photoUri,
  onChange,
  busy = false,
  size = layout.profilePhoto,
}: {
  userId: string;
  name: string;
  photoUri: string | null;
  onChange: (photoUri: string | null) => void;
  busy?: boolean;
  size?: number;
}) {
  const { pickFromLibrary, takePhoto } = usePhotoPicker();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { alignItems: 'center', gap: spacing.md },
        actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
        action: { flexGrow: 1 },
        busy: { opacity: opacity.pressed },
      }),
    [],
  );

  const choose = (pick: () => Promise<string | null>) => () => {
    void pick().then((uri) => {
      if (uri) onChange(uri);
    });
  };

  return (
    <View style={styles.root}>
      <PersonAvatar
        id={userId}
        name={name}
        uri={photoUri}
        size={size}
        style={busy ? styles.busy : undefined}
      />
      <Text variant="footnote" tone="secondary">
        {photoUri ? t('profilePhotoSet') : t('profilePhotoHint')}
      </Text>
      <View style={styles.actions}>
        <Button
          label={t('profilePhotoLibrary')}
          variant="ghost"
          busy={busy}
          onPress={choose(pickFromLibrary)}
          style={styles.action}
        />
        <Button
          label={t('profilePhotoCamera')}
          variant="ghost"
          busy={busy}
          onPress={choose(takePhoto)}
          style={styles.action}
        />
      </View>
      {photoUri ? (
        <Button label={t('profilePhotoRemove')} variant="ghost" onPress={() => onChange(null)} />
      ) : null}
    </View>
  );
}
