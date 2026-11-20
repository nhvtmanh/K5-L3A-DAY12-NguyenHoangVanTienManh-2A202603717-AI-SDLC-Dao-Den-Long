import {fuelValue} from '../core/lanterns.js';
export function visualCues(game,spawns=[]){
 const remaining=Math.max(0,Math.ceil(game.duration-game.sim_tick/60)),phase=game.sim_tick%1800,messages=[];
 if(spawns.length)messages.push(`Bóng Mực xuất hiện: ${spawns.map(n=>n.id).join(', ')}`);
 if(game.night===3&&game.windEnabled&&phase>=1680)messages.push('Gió sắp thổi trong 2 giây');
 if(remaining<=10&&remaining>0)messages.push(`Còn ${remaining} giây tới bình minh`);
 const weak=game.lanterns.filter(l=>l.lit&&l.fuelUnits<1800);if(weak.length)messages.push(`⚠ Đèn yếu: ${weak.map(l=>`${l.id} ${fuelValue(l)} dầu`).join(', ')}`);
 return messages;
}
