import { useState } from 'react';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { ImagePickerAsset } from 'expo-image-picker';
import { firebase } from '@/services/firebase';
import { api } from '@/services/api';
import { pickPhoto, uploadPhoto } from '@/services/photos';
import { useAuth } from '@/contexts/AuthContext';
import { userSchema } from '@/types/models';
import {
  Avatar,
  Button,
  Card,
  ErrorText,
  Field,
  Label,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { errorMessage } from '@/utils/errors';
export default function Register() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [phone, setPhone] = useState(''),
    [birth, setBirth] = useState(''),
    [photo, setPhoto] = useState<ImagePickerAsset | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const submit = async () => {
    setError('');
    if (!name.trim() || !phone || !/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
      setError('Preencha nome, celular e nascimento no formato AAAA-MM-DD.');
      return;
    }
    if (!user && (password.length < 6 || password !== confirm)) {
      setError('Use pelo menos 6 caracteres e confirme a senha corretamente.');
      return;
    }
    if (!photo) {
      setError('Selecione uma foto de perfil.');
      return;
    }
    setBusy(true);
    try {
      if (!firebase().auth.currentUser)
        await createUserWithEmailAndPassword(firebase().auth, email.trim(), password);
      const photoUrl = await uploadPhoto(photo);
      await api('/profile', userSchema, 'PUT', {
        name,
        phoneNumber: phone,
        birthDate: birth,
        photoUrl,
      });
      router.replace('/');
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      hasNavigationHeader
      title={user ? 'Só mais um passo.' : 'Seu lugar no Nivo.'}
      eyebrow="VAMOS NOS CONHECER"
      subtitle="Um perfil com a sua cara. Conversas com quem importa."
    >
      <ErrorText message={error} />
      {user ? <Label>Sua conta já foi criada. Complete os dados para continuar.</Label> : null}
      <Card>
        <SectionTitle title="Sobre você" />
        <Field label="Nome completo" value={name} onChangeText={setName} />
      </Card>
      {!user ? (
        <Card>
          <SectionTitle title="Seu acesso" />
          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry />
          <Field
            label="Confirmar senha"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
        </Card>
      ) : null}
      <Card>
        <SectionTitle title="Seus dados" />
        <Field label="Celular" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field
          label="Data de nascimento"
          value={birth}
          onChangeText={setBirth}
          placeholder="AAAA-MM-DD · ex.: 2000-01-31"
        />
      </Card>
      <Card style={{ alignItems: 'center' }}>
        <SectionTitle title="Sua foto" />
        <Label muted>Para sua turma reconhecer você.</Label>
        <Avatar name={name} url={photo?.uri} size={80} />
        <Button
          title={photo ? 'Trocar foto' : 'Escolher uma foto'}
          variant="secondary"
          disabled={busy}
          onPress={() => {
            void pickPhoto()
              .then(setPhoto)
              .catch((failure: unknown) => setError(errorMessage(failure)));
          }}
        />
      </Card>
      <Button
        title={busy ? 'Salvando…' : 'Começar a conversar'}
        disabled={busy}
        onPress={() => void submit()}
      />
      {user ? (
        <Button
          title="Sair da conta"
          variant="ghost"
          disabled={busy}
          onPress={() => {
            void logout().catch((failure: unknown) => setError(errorMessage(failure)));
          }}
        />
      ) : null}
    </Screen>
  );
}
