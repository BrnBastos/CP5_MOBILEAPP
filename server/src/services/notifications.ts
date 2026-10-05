import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ApiError } from '../errors.ts';
import { messageSchema, recipients } from '../domain.ts';
import { services } from './firebase.ts';
import { conversation } from './conversations.ts';

const deviceSchema = z.object({ token: z.string(), enabled: z.boolean() });
export async function notify(uid: string, conversationId: string, messageId: string) {
  const { db, realtime, messaging } = services();
  const raw = (
    await realtime.ref(`conversations/${conversationId}/messages/${messageId}`).get()
  ).val() as unknown;
  if (!raw) throw new ApiError(404, 'Mensagem não encontrada.');
  const message = messageSchema.parse(raw);
  if (message.senderId !== uid) throw new ApiError(403, 'Somente o remetente pode solicitar push.');
  const metadata = await conversation(conversationId, uid);
  const job = db.collection('notificationJobs').doc(`${conversationId}_${messageId}`);
  const claim = randomUUID();
  const acquired = await db.runTransaction(async (transaction) => {
    if ((await transaction.get(job)).exists) return false;
    transaction.create(job, { claim, state: 'processing', createdAt: Date.now() });
    return true;
  });
  if (!acquired) return { duplicate: true };
  try {
    const tokens: { token: string; path: string }[] = [];
    for (const member of recipients(message, metadata.members, metadata.policy)) {
      const devices = await db.collection('users').doc(member).collection('devices').get();
      for (const device of devices.docs) {
        const parsed = deviceSchema.safeParse(device.data());
        if (parsed.success && parsed.data.enabled)
          tokens.push({ token: parsed.data.token, path: device.ref.path });
      }
    }
    const unique = [...new Map(tokens.map((device) => [device.token, device])).values()];
    // Claim is durable and never automatically replayed after an ambiguous FCM timeout.
    let successes = 0;
    for (let offset = 0; offset < unique.length; offset += 500) {
      const batch = unique.slice(offset, offset + 500);
      const result = await messaging.sendEachForMulticast({
        tokens: batch.map((device) => device.token),
        notification: { title: 'Nova mensagem', body: 'Abra o chat para ver a mensagem.' },
        data: { conversationId, conversationType: message.conversationType, messageId },
        android: { priority: 'high', notification: { channelId: 'messages', tag: messageId } },
        apns: { headers: { 'apns-collapse-id': messageId } },
      });
      successes += result.successCount;
      for (const [index, response] of result.responses.entries()) {
        if (
          response.error &&
          [
            'messaging/invalid-registration-token',
            'messaging/registration-token-not-registered',
          ].includes(response.error.code)
        ) {
          const device = batch[index];
          if (device) await db.doc(device.path).update({ enabled: false, updatedAt: Date.now() });
        }
      }
    }
    await job.update({ state: 'sent', successes, completedAt: Date.now() });
    return { duplicate: false, sent: successes };
  } catch {
    await job.update({ state: 'failed', completedAt: Date.now() });
    throw new ApiError(502, 'Mensagem salva, mas o push não pôde ser confirmado.');
  }
}
