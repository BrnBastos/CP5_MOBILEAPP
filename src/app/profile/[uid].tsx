import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { api } from '@/services/api';
import { userSchema, type ChatUser } from '@/types/models';
import {
  Avatar,
  Card,
  ErrorText,
  Label,
  Loading,
  ProfileDetail,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { errorMessage } from '@/utils/errors';
export default function Profile() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const [profile, setProfile] = useState<ChatUser | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setProfile(null);
    setError('');
    void api(`/profiles/${uid}`, userSchema)
      .then((value) => {
        if (alive) setProfile(value);
      })
      .catch((failure: unknown) => {
        if (alive) setError(errorMessage(failure));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [uid]);
  return (
    <Screen
      hasNavigationHeader
      title="Cada pessoa, uma história."
      eyebrow="PERFIL"
      subtitle="Conheça quem está do outro lado da conversa."
    >
      <ErrorText message={error} />
      {loading ? <Loading /> : null}
      {profile ? (
        <>
          <Card style={{ alignItems: 'center', paddingVertical: 30 }}>
            <Avatar url={profile.photoUrl} name={profile.name} size={100} />
            <Label style={{ fontSize: 23, fontWeight: '700', textAlign: 'center' }}>
              {profile.name || 'Nome indisponível'}
            </Label>
          </Card>
          <Card>
            <SectionTitle title="Informações do perfil" />
            <ProfileDetail label="E-mail" value={profile.email || 'Não informado'} />
            <ProfileDetail label="Celular" value={profile.phoneNumber || 'Não informado'} />
            <ProfileDetail
              label="Data de nascimento"
              value={profile.birthDate || 'Não informada'}
            />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
