import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { directorySchema } from '@/types/models';
import { useCollection } from '@/hooks/useCollection';
import { useAuth } from '@/contexts/AuthContext';
import { api, idResponse } from '@/services/api';
import { ErrorText, Field, Label, Loading, Row, Screen } from '@/components/ui';
import { errorMessage } from '@/utils/errors';
export default function Users() {
  const { user } = useAuth();
  const directory = useCollection('directory', directorySchema);
  const [search, setSearch] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const filtered = useMemo(
    () =>
      directory.data.filter(
        (person) =>
          person.uid !== user?.uid &&
          person.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
      ),
    [directory.data, user, search],
  );
  const start = async (otherId: string) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await api('/direct', idResponse, 'POST', { otherId });
      router.replace({ pathname: '/chat/[id]', params: { id: result.id } });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Encontre uma pessoa">
      <Field label="Buscar por nome" value={search} onChangeText={setSearch} />
      <ErrorText message={error || directory.error} />
      {directory.loading || busy ? <Loading /> : null}
      {!directory.loading && !filtered.length ? <Label>Nenhuma pessoa encontrada.</Label> : null}
      {filtered.map((person) => (
        <Row
          key={person.uid}
          title={person.name}
          photoUrl={person.photoUrl}
          onPress={() => void start(person.uid)}
        />
      ))}
    </Screen>
  );
}
