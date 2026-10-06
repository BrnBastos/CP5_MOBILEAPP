import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { colors, Loading } from '@/components/ui';
function Navigation() {
  const { user, profile, loading } = useAuth();
  if (loading) return <Loading />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerBackTitle: 'Voltar',
        headerTitleStyle: { fontSize: 16, fontWeight: '600' },
        headerTintColor: colors.accent,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!profile}>
        <Stack.Screen name="register" options={{ title: 'Sua conta' }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(user && profile)}>
        <Stack.Screen name="users" options={{ title: 'Pessoas' }} />
        <Stack.Screen name="group" options={{ title: 'Grupo' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Mensagens' }} />
        <Stack.Screen name="profile/[uid]" options={{ title: 'Perfil' }} />
      </Stack.Protected>
    </Stack>
  );
}
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Navigation />
    </AuthProvider>
  );
}
