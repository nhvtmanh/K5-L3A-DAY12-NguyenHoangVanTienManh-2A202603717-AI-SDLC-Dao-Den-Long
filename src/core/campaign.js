import { createGame } from './game.js';
export class Campaign {
  constructor(seed=7){this.seed=seed;this.screen='menu';this.night=1;this.total=0;this.game=null;}
  start(){this.total=0;this.night=1;this.introduce();}
  introduce(){this.game=createGame({},this.seed,this.night);this.screen='intro';}
  play(){if(this.screen==='intro')this.screen='playing';}
  settle(){if(this.screen!=='playing'||!['won','lost'].includes(this.game.state))return; if(this.game.state==='won')this.total+=this.game.score;this.screen='result';}
  next(){if(this.screen!=='result'||this.game.state!=='won')return;if(this.night===3)this.screen='dawn';else{this.night++;this.introduce();}}
  retry(){this.introduce();}
  menu(){this.screen='menu';}
}
