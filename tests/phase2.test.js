import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,mkdtempSync,writeFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createGame,step,snapshot } from '../src/core/game.js';
import { NIGHTS,support,blocked,onIsland } from '../src/core/maps.js';
import { Campaign } from '../src/core/campaign.js';
const quiet={random_motes:false,random_shades:false,random_drifters:false,charms:[],wind_enabled:false};
const cases=JSON.parse(readFileSync('tests/fixtures/phase2/scenarios.json','utf8'));
function simulate(c){const g=createGame(c.scenario,7,c.night),events=[];let cursor=0,input={};for(let k=0;k<c.ticks;k++){if(c.frames[cursor]?.tick===k)Object.assign(input,c.frames[cursor++]);events.push(...step(g,input));}return {g,events};}
test('phase2 scenarios exercise each new headless mechanic',()=>{
 const results=Object.fromEntries(cases.map(c=>[c.name,simulate(c)]));
 assert.ok(Math.abs(results.dash.g.player.pos[2]-2.8)<1e-9);assert.equal(results.dash.events.filter(e=>e.name==='dash').length,1);
 assert.equal(results['air-dash'].g.player.pos[1],2);
 const paused=results.pause.g;assert.equal(paused.tick,8);assert.equal(paused.sim_tick,4);assert.equal(paused.dashCd,86);assert.ok(Math.abs(paused.player.pos[0]-.4)<1e-9);
 const fall=results.fall;assert.equal(fall.events.filter(e=>e.name==='player_hit').length,1);assert.equal(fall.events[0].data.lost,8);assert.deepEqual(fall.g.player.pos,[0,0,0]);assert.equal(fall.g.invuln,90);
 const launch=results['launch-night2'].g;assert.ok(Math.hypot(launch.player.pos[0]-70,launch.player.pos[2])<28);assert.ok(launch.player.grounded);
 const upper=results['launch-night3'].g;assert.equal(upper.player.pos[1],6);assert.ok(upper.player.grounded);
 assert.equal(results.charm.events.filter(e=>e.name==='dash').length,2);assert.equal(results.charm.g.dashCd,0);assert.ok(results.charm.g.charm>0);
 assert.equal(results['drifter-steal'].g.player.carried,5);assert.equal(results['drifter-steal'].g.player.flames,3);assert.equal(results['drifter-steal'].events.filter(e=>e.name==='drifter_steal').length,1);
 assert.equal(results['drifter-drop'].events.find(e=>e.name==='drifter_drop').data.amount,3);assert.equal(results['drifter-drop'].g.motes.length,0);assert.equal(results['drifter-drop'].g.player.carried,3);assert.ok(results['drifter-drop'].events.filter(e=>e.name==='mote_picked').every(e=>e.tick===2));
 const spawned=results['spawn-schedule'].g;assert.equal(spawned.drifters.length,1);assert.equal(spawned.shades.length,4);assert.equal(spawned.motes.length,24);
 assert.equal(results.wind.g.wind.active,true);assert.ok(Math.hypot(results.wind.g.player.pos[0],results.wind.g.player.pos[2])>0);
 assert.equal(results['pickup-height'].g.player.carried,0);
});
test('every phase2 fixture runs via CLI1.1 and is deterministic',()=>{
 const dir=mkdtempSync(join(tmpdir(),'phase2-'));
 try{for(const c of cases){const scenario=join(dir,'scenario.json'),inputs=join(dir,'inputs.json'),out=join(dir,'out.jsonl');writeFileSync(scenario,JSON.stringify(c.scenario));writeFileSync(inputs,JSON.stringify({frames:c.frames}));let previous;
  for(let run=0;run<2;run++){const result=spawnSync(process.execPath,['src/headless/cli.js','--seed','7','--night',String(c.night),'--ticks',String(c.ticks),'--scenario',scenario,'--inputs',inputs,'--out',out],{encoding:'utf8'});assert.equal(result.status,0,`${c.name}: ${result.stderr}`);const raw=readFileSync(out,'utf8');if(previous)assert.equal(raw,previous,c.name);previous=raw;const rows=raw.trim().split('\n').map(JSON.parse);assert.equal(rows[0].night,c.night);assert.equal(rows[1].name,'night_start');assert.equal(rows.at(-1).type,'end');for(const key of ['motes','drifters','charms','wind'])assert.ok(key in rows[0]);}}
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('standard maps, elevated surfaces, bridge and vertical walls',()=>{
 assert.deepEqual(Object.values(NIGHTS).map(n=>n.lanterns.length),[5,6,7]);assert.deepEqual(Object.values(NIGHTS).map(n=>n.motePoints.length),[24,24,30]);
 assert.equal(onIsland(2,35,2),true);assert.equal(onIsland(2,35,2.001),false);assert.equal(support(3,0,0,0),0);assert.equal(support(3,0,5,8),6);
 assert.equal(blocked(3,[3,6,0],[1.9,6,0]),true);assert.equal(blocked(3,[0,0,0],[.1,0,0]),false);
 const a=30*Math.PI/180;assert.ok(Math.abs(support(3,27*Math.cos(a),27*Math.sin(a),3)-1.5)<1e-9);
});
test('jump edges, full air control and dash cooldown without invulnerability',()=>{
 const g=createGame(quiet);step(g,{jump:true,move:[1,0]});assert.ok(g.player.pos[1]>0);assert.equal(g.player.vel[1],7-20/60);
 step(g,{jump:true,move:[-1,0]});assert.equal(g.player.vel[0],-6);
 const d=createGame(quiet);step(d,{dash:true});assert.equal(d.invuln,0);for(let i=0;i<89;i++)step(d,{dash:false});assert.equal(d.dashCd,1);assert.equal(step(d,{dash:true})[0].name,'dash');
});
test('charm lasts 600 ticks, refreshes, respawns after 2700 and pause freezes clocks',()=>{
 const g=createGame({...quiet,charms:[{id:'C1',pos:[0,0,0]}]},7,2);step(g);assert.equal(g.charm,600);assert.equal(g.charms[0].respawn,2700);
 for(let i=0;i<599;i++)step(g);assert.equal(g.charm,1);step(g);assert.equal(g.charm,0);
 const ttl=g.charms[0].respawn;step(g,{pause:true});for(let i=0;i<10;i++)step(g,{pause:false});assert.equal(g.charms[0].respawn,ttl);
 step(g,{pause:true});g.player.pos=[5,0,0];while(g.sim_tick<2701)step(g);assert.equal(g.charms[0].available,true);
});
test('fall death does not respawn; dropped motes expire; drifter flee removes itself',()=>{
 const dead=createGame({...quiet,player:{pos:[41,-11,0],flames:1,invuln_ticks:90}});step(dead);assert.equal(dead.state,'lost');assert.equal(dead.respawn,0);
 const g=createGame({...quiet,player:{carried:9},shades:[{pos:[0,.8,0]}]});step(g);assert.equal(g.motes.length,4);assert.ok(g.motes.every(m=>m.kind==='dropped'&&m.ttl===480));g.shades=[];for(let i=0;i<480;i++)step(g);assert.equal(g.motes.length,0);
 const d=createGame({...quiet,drifters:[{id:'D1',pos:[2,.8,0],state:'flee',stolen:3,state_ticks_left:2}]},7,2);step(d);step(d);assert.equal(d.drifters.length,0);
});
test('campaign sums won nights, retries same night and reaches Dawn after night3',()=>{
 const c=new Campaign();c.start();assert.equal(c.screen,'intro');for(let night=1;night<=3;night++){assert.equal(c.night,night);c.play();c.game.state='lost';c.game.score=999;c.settle();assert.equal(c.total,(night-1)*100);c.retry();assert.equal(c.night,night);c.play();c.game.state='won';c.game.score=100;c.settle();c.settle();assert.equal(c.total,night*100);c.next();}assert.equal(c.screen,'dawn');
});
test('newly spawned mote waits until the following tick and random cap counts active motes',()=>{
 const points=NIGHTS[1].motePoints,g=createGame({...quiet,random_motes:true,motes:points.slice(1),player:{pos:[...points[0]]}});
 for(let i=0;i<240;i++)step(g);assert.equal(g.motes.length,24);assert.equal(g.player.carried,0);step(g);assert.equal(g.player.carried,1);
 const full=createGame({...quiet,random_motes:true,motes:Array.from({length:30},()=>[100,0,100])});for(let i=0;i<240;i++)step(full);assert.equal(full.motes.length,30);
});
test('pulse uses 3D center, refreshes stun and push, and vertical hit threshold is enforced',()=>{
 const high=createGame({...quiet,player:{carried:3},shades:[{pos:[0,6,0]}]});assert.deepEqual(step(high,{pulse:true}).find(e=>e.name==='pulse').data.stunned_ids,[]);
 const refresh=createGame({...quiet,player:{carried:3},shades:[{id:'S1',pos:[2,.8,0],state:'stunned',state_ticks_left:10}]});step(refresh,{pulse:true});assert.equal(refresh.shades[0].left,120);assert.equal(refresh.shades[0].pushLeft,14);
 const p=createGame({...quiet,player:{pos:[0,4,0]},shades:[{pos:[0,.8,0]}]});assert.ok(!step(p).some(e=>e.name==='player_hit'));
});
test('drifter steals before shade hit, independent of safe-zone and player invulnerability',()=>{
 const g=createGame({...quiet,player:{carried:8},drifters:[{id:'D1',pos:[0,.8,0],state:'chase'}],shades:[{id:'S1',pos:[0,.8,0]}]},7,2);
 const events=step(g);assert.deepEqual(events.map(e=>e.name),['drifter_steal','player_hit']);assert.equal(events[0].data.carried,5);assert.equal(events[1].data.dropped,2);assert.equal(g.player.carried,3);
 const safe=createGame({...quiet,player:{carried:8,invuln_ticks:90},drifters:[{id:'D1',pos:[0,.8,0],state:'chase'}],lanterns:[{id:'L1',pos:[0,0,0],lit:true}]},7,2);assert.equal(step(safe)[0].name,'drifter_steal');
});
test('CLI1.1 rejects invalid new fields with exit2',()=>{
 const dir=mkdtempSync(join(tmpdir(),'phase2-errors-'));
 try{const scenario=join(dir,'scenario.json'),inputs=join(dir,'inputs.json'),out=join(dir,'out.jsonl');
 for(const bad of [{player:{charm_ticks:-1}},{random_drifters:1},{wind_enabled:'false'},{shades:[{pos:[0,0,0],state:'invalid'}]},{drifters:[{pos:[0,0,0],state:'flee',stolen:-1}]},{charms:[{id:'C1',respawn_s:-1}]}]){writeFileSync(scenario,JSON.stringify(bad));const r=spawnSync(process.execPath,['src/headless/cli.js','--seed','7','--night','2','--ticks','1','--scenario',scenario,'--out',out]);assert.equal(r.status,2);}
 writeFileSync(inputs,JSON.stringify({frames:[{tick:0,pause:1}]}));assert.equal(spawnSync(process.execPath,['src/headless/cli.js','--seed','7','--night','2','--ticks','1','--inputs',inputs,'--out',out]).status,2);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('scenario drifter IDs do not collide with generated IDs',()=>{
 const g=createGame({...quiet,drifters:[{id:'D2',pos:[20,.8,0]},{pos:[25,.8,0]}]},7,2);
 assert.equal(new Set(g.drifters.map(d=>d.id)).size,2);
 g.randomDrifters=true;g.drifters.pop();for(let i=0;i<1200;i++)step(g);assert.equal(new Set(g.drifters.map(d=>d.id)).size,g.drifters.length);
});
