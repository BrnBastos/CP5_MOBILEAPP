import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import { z } from 'zod';
import { createApp } from '../src/app.ts';
import { deleteApp, getApp } from 'firebase-admin/app';
import { services } from '../src/services/firebase.ts';

const enabled = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
test(
  'integração: concorrência, deduplicação, revogação e regras dos bancos',
  { skip: !enabled, timeout: 30000 },
  async (context) => {
    const app = createApp();
    app.listen(0, '127.0.0.1');
    context.after(
      () =>
        new Promise<void>((resolve, reject) =>
          app.close((error) => (error ? reject(error) : resolve())),
        ),
    );
    await once(app, 'listening');
    const address = app.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    const { auth, db } = services();
    context.after(async () => {
      await deleteApp(getApp());
    });
    const people: { uid: string; token: string }[] = [];
    for (let index = 0; index < 5; index++) {
      const uid = randomUUID(),
        email = `${uid}@example.test`,
        password = 'test-password-123';
      await auth.createUser({ uid, email, password });
      const response = await fetch(
        `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        },
      );
      assert.equal(response.status, 200);
      const { idToken } = z.object({ idToken: z.string() }).parse(await response.json());
      people.push({ uid, token: idToken });
    }
    const [owner, member, first, second, stranger] = people;
    assert.ok(owner && member && first && second && stranger);
    async function request(
      person: { token: string },
      path: string,
      method = 'GET',
      body?: unknown,
    ) {
      const response = await fetch(base + path, {
        method,
        headers: { Authorization: `Bearer ${person.token}`, 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, data: (await response.json()) as unknown };
    }
    for (const person of people) {
      assert.equal(
        (
          await request(person, '/profile', 'PUT', {
            name: 'Pessoa de teste',
            phoneNumber: '11999999999',
            birthDate: '2000-01-01',
            photoUrl: '',
          })
        ).status,
        200,
      );
    }
    const created = await request(owner, '/groups', 'POST', {
      name: 'Grupo de teste',
      memberIds: [owner.uid, member.uid],
      memberLimit: 3,
      notificationPolicy: 'disabled',
      photoUrl: '',
    });
    assert.equal(created.status, 200);
    const { id } = z.object({ id: z.string() }).parse(created.data);
    const simultaneous = await Promise.all(
      [first, second].map((person) =>
        request(owner, `/groups/${id}/members`, 'POST', { action: 'add', memberId: person.uid }),
      ),
    );
    assert.equal(simultaneous.filter((result) => result.status === 200).length, 1);
    assert.equal(simultaneous.filter((result) => result.status === 409).length, 1);
    const group = (await db.collection('groups').doc(id).get()).data();
    assert.equal(group?.memberIds.length, 3);
    assert.equal(
      (
        await request(stranger, `/conversations/${id}/messages`, 'POST', {
          id: randomUUID(),
          text: 'fora',
          target: { type: 'conversation' },
        })
      ).status,
      403,
    );
    assert.equal((await request(stranger, `/profiles/${owner.uid}`)).status, 403);
    assert.equal((await request(member, `/profiles/${owner.uid}`)).status, 200);
    const direct = await Promise.all([
      request(owner, '/direct', 'POST', { otherId: member.uid }),
      request(member, '/direct', 'POST', { otherId: owner.uid }),
    ]);
    assert.deepEqual(
      direct.map((result) => result.status),
      [200, 200],
    );
    assert.equal(
      z.object({ id: z.string() }).parse(direct[0]?.data).id,
      z.object({ id: z.string() }).parse(direct[1]?.data).id,
    );
    const messageId = randomUUID();
    const payload = {
      id: messageId,
      text: 'mensagem persistida',
      senderId: stranger.uid,
      target: { type: 'conversation' },
    };
    const saved = await request(member, `/conversations/${id}/messages`, 'POST', payload);
    assert.equal(saved.status, 200);
    assert.equal(z.object({ senderId: z.string() }).parse(saved.data).senderId, member.uid);
    assert.equal(
      (await request(member, `/conversations/${id}/messages`, 'POST', payload)).status,
      200,
    );
    const push = { conversationId: id, messageId };
    const notifications = await Promise.all([
      request(member, '/notifications/messages', 'POST', push),
      request(member, '/notifications/messages', 'POST', push),
    ]);
    assert.equal(
      notifications.filter(
        (result) => z.object({ duplicate: z.boolean() }).parse(result.data).duplicate,
      ).length,
      1,
    );
    const realtimeURL = `http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST}/conversations/${id}/messages.json?ns=demo-cp5-default-rtdb&auth=`;
    assert.equal((await fetch(realtimeURL + member.token)).status, 200);
    assert.equal((await fetch(realtimeURL + stranger.token)).status, 401);
    assert.equal(
      (
        await fetch(realtimeURL + member.token, {
          method: 'PUT',
          body: JSON.stringify({ forged: true }),
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request(owner, `/groups/${id}/members`, 'POST', {
          action: 'remove',
          memberId: member.uid,
        })
      ).status,
      200,
    );
    assert.equal((await fetch(realtimeURL + member.token)).status, 401);
    assert.equal(
      (
        await request(member, `/conversations/${id}/messages`, 'POST', {
          ...payload,
          id: randomUUID(),
        })
      ).status,
      403,
    );
    const privateProfile = await fetch(
      `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-cp5/databases/(default)/documents/users/${owner.uid}`,
      { headers: { Authorization: `Bearer ${stranger.token}` } },
    );
    assert.equal(privateProfile.status, 403);
  },
);
