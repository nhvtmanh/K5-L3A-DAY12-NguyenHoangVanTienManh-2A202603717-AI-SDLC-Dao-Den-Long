import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createGame, step } from '../src/core/game.js';

const directory = 'docs/proof/phase-2/regression-night1';
mkdirSync(directory, { recursive: true });
const game = createGame({}, 7), frames = [];
let targetId=null;
while (game.tick < 18000 && game.state === 'playing') {
  const p = game.player.pos;
  const distance = o => Math.hypot(o.pos[0] - p[0], o.pos[2] - p[2]);
  const lamps=game.lanterns.filter(l=>!l.lit).sort((a,b)=>distance(a)-distance(b));
  const candidates=game.player.carried>=10-lamps[0].deposited||!game.motes.length?lamps:game.motes;
  const target=candidates.find(o=>o.id===targetId)??[...candidates].sort((a,b)=>distance(a)-distance(b))[0];
  targetId=target.id;
  const d = distance(target);
  const goal=[(target.pos[0]-p[0])/Math.max(.01,d),(target.pos[2]-p[2])/Math.max(.01,d)];
  const threats=game.shades.filter(s=>!['stunned','spawning','recoil'].includes(s.state));
  let heading=goal,best=-Infinity;
  // Controller-only avoidance. The resulting ordinary inputs are replayed by the unmodified CLI.
  for(let j=0;j<32;j++){
    const a=j*Math.PI/16,v=[Math.cos(a),Math.sin(a)],future=[p[0]+v[0]*4.2,p[2]+v[1]*4.2];
    let score=(v[0]*goal[0]+v[1]*goal[1])*3;
    const radius=Math.hypot(...future);if(radius>38)score-=(radius-38)*20;
    for(const s of threats){const sd=distance(s),dx=(p[0]-s.pos[0])/Math.max(.01,sd),dz=(p[2]-s.pos[2])/Math.max(.01,sd);const predicted=[s.pos[0]+dx*2.8,s.pos[2]+dz*2.8];const pd=Math.hypot(future[0]-predicted[0],future[1]-predicted[1]);score-=Math.max(0,3-pd)**2*2;}
    if(score>best){best=score;heading=v;}
  }
  if(d<.5&&!lamps.includes(target))heading=[0,0];
  const danger=Math.min(...threats.map(distance));
  const frame = {
    tick: game.tick,
    move:heading,interact:d<=2&&lamps.includes(target)&&game.tick%2===0,
    dash:game.dashCd===0&&danger<6&&d>2,
    pulse:game.player.carried>=3&&game.pulseCd===0&&danger<1.5,
  };
  frames.push(frame); step(game, frame);
}
if(game.state!=='won')console.error(JSON.stringify({state:game.state,tick:game.tick,pos:game.player.pos,score:game.score,flames:game.player.flames,carried:game.player.carried,lit:game.lanterns.filter(l=>l.lit).length,motes:game.motes.length}));
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
