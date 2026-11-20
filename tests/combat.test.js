import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, snapshot } from '../src/core/game.js';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const quiet = { random_motes: false, random_shades: false };
test('two seeded shades spawn at tick 300 beyond 15m; scenario replaces and disables spawning', () => {
  const a = createGame({}, 99), b = createGame({}, 99);
  assert.deepEqual(snapshot(a), snapshot(b));
  assert.equal(a.shades.length, 0);
  for(let i=0;i<300;i++)step(a);
  assert.equal(a.shades.length, 2);
  assert.equal(new Set(a.shades.map(s => s.id)).size, 2);
  assert.ok(a.shades.every(s => Math.hypot(s.pos[0], s.pos[2]) >= 15));
  assert.equal(createGame(quiet).shades.length, 0);
  assert.equal(createGame({ shades: [] }).shades.length, 0);
  const scenario = createGame({ ...quiet, shades: [{ id: 'custom', pos: [10, 0, 0] }] });
  assert.equal(scenario.shades.length, 1);
  step(scenario);
  assert.ok(Math.abs(scenario.shades[0].pos[0] - (10 - 4 / 60)) < 1e-9);
  assert.equal(scenario.shades[0].id, 'custom');
  const mixed = createGame({ ...quiet, shades: [{ pos: [1, 0, 0] }, { id: 'S1', pos: [2, 0, 0] }] });
  assert.equal(new Set(mixed.shades.map(s => s.id)).size, 2);
});

test('CLI combat fixture is deterministic, contains stunned snapshots, and ends with no_flames', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lantern-combat-'));
  try {
    let previous;
    for (const name of ['a.jsonl', 'b.jsonl']) {
      const out = join(dir, name);
      const result = spawnSync(process.execPath, ['src/headless/cli.js', '--seed', '7', '--night', '1', '--ticks', '600', '--scenario', 'tests/fixtures/combat.scenario.json', '--inputs', 'tests/fixtures/combat.inputs.json', '--out', out], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      const raw = readFileSync(out, 'utf8');
      if (previous) assert.equal(raw, previous);
      previous = raw;
      const rows = raw.trim().split('\n').map(JSON.parse);
      assert.equal(rows[0].shades[0].state, 'chase');
      assert.ok(rows.some(r => r.type === 'snapshot' && r.shades[0].state === 'stunned'));
      const hits = rows.filter(r => r.name === 'player_hit');
      assert.equal(hits.length, 3); assert.equal(hits[1].tick - hits[0].tick, 90);
      assert.equal(hits[2].tick - hits[1].tick, 90);
      assert.deepEqual(rows.at(-2).data, { result: 'lost', reason: 'no_flames' });
      assert.equal(rows.at(-1).state, 'lost'); assert.equal(rows.at(-1).score, 5);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('contact loses one flame; simultaneous shades respect 90 ticks of invulnerability and drop half', () => {
  const g = createGame({ ...quiet, player: { carried: 8 }, shades: [{ pos: [0, 0, 0] }, { pos: [0, 0, 0] }] });
  const hits = [];
  while (g.state === 'playing') hits.push(...step(g).filter(e => e.name === 'player_hit'));
  assert.deepEqual(hits.map(e => e.tick), [1, 91, 181]);
  assert.deepEqual(hits.map(e => e.data), [
    { by: 'shade', flames: 2, dropped: 4 }, { by: 'shade', flames: 1, dropped: 2 }, { by: 'shade', flames: 0, dropped: 1 },
  ]);
  assert.equal(g.player.carried, 1); assert.equal(g.state, 'lost'); assert.equal(g.tick, 181);
});

test('hit radius is inclusive and measured in XZ after the shade movement', () => {
  const at = createGame({ ...quiet, shades: [{ pos: [1, .8, 0] }] });
  assert.equal(step(at).filter(e => e.name === 'player_hit').length, 1);
  const beyond = createGame({ ...quiet, shades: [{ pos: [1 + 4 / 60 + .0001, .8, 0] }] });
  assert.equal(step(beyond).filter(e => e.name === 'player_hit').length, 0);
});

test('pulse inclusive radius, cost, push, score, stun and recovery exactly after 120 ticks', () => {
  const g = createGame({ ...quiet, player: { carried: 6, invuln_ticks: 200 }, shades: [{ id: 'edge', pos: [5, .8, 0] }, { id: 'outside', pos: [5.001, .8, 0] }] });
  assert.deepEqual(step(g, { pulse: true }), [{ type: 'event', tick: 1, name: 'pulse', data: { stunned_ids: ['edge'] } }]);
  assert.equal(g.player.carried, 3); assert.equal(g.score, 5);
  assert.ok(Math.abs(g.shades[0].pos[0]-(5+4/15))<1e-9); assert.equal(g.shades[0].state, 'stunned');
  while (g.tick < 120) step(g, { pulse: true });
  assert.equal(g.player.carried, 3); assert.ok(Math.abs(g.shades[0].pos[0]-9)<1e-9);
  step(g);
  assert.equal(g.shades[0].state, 'chase');
  assert.ok(Math.abs(g.shades[0].pos[0] - (9 - 4 / 60)) < 1e-9);
});

test('pulse needs resources and a rising edge; cooldown permits the next pulse at tick 181', () => {
  const poor = createGame({ ...quiet, player: { carried: 2 } });
  assert.deepEqual(step(poor, { pulse: true }), []); assert.equal(poor.player.carried, 2);
  const g = createGame({ ...quiet, player: { carried: 9 } });
  assert.equal(step(g, { pulse: true })[0].name, 'pulse');
  step(g, { pulse: false }); assert.deepEqual(step(g, { pulse: true }), []);
  while (g.tick < 180) step(g, { pulse: false });
  assert.equal(step(g, { pulse: true })[0].name, 'pulse');
  assert.equal(g.tick, 181); assert.equal(g.player.carried, 3);
  assert.equal(g.score, 0);
});

test('pulse before shade contact prevents damage, including zero-distance push', () => {
  const g = createGame({ ...quiet, player: { carried: 3 }, shades: [{ pos: [0, 0, 0] }] });
  const events = step(g, { pulse: true });
  assert.deepEqual(events.map(e => e.name), ['pulse']);
  assert.equal(g.player.flames, 3); assert.ok(Math.abs(g.shades[0].pos[0]-4/15)<1e-9);
});

test('lit lantern repels shades within 30 ticks; unlit lantern does not', () => {
  const g = createGame({ ...quiet, lanterns: [{ id: 'L1', pos: [0, 0, 0], lit: true }], shades: [{ pos: [0, 0, 0] }, { pos: [5, 0, 0] }] });
  for (let i = 0; i < 180; i++) {
    step(g);
    if(i>=29)assert.ok(g.shades.every(s => Math.hypot(s.pos[0], s.pos[2]) >= 6-1e-6));
  }
  assert.equal(g.player.flames, 3);
  const edge = createGame({ ...quiet, player: { pos: [6, 0, 0] }, lanterns: [{ id: 'L1', pos: [0, 0, 0], lit: true }], shades: [{ pos: [6.1, .8, 0] }] });
  assert.deepEqual(step(edge), []); assert.equal(edge.player.flames, 3);
  const unlit = createGame({ ...quiet, lanterns: [{ id: 'L1', pos: [0, 0, 0] }], shades: [{ pos: [0, 0, 0] }] });
  assert.equal(step(unlit)[0].name, 'player_hit');
  const lighting = createGame({ ...quiet, player: { carried: 10 }, lanterns: [{ id: 'L1', pos: [0, 0, 0] }], shades: [{ pos: [0, 0, 0] }] });
  assert.deepEqual(step(lighting, { interact: true }).map(e => e.name), ['deposit', 'lantern_lit']);
  assert.equal(lighting.player.flames, 3);
  for(let i=0;i<29;i++)step(lighting);
  assert.ok(lighting.shades[0].pos[0]>=6-1e-6);
});
