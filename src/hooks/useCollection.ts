import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { z } from 'zod';
import { firebase } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/utils/errors';
export function useCollection<T>(name: string, schema: z.ZodType<T>, memberField?: string) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    setData([]);
    setError('');
    setLoading(true);
    if (!user) {
      setLoading(false);
      return;
    }
    const ref = collection(firebase().db, name);
    const source = memberField ? query(ref, where(memberField, 'array-contains', user.uid)) : ref;
    return onSnapshot(
      source,
      (snapshot) => {
        try {
          setData(snapshot.docs.map((item) => schema.parse(item.data())));
          setError('');
        } catch {
          setError('Dados recebidos em formato inválido.');
        }
        setLoading(false);
      },
      (failure) => {
        setError(errorMessage(failure));
        setLoading(false);
      },
    );
  }, [name, schema, memberField, user]);
  return { data, error, loading };
}
