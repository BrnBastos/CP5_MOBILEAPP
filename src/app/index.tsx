import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection } from '@/hooks/useCollection';
import { useNotifications } from '@/hooks/useNotifications';
import { directorySchema, directSchema, groupSchema } from '@/types/models';
import {
  Button,
  EmptyState,
  ErrorText,
  Label,
  Loading,
  Row,
  Screen,
  SectionTitle,
} from '@/components/ui';
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
    <Screen
      title="Suas conversas."
      eyebrow="UM POUCO MAIS PERTO"
      subtitle={`Olá, ${profile.name.split(' ')[0]}. Com quem vamos conversar hoje?`}
    >
      <ErrorText message={error || groups.error || direct.error || directory.error} />
      {notice ? <Label muted>{notice}</Label> : null}
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <Button
          style={{ flex: 1, minWidth: 130 }}
          title="Nova conversa"
          onPress={() => router.push('/users')}
        />
        <Button
          style={{ flex: 1, minWidth: 130 }}
          variant="secondary"
          title="Reunir a turma"
          onPress={() => router.push('/group')}
        />
      </View>
      {groups.loading || direct.loading ? <Loading /> : null}
      {!groups.loading && !direct.loading && !groups.data.length && !direct.data.length ? (
        <EmptyState
          title="Seu próximo papo está por vir"
          description="Comece uma conversa ou reúna sua turma em um grupo."
        />
      ) : null}
      {direct.data.length ? (
        <SectionTitle title="Só entre vocês" detail={`${direct.data.length} conversas`} />
      ) : null}
      {direct.data.map((item) => {
        const other = people.get(item.participantIds.find((id) => id !== user.uid) ?? '');
        return (
          <Row
            key={item.id}
            title={other?.name ?? 'Conversa individual'}
            subtitle="Conversa individual"
            photoUrl={other?.photoUrl}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
          />
        );
      })}
      {groups.data.length ? (
        <SectionTitle title="Sua turma, reunida" detail={`${groups.data.length} grupos`} />
      ) : null}
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
        title="Ver meu perfil"
        variant="secondary"
        onPress={() => router.push({ pathname: '/profile/[uid]', params: { uid: user.uid } })}
      />
      <Button
        title="Sair da conta"
        variant="ghost"
        onPress={() => {
          void logout().catch((failure: unknown) => setError(errorMessage(failure)));
        }}
      />
    </Screen>
  );
}
