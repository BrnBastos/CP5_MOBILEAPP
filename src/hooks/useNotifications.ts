import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { registerDevice, subscribeNotifications } from '@/services/notifications';
import { errorMessage } from '@/utils/errors';
export function useNotifications() {
  const { user, profile } = useAuth();
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let disposed = false;
    const cleanup: (() => void)[] = [];
    setNotice('');
    if (!user || !profile) return;
    const save = (unsubscribe: () => void) => {
      if (disposed) unsubscribe();
      else cleanup.push(unsubscribe);
    };
    void registerDevice((failure) => {
      if (!disposed) setNotice(errorMessage(failure));
    })
      .then(save)
      .catch((error: unknown) => {
        if (!disposed) setNotice(errorMessage(error));
      });
    void subscribeNotifications((id) => {
      if (!disposed) router.push({ pathname: '/chat/[id]', params: { id } });
    })
      .then(save)
      .catch((error: unknown) => {
        if (!disposed) setNotice(errorMessage(error));
      });
    return () => {
      disposed = true;
      cleanup.forEach((off) => off());
    };
  }, [user, profile]);
  return notice;
}
