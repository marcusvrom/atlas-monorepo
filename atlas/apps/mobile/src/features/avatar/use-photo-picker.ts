import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { showToast } from '../../design/components/toast-store';
import { t } from '../../i18n';

/**
 * Seleção de foto do avatar: galeria ou câmera. Concentra o pedido de permissão
 * e o tratamento de erro num só lugar, para a tela só receber a URI (ou null se
 * o usuário cancelou/negou). A URI é local do device (file://, ph://,
 * content://) — coerente com o campo `photoUri` do contrato.
 */
export function usePhotoPicker() {
  const pickFromLibrary = useCallback(async (): Promise<string | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast(t('avatarPhotoPermission'));
      return null;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      return result.canceled ? null : (result.assets[0]?.uri ?? null);
    } catch {
      showToast(t('avatarPhotoError'));
      return null;
    }
  }, []);

  const takePhoto = useCallback(async (): Promise<string | null> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showToast(t('avatarPhotoPermission'));
      return null;
    }
    try {
      const result = await ImagePicker.launchCameraAsync(pickerOptions);
      return result.canceled ? null : (result.assets[0]?.uri ?? null);
    } catch {
      showToast(t('avatarPhotoError'));
      return null;
    }
  }, []);

  return { pickFromLibrary, takePhoto };
}

// Recorte quadrado 1:1 — o avatar é sempre circular. Qualidade reduzida para
// manter a URI leve; foto de avatar não precisa de resolução total.
const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};
