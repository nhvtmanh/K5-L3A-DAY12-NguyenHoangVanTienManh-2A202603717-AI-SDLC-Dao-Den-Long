import {createGame} from './game.js';
import {seededRandom} from './random.js';
export function createBenchmarkGame(seed=42){
 const random=seededRandom(seed),points=(count,height)=>Array.from({length:count},(_,i)=>{const radius=39*Math.sqrt((i+.5)/count),angle=i*Math.PI*(3-Math.sqrt(5))+(random()-.5)*.03;return[Math.cos(angle)*radius,height,Math.sin(angle)*radius];});
 const game=createGame({random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false,motes:points(100,0),shades:points(200,.8).map(pos=>({pos,state:'wander'})),lanterns:['L1','L2','L3'].map(id=>({id,lit:true,fuel:100}))},seed,1);
 game.benchmark=true;return game;
}
// Positive rotation around +Y is counterclockwise when viewed down from above.
export function benchmarkCamera(elapsedSeconds){const angle=elapsedSeconds*Math.PI*2/15;return[30*Math.cos(angle),15,-30*Math.sin(angle)+0];}
