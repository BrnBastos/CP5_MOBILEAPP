import { useEffect, useState } from 'react';
import { limitToLast, onValue, orderByChild, query, ref } from 'firebase/database';
import { firebase } from '@/services/firebase';
import { messageSchema, type Message } from '@/types/models';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/utils/errors';
export function useChat(id: string, enabled = true) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    setMessages([]);
    setError('');
    setLoading(true);
    if (!user || !id || !enabled) {
      setLoading(false);
      return;
    }
    const source = query(
      ref(firebase().realtime, `conversations/${id}/messages`),
      orderByChild('createdAt'),
      limitToLast(200),
    );
    return onValue(
      source,
      (snapshot) => {
        try {
          const next: Message[] = [];
          snapshot.forEach((item) => {
            next.push(messageSchema.parse(item.val() as unknown));
          });
          setMessages(next);
          setError('');
        } catch {
          setError('Não foi possível interpretar as mensagens.');
        }
        setLoading(false);
      },
      (failure) => {
        setMessages([]);
        setError(errorMessage(failure));
        setLoading(false);
      },
    );
  }, [id, user, enabled]);
  return { messages, error, loading };
}
