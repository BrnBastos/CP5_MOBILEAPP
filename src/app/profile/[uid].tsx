import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { api } from '@/services/api';
import { userSchema, type ChatUser } from '@/types/models';
import { Avatar, ErrorText, Label, Loading, Screen } from '@/components/ui';
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
    <Screen title="Perfil">
      <ErrorText message={error} />
      {loading ? <Loading /> : null}
      {profile ? (
        <>
          <Avatar url={profile.photoUrl} name={profile.name} size={100} />
          <Label>{profile.name || 'Nome indisponível'}</Label>
          <Label>E-mail: {profile.email || 'Indisponível'}</Label>
          <Label>Celular: {profile.phoneNumber || 'Indisponível'}</Label>
          <Label>Nascimento: {profile.birthDate || 'Indisponível'}</Label>
        </>
      ) : null}
    </Screen>
  );
}
