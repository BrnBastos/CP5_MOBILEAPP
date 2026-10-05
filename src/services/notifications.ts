import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { z } from 'zod';
import { api } from './api';
const response = z.object({ registered: z.boolean() });
const supported = () =>
  Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
async function messaging() {
  const module = await import('@react-native-firebase/messaging');
  return { ...module, instance: module.getMessaging() };
}
async function deviceId() {
  let id = await AsyncStorage.getItem('cp5.device');
  if (!id) {
    id = Crypto.randomUUID();
    await AsyncStorage.setItem('cp5.device', id);
  }
  return id;
}
export async function registerDevice(onError: (error: unknown) => void = () => undefined) {
  if (!supported()) throw new Error('Push requer um build nativo configurado.');
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Mensagens',
      importance: Notifications.AndroidImportance.HIGH,
    });
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted')
    throw new Error('Notificações não autorizadas. Você pode habilitá-las nas configurações.');
  const module = await messaging();
  await module.registerDeviceForRemoteMessages(module.instance);
  const token = await module.getToken(module.instance);
  if (!token) throw new Error('Token do dispositivo indisponível.');
  const register = (value: string) =>
    api(`/devices/${awaitableId}`, response, 'PUT', {
      token: value,
      platform: Platform.OS,
      enabled: true,
    });
  const awaitableId = await deviceId();
  await register(token);
  return module.onTokenRefresh(module.instance, (value) => {
    void register(value).catch(onError);
  });
}
export async function unregisterDevice() {
  if (!supported()) return;
  try {
    await api(`/devices/${await deviceId()}`, z.object({ removed: z.boolean() }), 'DELETE');
  } finally {
    const module = await messaging();
    await module.deleteToken(module.instance);
  }
}
export async function subscribeNotifications(open: (id: string) => void) {
  if (!supported()) return () => undefined;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  const module = await messaging();
  const handle = (data: Record<string, unknown> | undefined) => {
    if (
      typeof data?.conversationId === 'string' &&
      ['direct', 'group'].includes(String(data.conversationType))
    )
      open(data.conversationId);
  };
  const offOpen = module.onNotificationOpenedApp(module.instance, (message) =>
    handle(message.data),
  );
  const offMessage = module.onMessage(module.instance, async (message) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.notification?.title ?? 'Nova mensagem',
        body: message.notification?.body ?? 'Abra a conversa.',
        data: message.data,
      },
      trigger: null,
    });
  });
  const expoListener = Notifications.addNotificationResponseReceivedListener((event) =>
    handle(event.notification.request.content.data),
  );
  const initial = await module.getInitialNotification(module.instance);
  if (initial) handle(initial.data);
  return () => {
    offOpen();
    offMessage();
    expoListener.remove();
  };
}
