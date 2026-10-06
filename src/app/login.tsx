import { useState } from 'react';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebase } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, ErrorText, Field, Label, Screen } from '@/components/ui';
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
    <Screen
      title="Que bom ter você aqui."
      eyebrow="SEU ESPAÇO NO NIVO"
      subtitle="Entre para continuar suas conversas e encontrar sua turma."
    >
      <Card>
        <ErrorText message={auth.error || error} />
        <Field
          label="Seu e-mail"
          placeholder="voce@exemplo.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Field
          label="Sua senha"
          placeholder="Digite sua senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
        />
        <Button
          title={busy ? 'Entrando…' : 'Entrar no Nivo'}
          disabled={busy || !email || !password}
          onPress={() => void submit()}
        />
      </Card>
      <Label muted style={{ textAlign: 'center' }}>
        Primeira vez por aqui?
      </Label>
      <Button
        title="Criar minha conta"
        variant="secondary"
        disabled={busy}
        onPress={() => router.push('/register')}
      />
    </Screen>
  );
}
