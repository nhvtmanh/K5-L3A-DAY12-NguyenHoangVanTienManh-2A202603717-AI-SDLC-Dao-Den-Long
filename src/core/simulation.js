import { NIGHTS, onIsland, support, surfaces, blocked } from './maps.js';
import { initializeLantern, updateFuel, interactWithLantern, finishAtDawn, hasSafeZone, canReceive, capacity, fuelValue } from './lanterns.js';
export { TUNING } from './tuning.js';
const round=n=>Math.round(n*1000)/1000;
const xz=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const direction=(a,b)=>{const d=xz(a,b);return d?[(b[0]-a[0])/d,(b[2]-a[2])/d]:[1,0];};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let v=Math.imul(s^(s>>>15),s|1);v^=v+Math.imul(v^(v>>>7),v|61);return((v^(v>>>14))>>>0)/4294967296;};}
export function createGame(scenario={},seed=7,night=1){
  const map=NIGHTS[night], random=rng(seed), playerPatch=structuredClone(scenario.player??{});
  const p={pos:[0,0,0],vel:[0,0,0],grounded:true,carried:0,flames:3,successful_lights:0,...playerPatch};
  p.grounded=Math.abs(p.pos[1]-support(night,p.pos[0],p.pos[2],p.pos[1]))<1e-6;
  const lanterns=map.lanterns.map(base=>initializeLantern(base,scenario.lanterns?.find(l=>l.id===base.id)));
  const game={night,map,random,tick:0,sim_tick:0,state:'playing',duration:scenario.time_left_s??map.duration,
    score:0,player:p,lanterns,motes:[],shades:[],drifters:[],
    charms:structuredClone(scenario.charms??map.charms).map(c=>({available:true,...map.charms.find(base=>base.id===c.id),...c,pos:c.pos??map.charms.find(base=>base.id===c.id)?.pos??[0,0,0],respawn:c.respawn_ticks??Math.round((c.respawn_s??0)*60)})),
    randomMotes:scenario.random_motes!==false,randomShades:scenario.random_shades!==false,
    randomDrifters:scenario.random_drifters!==false,windEnabled:scenario.wind_enabled!==false,
    wind:{active:false,dir_deg:0},previous:{},nextMote:1,nextShade:1,nextDrifter:1,
    invuln:playerPatch.invuln_ticks??0,dashCd:playerPatch.dash_cd_ticks??0,pulseCd:playerPatch.pulse_cd_ticks??0,charm:playerPatch.charm_ticks??0,
    dashLeft:0,dashDir:[0,1],facing:[0,1],launch:null,respawn:0,falling:false};
  for(const key of ['invuln_ticks','dash_cd_ticks','pulse_cd_ticks','charm_ticks'])delete p[key];
  const taken=new Set();
  if(scenario.motes!==undefined)for(const pos of scenario.motes)addMote(game,pos);
  else if(game.randomMotes)for(let i=0;i<20;i++){
    const empty=map.motePoints.map((_,index)=>index).filter(index=>!taken.has(index));
    const index=empty[Math.floor(random()*empty.length)];taken.add(index);addMote(game,map.motePoints[index]);
  }
  const supplied=structuredClone(scenario.shades??[]),reserved=new Set(supplied.filter(s=>s.id).map(s=>s.id));
  for(const s of supplied){while(reserved.has(`S${game.nextShade}`))game.nextShade++;const id=s.id??`S${game.nextShade++}`;reserved.add(id);
    const state=s.state==='drain'&&!s.target_lantern_id?'wander':s.state??'chase';
    game.shades.push({id,pos:[...s.pos],state,target_lantern_id:s.target_lantern_id??null,left:s.state_ticks_left??0,dir:direction(p.pos,s.pos),pushLeft:0,expel:0});}
  while(reserved.has(`S${game.nextShade}`))game.nextShade++;
  const drifters=structuredClone(scenario.drifters??[]),reservedD=new Set(drifters.filter(d=>d.id!==undefined).map(d=>d.id));
  for(const d of drifters){while(reservedD.has(`D${game.nextDrifter}`))game.nextDrifter++;const id=d.id??`D${game.nextDrifter++}`;reservedD.add(id);game.drifters.push({pos:[0,.8,0],state:'idle',stolen:0,dir:[1,0],...d,id,left:d.state_ticks_left??(d.state==='flee'?240:0)});}
  while(reservedD.has(`D${game.nextDrifter}`))game.nextDrifter++;
  return game;
}
function addMote(g,pos,kind='random',ttl=null){g.motes.push({id:`M${g.nextMote++}`,pos:[...pos],kind,ttl,born:g.sim_tick});}
function drop(g,pos,count,scatter=true){for(let i=0;i<count;i++){const a=g.random()*Math.PI*2,r=scatter?1.5+g.random():0;addMote(g,[pos[0]+Math.cos(a)*r,pos[1],pos[2]+Math.sin(a)*r],'dropped',480);}}
function walkShade(g,s,dir,amount){
  const from=[...s.pos],to=[from[0]+dir[0]*amount,from[1],from[2]+dir[1]*amount];
  const ground=support(g.night,to[0],to[2],Math.max(0,from[1]-.8)+.11);
  if(!Number.isFinite(ground)||!onIsland(g.night,to[0],to[2])||blocked(g.night,[from[0],from[1]-.8,from[2]],[to[0],from[1]-.8,to[2]]))return;
  to[1]=ground+.8;
  for(const l of g.lanterns)if(hasSafeZone(l)&&xz(from,l.pos)>=6-1e-6&&xz(to,l.pos)<6){const d=direction(l.pos,to);to[0]=l.pos[0]+d[0]*6;to[2]=l.pos[2]+d[1]*6;}
  if(!onIsland(g.night,to[0],to[2])||blocked(g.night,[from[0],from[1]-.8,from[2]],[to[0],to[1]-.8,to[2]]))return;
  s.pos=to;
}
function spawnShade(g,emit){
  if(g.shades.length>=g.map.shadeCap)return;
  const points=g.map.shadePoints.filter(p=>xz(p,g.player.pos)>=15&&!g.lanterns.some(l=>hasSafeZone(l)&&xz(p,l.pos)<=6)&&!g.shades.some(s=>xz(p,s.pos)<1e-6));
  if(!points.length)return;const pos=points[Math.floor(g.random()*points.length)];
  g.shades.push({id:`S${g.nextShade++}`,pos:[pos[0],pos[1]+.8,pos[2]],state:'spawning',left:30,dir:[1,0],pushLeft:0,expel:0});emit('shade_spawned',{id:g.shades.at(-1).id});
}
export function step(g,input={}){
  if(g.state==='won'||g.state==='lost')return[];
  const edge=key=>Boolean(input[key])&&!g.previous[key];
  const jump=edge('jump'),dash=edge('dash'),interact=edge('interact'),pulse=edge('pulse'),pause=edge('pause');
  g.previous={...input};g.tick++;
  const events=[],emit=(name,data={})=>events.push({type:'event',tick:g.tick,name,data});
  if(pause){g.state=g.state==='paused'?'playing':'paused';emit(g.state==='paused'?'paused':'resumed');}
  if(g.state==='paused')return events;
  g.sim_tick++;
  if(g.dashLeft===1)g.player.vel[1]=g.dashVertical??0;
  for(const key of ['invuln','dashCd','pulseCd','charm','dashLeft'])g[key]=Math.max(0,g[key]-1);
  updateFuel(g,emit);
  for(const s of g.shades)s.left=Math.max(0,s.left-1);
  for(const d of g.drifters)if(d.state==='flee'){d.left--;if(d.left<=0)d.state='removed';}
  g.drifters=g.drifters.filter(d=>d.state!=='removed');
  for(const m of g.motes)if(m.ttl!==null)m.ttl--;
  g.motes=g.motes.filter(m=>m.ttl===null||m.ttl>0);
  for(const c of g.charms)if(!c.available){c.respawn=Math.max(0,c.respawn-1);if(!c.respawn)c.available=true;}
  const p=g.player,old=[...p.pos];
  const windPhase=g.sim_tick%1800;
  if(g.night===3&&g.windEnabled&&windPhase===0)g.wind.dir_deg=g.random()*360;
  g.wind.active=g.night===3&&g.windEnabled&&g.sim_tick>=1800&&windPhase<300;
  let respawned=false;
  if(g.respawn>0){g.respawn--;if(!g.respawn){p.pos=[0,0,0];p.vel=[0,0,0];p.grounded=true;g.invuln=90;g.falling=false;g.launch=null;respawned=true;}}
  const yaw=(input.cam_yaw_deg??0)*Math.PI/180,[mx,mz]=input.move??[0,0],norm=Math.max(1,Math.hypot(mx,mz));
  const move=[(mx*Math.cos(yaw)+mz*Math.sin(yaw))/norm,(-mx*Math.sin(yaw)+mz*Math.cos(yaw))/norm];
  const heading=g.dashLeft?g.dashDir:(g.launch??move);
  if(Math.hypot(...heading)>0)g.facing=direction([0,0,0],[heading[0],0,heading[1]]);
  if(!g.respawn&&!respawned&&!g.falling){
    if(jump&&p.grounded){p.vel[1]=7;p.grounded=false;}
    if(dash&&!g.dashLeft&&(g.dashCd===0||g.charm>0)){g.dashDir=[...g.facing];g.dashVertical=p.vel[1];g.dashLeft=12;g.dashCd=g.charm?0:90;emit('dash');}
    let vx=move[0]*(g.charm?7.2:6),vz=move[1]*(g.charm?7.2:6);
    if(g.launch){vx=g.launch[0];vz=g.launch[1];}
    if(g.dashLeft){vx=g.dashDir[0]*14;vz=g.dashDir[1]*14;}
    if(g.dashLeft)p.vel[1]=0;
    if(g.wind.active){vx+=Math.cos(g.wind.dir_deg*Math.PI/180)*2;vz+=Math.sin(g.wind.dir_deg*Math.PI/180)*2;}
    const to=[p.pos[0]+vx/60,p.pos[1],p.pos[2]+vz/60];
    if(!blocked(g.night,p.pos,to)){p.pos[0]=to[0];p.pos[2]=to[2];}else{vx=0;vz=0;}
    p.vel[0]=vx;p.vel[2]=vz;
    const heights=surfaces(g.night,p.pos[0],p.pos[2]),nearby=heights.filter(h=>Math.abs(h-old[1])<=.11);
    if(p.grounded&&nearby.length&&!jump){p.pos[1]=Math.max(...nearby);p.vel[1]=0;}
    else {
      p.grounded=false;
      if(!g.dashLeft){p.pos[1]+=p.vel[1]/60;p.vel[1]-=20/60;}
      const floors=heights.filter(h=>old[1]>=h-1e-6&&p.pos[1]<=h+1e-6);
      if(floors.length&&p.vel[1]<=0){p.pos[1]=Math.max(...floors);p.vel[1]=0;p.grounded=true;g.launch=null;}
    }
    for(const pad of g.map.pads)if(p.grounded&&Math.abs(p.pos[1]-pad.pos[1])<.1&&xz(p.pos,pad.pos)<=1){
      const dir=direction(pad.pos,pad.target);g.launch=[dir[0]*pad.speed,dir[1]*pad.speed];p.vel=[g.launch[0],pad.vy,g.launch[1]];p.grounded=false;break;}
    if(p.pos[1]<-10){const lost=p.carried;p.carried=0;p.flames=Math.max(0,p.flames-1);g.respawn=p.flames?60:0;g.falling=true;p.vel=[0,0,0];g.launch=null;g.dashLeft=0;emit('player_hit',{by:'fall',flames:p.flames,dropped:0,lost});}
  }
  const canAct=!g.respawn&&!g.falling;
  if(canAct){
    g.motes=g.motes.filter(m=>{if(m.born===g.sim_tick||p.carried>=capacity(g)||xz(p.pos,m.pos)>1||Math.abs(p.pos[1]-m.pos[1])>1.5)return true;p.carried++;emit('mote_picked',{carried:p.carried});return false;});
    for(const c of g.charms)if(c.available&&xz(p.pos,c.pos)<=1&&Math.abs(p.pos[1]-c.pos[1])<=1.5){c.available=false;c.respawn=2700;g.charm=600;g.dashCd=0;emit('charm_picked',{charm_id:c.id,charm_ticks:600});}
    if(interact&&p.carried){const l=g.lanterns.filter(l=>canReceive(l)&&xz(p.pos,l.pos)<=2).sort((a,b)=>xz(p.pos,a.pos)-xz(p.pos,b.pos)||a.id.localeCompare(b.id))[0];if(l)interactWithLantern(g,l,emit);}
  }
  const drainEnded=new Set();
  for(const s of g.shades){
    if(s.state==='drain'){
      const target=g.lanterns.find(l=>l.id===s.target_lantern_id);
      if(!target||!target.lit||target.fuelUnits>=1800||xz(s.pos,target.pos)>2){s.state='wander';s.target_lantern_id=null;drainEnded.add(s.id);}
    }
    const l=g.lanterns.find(l=>hasSafeZone(l)&&xz(s.pos,l.pos)<6-1e-7);
    if(l){
      if(!s.expel){s.expel=30;const dir=direction(l.pos,s.pos),base=Math.atan2(dir[1],dir[0]);const targets=Array.from({length:64},(_,i)=>{const a=base+i*Math.PI/32;return[l.pos[0]+Math.cos(a)*6,s.pos[1],l.pos[2]+Math.sin(a)*6];}).filter(p=>onIsland(g.night,p[0],p[2]));s.expelTarget=targets.reduce((best,p)=>!best||xz(p,s.pos)<xz(best,s.pos)-1e-9?p:best,null)??s.pos;}
      s.pos[0]+=(s.expelTarget[0]-s.pos[0])/s.expel;s.pos[2]+=(s.expelTarget[2]-s.pos[2])/s.expel;s.expel--;s.protected=true;
    }
    else{s.expel=0;s.protected=false;}
  }
  if(canAct&&pulse&&g.pulseCd===0&&p.carried>=3){p.carried-=3;g.pulseCd=180;const center=[p.pos[0],p.pos[1]+.8,p.pos[2]],ids=[];
    const inPulse=s=>Math.hypot(center[0]-s.pos[0],center[1]-s.pos[1],center[2]-s.pos[2])<=5;
    for(const s of g.shades)if(inPulse(s)){g.score+=s.state==='drain'?15:5;s.state='stunned';s.left=120;s.pushLeft=15;s.pushDir=direction(center,s.pos);ids.push(s.id);}
    for(const d of g.drifters)if(inPulse(d)){
      if(d.state==='chase'){d.state='flee';d.left=240;d.dir=direction(p.pos,d.pos);}
      else if(d.state==='flee'&&d.stolen){const amount=d.stolen;const ground=support(g.night,d.pos[0],d.pos[2],d.pos[1]);drop(g,[d.pos[0],Number.isFinite(ground)?ground:0,d.pos[2]],amount,false);d.stolen=0;d.left=120;emit('drifter_drop',{drifter_id:d.id,amount});}}
    emit('pulse',{stunned_ids:ids});
  }
  for(const s of g.shades){
    if(s.state==='stunned'&&s.left===0){s.state='wander';s.target_lantern_id=null;s.recoveredTick=g.sim_tick;continue;}
    if(s.protected)continue;
    if(s.state==='stunned'&&s.left>0){if(s.pushLeft>0){walkShade(g,s,s.pushDir??[1,0],4/15);s.pushLeft--;}continue;}
    if(drainEnded.has(s.id))continue;
    if(s.state==='spawning'&&s.left>0)continue;
    if(s.state==='recoil'&&s.left>0){walkShade(g,s,s.dir,2/60);continue;}
    const d=xz(s.pos,p.pos);
    if(s.state==='drain'){
      const target=g.lanterns.find(l=>l.id===s.target_lantern_id);
      if(d<=6){s.state='chase';s.target_lantern_id=null;}
      else if(!target||!target.lit||target.fuelUnits>=1800||xz(s.pos,target.pos)>2){s.state='wander';s.target_lantern_id=null;continue;}
      else continue;
    }
    if(s.state==='chase'&&d>18)s.state='wander';else if(d<=12)s.state='chase';else if(s.state!=='chase')s.state='wander';
    if(s.state==='chase')walkShade(g,s,direction(s.pos,p.pos),Math.min(d,g.map.shadeSpeed/60));
    else{
      const nearest=list=>list.sort((a,b)=>xz(s.pos,a.pos)-xz(s.pos,b.pos)||a.id.localeCompare(b.id))[0];
      const target=nearest(g.lanterns.filter(l=>l.lit&&l.fuelUnits<1800))??nearest(g.lanterns.filter(l=>!l.lit));
      s.target_lantern_id=target?.id??null;
      if(target){walkShade(g,s,direction(s.pos,target.pos),Math.min(xz(s.pos,target.pos),2/60));if(target.lit&&target.fuelUnits<1800&&xz(s.pos,target.pos)<=2)s.state='drain';}
      else{if(g.sim_tick%120===0||!s.wanderDir){const a=g.random()*Math.PI*2;s.wanderDir=[Math.cos(a),Math.sin(a)];}walkShade(g,s,s.wanderDir,2/60);}
    }
  }
  for(const d of g.drifters){
    if(d.state==='idle'&&p.carried>=5&&xz(p.pos,d.pos)<=15)d.state='chase';
    if(d.state==='chase'&&(p.carried<5||xz(p.pos,d.pos)>15))d.state='idle';
    let dir=d.dir??[1,0],speed=7;
    if(d.state==='chase')dir=direction(d.pos,p.pos);
    else if(d.state==='idle'){speed=2;if(g.sim_tick%120===0||!d.idleDir){const a=g.random()*Math.PI*2;d.idleDir=[Math.cos(a),Math.sin(a)];}dir=d.idleDir;}
    d.pos[0]+=dir[0]*speed/60;d.pos[2]+=dir[1]*speed/60;
  }
  if(canAct){
    for(const d of [...g.drifters].sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true})))if(d.state==='chase'&&xz(p.pos,d.pos)<=1.2){const amount=Math.min(3,p.carried);p.carried-=amount;d.stolen=amount;d.state='flee';d.left=240;d.dir=direction(p.pos,d.pos);d.pos[0]+=d.dir[0]*7/60;d.pos[2]+=d.dir[1]*7/60;emit('drifter_steal',{drifter_id:d.id,amount,carried:p.carried});}
    const safe=g.lanterns.some(l=>hasSafeZone(l)&&xz(p.pos,l.pos)<=6);
    if(!g.invuln&&!safe)for(const s of [...g.shades].sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}))){
      if(s.protected||s.recoveredTick===g.sim_tick||s.state==='stunned'||s.state==='spawning'||s.state==='recoil'||xz(p.pos,s.pos)>1||Math.abs(p.pos[1]-s.pos[1])>1.5)continue;
      p.flames=Math.max(0,p.flames-1);const amount=Math.floor(p.carried/2);p.carried-=amount;drop(g,p.pos,amount);g.invuln=90;s.state='recoil';s.left=60;s.dir=direction(p.pos,s.pos);walkShade(g,s,s.dir,2/60);emit('player_hit',{by:'shade',flames:p.flames,dropped:amount});break;
    }
  }
  if(g.randomMotes&&g.sim_tick%240===0&&g.motes.filter(m=>m.kind==='random').length<30){const empty=g.map.motePoints.filter(point=>!g.motes.some(m=>xz(m.pos,point)<1e-6&&Math.abs(m.pos[1]-point[1])<1e-6));if(empty.length)addMote(g,empty[Math.floor(g.random()*empty.length)]);}
  if(g.randomShades&&g.sim_tick>=300&&(g.sim_tick-300)%g.map.shadeInterval===0){spawnShade(g,emit);if(g.sim_tick===300)spawnShade(g,emit);}
  if(g.night>1&&g.randomDrifters&&g.sim_tick%1200===0&&g.drifters.length<2){const point=g.map.shadePoints[Math.floor(g.random()*g.map.shadePoints.length)];g.drifters.push({id:`D${g.nextDrifter++}`,pos:[point[0],point[1]+.8,point[2]],state:'idle',stolen:0,left:0,dir:[1,0]});}
  finishAtDawn(g,emit);return events;
}
export function snapshot(g){const p=g.player;return {type:'snapshot',tick:g.tick,sim_tick:g.sim_tick,night:g.night,state:g.state,time_left_s:Math.max(0,g.duration-g.sim_tick/60),score:g.score,wind:{...g.wind},
  player:{pos:p.pos.map(round),vel:p.vel.map(round),grounded:p.grounded,flames:p.flames,carried:p.carried,capacity:capacity(g),invuln:g.invuln>0,dash_cd_s:g.dashCd/60,pulse_cd_s:g.pulseCd/60,charm_s:g.charm/60},
  lanterns:g.lanterns.map(l=>({id:l.id,pos:l.pos.map(round),lit:l.lit,deposited:l.deposited,fuel:fuelValue(l),ever_lit:l.ever_lit,relit_count:l.relit_count})),shades:g.shades.map(s=>({id:s.id,pos:s.pos.map(round),state:s.state})),motes_active:g.motes.length,
  motes:g.motes.map(m=>({id:m.id,pos:m.pos.map(round),kind:m.kind,ttl_s:m.ttl===null?null:m.ttl/60})),
  drifters:g.drifters.map(d=>({id:d.id,pos:d.pos.map(round),state:d.state,stolen:d.stolen})),charms:g.charms.map(c=>({id:c.id,available:c.available,respawn_s:c.respawn/60}))};}
