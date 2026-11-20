import {writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createGame,step} from '../src/core/game.js';
import {seededRandom} from '../src/core/random.js';
function options(args){const result={};for(let i=0;i<args.length;i+=2){if(!['--seed','--nights','--out'].includes(args[i])||args[i+1]===undefined)throw new Error('Use --seed <int> --nights <int> --out <file>');result[args[i].slice(2)]=args[i+1];}return result;}
try{
 const o=options(process.argv.slice(2)),seed=Number(o.seed),nights=Number(o.nights);
 if(!Number.isSafeInteger(seed)||!Number.isSafeInteger(nights)||nights<1||!o.out)throw new Error('Invalid soak arguments');
 const started=performance.now(),results=[];let crashes=0,game=createGame({},seed,1);
 const mem_start_mb=process.memoryUsage().rss/1048576;
 for(let i=0;i<nights;i++){
  try{const random=seededRandom(seed+i);let move=[0,0];
   while(game.state==='playing'&&game.sim_tick<game.map.duration*60){if(game.sim_tick%30===0){const angle=random()*Math.PI*2;move=[Math.cos(angle),Math.sin(angle)];}step(game,{move,jump:random()<.05,dash:random()<.03,pulse:random()<.02,interact:random()<.1});}
   results.push(game.state);
  }catch(error){crashes++;results.push('crashed');console.error(`Night ${i}: ${error.message}`);}
  game=createGame({},seed+i+1,(i+1)%3+1);
 }
 const mem_end_mb=process.memoryUsage().rss/1048576;
 const report={nights,crashes,results,mem_start_mb,mem_end_mb,duration_s:(performance.now()-started)/1000};
 writeFileSync(o.out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 if(crashes||mem_end_mb>1.2*mem_start_mb)process.exitCode=1;
}catch(error){console.error(error.message);process.exitCode=2;}
