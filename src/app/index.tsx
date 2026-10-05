import { useMemo, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection } from '@/hooks/useCollection';
import { useNotifications } from '@/hooks/useNotifications';
import { directorySchema, directSchema, groupSchema } from '@/types/models';
import { Button, ErrorText, Label, Loading, Row, Screen } from '@/components/ui';
import { errorMessage } from '@/utils/errors';
export default function Conversations() {
  const { user, profile, logout } = useAuth();
  const directory = useCollection('directory', directorySchema),
    groups = useCollection('groups', groupSchema, 'memberIds'),
    direct = useCollection('directConversations', directSchema, 'participantIds');
  const notice = useNotifications();
  const [error, setError] = useState('');
  const people = useMemo(
    () => new Map(directory.data.map((person) => [person.uid, person])),
    [directory.data],
  );
  if (!user) return <Redirect href="/login" />;
  if (!profile) return <Redirect href="/register" />;
  return (
    <Screen title={`Olá, ${profile.name.split(' ')[0]}`}>
      <ErrorText message={error || groups.error || direct.error || directory.error} />
      <Label>{notice}</Label>
      <Button title="Nova conversa" onPress={() => router.push('/users')} />
      <Button title="Criar grupo" onPress={() => router.push('/group')} />
      {groups.loading || direct.loading ? <Loading /> : null}
      {!groups.loading && !direct.loading && !groups.data.length && !direct.data.length ? (
        <Label>Nenhuma conversa ainda. Comece falando com alguém.</Label>
      ) : null}
      {direct.data.map((item) => {
        const other = people.get(item.participantIds.find((id) => id !== user.uid) ?? '');
        return (
          <Row
            key={item.id}
            title={other?.name ?? 'Conversa individual'}
            subtitle="Individual"
            photoUrl={other?.photoUrl}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
          />
        );
      })}
      {groups.data.map((group) => (
        <Row
          key={group.id}
          title={group.name}
          subtitle={`Grupo · ${group.memberIds.length}/${group.memberLimit} integrantes`}
          photoUrl={group.photoUrl}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: group.id } })}
        />
      ))}
      <Button
        title="Meu perfil"
        onPress={() => router.push({ pathname: '/profile/[uid]', params: { uid: user.uid } })}
      />
      <Button
        title="Sair"
        onPress={() => {
          void logout().catch((failure: unknown) => setError(errorMessage(failure)));
        }}
      />
    </Screen>
  );
}
