import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ApiError } from '../errors.ts';
import { directSchema, groupSchema, validateGroup, groupInputSchema } from '../domain.ts';
import { services } from './firebase.ts';

export async function conversation(id: string, uid: string) {
  const { db } = services();
  const direct = await db.collection('directConversations').doc(id).get();
  if (direct.exists) {
    const item = directSchema.parse(direct.data());
    if (item.state !== 'ready')
      throw new ApiError(409, 'Conversa em atualização. Tente novamente.');
    if (!item.participantIds.includes(uid)) throw new ApiError(403, 'Sem acesso à conversa.');
    return {
      type: 'direct' as const,
      members: [...item.participantIds],
      policy: 'direct_messages_only' as const,
      item,
    };
  }
  const snapshot = await db.collection('groups').doc(id).get();
  if (!snapshot.exists) throw new ApiError(404, 'Conversa não encontrada.');
  const item = groupSchema.parse(snapshot.data());
  if (item.state !== 'ready') throw new ApiError(409, 'Grupo em atualização. Tente novamente.');
  if (!item.memberIds.includes(uid)) throw new ApiError(403, 'Sem acesso ao grupo.');
  return { type: 'group' as const, members: item.memberIds, policy: item.notificationPolicy, item };
}

// ACL uses a monotonic revision, so a delayed worker cannot restore an old membership.
export async function finishSync(collection: string, id: string) {
  const { db, realtime } = services();
  const ref = db.collection(collection).doc(id);
  const snapshot = await ref.get();
  const data = snapshot.data();
  if (!data || data.state !== 'syncing') return;
  const revision = z.number().int().parse(data.revision);
  const next =
    collection === 'groups' ? groupSchema.parse(data.pending) : directSchema.parse(data.pending);
  const members = 'memberIds' in next ? next.memberIds : next.participantIds;
  const acl = realtime.ref(`conversations/${id}/access`);
  const schema = z.object({
    revision: z.number(),
    ready: z.boolean(),
    members: z.record(z.string(), z.boolean()).default({}),
  });
  await acl.transaction((raw: unknown) => {
    const current = raw === null ? null : schema.parse(raw);
    if (
      current &&
      (current.revision > revision || (current.revision === revision && current.ready))
    )
      return undefined;
    return { revision, ready: false, members: {} };
  });
  const active = await ref.get();
  if (active.data()?.revision !== revision || active.data()?.state !== 'syncing') return;
  // Preserve pending data until completion, allowing recovery after a process restart.
  const accepted = await db.runTransaction(async (transaction) => {
    const latest = await transaction.get(ref);
    if (latest.data()?.revision !== revision || latest.data()?.state !== 'syncing') return false;
    transaction.update(ref, { ...next, state: 'syncing' });
    return true;
  });
  if (!accepted) return;
  await acl.transaction((raw: unknown) => {
    const current = raw === null ? null : schema.parse(raw);
    if (current && current.revision > revision) return undefined;
    return {
      revision,
      ready: true,
      members: Object.fromEntries(members.map((member) => [member, true])),
    };
  });
  await db.runTransaction(async (transaction) => {
    const latest = await transaction.get(ref);
    if (latest.data()?.revision === revision && latest.data()?.state === 'syncing')
      transaction.set(ref, { ...next, state: 'ready' });
  });
}

export async function recoverSync() {
  for (const collection of ['groups', 'directConversations']) {
    const snapshots = await services()
      .db.collection(collection)
      .where('state', '==', 'syncing')
      .get();
    for (const snapshot of snapshots.docs) await finishSync(collection, snapshot.id);
  }
}

export async function saveGroup(uid: string, raw: unknown, id?: string) {
  const operation = z
    .object({
      action: z.enum(['add', 'remove']),
      memberId: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
    })
    .safeParse(raw);
  const form = operation.success ? null : groupInputSchema.parse(raw);
  const { db } = services();
  const ref = db.collection('groups').doc(id ?? `g_${randomUUID()}`);
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(ref);
    const old = current.exists ? groupSchema.parse(current.data()) : null;
    if (id && !old) throw new ApiError(404, 'Grupo não encontrado.');
    if (old && old.ownerId !== uid) throw new ApiError(403, 'Somente o proprietário pode editar.');
    if (old?.state === 'syncing') throw new ApiError(409, 'Grupo em atualização. Tente novamente.');
    if (operation.success && !old) throw new ApiError(404, 'Grupo não encontrado.');
    const input = validateGroup(
      operation.success && old
        ? {
            ...old,
            memberIds:
              operation.data.action === 'add'
                ? [...new Set([...old.memberIds, operation.data.memberId])]
                : old.memberIds.filter((member) => member !== operation.data.memberId),
          }
        : groupInputSchema.parse(form),
      uid,
    );
    const users = await transaction.getAll(
      ...input.memberIds.map((member) => db.collection('users').doc(member)),
    );
    if (users.some((user) => !user.exists))
      throw new ApiError(400, 'Integrante sem cadastro completo.');
    const next = {
      ...input,
      id: ref.id,
      ownerId: uid,
      createdAt: old?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      revision: (old?.revision ?? 0) + 1,
      state: 'ready' as const,
    };
    transaction.set(ref, {
      ...(old ?? next),
      revision: next.revision,
      state: 'syncing',
      pending: next,
    });
  });
  await finishSync('groups', ref.id);
  return { id: ref.id };
}

export async function createDirect(uid: string, otherId: string) {
  if (uid === otherId) throw new ApiError(400, 'Selecione outra pessoa.');
  const participantIds = [uid, otherId].sort();
  const id = `d_${createHash('sha256').update(JSON.stringify(participantIds)).digest('hex')}`;
  const { db } = services();
  const ref = db.collection('directConversations').doc(id);
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(ref);
    if (current.exists) return;
    const users = await transaction.getAll(
      ...participantIds.map((member) => db.collection('users').doc(member)),
    );
    if (users.some((user) => !user.exists))
      throw new ApiError(400, 'Usuário sem cadastro completo.');
    const next = directSchema.parse({
      id,
      type: 'direct',
      participantIds,
      createdAt: Date.now(),
      revision: 1,
      state: 'ready',
    });
    transaction.set(ref, { ...next, state: 'syncing', pending: next });
  });
  await finishSync('directConversations', id);
  return { id };
}
