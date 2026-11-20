import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createGame,step,snapshot} from '../src/core/game.js';
import {capacity,hasSafeZone,canReceive,initializeLantern,interactWithLantern,fuelValue} from '../src/core/lanterns.js';
import {lanternPresentation,shadeAccent} from '../src/web/presentation.js';
const quiet={random_motes:false,random_shades:false,random_drifters:false,charms:[],wind_enabled:false};
const fixtures=JSON.parse(readFileSync('tests/fixtures/phase3/scenarios.json','utf8'));
function run(c){const g=createGame(c.scenario,7,c.night),events=[],input={};let cursor=0;for(let k=0;k<c.ticks;k++){if(c.frames[cursor]?.tick===k)Object.assign(input,c.frames[cursor++]);events.push(...step(g,input));}return{g,events};}
test('integer fuel decay, expiry once and pause freeze',()=>{
 const g=createGame({...quiet,lanterns:[{id:'L1',lit:true}]});for(let i=0;i<60;i++)step(g);assert.equal(g.lanterns[0].fuelUnits,5940);assert.equal(snapshot(g).lanterns[0].fuel,99);
 const fuel=g.lanterns[0].fuelUnits;step(g,{pause:true});for(let i=0;i<60;i++)step(g,{pause:false});assert.equal(g.lanterns[0].fuelUnits,fuel);
 const out=run(fixtures.find(c=>c.name==='fuel-out'));assert.equal(out.events.filter(e=>e.name==='lantern_out').length,1);assert.equal(out.g.lanterns[0].deposited,0);assert.equal(out.g.lanterns[0].ever_lit,true);assert.equal(snapshot(out.g).lanterns[0].fuel,0);assert.ok(!step(out.g).some(e=>e.name==='lantern_out'));
});
test('refuel ceil, clamp, points; completely full lantern receives nothing',()=>{
 const r=run(fixtures.find(c=>c.name==='refuel'));assert.deepEqual(r.events,[{type:'event',tick:1,name:'refuel',data:{lantern_id:'L1',amount:4,fuel:90}}]);assert.equal(r.g.score,20);assert.equal(r.g.player.carried,0);
 const g=createGame({...quiet,player:{carried:10},lanterns:[{id:'L1',lit:true}]});assert.equal(canReceive(g.lanterns[0]),false);const events=[];interactWithLantern(g,g.lanterns[0],(...e)=>events.push(e));assert.deepEqual(events,[]);assert.equal(g.score,0);assert.equal(g.player.carried,10);
 g.lanterns[0].fuelUnits=5999;interactWithLantern(g,g.lanterns[0],()=>{});assert.equal(g.player.carried,9);assert.equal(g.lanterns[0].fuelUnits,6000);assert.equal(g.score,5);
});
test('relight cost5, bonus40, dynamic capacity includes relights but excludes presets',()=>{
 const r=run(fixtures.find(c=>c.name==='relight'));assert.equal(r.g.score,65);assert.equal(r.g.lanterns[0].relit_count,1);assert.equal(r.g.lanterns[0].fuelUnits,6000);assert.equal(r.events.find(e=>e.name==='lantern_lit').data.relight,true);assert.equal(capacity(r.g),12);
 const preset=createGame({...quiet,lanterns:[{id:'L1',lit:true}]});assert.equal(preset.player.successful_lights,0);assert.equal(capacity(preset),10);assert.equal(preset.score,0);assert.equal(snapshot(preset).lanterns[0].relit_count,0);
 for(let i=0;i<5;i++){const l=r.g.lanterns[0];l.fuelUnits=1;step(r.g);r.g.player.carried=5;step(r.g,{interact:true});step(r.g,{interact:false});}assert.equal(capacity(r.g),20);assert.equal(r.g.player.successful_lights,6);assert.equal(r.g.lanterns[0].relit_count,6);
 const explicit=createGame({...quiet,player:{successful_lights:2},motes:Array.from({length:20},()=>[0,0,0])});step(explicit);assert.equal(explicit.player.carried,14);assert.equal(explicit.motes.length,6);
});
test('drain stacks with decay; events use global sim_tick60 and pause freezes them',()=>{
 const r=run(fixtures.find(c=>c.name==='drain-stacking'));assert.equal(r.g.lanterns[0].fuelUnits,540);assert.equal(fuelValue(r.g.lanterns[0]),9);assert.deepEqual(r.events.filter(e=>e.name==='fuel_drain').map(e=>[e.tick,e.data.shade_id,e.data.fuel]),[[60,'S1',9],[60,'S2',9]]);
 const paused=createGame({...quiet,player:{pos:[20,0,0]},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:20}],shades:[{id:'S1',pos:[1,.8,0],state:'drain',target_lantern_id:'L1'}]});step(paused,{pause:true});for(let i=0;i<60;i++)assert.deepEqual(step(paused,{pause:false}),[]);assert.equal(paused.sim_tick,0);assert.equal(paused.lanterns[0].fuelUnits,1200);
});
test('weak target chosen only by wander; chase remains chase and target tie picks smaller ID',()=>{
 const base={...quiet,player:{pos:[15,0,0]},lanterns:[{id:'L1',pos:[1,0,0],lit:true,fuel:20},{id:'L2',pos:[-1,0,0],lit:true,fuel:20}]};
 const wander=createGame({...base,shades:[{pos:[0,.8,0],state:'wander'}]});step(wander);assert.equal(wander.shades[0].target_lantern_id,'L1');assert.equal(wander.shades[0].state,'drain');
 const chase=createGame({...base,shades:[{pos:[0,.8,0],state:'chase'}]});step(chase);assert.equal(chase.shades[0].state,'chase');assert.equal(chase.shades[0].target_lantern_id,null);
 const fallback=createGame({...quiet,player:{pos:[20,0,0]},lanterns:[{id:'L1',pos:[8,0,0],lit:true,fuel:50},{id:'L2',pos:[-1,0,0]}],shades:[{pos:[0,.8,0],state:'wander'}]});step(fallback);assert.equal(fallback.shades[0].target_lantern_id,'L2');assert.equal(fallback.shades[0].state,'wander');
});
test('safe boundary is exact30; restoration expels drain shade and prevents damage',()=>{
 const l=initializeLantern({id:'L1',lit:false,pos:[0,0,0],deposited:0},{lit:true,fuel:30});assert.equal(hasSafeZone(l),true);l.fuelUnits--;assert.equal(hasSafeZone(l),false);assert.equal(fuelValue(l),30);
 const r=run(fixtures.find(c=>c.name==='restore-safe'));assert.equal(r.g.player.flames,3);assert.equal(r.g.score,5);assert.equal(r.g.shades[0].state,'wander');assert.ok(Math.hypot(r.g.shades[0].pos[0],r.g.shades[0].pos[2])>=6-1e-6);assert.equal(hasSafeZone(r.g.lanterns[0]),true);
});
test('drain exits on player6m, target extinction or distance; stun recovers to wander for one step',()=>{
 const scenario={...quiet,player:{pos:[6,0,0]},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:20}],shades:[{pos:[0,.8,0],state:'drain',target_lantern_id:'L1'}]};const chase=createGame(scenario);step(chase);assert.equal(chase.shades[0].state,'chase');
 const out=createGame({...scenario,player:{pos:[20,0,0]},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:1/60}]});step(out);assert.equal(out.shades[0].state,'wander');assert.equal(out.lanterns[0].lit,false);
 const distant=createGame({...scenario,player:{pos:[20,0,0]},shades:[{pos:[3,.8,0],state:'drain',target_lantern_id:'L1'}]});step(distant);assert.equal(distant.shades[0].state,'wander');
 const stun=createGame({...quiet,shades:[{pos:[3,.8,0],state:'stunned',state_ticks_left:1}]});step(stun);assert.equal(stun.shades[0].state,'wander');assert.equal(stun.shades[0].pos[0],3);step(stun);assert.equal(stun.shades[0].state,'chase');
 const overlap=createGame({...quiet,shades:[{pos:[0,.8,0],state:'stunned',state_ticks_left:1}]});step(overlap);assert.equal(overlap.shades[0].state,'wander');assert.equal(overlap.player.flames,3);step(overlap);assert.equal(overlap.player.flames,2);
});
test('pulse gives total15 for a draining shade,5 otherwise, with ordinary stun/push',()=>{
 const r=run(fixtures.find(c=>c.name==='pulse-drain'));assert.equal(r.g.score,15);assert.equal(r.g.shades[0].state,'stunned');assert.equal(r.g.player.carried,0);
 const normal=createGame({...quiet,player:{carried:3},shades:[{pos:[2,.8,0]}]});step(normal,{pulse:true});assert.equal(normal.score,5);
});
test('all-lit no longer ends early; dawn thresholds3/5,4/6,5/7 and fuel/flame bonus',()=>{
 const early=createGame({...quiet,lanterns:Array.from({length:5},(_,i)=>({id:`L${i+1}`,lit:true}))});assert.deepEqual(step(early),[]);assert.equal(early.state,'playing');
 for(const[night,count]of[[1,3],[2,4],[3,5]]){const c=fixtures.find(c=>c.name===`dawn-night${night}`),r=run(c);assert.equal(r.g.state,'won');assert.equal(r.events.at(-1).data.reason,'dawn_survived');assert.equal(r.g.score,149*count+150);const fail=run({...c,scenario:{...c.scenario,lanterns:c.scenario.lanterns.slice(1)}});assert.equal(fail.g.state,'lost');assert.equal(fail.g.score,0);}
});
test('last-tick out/refuel/hit are applied before dawn; death always wins precedence',()=>{
 const out=run(fixtures.find(c=>c.name==='last-tick-out'));assert.equal(out.g.state,'lost');assert.equal(out.events.at(-1).data.reason,'dawn');
 const relight=run(fixtures.find(c=>c.name==='last-tick-relight'));assert.deepEqual(relight.events.map(e=>e.name),['lantern_out','deposit','lantern_lit','game_over']);assert.equal(relight.g.state,'won');assert.equal(relight.g.score,663);
 const hit=run(fixtures.find(c=>c.name==='last-tick-hit'));assert.equal(hit.events.at(-1).data.reason,'no_flames');assert.equal(hit.g.score,0);
});
test('lantern silhouette, tear,1Hz blink and alternate accent independent of colors',()=>{
 const off={lit:false,fuelUnits:0},on={lit:true,fuelUnits:6000},weak={lit:true,fuelUnits:1799};assert.equal(lanternPresentation(off,0).paperScale,.8);assert.equal(lanternPresentation(off,0).torn,true);assert.equal(lanternPresentation(on,0).paperScale,1);assert.equal(lanternPresentation(on,0).torn,false);
 assert.equal(lanternPresentation(weak,0).blinkOn,true);assert.equal(lanternPresentation(weak,30).blinkOn,false);assert.equal(lanternPresentation(weak,60).blinkOn,true);assert.equal(shadeAccent(true),'#00B3FF');assert.equal(shadeAccent(false),'#7A3CFF');
});
test('v1.2 scenarios validate new fields and deterministic snapshots/events',()=>{
 const dir=mkdtempSync(join(tmpdir(),'phase3-'));try{const s=join(dir,'s.json'),i=join(dir,'i.json'),o=join(dir,'out.jsonl');
 for(const c of fixtures){writeFileSync(s,JSON.stringify(c.scenario));writeFileSync(i,JSON.stringify({frames:c.frames}));let previous;for(let pass=0;pass<2;pass++){const result=spawnSync(process.execPath,['src/headless/cli.js','--seed','7','--night',String(c.night),'--ticks',String(c.ticks),'--scenario',s,'--inputs',i,'--snapshot-every','1','--out',o],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);const raw=readFileSync(o,'utf8');if(previous)assert.equal(raw,previous,c.name);previous=raw;const rows=raw.trim().split('\n').map(JSON.parse);assert.ok('capacity'in rows[0].player);assert.ok('ever_lit'in rows[0].lanterns[0]);assert.ok('relit_count'in rows[0].lanterns[0]);assert.ok(rows[0].lanterns.every(l=>!l.lit?l.fuel===0:true));}}
 for(const bad of [{player:{successful_lights:-1}},{lanterns:[{id:'L1',fuel:101}]},{lanterns:[{id:'L1',ever_lit:1}]},{shades:[{pos:[0,.8,0],state:'drain',target_lantern_id:'L99'}]}]){writeFileSync(s,JSON.stringify(bad));assert.equal(spawnSync(process.execPath,['src/headless/cli.js','--seed','7','--night','1','--ticks','1','--scenario',s,'--out',o]).status,2);}
 const missing=createGame({...quiet,shades:[{pos:[0,.8,0],state:'drain'}]});assert.equal(missing.shades[0].state,'wander');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
