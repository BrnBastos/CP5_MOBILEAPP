import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ApiError } from '../errors.ts';
import { messageInputSchema, messageSchema, profileSchema } from '../domain.ts';
import { services } from '../services/firebase.ts';
import { conversation, createDirect, saveGroup } from '../services/conversations.ts';
import { notify } from '../services/notifications.ts';

export async function route(
  method: string,
  path: string,
  uid: string,
  raw: unknown,
): Promise<unknown> {
  const { db, auth, realtime } = services();
  const parts = path.split('/').filter(Boolean);
  if (method === 'PUT' && path === '/profile') {
    const input = profileSchema.parse(raw);
    const account = await auth.getUser(uid);
    const ref = db.collection('users').doc(uid);
    const old = await ref.get();
    const profile = {
      ...input,
      uid,
      email: account.email ?? '',
      createdAt: old.data()?.createdAt ?? Date.now(),
    };
    const batch = db.batch();
    batch.set(ref, profile);
    batch.set(db.collection('directory').doc(uid), {
      uid,
      name: input.name,
      photoUrl: input.photoUrl,
    });
    await batch.commit();
    return profile;
  }
  if (method === 'GET' && parts[0] === 'profiles' && parts.length === 2) {
    const id = z.string().min(1).parse(parts[1]);
    if (uid !== id) {
      const [groups, direct] = await Promise.all([
        db.collection('groups').where('memberIds', 'array-contains', uid).get(),
        db.collection('directConversations').where('participantIds', 'array-contains', uid).get(),
      ]);
      if (
        ![...groups.docs, ...direct.docs].some(
          (doc) =>
            doc.data().state === 'ready' &&
            (
              (doc.data().memberIds as unknown[] | undefined) ??
              (doc.data().participantIds as unknown[] | undefined) ??
              []
            ).includes(id),
        )
      )
        throw new ApiError(
          403,
          'Perfil disponível apenas para participantes de uma conversa em comum.',
        );
    }
    const profile = await db.collection('users').doc(id).get();
    if (!profile.exists) throw new ApiError(404, 'Perfil não encontrado.');
    return profile.data();
  }
  if (method === 'POST' && path === '/direct')
    return createDirect(
      uid,
      z.object({ otherId: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/) }).parse(raw).otherId,
    );
  if (method === 'POST' && path === '/groups') return saveGroup(uid, raw);
  if (method === 'PUT' && parts[0] === 'groups' && parts.length === 2)
    return saveGroup(uid, raw, parts[1]);
  if (method === 'POST' && parts[0] === 'groups' && parts[2] === 'members' && parts.length === 3)
    return saveGroup(uid, raw, parts[1]);
  if (
    method === 'POST' &&
    parts[0] === 'conversations' &&
    parts[2] === 'messages' &&
    parts.length === 3
  ) {
    const id = z.string().min(1).parse(parts[1]);
    const metadata = await conversation(id, uid);
    const input = messageInputSchema.parse(raw);
    const directed = [
      ...input.mentionedUserIds,
      ...(input.target.type === 'member' ? [input.target.memberId] : []),
    ];
    if (directed.some((member) => !metadata.members.includes(member)))
      throw new ApiError(400, 'Destinatário não pertence à conversa.');
    if (metadata.type === 'direct' && directed.length)
      throw new ApiError(400, 'Direcionamento disponível apenas em grupos.');
    const message = {
      ...input,
      conversationId: id,
      conversationType: metadata.type,
      senderId: uid,
      createdAt: Date.now(),
    };
    const ref = realtime.ref(`conversations/${id}`);
    const stateSchema = z.object({
      access: z.object({
        revision: z.number(),
        ready: z.boolean(),
        members: z.record(z.string(), z.boolean()).default({}),
      }),
      messages: z.record(z.string(), z.unknown()).optional(),
    });
    const result = await ref.transaction((rawState: unknown) => {
      // A first RTDB callback may see an empty local cache. A no-op null write
      // triggers a server comparison/retry; it never creates a message without ACL.
      if (rawState === null) return null;
      const parsed = stateSchema.safeParse(rawState);
      if (!parsed.success || !parsed.data.access.ready || !parsed.data.access.members[uid])
        return undefined;
      const state = parsed.data;
      if (state.messages?.[input.id]) return undefined;
      return { ...state, messages: { ...state.messages, [input.id]: message } };
    });
    const state = stateSchema.safeParse(result.snapshot.val() as unknown);
    if (!result.committed) {
      const previous = state.success ? state.data.messages?.[input.id] : undefined;
      if (!previous)
        throw new ApiError(403, 'Acesso à conversa removido ou temporariamente indisponível.');
      const existing = messageSchema.parse(previous);
      if (
        existing.senderId !== uid ||
        existing.text !== input.text ||
        JSON.stringify(existing.target) !== JSON.stringify(input.target) ||
        JSON.stringify(existing.mentionedUserIds) !== JSON.stringify(input.mentionedUserIds)
      )
        throw new ApiError(409, 'Identificador já utilizado por outra mensagem.');
      return existing;
    }
    if (!state.success || !state.data.messages?.[input.id])
      throw new ApiError(403, 'Acesso à conversa indisponível.');
    return message;
  }

  if (method === 'POST' && path === '/notifications/messages') {
    const input = z
      .object({
        conversationId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
        messageId: z.string().uuid(),
      })
      .parse(raw);
    return notify(uid, input.conversationId, input.messageId);
  }
  if ((method === 'PUT' || method === 'DELETE') && parts[0] === 'devices' && parts.length === 2) {
    const id = z.string().uuid().parse(parts[1]);
    const ref = db.collection('users').doc(uid).collection('devices').doc(id);
    if (method === 'DELETE') {
      await ref.delete();
      return { removed: true };
    }
    const input = z
      .object({
        token: z.string().min(10).max(4096),
        platform: z.enum(['android', 'ios']),
        enabled: z.boolean(),
      })
      .parse(raw);
    await ref.set({ ...input, updatedAt: Date.now() });
    return { registered: true };
  }
  if (method === 'POST' && path === '/media/signature') {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME,
      apiKey = process.env.CLOUDINARY_API_KEY,
      secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !secret)
      throw new ApiError(503, 'Armazenamento de fotos ainda não configurado.');
    const input = z
      .object({
        groupId: z
          .string()
          .regex(/^[a-zA-Z0-9_-]+$/)
          .optional(),
      })
      .parse(raw);
    if (input.groupId) {
      const group = await db.collection('groups').doc(input.groupId).get();
      if (group.data()?.ownerId !== uid)
        throw new ApiError(403, 'Somente o proprietário pode alterar a foto.');
    }
    const fields = {
      allowed_formats: 'jpg,png,webp',
      public_id: `cp5/${input.groupId ? 'groups/' + input.groupId : 'users/' + uid}/${randomUUID()}`,
      timestamp: Math.floor(Date.now() / 1000),
    };
    const signed = Object.entries(fields)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    return {
      cloudName,
      apiKey,
      ...fields,
      signature: createHash('sha1')
        .update(signed + secret)
        .digest('hex'),
    };
  }
  throw new ApiError(404, 'Endpoint não encontrado.');
}
