import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection } from '@/hooks/useCollection';
import { directorySchema, groupSchema, policyLabels, type Policy } from '@/types/models';
import { api, idResponse } from '@/services/api';
import { firebase } from '@/services/firebase';
import { pickPhoto, uploadPhoto } from '@/services/photos';
import {
  Avatar,
  Button,
  Card,
  ErrorText,
  Field,
  Label,
  Loading,
  Row,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { errorMessage } from '@/utils/errors';
export default function GroupForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const directory = useCollection('directory', directorySchema);
  const [name, setName] = useState(''),
    [limit, setLimit] = useState('5'),
    [members, setMembers] = useState<string[]>(user ? [user.uid] : []),
    [policy, setPolicy] = useState<Policy>('all_group_messages'),
    [photoUrl, setPhotoUrl] = useState(''),
    [photo, setPhoto] = useState<ImagePickerAsset | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [search, setSearch] = useState(''),
    [loading, setLoading] = useState(Boolean(id)),
    [allowed, setAllowed] = useState(!id);
  useEffect(() => {
    let alive = true;
    if (!id) return;
    void getDoc(doc(firebase().db, 'groups', id))
      .then((snapshot) => {
        if (!alive) return;
        const group = groupSchema.parse(snapshot.data());
        setAllowed(group.ownerId === user?.uid);
        setName(group.name);
        setLimit(String(group.memberLimit));
        setMembers(group.memberIds);
        setPolicy(group.notificationPolicy);
        setPhotoUrl(group.photoUrl);
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
  }, [id, user]);
  const capacity = Number(limit),
    validCapacity =
      Number.isInteger(capacity) && capacity >= 2 && capacity <= 100 && capacity >= members.length;
  const people = useMemo(
    () =>
      directory.data.filter((person) => person.name.toLowerCase().includes(search.toLowerCase())),
    [directory.data, search],
  );
  const toggle = (uid: string) => {
    if (uid === user?.uid) return;
    if (!members.includes(uid) && members.length >= capacity) {
      setError('Grupo sem vagas. Aumente o limite.');
      return;
    }
    setMembers((current) =>
      current.includes(uid) ? current.filter((value) => value !== uid) : [...current, uid],
    );
  };
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const url = photo ? await uploadPhoto(photo, id) : photoUrl;
      const result = await api(id ? `/groups/${id}` : '/groups', idResponse, id ? 'PUT' : 'POST', {
        name,
        photoUrl: url,
        memberIds: members,
        memberLimit: capacity,
        notificationPolicy: policy,
      });
      router.replace({ pathname: '/chat/[id]', params: { id: result.id } });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      hasNavigationHeader
      title={id ? 'Do jeito da sua turma.' : 'Juntos, fica melhor.'}
      eyebrow={id ? 'AJUSTES DO GRUPO' : 'NOVO GRUPO'}
      subtitle="Escolha um nome, uma foto e quem faz parte dessa conversa."
    >
      <ErrorText message={error || directory.error} />
      {loading ? (
        <Loading />
      ) : !allowed ? (
        <Label>Somente o proprietário pode editar este grupo.</Label>
      ) : (
        <>
          <Card>
            <SectionTitle title="A cara do grupo" />
            <Field
              label="Nome do grupo"
              placeholder="Como a turma se chama?"
              value={name}
              onChangeText={setName}
            />
            <Avatar name={name} url={photo?.uri ?? photoUrl} size={80} />
            <Button
              title="Escolher foto do grupo"
              variant="secondary"
              disabled={busy}
              onPress={() => {
                void pickPhoto()
                  .then(setPhoto)
                  .catch((failure: unknown) => setError(errorMessage(failure)));
              }}
            />
          </Card>
          <Card>
            <SectionTitle title="Espaço para a turma" />
            <Field
              label="Limite de integrantes (2 a 100)"
              value={limit}
              onChangeText={setLimit}
              keyboardType="number-pad"
            />
            <Label>
              {members.length} integrantes · {validCapacity ? capacity - members.length : 0} vagas
            </Label>
            {!validCapacity ? (
              <ErrorText message="O limite deve ser inteiro e comportar os integrantes atuais." />
            ) : null}
          </Card>
          <Card>
            <SectionTitle title="Quando avisar?" />
            <Label muted>Escolha quais mensagens geram notificações neste grupo.</Label>
            {(Object.keys(policyLabels) as Policy[]).map((item) => (
              <Button
                key={item}
                title={`${policy === item ? '✓  ' : ''}${policyLabels[item]}`}
                variant={policy === item ? 'primary' : 'secondary'}
                disabled={busy}
                onPress={() => setPolicy(item)}
              />
            ))}
          </Card>
          <SectionTitle title="Quem vem junto?" detail={`${members.length} selecionados`} />
          <Field
            label="Buscar pessoas"
            placeholder="Digite um nome"
            value={search}
            onChangeText={setSearch}
          />
          {people.map((person) => (
            <Row
              key={person.uid}
              title={person.name}
              selected={members.includes(person.uid)}
              subtitle={
                person.uid === user?.uid
                  ? 'Você · proprietário do grupo'
                  : members.includes(person.uid)
                    ? 'Faz parte do grupo'
                    : 'Toque para adicionar'
              }
              photoUrl={person.photoUrl}
              onPress={() => {
                if (!busy) toggle(person.uid);
              }}
            />
          ))}
          <Button
            title={busy ? 'Salvando…' : id ? 'Salvar alterações' : 'Criar nosso grupo'}
            disabled={busy || !validCapacity || members.length < 2 || name.trim().length < 2}
            onPress={() => void save()}
          />
        </>
      )}
    </Screen>
  );
}
