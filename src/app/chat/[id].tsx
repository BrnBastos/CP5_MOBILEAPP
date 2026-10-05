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
import { Avatar, Button, ErrorText, Field, Label, Loading, colors } from '@/components/ui';
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
    <SafeAreaView style={styles.container}>
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
            <Label>{title}</Label>
            {group ? <Label>{policyLabels[group.notificationPolicy]}</Label> : null}
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
              <Button
                key={member}
                title={`${people.get(member)?.name ?? member}${member === group.ownerId ? ' · proprietário' : ''}`}
                onPress={() => router.push({ pathname: '/profile/[uid]', params: { uid: member } })}
              />
            ))}
            {group.ownerId === user?.uid ? (
              <Button
                title="Editar grupo"
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
          contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            !chat.loading ? <Label>Esta conversa ainda não tem mensagens.</Label> : null
          }
          renderItem={({ item }) => (
            <View
              style={[styles.bubble, item.senderId === user?.uid ? styles.sent : styles.received]}
            >
              {group ? (
                <Text style={styles.author}>{people.get(item.senderId)?.name ?? 'Integrante'}</Text>
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
          <View style={{ paddingHorizontal: 14 }}>
            <Button
              title={
                target
                  ? `Para: ${people.get(target)?.name ?? 'integrante'} · alterar`
                  : 'Selecionar destinatário (opcional)'
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
                  title="Todo o grupo"
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
          <Field
            label="Mensagem"
            value={text}
            onChangeText={setText}
            editable={!busy && Boolean(metadata)}
            multiline
            maxLength={4000}
          />
          <Button
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
  header: { flexDirection: 'row', gap: 14, padding: 16, alignItems: 'center' },
  bubble: { maxWidth: '85%', padding: 14, borderRadius: 14, gap: 5 },
  sent: { backgroundColor: '#155e75', alignSelf: 'flex-end' },
  received: { backgroundColor: colors.card, alignSelf: 'flex-start' },
  author: { color: colors.accent, fontWeight: '700' },
  message: { color: colors.text, fontSize: 16 },
  details: { color: colors.muted, fontSize: 12 },
  composer: { padding: 14, gap: 12 },
  members: { padding: 14, gap: 8 },
});
