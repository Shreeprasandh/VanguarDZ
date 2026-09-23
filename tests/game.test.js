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

describe('VanguarDZ Lexicon Packs & Code Mode', async () => {
  const { LEXICON_PACKS, getLexiconPack, getLexiconWord } = await import('../src/game/lexicons.js');
  const { getWordForEnemy } = await import('../src/game/words.js');

  test('All 5 core lexicon packs are provisioned', () => {
    assert.strictEqual(LEXICON_PACKS.length, 5);
    const ids = LEXICON_PACKS.map(p => p.id);
    assert.deepStrictEqual(ids, ['english', 'python', 'javascript', 'java', 'terminal']);
  });

  test('Code lexicon packs contain strictly lowercase alphanumeric words (no special symbols)', () => {
    const codePacks = LEXICON_PACKS.filter(p => p.id !== 'english');
    for (const pack of codePacks) {
      assert.ok(pack.words, `Pack ${pack.id} must define word lists`);
      assert.ok(pack.words.short.length >= 30, `${pack.id} short tier needs at least 30 words`);
      assert.ok(pack.words.medium.length >= 30, `${pack.id} medium tier needs at least 30 words`);
      assert.ok(pack.words.long.length >= 20, `${pack.id} long tier needs at least 20 words`);

      const allWords = [...pack.words.short, ...pack.words.medium, ...pack.words.long];
      for (const word of allWords) {
        assert.match(word, /^[a-z]+$/, `Word "${word}" in ${pack.id} must be strictly lowercase a-z`);
      }
    }
  });

  test('getLexiconWord returns valid words for wave tiers and hostile types', () => {
    const pyShort = getLexiconWord('python', 2, new Set());
    assert.strictEqual(typeof pyShort, 'string');
    assert.ok(pyShort.length <= 5);

    const pyLong = getLexiconWord('python', 18, new Set(), 'boss');
    assert.strictEqual(typeof pyLong, 'string');
    assert.ok(pyLong.length >= 7);
  });

  test('getWordForEnemy delegates to custom lexicon when packId is specified', () => {
    const used = new Set();
    const word = getWordForEnemy('drone', 2, used, 'python');
    assert.strictEqual(typeof word, 'string');
    const pyPack = getLexiconPack('python');
    const allPyWords = [...pyPack.words.short, ...pyPack.words.medium, ...pyPack.words.long];
    assert.ok(allPyWords.includes(word), `Expected "${word}" to be from Python pack`);
  });
});
