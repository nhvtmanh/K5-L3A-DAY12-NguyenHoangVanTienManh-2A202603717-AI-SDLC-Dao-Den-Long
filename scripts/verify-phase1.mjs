import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createGame, step } from '../src/core/game.js';

const directory = 'docs/proof/phase-1';
mkdirSync(directory, { recursive: true });
const game = createGame({}, 7), frames = [];
while (game.tick < 18000 && game.state === 'playing') {
  const p = game.player.pos;
  const distance = o => Math.hypot(o.pos[0] - p[0], o.pos[2] - p[2]);
  const lamp = game.lanterns.filter(l => !l.lit).sort((a, b) => distance(a) - distance(b))[0];
  const target = game.player.carried >= 10 - lamp.deposited || !game.motes.length
    ? lamp : [...game.motes].sort((a, b) => distance(a) - distance(b))[0];
  const d = distance(target);
  const frame = {
    tick: game.tick,
    move: d > .5 ? [(target.pos[0] - p[0]) / d, (target.pos[2] - p[2]) / d] : [0, 0],
    interact: d <= 2 && target === lamp && game.tick % 2 === 0,
    pulse: game.player.carried >= 3 && game.tick >= game.pulseReadyTick
      && game.shades.some(s => s.state !== 'stunned' && distance(s) < 2),
  };
  frames.push(frame); step(game, frame);
}
assert.equal(game.state, 'won', 'Default Night 1 route must win without scenario overrides');
writeFileSync(`${directory}/night1.inputs.json`, JSON.stringify({ frames }) + '\n');
const run = (out, extra) => {
  const result = spawnSync(process.execPath, ['src/headless/cli.js', '--seed', '7', '--night', '1', '--ticks', '18000', '--out', out, ...extra], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return readFileSync(out, 'utf8');
};
const first = run(`${directory}/night1-win.jsonl`, ['--inputs', `${directory}/night1.inputs.json`]);
const secondPath = `${directory}/night1-repeat.jsonl`;
try { assert.equal(run(secondPath, ['--inputs', `${directory}/night1.inputs.json`]), first); }
finally { rmSync(secondPath, { force: true }); }
const rows = first.trim().split('\n').map(JSON.parse);
assert.equal(rows[0].player.carried, 0);
assert.equal(rows[0].lanterns.filter(l => l.lit).length, 0);
assert.equal(rows.filter(r => r.name === 'lantern_lit').length, 5);
assert.deepEqual(rows.at(-1), { type: 'end', ticks: game.tick, state: 'won', score: game.score });
const idle = run(`${directory}/night1-idle-loss.jsonl`, []).trim().split('\n').map(JSON.parse);
assert.deepEqual(idle.at(-2).data, { result: 'lost', reason: 'no_flames' });
const report = {
  seed: 7, scenario: 'none; default Night 1', deterministic: true,
  won: rows.at(-1), idle_loss: idle.at(-1),
  events: rows.filter(r => r.type === 'event').reduce((counts, row) => { counts[row.name] = (counts[row.name] ?? 0) + 1; return counts; }, {}),
};
writeFileSync(`${directory}/night1-summary.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
