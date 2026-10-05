import { z } from 'zod';
import { firebase } from './firebase';
export async function api<T>(
  path: string,
  schema: z.ZodType<T>,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new Error('API ainda não configurada.');
  if (!url.startsWith('https://') && !__DEV__) throw new Error('A API deve usar HTTPS.');
  const user = firebase().auth.currentUser;
  if (!user) throw new Error('Faça login para continuar.');
  const token = await user.getIdToken();
  let response: Response;
  try {
    response = await fetch(`${url.replace(/\/$/, '')}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(90000),
    });
  } catch {
    throw new Error('Sem conexão com a API. Tente novamente em instantes.');
  }
  const raw: unknown = await response.json();
  if (!response.ok) {
    const error = z.object({ error: z.string() }).safeParse(raw);
    throw new Error(error.success ? error.data.error : 'Não foi possível concluir a operação.');
  }
  return schema.parse(raw);
}
export const idResponse = z.object({ id: z.string() });
