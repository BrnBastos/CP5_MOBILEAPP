import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

if (Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  void import('@react-native-firebase/messaging')
    .then((module) => {
      module.setBackgroundMessageHandler(module.getMessaging(), async () => {
        // Notification + data payloads are displayed by the OS in background.
      });
    })
    .catch(() => console.warn('FCM nativo ainda não configurado.'));
}
