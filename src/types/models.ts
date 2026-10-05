import { z } from 'zod';
export const policySchema = z.enum([
  'all_group_messages',
  'mentioned_members',
  'direct_messages_only',
  'disabled',
]);
export type Policy = z.infer<typeof policySchema>;
export const directorySchema = z.object({
  uid: z.string(),
  name: z.string(),
  photoUrl: z.string(),
});
export type DirectoryUser = z.infer<typeof directorySchema>;
export const userSchema = directorySchema.extend({
  email: z.string(),
  phoneNumber: z.string(),
  birthDate: z.string(),
  createdAt: z.number(),
});
export type ChatUser = z.infer<typeof userSchema>;
export const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  photoUrl: z.string(),
  ownerId: z.string(),
  memberIds: z.array(z.string()),
  memberLimit: z.number(),
  notificationPolicy: policySchema,
  createdAt: z.number(),
  updatedAt: z.number(),
  revision: z.number(),
  state: z.enum(['ready', 'syncing']),
});
export type Group = z.infer<typeof groupSchema>;
export const directSchema = z.object({
  id: z.string(),
  type: z.literal('direct'),
  participantIds: z.tuple([z.string(), z.string()]),
  createdAt: z.number(),
  revision: z.number(),
  state: z.enum(['ready', 'syncing']),
});
export type Direct = z.infer<typeof directSchema>;
export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  conversationType: z.enum(['direct', 'group']),
  senderId: z.string(),
  text: z.string(),
  mentionedUserIds: z.array(z.string()).default([]),
  target: z.discriminatedUnion('type', [
    z.object({ type: z.literal('conversation') }),
    z.object({ type: z.literal('member'), memberId: z.string() }),
  ]),
  createdAt: z.number(),
});
export type Message = z.infer<typeof messageSchema>;
export const policyLabels: Record<Policy, string> = {
  all_group_messages: 'Todas as mensagens',
  mentioned_members: 'Somente integrantes selecionados',
  direct_messages_only: 'Somente conversas individuais',
  disabled: 'Notificações desativadas',
};
