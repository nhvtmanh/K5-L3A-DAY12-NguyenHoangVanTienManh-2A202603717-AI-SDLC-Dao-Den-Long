import {createGame,step} from '../src/core/game.js';
import {capacity,lightCost} from '../src/core/lanterns.js';

// A test controller, not a gameplay rule. It only emits the ordinary contract inputs.
export function createSurvivalReplay(seed=7){
 const game=createGame({},seed),frames=[];let targetId=null;
 while(game.state==='playing'){
  const player=game.player,p=player.pos,distance=o=>Math.hypot(o.pos[0]-p[0],o.pos[2]-p[2]);
  const desired=game.lanterns.filter(l=>['L1','L2','L5'].includes(l.id));
  let lamps=desired.filter(l=>!l.lit||l.fuelUnits<3600).sort((a,b)=>distance(a)+a.fuelUnits/300-distance(b)-b.fuelUnits/300);
  if(!lamps.length&&player.carried>=capacity(game))lamps=desired.filter(l=>l.fuelUnits<5400).sort((a,b)=>distance(a)-distance(b));
  const need=lamps[0]?(lamps[0].lit?Math.min(5,Math.ceil((6000-lamps[0].fuelUnits)/600)):lightCost(lamps[0])-lamps[0].deposited):capacity(game);
  let candidates=lamps.length&&player.carried>=need?lamps:game.motes;
  if(!candidates.length)candidates=desired;
  const target=candidates.find(o=>o.id===targetId)??[...candidates].sort((a,b)=>distance(a)-distance(b))[0];targetId=target.id;
  const d=distance(target),goal=[(target.pos[0]-p[0])/Math.max(.01,d),(target.pos[2]-p[2])/Math.max(.01,d)];
  const threats=game.shades.filter(s=>!['stunned','spawning','recoil','drain'].includes(s.state));
  let heading=goal,best=-Infinity;
  for(let j=0;j<32;j++){
   const a=j*Math.PI/16,v=[Math.cos(a),Math.sin(a)],future=[p[0]+v[0]*4.2,p[2]+v[1]*4.2];
   let score=(v[0]*goal[0]+v[1]*goal[1])*3;
   const radius=Math.hypot(...future);if(radius>38)score-=(radius-38)*20;
   for(const s of threats){const sd=distance(s),dx=(p[0]-s.pos[0])/Math.max(.01,sd),dz=(p[2]-s.pos[2])/Math.max(.01,sd);const predicted=[s.pos[0]+dx*2.8,s.pos[2]+dz*2.8];const pd=Math.hypot(future[0]-predicted[0],future[1]-predicted[1]);score-=Math.max(0,3-pd)**2*2;}
   if(score>best){best=score;heading=v;}
  }
  if(d<.5&&!lamps.includes(target))heading=[0,0];
  const danger=Math.min(...threats.map(distance));
  const frame={tick:game.tick,move:heading,interact:lamps.includes(target)&&d<=2&&game.tick%2===0,dash:game.dashCd===0&&danger<6&&d>2,pulse:player.carried>=3&&game.pulseCd===0&&danger<1.5};
  frames.push(frame);step(game,frame);
 }
 return {game,frames};
}
