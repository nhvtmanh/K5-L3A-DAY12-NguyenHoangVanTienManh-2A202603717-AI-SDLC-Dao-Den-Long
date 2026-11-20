import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir,cpus} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const version=JSON.parse(readFileSync('game.contract.json','utf8')).contract_version;
const folder=version==='1.3'?'docs/proof/phase-4/regression-phase3':'docs/proof/phase-3';mkdirSync(folder,{recursive:true});
const fixtures=JSON.parse(readFileSync('tests/fixtures/phase3/scenarios.json','utf8')),temp=mkdtempSync(join(tmpdir(),'phase3-proof-'));
const report={node:process.version,cpu:cpus()[0]?.model,contract:version,fixtures:[]};
try{for(const c of fixtures){const s=join(temp,'scenario.json'),i=join(temp,'inputs.json');writeFileSync(s,JSON.stringify(c.scenario));writeFileSync(i,JSON.stringify({frames:c.frames}));let previous,end;
 for(let pass=0;pass<2;pass++){const out=pass===0?`${folder}/${c.name}.jsonl`:join(temp,'repeat.jsonl');const result=spawnSync(process.execPath,['src/headless/cli.js','--seed','7','--night',String(c.night),'--ticks',String(c.ticks),'--scenario',s,'--inputs',i,'--snapshot-every','1','--out',out],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);const raw=readFileSync(out,'utf8');if(previous)assert.equal(raw,previous,c.name);previous=raw;const rows=raw.trim().split('\n').map(JSON.parse);end=rows.at(-1);}
 report.fixtures.push({name:c.name,night:c.night,deterministic:true,end});}
 writeFileSync(`${folder}/verification.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{rmSync(temp,{recursive:true,force:true});}
