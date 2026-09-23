import { test, describe } from 'node:test';
import assert from 'node:assert';
import { hashPassword } from '../src/game/supabase.js';

describe('VanguarDZ Security & Hashing', () => {
  test('hashPassword produces 64-character SHA-256 hex string', async () => {
    const hash = await hashPassword('pilot1', 'secretkey123');
    assert.strictEqual(typeof hash, 'string');
    assert.strictEqual(hash.length, 64);
    assert.match(hash, /^[0-9a-f]{64}$/);
  });

  test('hashPassword produces identical hashes for same pilot and password', async () => {
    const hash1 = await hashPassword('pilot1', 'secretkey123');
    const hash2 = await hashPassword('pilot1', 'secretkey123');
    assert.strictEqual(hash1, hash2);
  });

  test('hashPassword generates distinct hashes across different pilot usernames (salted)', async () => {
    const hash1 = await hashPassword('pilotA', 'secretkey123');
    const hash2 = await hashPassword('pilotB', 'secretkey123');
    assert.notStrictEqual(hash1, hash2);
  });

  test('hashPassword handles empty password gracefully', async () => {
    const hash = await hashPassword('pilot1', '');
    assert.strictEqual(hash, '');
  });
});

describe('VanguarDZ Core Mechanics & Room Logic', () => {
  function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  test('generateRoomCode produces valid 4-character uppercase alphabetic code', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      assert.strictEqual(code.length, 4);
      assert.match(code, /^[A-Z]{4}$/);
    }
  });
});
