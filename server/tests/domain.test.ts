import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recipients, validateGroup, type Message } from '../src/domain.ts';

const message: Message = {
  id: 'x',
  conversationId: 'g',
  conversationType: 'group',
  senderId: 'a',
  text: 'oi',
  createdAt: 0,
  mentionedUserIds: ['b', 'stranger'],
  target: { type: 'member', memberId: 'c' },
};
test('políticas excluem remetente, externos e removidos e deduplicam menções', () => {
  assert.deepEqual(recipients(message, ['a', 'b', 'c', 'd'], 'all_group_messages'), [
    'b',
    'c',
    'd',
  ]);
  assert.deepEqual(recipients(message, ['a', 'b', 'c', 'd'], 'mentioned_members'), ['b', 'c']);
  assert.deepEqual(recipients(message, ['a', 'b'], 'mentioned_members'), ['b']);
  assert.deepEqual(recipients(message, ['a', 'b'], 'disabled'), []);
  assert.deepEqual(recipients(message, ['a', 'b'], 'direct_messages_only'), []);
  assert.deepEqual(
    recipients({ ...message, conversationType: 'direct' }, ['a', 'b'], 'direct_messages_only'),
    ['b'],
  );
});
test('proprietário conta como integrante e redução abaixo da ocupação falha', () => {
  const group = {
    name: 'Grupo',
    photoUrl: '',
    memberIds: ['a', 'b', 'c'],
    memberLimit: 2,
    notificationPolicy: 'disabled' as const,
  };
  assert.throws(() => validateGroup(group, 'a'));
  assert.throws(() => validateGroup({ ...group, memberLimit: 3, memberIds: ['b', 'c'] }, 'a'));
  assert.equal(validateGroup({ ...group, memberIds: ['a', 'b', 'b'] }, 'a').memberIds.length, 2);
});
