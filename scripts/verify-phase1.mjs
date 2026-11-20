import {mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createSurvivalReplay} from './night1-survival.mjs';
const version=JSON.parse(readFileSync('game.contract.json','utf8')).contract_version;
const directory=`docs/proof/${version==='1.3'?'phase-4':'phase-3'}/regression-night1`;mkdirSync(directory,{recursive:true});
const {game,frames}=createSurvivalReplay(7);
assert.equal(game.state,'won','Ordinary default Night1 inputs must survive to dawn');
assert.equal(game.sim_tick,14400);
writeFileSync(`${directory}/night1.inputs.json`,JSON.stringify({frames})+'\n');
function run(out,extra){const result=spawnSync(process.execPath,['src/headless/cli.js','--seed','7','--night','1','--ticks','14400','--out',out,...extra],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);return readFileSync(out,'utf8');}
const first=run(`${directory}/night1-win.jsonl`,['--inputs',`${directory}/night1.inputs.json`]),repeat=`${directory}/repeat.jsonl`;
try{assert.equal(run(repeat,['--inputs',`${directory}/night1.inputs.json`]),first);}finally{rmSync(repeat,{force:true});}
const rows=first.trim().split('\n').map(JSON.parse);assert.equal(rows[0].lanterns.filter(l=>l.lit).length,0);assert.equal(rows[0].player.carried,0);assert.equal(rows[0].player.capacity,10);
assert.deepEqual(rows.at(-1),{type:'end',ticks:14400,state:'won',score:game.score});assert.equal(rows.findLast(row=>row.name==='game_over').data.reason,'dawn_survived');
const idle=run(`${directory}/night1-idle-loss.jsonl`,[]).trim().split('\n').map(JSON.parse);assert.equal(idle.at(-1).state,'lost');
const report={seed:7,scenario:'none; default Night1, no overrides',deterministic:true,won:rows.at(-1),lit_at_dawn:game.lanterns.filter(l=>l.lit).length,idle_loss:idle.at(-1),events:rows.filter(r=>r.type==='event').reduce((counts,r)=>{counts[r.name]=(counts[r.name]??0)+1;return counts;},{})};
writeFileSync(`${directory}/night1-summary.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
