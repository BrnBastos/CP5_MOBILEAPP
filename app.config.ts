import { existsSync } from 'node:fs';
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default function configure({ config }: ConfigContext): ExpoConfig {
  const android = existsSync('./google-services.json');
  const ios = existsSync('./GoogleService-Info.plist');
  const basePlugins = (config.plugins ?? []).filter((plugin) => {
    const name = typeof plugin === 'string' ? plugin : plugin[0];
    return ![
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
      'expo-build-properties',
    ].includes(name ?? '');
  });
  return {
    ...config,
    name: config.name ?? 'CP5 Chat',
    slug: config.slug ?? 'cp5-mobileapp',
    plugins: [
      ...basePlugins,
      [
        'expo-image-picker',
        { photosPermission: 'Permita escolher fotos para seu perfil e grupos.' },
      ],
      'expo-notifications',
      ['expo-build-properties', { ios: { useFrameworks: 'static' } }],
      ...(android || ios ? ['@react-native-firebase/app', '@react-native-firebase/messaging'] : []),
    ],
    android: {
      ...config.android,
      ...(android ? { googleServicesFile: './google-services.json' } : {}),
    },
    ios: {
      ...config.ios,
      ...(ios
        ? {
            googleServicesFile: './GoogleService-Info.plist',
            entitlements: { 'aps-environment': 'development' },
            infoPlist: { UIBackgroundModes: ['remote-notification'] },
          }
        : {}),
    },
  };
}
