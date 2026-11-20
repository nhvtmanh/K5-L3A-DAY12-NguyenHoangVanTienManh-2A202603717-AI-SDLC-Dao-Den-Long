import { readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync } from 'node:fs';
import { tmpdir,cpus,platform } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const folder='docs/proof/phase-2';mkdirSync(folder,{recursive:true});
const fixtures=JSON.parse(readFileSync('tests/fixtures/phase2/scenarios.json','utf8'));
const temp=mkdtempSync(join(tmpdir(),'lantern-proof-')),report={node:process.version,platform:platform(),cpu:cpus()[0]?.model,fixtures:[],benchmarks:[]};
function run(c,out){const s=join(temp,'scenario.json'),i=join(temp,'inputs.json');writeFileSync(s,JSON.stringify(c.scenario));writeFileSync(i,JSON.stringify({frames:c.frames}));const start=performance.now();const result=spawnSync(process.execPath,['src/headless/cli.js','--seed','7','--night',String(c.night),'--ticks',String(c.ticks),'--scenario',s,'--inputs',i,'--out',out],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);return {raw:readFileSync(out,'utf8'),seconds:(performance.now()-start)/1000};}
try{
 for(const c of fixtures){const a=run(c,`${folder}/${c.name}.jsonl`),b=run(c,join(temp,'repeat.jsonl'));assert.equal(a.raw,b.raw,c.name);const rows=a.raw.trim().split('\n').map(JSON.parse);report.fixtures.push({name:c.name,night:c.night,deterministic:true,end:rows.at(-1),seconds:a.seconds});}
 for(const night of [1,2,3]){const c={night,ticks:21600,scenario:{player:{invuln_ticks:100000},time_left_s:360},frames:[]};const result=run(c,join(temp,'benchmark.jsonl'));assert.ok(result.seconds<=30,`Night ${night} exceeds headless30s`);const rows=result.raw.trim().split('\n').map(JSON.parse);assert.equal(rows.at(-1).ticks,21600);report.benchmarks.push({night,ticks:21600,seconds:result.seconds,scenario:'360s duration + initial invulnerability to prevent early exit; otherwise normal spawns/wind',passed:true});}
 writeFileSync(`${folder}/verification.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{rmSync(temp,{recursive:true,force:true});}
