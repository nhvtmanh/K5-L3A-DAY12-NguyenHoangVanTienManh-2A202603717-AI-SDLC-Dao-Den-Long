import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGame, step } from '../src/core/game.js';

test('camera rotation, normalization, and fixed-step movement', () => {
  const g = createGame();
  for (let i = 0; i < 60; i++) step(g, { move: [0, 1], cam_yaw_deg: 90 });
  assert.ok(Math.abs(g.player.pos[0] - 5) < 1e-9);
  assert.ok(Math.abs(g.player.pos[2]) < 1e-9);
  const diagonal = createGame();
  for (let i = 0; i < 60; i++) step(diagonal, { move: [1, 1] });
  assert.ok(Math.abs(Math.hypot(...[diagonal.player.pos[0], diagonal.player.pos[2]]) - 5) < 1e-9);
});
test('CLI tick boundaries, sticky input, determinism, dawn and invalid JSON', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lantern-test-'));
  try {
    const inputs = join(dir, 'inputs.json'), scenario = join(dir, 'scenario.json');
    writeFileSync(inputs, JSON.stringify({ frames: [{ tick: 0, move: [0, 1] }, { tick: 30, jump: true }] }));
    writeFileSync(scenario, JSON.stringify({ random_motes: false, random_shades: false }));
    const run = (out, extra = []) => spawnSync(process.execPath, ['src/headless/cli.js', '--seed', '7', '--night', '1', '--ticks', '60', '--out', out, ...(extra.includes('--scenario') ? [] : ['--scenario', scenario]), ...extra], { encoding: 'utf8' });
    const a = join(dir, 'a.jsonl'), b = join(dir, 'b.jsonl');
    assert.equal(run(a, ['--inputs', inputs]).status, 0);
    assert.equal(run(b, ['--inputs', inputs]).status, 0);
    assert.equal(readFileSync(a, 'utf8'), readFileSync(b, 'utf8'));
    const rows = readFileSync(a, 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(rows[0].tick, 0); assert.equal(rows[0].player.pos[2], 0);
    assert.equal(rows.at(-2).player.pos[2], 5); assert.equal(rows.at(-2).time_left_s, 299);
    assert.deepEqual(rows.at(-1), { type: 'end', ticks: 60, state: 'playing', score: 0 });
    writeFileSync(scenario, JSON.stringify({ time_left_s: 1 / 60, random_motes: false }));
    assert.equal(run(a, ['--scenario', scenario]).status, 0);
    const dawn = readFileSync(a, 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(dawn[1].name, 'game_over'); assert.equal(dawn[1].tick, 1);
    assert.equal(dawn.at(-1).ticks, 1);
    writeFileSync(inputs, '{broken'); assert.equal(run(a, ['--inputs', inputs]).status, 2);
    writeFileSync(inputs, JSON.stringify({ frames: [{ tick: 0 }, { tick: 0 }] }));
    assert.equal(run(a, ['--inputs', inputs]).status, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
