import { useState } from 'react';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebase } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button, ErrorText, Field, Screen } from '@/components/ui';
import { errorMessage } from '@/utils/errors';
export default function Login() {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const auth = useAuth();
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await signInWithEmailAndPassword(firebase().auth, email.trim(), password);
      router.replace('/');
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Bem-vindo ao CP5 Chat">
      <ErrorText message={auth.error || error} />
      <Field
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Field
        label="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
      />
      <Button
        title={busy ? 'Entrando…' : 'Entrar'}
        disabled={busy || !email || !password}
        onPress={() => void submit()}
      />
      <Button title="Criar conta" disabled={busy} onPress={() => router.push('/register')} />
    </Screen>
  );
}
