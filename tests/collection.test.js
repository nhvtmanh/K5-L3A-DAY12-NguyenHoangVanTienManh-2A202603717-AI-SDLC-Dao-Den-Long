import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGame, step, snapshot, TUNING } from '../src/core/game.js';

test('pickup is inclusive in XZ, capacity leaves excess motes, scenario grants no score', () => {
  const g = createGame({ random_motes: false, player: { pos: [0, 0, 0], carried: 9 }, motes: [[1, 0, 0], [0, 0, 0], [1.001, 0, 0]] });
  assert.equal(g.score, 0);
  assert.equal(snapshot(g).motes_active, 3);
  assert.deepEqual(step(g), [{ type: 'event', tick: 1, name: 'mote_picked', data: { carried: 10 } }]);
  assert.equal(g.score, 0); assert.equal(g.motes.length, 2);
  step(g); assert.equal(g.score, 0); assert.equal(g.motes.length, 2);
  const outside = createGame({ random_motes: false, motes: [[1.001, 0, 0]] });
  assert.deepEqual(step(outside), []); assert.equal(outside.player.carried, 0);
});

test('partial deposits, nearest unlit lantern, inclusive radius, and interaction rising edges', () => {
  const g = createGame({ random_motes: false, player: { carried: 3 }, lanterns: [{ id: 'L1', pos: [2, 0, 0] }] });
  assert.deepEqual(step(g, { interact: true }), [{ type: 'event', tick: 1, name: 'deposit', data: { lantern_id: 'L1', amount: 3, deposited: 3 } }]);
  g.player.carried = 10;
  assert.deepEqual(step(g, { interact: true }), []);
  step(g, { interact: false });
  const events = step(g, { interact: true });
  assert.deepEqual(events.map(e => e.name), ['deposit', 'lantern_lit']);
  assert.equal(events[0].data.amount, 7); assert.equal(g.player.carried, 3); assert.equal(g.score, 200);
  step(g, { interact: false }); assert.deepEqual(step(g, { interact: true }), []);
  const nearest = createGame({ random_motes: false, player: { carried: 20 }, lanterns: [{ id: 'L1', pos: [2, 0, 0] }, { id: 'L2', pos: [1, 0, 0] }] });
  assert.equal(step(nearest, { interact: true })[0].data.lantern_id, 'L2');
  const tie = createGame({ random_motes: false, player: { carried: 20 }, lanterns: [{ id: 'L2', pos: [-1, 0, 0] }, { id: 'L1', pos: [1, 0, 0] }] });
  assert.equal(step(tie, { interact: true })[0].data.lantern_id, 'L1');
  const outside = createGame({ random_motes: false, player: { carried: 20 }, lanterns: [{ id: 'L1', pos: [2.001, 0, 0] }] });
  assert.deepEqual(step(outside, { interact: true }), []);
  assert.equal(outside.player.carried, 20);
});

test('seeded initial distribution and scenario overrides', () => {
  assert.deepEqual(snapshot(createGame({}, 42)), snapshot(createGame({}, 42)));
  assert.notDeepEqual(createGame({}, 42).motes, createGame({}, 43).motes);
  const g = createGame({}, 42);
  assert.equal(g.motes.length, 20);
  assert.equal(new Set(g.motes.map(m=>m.pos.join(','))).size,20);
  assert.ok(g.motes.every(m => Math.hypot(m.pos[0], m.pos[2]) <= 33.000001));
  assert.equal(createGame({ random_motes: false }).motes.length, 0);
  assert.equal(createGame({ motes: [] }).motes.length, 0);
  assert.equal(createGame({ random_motes: true, motes: [[0, 0, 0]] }).motes.length, 1);
  assert.equal(createGame({ lanterns: [{ id: 'L1', lit: true }] }).score, 0);
});

test('contract tuning matches implemented mechanics', () => {
  const contract = JSON.parse(readFileSync('game.contract.json', 'utf8'));
  for (const [key, value] of Object.entries(TUNING)) assert.deepEqual(contract.tuning[key], value, key);
  assert.equal(contract.tuning.lantern_count_night1, createGame().lanterns.length);
});

test('all five initially unlit lanterns can be completed using finite motes', () => {
  const g = createGame({ random_motes: false, player: { carried: 10 },
    motes: Array.from({ length: 40 }, () => [0, 0, 0]),
    lanterns: Array.from({ length: 5 }, (_, i) => ({ id: `L${i + 1}`, pos: [0, 0, 0] })),
  });
  const events = [];
  for (let k = 0; k < 9; k++) events.push(...step(g, { interact: k % 2 === 0 }));
  assert.equal(g.state, 'won'); assert.equal(g.tick, 9);
  assert.equal(g.player.carried, 0); assert.equal(g.motes.length, 0);
  assert.equal(events.filter(e => e.name === 'mote_picked').length, 40);
  assert.deepEqual(events.filter(e => e.name === 'lantern_lit').map(e => e.data.lantern_id), ['L1', 'L2', 'L3', 'L4', 'L5']);
  assert.equal(g.score, 1748);
});

test('terminal precedence and win reward applied only once', () => {
  const lanterns = Array.from({ length: 5 }, (_, i) => ({ id: `L${i + 1}`, lit: true }));
  const won = createGame({ random_motes: false, lanterns, time_left_s: 0 });
  assert.equal(step(won)[0].data.reason, 'all_lit');
  assert.equal(won.score, 150); assert.deepEqual(step(won), []); assert.equal(won.score, 150);
  const dead = createGame({ random_motes: false, lanterns, player: { flames: 0 }, time_left_s: 0 });
  assert.equal(step(dead)[0].data.reason, 'no_flames'); assert.equal(dead.score, 0);
});

test('CLI collection-to-win fixture has exact events, snapshots and deterministic output', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lantern-collection-'));
  try {
    let previous;
    for (const filename of ['a.jsonl', 'b.jsonl']) {
      const out = join(dir, filename);
      const result = spawnSync(process.execPath, ['src/headless/cli.js', '--seed', '7', '--night', '1', '--ticks', '60', '--snapshot-every', '1', '--scenario', 'tests/fixtures/collection-win.scenario.json', '--inputs', 'tests/fixtures/collection-win.inputs.json', '--out', out], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      const raw = readFileSync(out, 'utf8');
      if (previous) assert.equal(raw, previous);
      previous = raw;
      const rows = raw.trim().split('\n').map(JSON.parse);
      assert.equal(rows[0].tick, 0); assert.equal(rows[0].score, 0); assert.equal(rows[0].player.carried, 9);
      assert.deepEqual(rows.filter(r => r.type === 'event' && r.tick>0), [
        { type: 'event', tick: 1, name: 'mote_picked', data: { carried: 10 } },
        { type: 'event', tick: 1, name: 'deposit', data: { lantern_id: 'L1', amount: 10, deposited: 10 } },
        { type: 'event', tick: 1, name: 'lantern_lit', data: { lantern_id: 'L1' } },
        { type: 'event', tick: 1, name: 'game_over', data: { result: 'won', reason: 'all_lit' } },
      ]);
      assert.equal(rows.at(-2).player.carried, 0); assert.equal(rows.at(-2).motes_active, 0);
      assert.deepEqual(rows.at(-1), { type: 'end', ticks: 1, state: 'won', score: 948 });
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
