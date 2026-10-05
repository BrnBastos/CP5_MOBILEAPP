import { z } from 'zod';
import { ApiError } from './errors.ts';

export const policySchema = z.enum([
  'all_group_messages',
  'mentioned_members',
  'direct_messages_only',
  'disabled',
]);
export type Policy = z.infer<typeof policySchema>;
const uidSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phoneNumber: z.string().regex(/^\+?[0-9 ()-]{8,20}$/),
  birthDate: z.iso
    .date()
    .refine(
      (value) =>
        value <= new Date().toISOString().slice(0, 10) &&
        new Date(value).toISOString().slice(0, 10) === value,
      'Data futura inválida.',
    ),
  photoUrl: z.url().startsWith('https://res.cloudinary.com/').or(z.literal('')),
});
export const groupInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  photoUrl: z.url().startsWith('https://res.cloudinary.com/').or(z.literal('')),
  memberIds: z.array(uidSchema).min(2).max(100),
  memberLimit: z.number().int().min(2).max(100),
  notificationPolicy: policySchema,
});
export const groupSchema = groupInputSchema.extend({
  id: z.string(),
  ownerId: uidSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
  revision: z.number().int(),
  state: z.enum(['ready', 'syncing']),
});
export type Group = z.infer<typeof groupSchema>;
export const directSchema = z.object({
  id: z.string(),
  type: z.literal('direct'),
  participantIds: z.tuple([uidSchema, uidSchema]),
  createdAt: z.number(),
  revision: z.number(),
  state: z.enum(['ready', 'syncing']),
});
export type Direct = z.infer<typeof directSchema>;
export const messageInputSchema = z.object({
  id: z.string().uuid(),
  text: z.string().trim().min(1).max(4000),
  mentionedUserIds: z.array(uidSchema).max(100).default([]),
  target: z.discriminatedUnion('type', [
    z.object({ type: z.literal('conversation') }),
    z.object({ type: z.literal('member'), memberId: uidSchema }),
  ]),
});
export const messageSchema = messageInputSchema.extend({
  conversationId: z.string(),
  conversationType: z.enum(['direct', 'group']),
  senderId: uidSchema,
  createdAt: z.number(),
});
export type Message = z.infer<typeof messageSchema>;
export function validateGroup(input: z.infer<typeof groupInputSchema>, ownerId: string) {
  const ids = [...new Set(input.memberIds)];
  if (!ids.includes(ownerId)) throw new ApiError(400, 'O proprietário deve permanecer no grupo.');
  if (ids.length < 2 || ids.length > input.memberLimit)
    throw new ApiError(409, 'Quantidade de integrantes incompatível com o limite.');
  return { ...input, memberIds: ids };
}
export function recipients(message: Message, memberIds: string[], policy: Policy): string[] {
  if (
    policy === 'disabled' ||
    (message.conversationType === 'group' && policy === 'direct_messages_only')
  )
    return [];
  const directed = [
    ...message.mentionedUserIds,
    ...(message.target.type === 'member' ? [message.target.memberId] : []),
  ];
  return [...new Set(memberIds)].filter(
    (id) =>
      id !== message.senderId &&
      (message.conversationType === 'direct' ||
        policy === 'all_group_messages' ||
        directed.includes(id)),
  );
}
