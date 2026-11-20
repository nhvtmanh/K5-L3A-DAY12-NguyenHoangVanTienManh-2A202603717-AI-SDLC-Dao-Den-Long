export class GameAudio {
  constructor(volume=.5){this.volume=volume;this.context=null;this.nextNote=0;this.note=0;}
  async unlock(){try{this.context??=new AudioContext();if(!this.master){this.master=this.context.createGain();this.master.connect(this.context.destination);}this.master.gain.value=this.volume;await this.context.resume();}catch{}}
  setVolume(value){this.volume=value;if(this.master)this.master.gain.setTargetAtTime(value,this.context.currentTime,.03);}
  tone(frequency,duration=.15,type='sine',level=.15){if(!this.context||this.context.state!=='running')return;const t=this.context.currentTime,o=this.context.createOscillator(),gain=this.context.createGain();o.type=type;o.frequency.setValueAtTime(frequency,t);gain.gain.setValueAtTime(level,t);gain.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(gain);gain.connect(this.master);o.start(t);o.stop(t+duration);o.onended=()=>{o.disconnect();gain.disconnect();};}
  event(name){const notes={mote_picked:880,lantern_lit:660,pulse:220,player_hit:110,jump:440,dash:330,game_over:130,won:1046,lost:130,shade_spawned:146,charm_picked:784,countdown:523,wind:174};this.tone(notes[name]??440,name==='lantern_lit'||name==='won'?.6:.18,name==='player_hit'?'triangle':'sine');}
  music(active){if(!this.context||!active)return;const t=this.context.currentTime;if(t>=this.nextNote){this.tone([220,261.63,329.63,293.66,196,261.63,329.63,392][this.note++%8],1.4,'sine',.035);this.nextNote=t+1.1;}}
}
