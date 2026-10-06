import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { z } from 'zod';
import * as Crypto from 'expo-crypto';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useCollection } from '@/hooks/useCollection';
import { api } from '@/services/api';
import { firebase } from '@/services/firebase';
import {
  directorySchema,
  directSchema,
  groupSchema,
  messageSchema,
  policyLabels,
  type Direct,
  type Group,
  type Message,
} from '@/types/models';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorText,
  Field,
  Label,
  Loading,
  Row,
  colors,
} from '@/components/ui';
import { softShadow } from '@/theme/theme';
import { errorMessage } from '@/utils/errors';
export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [metadata, setMetadata] = useState<Group | Direct | null>(null),
    [error, setError] = useState(''),
    [text, setText] = useState(''),
    [busy, setBusy] = useState(false),
    [target, setTarget] = useState(''),
    [showMembers, setShowMembers] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  const directory = useCollection('directory', directorySchema),
    chat = useChat(id, metadata?.state === 'ready');
  const list = useRef<FlatList<Message>>(null);
  const pending = useRef<{ id: string; text: string; target: string } | null>(null);
  useEffect(() => {
    setMetadata(null);
    setError('');
    const type = id.startsWith('g_') ? 'groups' : 'directConversations';
    return onSnapshot(
      doc(firebase().db, type, id),
      (snapshot) => {
        try {
          if (!snapshot.exists()) throw new Error('Conversa indisponível.');
          setMetadata(
            type === 'groups'
              ? groupSchema.parse(snapshot.data())
              : directSchema.parse(snapshot.data()),
          );
        } catch (failure) {
          setMetadata(null);
          setError(errorMessage(failure));
        }
      },
      (failure) => {
        setMetadata(null);
        setError(errorMessage(failure));
      },
    );
  }, [id]);
  const people = useMemo(
    () => new Map(directory.data.map((person) => [person.uid, person])),
    [directory.data],
  );
  const group = metadata && 'memberIds' in metadata ? metadata : null;
  const members =
    group?.memberIds ?? (metadata && 'participantIds' in metadata ? metadata.participantIds : []);
  const other = people.get(members.find((member) => member !== user?.uid) ?? '');
  const title = group?.name ?? other?.name ?? 'Conversa';
  const send = useCallback(async () => {
    if (!text.trim() || busy || !metadata || metadata.state !== 'ready') return;
    setBusy(true);
    setError('');
    const previous = pending.current;
    const outgoing =
      previous && previous.text === text.trim() && previous.target === target
        ? previous
        : { id: Crypto.randomUUID(), text: text.trim(), target };
    pending.current = outgoing;
    try {
      const message = await api(`/conversations/${id}/messages`, messageSchema, 'POST', {
        id: outgoing.id,
        text: outgoing.text,
        target: target ? { type: 'member', memberId: target } : { type: 'conversation' },
        mentionedUserIds: [],
      });
      setText('');
      pending.current = null;
      try {
        await api(
          '/notifications/messages',
          z.object({ duplicate: z.boolean(), sent: z.number().optional() }),
          'POST',
          { conversationId: id, messageId: message.id },
        );
      } catch (failure) {
        setError(`Mensagem salva. ${errorMessage(failure)}`);
      }
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }, [text, busy, metadata, target, id]);
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={group ? 'Ver integrantes' : 'Ver perfil'}
            onPress={() =>
              group
                ? setShowMembers((value) => !value)
                : other && router.push({ pathname: '/profile/[uid]', params: { uid: other.uid } })
            }
          >
            <Avatar name={title} url={group?.photoUrl ?? other?.photoUrl} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatTitle}>{title}</Text>
            {group ? (
              <Label muted style={{ fontSize: 12 }}>
                {policyLabels[group.notificationPolicy]}
              </Label>
            ) : null}
          </View>
        </View>
        <ErrorText message={error || chat.error || directory.error} />
        {group?.state === 'syncing' ? <Label>Atualizando integrantes…</Label> : null}
        {showMembers && group ? (
          <ScrollView
            style={{ maxHeight: 220 }}
            contentContainerStyle={styles.members}
            keyboardShouldPersistTaps="handled"
          >
            {members.map((member) => (
              <Row
                key={member}
                title={people.get(member)?.name ?? 'Integrante'}
                photoUrl={people.get(member)?.photoUrl}
                subtitle={member === group.ownerId ? 'Proprietário do grupo' : 'Ver perfil'}
                onPress={() => router.push({ pathname: '/profile/[uid]', params: { uid: member } })}
              />
            ))}
            {group.ownerId === user?.uid ? (
              <Button
                title="Ajustar este grupo"
                variant="secondary"
                onPress={() => router.push({ pathname: '/group', params: { id } })}
              />
            ) : null}
          </ScrollView>
        ) : null}
        {chat.loading ? <Loading /> : null}
        <FlatList
          ref={list}
          data={chat.messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 14, flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            !chat.loading ? (
              <EmptyState
                title="O primeiro oi é seu"
                description="Envie uma mensagem para começar essa conversa."
              />
            ) : null
          }
          renderItem={({ item }) => (
            <View
              style={[styles.bubble, item.senderId === user?.uid ? styles.sent : styles.received]}
            >
              {group ? (
                <Text style={styles.author}>
                  {item.senderId === user?.uid
                    ? 'Você'
                    : (people.get(item.senderId)?.name ?? 'Integrante')}
                </Text>
              ) : null}
              <Text style={styles.message}>{item.text}</Text>
              {item.target.type === 'member' ? (
                <Text style={styles.details}>
                  Para {people.get(item.target.memberId)?.name ?? 'integrante'}
                </Text>
              ) : null}
              <Text style={styles.details}>
                {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        />
        {group ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <Button
              variant="secondary"
              title={
                target
                  ? `Para: ${people.get(target)?.name ?? 'integrante'} · alterar`
                  : 'Mensagem para todo o grupo'
              }
              disabled={busy}
              onPress={() => setShowTargets((value) => !value)}
            />
            {showTargets ? (
              <ScrollView
                style={{ maxHeight: 180 }}
                contentContainerStyle={styles.members}
                keyboardShouldPersistTaps="handled"
              >
                <Button
                  title="Enviar para todo o grupo"
                  variant="secondary"
                  onPress={() => {
                    setTarget('');
                    setShowTargets(false);
                  }}
                />
                {members
                  .filter((member) => member !== user?.uid)
                  .map((member) => (
                    <Button
                      key={member}
                      title={people.get(member)?.name ?? 'Integrante'}
                      variant="secondary"
                      onPress={() => {
                        setTarget(member);
                        setShowTargets(false);
                      }}
                    />
                  ))}
              </ScrollView>
            ) : null}
          </View>
        ) : null}
        <View style={styles.composer}>
          <View style={{ flex: 1 }}>
            <Field
              label="Sua mensagem"
              placeholder="Escreva algo…"
              style={{ minHeight: 54, maxHeight: 130, textAlignVertical: 'top' }}
              value={text}
              onChangeText={setText}
              editable={!busy && Boolean(metadata)}
              multiline
              maxLength={4000}
            />
          </View>
          <Button
            style={{ minWidth: 86 }}
            title={busy ? 'Enviando…' : 'Enviar'}
            disabled={
              busy || !text.trim() || !metadata || metadata.state !== 'ready' || Boolean(chat.error)
            }
            onPress={() => void send()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  bubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 22,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    boxShadow: softShadow,
  },
  sent: { backgroundColor: colors.greenSoft, alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  received: { backgroundColor: colors.card, alignSelf: 'flex-start', borderBottomLeftRadius: 6 },
  author: { color: colors.blue, fontWeight: '600', fontSize: 12 },
  message: { color: colors.text, fontSize: 16, lineHeight: 24 },
  details: { color: colors.muted, fontSize: 11, alignSelf: 'flex-end', marginTop: 3 },
  composer: {
    padding: 20,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  members: { padding: 14, gap: 8 },
});
