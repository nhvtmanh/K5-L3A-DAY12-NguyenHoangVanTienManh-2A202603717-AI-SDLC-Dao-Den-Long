import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {frameMetrics} from '../src/metrics.js';
import {createBenchmarkGame,benchmarkCamera} from '../src/core/benchmark.js';
import {step,snapshot} from '../src/core/game.js';
import {validName,addEntry,readEntries,sortedEntries} from '../src/server/leaderboard.js';
import {leaderboardApi} from '../src/server/api.js';
import {DEFAULT_BINDINGS,validateBindings,rebind,mappedInput} from '../src/web/keybindings.js';
import {visualCues} from '../src/web/accessibility.js';
import {createGame} from '../src/core/game.js';
test('benchmark statistics use exact N/sum, slowest ceil1percent and nearest-rank95',()=>{
 const samples=[...Array(99).fill(10),100],m=frameMetrics(samples);assert.equal(m.frames,100);assert.equal(m.avg_fps,100000/1090);assert.equal(m.p1_low_fps,10);assert.equal(m.frame_ms_p95,10);
 assert.equal(frameMetrics([20]).p1_low_fps,50);assert.throws(()=>frameMetrics([]));assert.throws(()=>frameMetrics([0]));
});
test('benchmark exact200wander/100motes; player, fuel, pickup, damage, spawns and end frozen',()=>{
 const g=createBenchmarkGame(42),before=snapshot(g);assert.deepEqual(before,snapshot(createBenchmarkGame(42)));
 for(let i=0;i<2000;i++)step(g,{move:[1,1],jump:true,dash:true,interact:true,pulse:true});
 assert.equal(g.shades.length,200);assert.equal(g.motes.length,100);assert.deepEqual(g.player.pos,[0,0,0]);assert.equal(g.player.flames,3);assert.equal(g.player.carried,0);assert.equal(g.state,'playing');assert.ok(g.shades.every(s=>s.state==='wander'));assert.equal(g.lanterns.filter(l=>l.lit).length,3);assert.ok(g.lanterns.filter(l=>l.lit).every(l=>l.fuelUnits===6000));assert.notDeepEqual(snapshot(g).shades,before.shades);
 assert.deepEqual(benchmarkCamera(0),[30,15,0]);const quarter=benchmarkCamera(3.75);assert.ok(Math.abs(quarter[0])<1e-9);assert.equal(quarter[2],-30);assert.ok(-30*quarter[2]>0,'XZ cross product points +Y: counterclockwise viewed from above');assert.ok(Math.abs(benchmarkCamera(15)[0]-30)<1e-9);
});
test('leaderboard validates names, stores five fields, sorts top10, and preserves earliest ties',()=>{
 const dir=mkdtempSync(join(tmpdir(),'phase4-board-')),file=join(dir,'leaderboard.json');
 try{
  for(const name of ['ab','too_long_name_13','a b','<svg>'])assert.equal(validName(name),false);assert.equal(validName('Manh_123'),true);
  for(let i=0;i<12;i++)addEntry(file,{name:`User_${i}`,score:i,nights_won:i%4,seed:7},new Date(`2026-11-20T00:00:${String(i).padStart(2,'0')}Z`));
  assert.equal(readEntries(file).length,10);assert.deepEqual(readEntries(file).map(e=>e.score),[11,10,9,8,7,6,5,4,3,2]);
  assert.deepEqual(Object.keys(readEntries(file)[0]),['name','score','nights_won','achieved_at','seed']);
  const first={name:'First',score:100,nights_won:1,seed:7,achieved_at:'2026-11-20T01:00:00+07:00'},later={...first,name:'Later',achieved_at:'2026-11-20T01:01:00+07:00'};assert.equal(sortedEntries([later,first])[0].name,'First');
  const output=join(dir,'export.json');const result=spawnSync(process.execPath,['scripts/run.mjs','--data-dir',dir,'--export-leaderboard',output],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(readFileSync(output,'utf8')),{entries:readEntries(file)});
  assert.throws(()=>addEntry(file,{name:'ab',score:1,nights_won:1,seed:7}));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('invalid local leaderboard is not silently overwritten',()=>{
 const dir=mkdtempSync(join(tmpdir(),'phase4-corrupt-')),file=join(dir,'leaderboard.json');try{writeFileSync(file,'{broken');assert.throws(()=>addEntry(file,{name:'User',score:10,nights_won:1,seed:7}));assert.equal(readFileSync(file,'utf8'),'{broken');}finally{rmSync(dir,{recursive:true,force:true});}
});
test('local leaderboard API persists POST, reloads GET, rejects invalid submission',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'phase4-api-')),file=join(dir,'leaderboard.json'),server=createServer(async(req,res)=>{if(!await leaderboardApi(req,res,file)){res.writeHead(404);res.end();}});
 try{server.listen(0,'127.0.0.1');await once(server,'listening');const url=`http://127.0.0.1:${server.address().port}/api/leaderboard`;
  const valid=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Player_1',score:120,nights_won:1,seed:7})});assert.equal(valid.status,201);
  const data=await(await fetch(url)).json();assert.equal(data.entries[0].name,'Player_1');assert.match(data.entries[0].achieved_at,/Z$/);assert.equal(readEntries(file)[0].score,120);
  const invalid=await fetch(url,{method:'POST',body:JSON.stringify({name:'x',score:120,nights_won:1,seed:7})});assert.equal(invalid.status,400);assert.equal(readEntries(file).length,1);
 }finally{await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true});}
});
test('all nine remappable actions reject duplicates, persistable bindings and restore defaults',()=>{
 assert.equal(validateBindings(DEFAULT_BINDINGS),true);assert.throws(()=>rebind(DEFAULT_BINDINGS,'jump','KeyW'),/đã dùng/);
 const changed=rebind(DEFAULT_BINDINGS,'jump','KeyJ');assert.equal(mappedInput(new Set(['KeyJ','KeyD']),changed).jump,true);assert.deepEqual(mappedInput(new Set(['KeyJ','KeyD']),changed).move,[1,0]);assert.equal(mappedInput(new Set(['ShiftRight']),DEFAULT_BINDINGS).dash,true);
 assert.throws(()=>rebind(DEFAULT_BINDINGS,'interact','ShiftRight'));assert.equal(validateBindings(JSON.parse(JSON.stringify(changed))),true);assert.equal(DEFAULT_BINDINGS.jump,'Space');
});
test('soak uses one child process for sequential seeded nights and emits real memory metrics',()=>{
 const dir=mkdtempSync(join(tmpdir(),'phase4-soak-'));try{const out=join(dir,'soak.json'),result=spawnSync(process.execPath,['--jitless','--max-semi-space-size=1','--max-old-space-size=32','scripts/soak.mjs','--seed','7','--nights','2','--out',out],{encoding:'utf8'});const data=JSON.parse(readFileSync(out,'utf8'));assert.equal(data.nights,2);assert.equal(data.crashes,0);assert.equal(data.results.length,2);assert.ok(data.results.every(r=>['won','lost'].includes(r)));assert.ok(data.mem_start_mb>0&&data.mem_end_mb>0);assert.ok(data.duration_s>0);assert.ok([0,1].includes(result.status),result.stderr);}finally{rmSync(dir,{recursive:true,force:true});}
});
test('visual accessibility cues cover shade spawn, wind lead, last10seconds and weak fuel',()=>{
 const g=createGame({lanterns:[{id:'L1',lit:true,fuel:29}],time_left_s:38},7,3);g.sim_tick=1680;
 const cues=visualCues(g,[{id:'S1'}]);assert.ok(cues.some(s=>s.includes('S1')));assert.ok(cues.some(s=>s.includes('Gió sắp')));assert.ok(cues.some(s=>s.includes('10 giây')));assert.ok(cues.some(s=>s.includes('Đèn yếu: L1')));
});
