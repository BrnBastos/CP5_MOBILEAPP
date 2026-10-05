import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { z } from 'zod';
import { api } from './api';
export async function pickPhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Permita o acesso às fotos para selecionar uma imagem.');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  const photo = result.canceled ? null : (result.assets[0] ?? null);
  if (photo?.fileSize && photo.fileSize > 5 * 1024 * 1024)
    throw new Error('Escolha uma imagem de até 5 MB.');
  return photo;
}
export async function uploadPhoto(
  photo: ImagePicker.ImagePickerAsset,
  groupId?: string,
): Promise<string> {
  const signed = await api(
    '/media/signature',
    z.object({
      cloudName: z.string(),
      apiKey: z.string(),
      signature: z.string(),
      timestamp: z.number(),
      public_id: z.string(),
      allowed_formats: z.string(),
    }),
    'POST',
    { groupId },
  );
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(photo.uri)).blob();
    form.append('file', blob, photo.fileName ?? 'photo.jpg');
  } else {
    // RN FormData supports a URI descriptor although DOM TypeScript declares Blob only.
    form.append('file', {
      uri: photo.uri,
      name: photo.fileName ?? 'photo.jpg',
      type: photo.mimeType ?? 'image/jpeg',
    } as unknown as Blob);
  }
  form.append('api_key', signed.apiKey);
  form.append('signature', signed.signature);
  form.append('timestamp', String(signed.timestamp));
  form.append('public_id', signed.public_id);
  form.append('allowed_formats', signed.allowed_formats);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!response.ok) throw new Error('Não foi possível enviar a foto.');
  return z.object({ secure_url: z.url() }).parse(await response.json()).secure_url;
}
