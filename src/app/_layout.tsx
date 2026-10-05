import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui';
function Navigation() {
  const { user, profile, loading } = useAuth();
  if (loading) return <Loading />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        contentStyle: { backgroundColor: '#0f172a' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ title: 'Entrar' }} />
      </Stack.Protected>
      <Stack.Protected guard={!profile}>
        <Stack.Screen name="register" options={{ title: 'Cadastro' }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(user && profile)}>
        <Stack.Screen name="users" options={{ title: 'Pessoas' }} />
        <Stack.Screen name="group" options={{ title: 'Grupo' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Conversa' }} />
        <Stack.Screen name="profile/[uid]" options={{ title: 'Perfil' }} />
      </Stack.Protected>
    </Stack>
  );
}
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Navigation />
    </AuthProvider>
  );
}
