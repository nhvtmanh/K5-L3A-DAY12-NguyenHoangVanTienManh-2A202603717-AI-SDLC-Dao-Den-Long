import * as THREE from 'three';
import { step } from '../core/game.js';
import { Campaign } from '../core/campaign.js';
import { NIGHTS } from '../core/maps.js';
import { PALETTE as C } from '../core/tuning.js';
import { cameraOffset, movementFromKeys, rotateCamera } from './controls.js';
import { GameAudio } from './audio.js';
import { capacity,canReceive,lightCost,hasSafeZone,fuelValue } from '../core/lanterns.js';
import { lanternPresentation,shadeAccent } from './presentation.js';
import {ACTIONS,DEFAULT_BINDINGS,normalizeKey,keyLabel,rebind,validateBindings,mappedInput} from './keybindings.js';
import {scoreForm,leaderboardHtml} from './leaderboard.js';
import {createBenchmarkGame,benchmarkCamera} from '../core/benchmark.js';
import {frameMetrics} from '../metrics.js';
import {visualCues} from './accessibility.js';
import './style.css';
const $=id=>document.getElementById(id);
let settings={volume:.5,sensitivity:.15,colorblind:false,reducedMotion:false,largeText:false,bindings:{...DEFAULT_BINDINGS}};
try{const s=JSON.parse(localStorage.getItem('lantern-settings')??'{}');if(Number.isFinite(s.volume))settings.volume=Math.max(0,Math.min(1,s.volume));if(Number.isFinite(s.sensitivity))settings.sensitivity=Math.max(.03,Math.min(.6,s.sensitivity));if(typeof s.colorblind==='boolean')settings.colorblind=s.colorblind;}catch{}
document.body.classList.toggle('colorblind',settings.colorblind);
try{const s=JSON.parse(localStorage.getItem('lantern-settings')??'{}');settings.reducedMotion=s.reducedMotion===true;settings.largeText=s.largeText===true;if(s.bindings){validateBindings(s.bindings);settings.bindings={...s.bindings};}}catch{}
const query=new URLSearchParams(location.search),isBenchmark=query.get('benchmark')==='1',benchDuration=Number(query.get('duration')??30),benchSeed=Number(query.get('seed')??42);
if(isBenchmark)settings={volume:0,sensitivity:.15,colorblind:false,reducedMotion:false,largeText:false,bindings:{...DEFAULT_BINDINGS}};
let captureAction=null,keyWarning='',lastBoardRequest=0;
const savedGames=new WeakSet();let savingScore=false;
function persistSettings(){try{localStorage.setItem('lantern-settings',JSON.stringify(settings));}catch{}}
function applySettings(){document.body.classList.toggle('colorblind',settings.colorblind);document.body.classList.toggle('reduce-motion',settings.reducedMotion);document.documentElement.style.fontSize=settings.largeText?'22.5px':'18px';$('controls').textContent=`${['forward','left','back','right'].map(a=>keyLabel(settings.bindings[a])).join('')} đi · Chuột nhìn · ${keyLabel(settings.bindings.jump)} nhảy · ${keyLabel(settings.bindings.dash)} lướt · ${keyLabel(settings.bindings.interact)} tương tác · ${keyLabel(settings.bindings.pulse)} tỏa sáng · ${keyLabel(settings.bindings.pause)} tạm dừng`;}
applySettings();
const sound=new GameAudio(settings.volume),campaign=new Campaign(7);
campaign.game=campaign.game??new Campaign(7).game;
// Menu preview uses Night 1 data without starting its gameplay clock.
campaign.introduce();campaign.menu();
if(isBenchmark){campaign.game=createBenchmarkGame(benchSeed);campaign.screen='playing';}
const scene=new THREE.Scene();scene.background=new THREE.Color(C.sky);scene.fog=new THREE.FogExp2(C.fog,.009);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,350);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);$('game').append(renderer.domElement);
const ambient=new THREE.AmbientLight('#ffffff',.15);scene.add(ambient);
const moon=new THREE.DirectionalLight('#ccd6ff',.7);moon.position.set(-20,30,10);scene.add(moon);
const world=new THREE.Group(),actors=new THREE.Group();scene.add(world,actors);
const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.85,...extra});
function mesh(geometry,color,parent=world,extra={}){const m=new THREE.Mesh(geometry,material(color,extra));parent.add(m);return m;}
function clear(group){group.traverse(o=>{if(o.isInstancedMesh)o.dispose();o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});group.clear();}
let lampViews=new Map(),moteViews=new Map(),shadeViews=new Map(),drifterViews=new Map(),charmViews=new Map(),player,pulseView,leaves=[];
let shadeBatches,moteBatches;
const dummy=new THREE.Object3D(),shadeColor=new THREE.Color(C.shade),stunColor=new THREE.Color(C.stunned);
function batch(geometry,mat,count){const object=new THREE.InstancedMesh(geometry,mat,count);object.count=0;object.frustumCulled=false;actors.add(object);return object;}
function buildWorld(){
 clear(world);clear(actors);lampViews.clear();moteViews.clear();shadeViews.clear();drifterViews.clear();charmViews.clear();leaves=[];
 const g=campaign.game,map=g.map;
 const sea=mesh(new THREE.CircleGeometry(200,64),C.sea);sea.rotation.x=-Math.PI/2;sea.position.set(30,-3,0);
 for(const [x,z,r]of map.islands){const base=mesh(new THREE.CylinderGeometry(r,r-2,2,64),C.grass);base.position.set(x,-1,z);const shore=mesh(new THREE.RingGeometry(r-1,r,64),C.sand);shore.rotation.x=-Math.PI/2;shore.position.set(x,.01,z);}
 if(g.night===2){const bridge=mesh(new THREE.BoxGeometry(18,.25,4),C.wood);bridge.position.set(35,-.125,0);}
 if(g.night===3){
  const tier=mesh(new THREE.RingGeometry(12,24,64,1,0,Math.PI),C.grass,world,{side:THREE.DoubleSide});tier.rotation.x=Math.PI/2;tier.position.y=3;
  for(const radius of [12,24]){const wall=mesh(new THREE.CylinderGeometry(radius,radius,3,48,1,true,-Math.PI/2,Math.PI),C.grass,world,{side:THREE.DoubleSide});wall.position.y=1.5;}
  for(const x of [-18,18]){const wall=mesh(new THREE.BoxGeometry(12,3,.1),C.grass);wall.position.set(x,1.5,0);}
  const upper=mesh(new THREE.CylinderGeometry(8,8,.2,48),C.grass);upper.position.y=5.9;
  const tower=mesh(new THREE.CylinderGeometry(2,2,8,24),C.wood);tower.position.y=10;
  const bell=mesh(new THREE.SphereGeometry(.8,16,12),C.gold);bell.position.set(0,14,0);
  for(const deg of [30,150]){const a=deg*Math.PI/180,verts=[];for(const [r,y,side]of [[30,0,-1.5],[30,0,1.5],[24,3,-1.5],[24,3,1.5]])verts.push(Math.cos(a)*r-Math.sin(a)*side,y,Math.sin(a)*r+Math.cos(a)*side);const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geometry.setIndex([0,1,2,1,3,2]);geometry.computeVertexNormals();mesh(geometry,C.sand,world,{side:THREE.DoubleSide});}
 }
 for(const pad of map.pads){const disk=mesh(new THREE.CylinderGeometry(1,1,.08,24),C.red);disk.position.fromArray(pad.pos);disk.position.y+=.04;const border=mesh(new THREE.TorusGeometry(.9,.08,6,24),C.gold);border.rotation.x=Math.PI/2;border.position.copy(disk.position);border.position.y+=.08;}
 for(const l of g.lanterns){
  const group=new THREE.Group();group.position.fromArray(l.pos);world.add(group);
  mesh(new THREE.CylinderGeometry(.12,.18,3,8),C.wood,group).position.y=1.5;
  const body=mesh(new THREE.CylinderGeometry(.65,.65,1,8),C.unlit,group);body.position.y=3;
  const roof=mesh(new THREE.ConeGeometry(.85,.4,8),C.wood,group);roof.position.y=3.7;
  const tearShape=new THREE.Shape();tearShape.moveTo(-.16,.3);for(const[x,y]of[[.04,.16],[-.07,.04],[.15,-.12],[.02,-.32],[-.13,-.18],[-.08,.03],[-.22,.17]])tearShape.lineTo(x,y);tearShape.closePath();
  const tear=new THREE.Group();tear.position.y=3;group.add(tear);const tearGeometry=new THREE.ShapeGeometry(tearShape),tearMaterial=new THREE.MeshBasicMaterial({color:C.sky,side:THREE.DoubleSide});
  for(let i=0;i<4;i++){const a=i*Math.PI/2,patch=new THREE.Mesh(tearGeometry,tearMaterial);patch.rotation.y=a;patch.position.set(Math.sin(a)*.66,0,Math.cos(a)*.66);tear.add(patch);}
  const core=mesh(new THREE.SphereGeometry(.3,12,8),C.core,group,{emissive:C.core});core.position.y=3;core.visible=false;
  const light=new THREE.PointLight(C.lit,0,17);light.position.y=3;group.add(light);
  const safe=mesh(new THREE.RingGeometry(5.9,6,64),C.gold,group,{transparent:true,opacity:.2,side:THREE.DoubleSide});safe.rotation.x=-Math.PI/2;safe.position.y=.04;safe.visible=false;
  const bar=new THREE.Group();bar.position.y=4.35;group.add(bar);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.2),new THREE.MeshBasicMaterial({color:C.sky}));bar.add(back);
  const fill=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.12),new THREE.MeshBasicMaterial({color:C.gold}));fill.position.z=.01;bar.add(fill);
  lampViews.set(l.id,{body,roof,tear,core,light,safe,bar,fill});
 }
 player=new THREE.Group();actors.add(player);
 mesh(new THREE.CylinderGeometry(.35,.5,1,8),C.shirt,player).position.y=.75;
 mesh(new THREE.SphereGeometry(.3,12,8),C.sand,player).position.y=1.5;
 mesh(new THREE.ConeGeometry(.8,.35,24),C.sand,player).position.y=1.85;
 const scarf=mesh(new THREE.BoxGeometry(.5,.15,.2),C.red,player);scarf.position.set(0,1.25,-.3);
 const charm=mesh(new THREE.SphereGeometry(.13,8,8),C.core,player,{emissive:C.lit});charm.position.set(.55,1.4,0);
 const smallLight=new THREE.PointLight(C.lit,6,6);smallLight.position.set(.55,1.5,0);player.add(smallLight);
 pulseView=new THREE.Mesh(new THREE.RingGeometry(.95,1,64),new THREE.MeshBasicMaterial({color:C.halo,side:THREE.DoubleSide,transparent:true}));pulseView.rotation.x=-Math.PI/2;world.add(pulseView);pulseView.visible=false;
 for(let i=0;i<14;i++){const leaf=mesh(new THREE.PlaneGeometry(.3,.12),C.gold,actors,{side:THREE.DoubleSide});leaf.visible=false;leaves.push(leaf);}
 for(const c of g.charms){const group=new THREE.Group();group.position.fromArray(c.pos);group.position.y+=.6;actors.add(group);const paper=mesh(new THREE.BoxGeometry(.45,.7,.06),C.red,group);mesh(new THREE.BoxGeometry(.55,.8,.04),C.gold,group).position.z=-.03;paper.position.z=.01;charmViews.set(c.id,group);}
 shadeBatches={body:batch(new THREE.SphereGeometry(.65,12,8),material('#ffffff'),256),rim:batch(new THREE.SphereGeometry(.68,12,8),new THREE.MeshBasicMaterial({color:shadeAccent(settings.colorblind),side:THREE.BackSide}),256),eyes:batch(new THREE.SphereGeometry(.08,6,6),material(shadeAccent(settings.colorblind),{emissive:shadeAccent(settings.colorblind)}),512)};
 moteBatches={body:batch(new THREE.SphereGeometry(.13,8,6),material(C.mote,{emissive:C.mote,emissiveIntensity:1}),512),halo:batch(new THREE.SphereGeometry(.25,8,6),material(C.halo,{transparent:true,opacity:.15,depthWrite:false}),512)};
}
let yaw=180,pitch=.55,accumulator=0,pulseTick=-100,hitTick=-100,pendingPause=false,lastCountdown=-1,lastWindWarning=-1,menuReturn='menu',spawnNotices=[];
const keys=new Set();
function resetVisuals(){yaw=180;pitch=.55;accumulator=0;pulseTick=hitTick=-100;keys.clear();lastCountdown=-1;lastWindWarning=-1;spawnNotices=[];buildWorld();}
function buttons(items){return `<div class="buttons">${items.map(([action,text,secondary])=>`<button data-action="${action}" class="${secondary?'secondary':''}">${text}</button>`).join('')}</div>`;}
function showPanel(){const g=campaign.game,s=campaign.screen,paused=g.state==='paused';$('hud').hidden=!['playing'].includes(s);$('overlay').hidden=s==='playing'&&!paused;
 if(s==='menu')$('panel').innerHTML=`<span class="eyebrow">ĐẢO ĐÈN LỒNG · BA HÒN ĐẢO</span><h1>Mang ánh sáng<br>trở về đảo</h1><p>Cùng Mây thu thập đom đóm, châm dầu và giữ các hòn đảo sáng tới bình minh.</p>${buttons([['start','Bắt đầu'],['leaderboard','Bảng xếp hạng',true],['settings','Cài đặt',true]])}`;
 else if(s==='intro')$('panel').innerHTML=`<span class="eyebrow">ĐÊM ${g.night} / 3</span><h1>${g.map.name}</h1><blockquote>Ông Đăng: “Mây à, hãy giữ ánh sáng tới bình minh. Châm dầu cho đèn yếu và giữ ít nhất ${Math.ceil(.6*g.lanterns.length)}/${g.lanterns.length} chiếc đèn sáng khi hết Đêm.”</blockquote><p>Đèn yếu dưới 30 dầu mất vùng an toàn. Space nhảy · Shift lướt · E nạp/châm dầu · Q tỏa sáng</p>${buttons([['play','Vào Đêm'],['menu','Về menu',true]])}`;
 else if(s==='result')$('panel').innerHTML=`<span class="eyebrow">ĐÊM ${g.night} · ${g.map.name}</span><h1>${g.state==='won'?'Đảo đã sáng lên':'Ngọn lửa cần bạn'}</h1><p>Điểm Đêm: ${g.score} · Tổng các Đêm thắng: ${campaign.total}</p>${g.state==='lost'?scoreForm(savedGames.has(g)):''}${buttons(g.state==='won'?[['next',g.night===3?'Đón Bình Minh':'Đêm kế tiếp'],['menu','Về menu',true]]:[['retry','Chơi lại Đêm'],['leaderboard','Bảng xếp hạng',true],['menu','Về menu',true]])}`;
 else if(s==='dawn')$('panel').innerHTML=`<span class="eyebrow">BA HÒN ĐẢO ĐÃ SÁNG</span><h1>Bình Minh</h1><p>Mây đã mang ánh sáng về cả ba hòn đảo.</p><h2>Tổng điểm: ${campaign.total}</h2>${scoreForm(savedGames.has(g))}${buttons([['start','Chơi lại hành trình'],['leaderboard','Bảng xếp hạng',true],['menu','Về menu',true]])}`;
 else if(s==='settings')$('panel').innerHTML=`<span class="eyebrow">CÀI ĐẶT</span><h2>Âm thanh, camera và màu</h2><label>Âm lượng <output id="volume-value">${Math.round(settings.volume*100)}%</output><input id="volume" aria-label="Âm lượng" type="range" min="0" max="100" value="${settings.volume*100}"></label><label>Độ nhạy chuột <output id="sensitivity-value">${settings.sensitivity.toFixed(2)}</output><input id="sensitivity" aria-label="Độ nhạy chuột" type="range" min="0.03" max="0.6" step="0.01" value="${settings.sensitivity}"></label><label class="check"><input id="colorblind" type="checkbox" ${settings.colorblind?'checked':''}> Bảng màu dễ phân biệt</label>${buttons([['back','Quay lại']])}`;
 else if(s==='leaderboard'){
  const request=++lastBoardRequest;$('panel').innerHTML='<h2>Bảng xếp hạng</h2><p>Đang tải…</p>'+buttons([['menu','Về menu']]);
  leaderboardHtml().then(html=>{if(campaign.screen==='leaderboard'&&request===lastBoardRequest)$('panel').innerHTML=html+buttons([['menu','Về menu']]);}).catch(error=>{if(campaign.screen==='leaderboard'){$('panel').innerHTML='<h2>Bảng xếp hạng</h2><p id="board-error"></p>'+buttons([['menu','Về menu']]);$('board-error').textContent=error.message;}});
 }
 else if(paused)$('panel').innerHTML=`<span class="eyebrow">ĐÊM ${g.night} · TẠM DỪNG</span><h2>Giữ lại một chút bình yên</h2>${buttons([['resume','Tiếp tục'],['retry','Chơi lại Đêm',true],['settings','Cài đặt',true],['menu','Về menu',true]])}`;
 if(s==='settings'){
  const extra=document.createElement('section');extra.innerHTML=`<label class="check"><input id="reduced-motion" type="checkbox" ${settings.reducedMotion?'checked':''}> Giảm chuyển động</label><label class="check"><input id="large-text" type="checkbox" ${settings.largeText?'checked':''}> Chữ lớn (×1.25)</label><h2>Đổi phím</h2><p id="key-warning" role="alert"></p><div class="key-grid">${Object.entries(ACTIONS).map(([id,label])=>`<button class="secondary" data-action="bind:${id}">${label}: ${keyLabel(settings.bindings[id])}</button>`).join('')}</div>${buttons([['reset-keys','Khôi phục mặc định',true]])}`;
  $('panel').insertBefore(extra,$('panel').lastElementChild);$('key-warning').textContent=captureAction?`Nhấn phím mới cho ${ACTIONS[captureAction]}`:keyWarning;
 }
 if(!$('overlay').hidden&&document.pointerLockElement)document.exitPointerLock();
}
function action(name){if(isBenchmark)return;sound.unlock();if(name==='start'){campaign.start();resetVisuals();}if(name==='play')campaign.play();if(name==='retry'){campaign.retry();resetVisuals();}if(name==='next'){campaign.next();resetVisuals();}if(name==='menu')campaign.menu();if(name==='leaderboard')campaign.screen='leaderboard';if(name==='resume')pendingPause=true;if(name==='settings'){menuReturn=campaign.screen;campaign.screen='settings';}if(name==='back'){campaign.screen=menuReturn;captureAction=null;}if(name.startsWith('bind:')){captureAction=name.slice(5);keyWarning='';}if(name==='reset-keys'){settings.bindings={...DEFAULT_BINDINGS};captureAction=null;keyWarning='Đã khôi phục phím mặc định';persistSettings();applySettings();}showPanel();}
$('panel').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)action(b.dataset.action);});
$('panel').addEventListener('input',e=>{if(e.target.id==='volume'){settings.volume=Number(e.target.value)/100;sound.setVolume(settings.volume);$('volume-value').textContent=`${e.target.value}%`;}else if(e.target.id==='sensitivity'){settings.sensitivity=Number(e.target.value);$('sensitivity-value').textContent=settings.sensitivity.toFixed(2);}else if(e.target.id==='colorblind')settings.colorblind=e.target.checked;else if(e.target.id==='reduced-motion')settings.reducedMotion=e.target.checked;else if(e.target.id==='large-text')settings.largeText=e.target.checked;persistSettings();applySettings();});
$('panel').addEventListener('submit',async e=>{if(e.target.id!=='score-form')return;e.preventDefault();const game=campaign.game;if(savingScore||savedGames.has(game))return;savingScore=true;const button=e.target.querySelector('button');button.disabled=true;
 try{const response=await fetch('/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('player-name').value,score:campaign.total,nights_won:campaign.screen==='dawn'?3:campaign.night-1,seed:campaign.seed})});const data=await response.json();if(!response.ok)throw new Error(data.error??'Không lưu được điểm');savedGames.add(game);if(campaign.game===game)showPanel();}
 catch(error){if($('score-message'))$('score-message').textContent=error.message;button.disabled=false;}finally{savingScore=false;}});
const canvas=renderer.domElement;let dragging=false;
canvas.addEventListener('click',async()=>{if(campaign.screen!=='playing'||campaign.game.state==='paused')return;sound.unlock();try{await canvas.requestPointerLock?.();}catch{$('camera-help').textContent='Giữ chuột phải và kéo để xoay camera';}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('mousedown',e=>{if(e.button===2)dragging=true;});addEventListener('mouseup',()=>dragging=false);
document.addEventListener('mousemove',e=>{if(campaign.screen!=='playing'||campaign.game.state==='paused'||(document.pointerLockElement!==canvas&&!dragging))return;({yaw,pitch}=rotateCamera(yaw,pitch,e.movementX*settings.sensitivity/.15,e.movementY*settings.sensitivity/.15));});
let wasLocked=false;
document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===canvas;if(wasLocked&&!locked&&campaign.screen==='playing'&&campaign.game.state==='playing')pendingPause=true;wasLocked=locked;});
addEventListener('blur',()=>{keys.clear();dragging=false;if(campaign.screen==='playing'&&campaign.game.state==='playing')pendingPause=true;});
addEventListener('keydown',e=>{if(isBenchmark)return;
 if(captureAction&&campaign.screen==='settings'){e.preventDefault();try{settings.bindings=rebind(settings.bindings,captureAction,e.code);persistSettings();applySettings();keyWarning='Đã lưu phím mới';}catch(error){keyWarning=error.message;}captureAction=null;showPanel();return;}
 if(e.target instanceof HTMLInputElement)return;const code=normalizeKey(e.code),pauseKey=code===settings.bindings.pause||(code==='Escape'&&!Object.values(settings.bindings).includes('Escape')&&settings.bindings.pause==='KeyP');
 if(campaign.screen==='playing'&&(Object.values(settings.bindings).includes(code)||pauseKey))e.preventDefault();if(pauseKey&&!e.repeat&&campaign.screen==='playing')pendingPause=true;else keys.add(e.code);
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
function actorViews(g){
 const sync=(list,views,build,position)=>{const ids=new Set(list.map(e=>e.id));for(const[id,view]of views)if(!ids.has(id)){view.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});actors.remove(view);views.delete(id);}for(const item of list){let view=views.get(item.id);if(!view){view=build(item);views.set(item.id,view);actors.add(view);}position(item,view);}};
 const moteCount=Math.min(512,g.motes.length);moteBatches.body.count=moteBatches.halo.count=moteCount;
 for(let i=0;i<moteCount;i++){const m=g.motes[i];dummy.position.set(m.pos[0],m.pos[1]+.4,m.pos[2]);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);dummy.updateMatrix();moteBatches.body.setMatrixAt(i,dummy.matrix);moteBatches.halo.setMatrixAt(i,dummy.matrix);}
 moteBatches.body.instanceMatrix.needsUpdate=moteBatches.halo.instanceMatrix.needsUpdate=true;
 const shadeCount=Math.min(256,g.shades.length);shadeBatches.body.count=shadeBatches.rim.count=shadeCount;shadeBatches.eyes.count=shadeCount*2;
 shadeBatches.rim.material.color.set(shadeAccent(settings.colorblind));shadeBatches.eyes.material.color.set(shadeAccent(settings.colorblind));shadeBatches.eyes.material.emissive.set(shadeAccent(settings.colorblind));
 for(let i=0;i<shadeCount;i++){const s=g.shades[i],scale=s.state==='spawning'?.4:1,angle=Math.atan2(player.position.x-s.pos[0],player.position.z-s.pos[2]);dummy.position.fromArray(s.pos);dummy.rotation.set(0,angle,0);dummy.scale.set(scale,scale*1.2,scale);dummy.updateMatrix();shadeBatches.body.setMatrixAt(i,dummy.matrix);shadeBatches.body.setColorAt(i,s.state==='stunned'?stunColor:shadeColor);shadeBatches.rim.setMatrixAt(i,dummy.matrix);for(let eye=0;eye<2;eye++){const x=eye? .23:-.23;dummy.position.set(s.pos[0]+(x*Math.cos(angle)+.55*Math.sin(angle))*scale,s.pos[1]+.1*scale,s.pos[2]+(-x*Math.sin(angle)+.55*Math.cos(angle))*scale);dummy.rotation.set(0,0,0);dummy.scale.setScalar(scale);dummy.updateMatrix();shadeBatches.eyes.setMatrixAt(i*2+eye,dummy.matrix);}}
 for(const view of Object.values(shadeBatches))view.instanceMatrix.needsUpdate=true;if(shadeBatches.body.instanceColor)shadeBatches.body.instanceColor.needsUpdate=true;
 sync(g.drifters,drifterViews,()=>{const group=new THREE.Group();const ribbon=mesh(new THREE.PlaneGeometry(2,.4,6,1),C.drifter,group,{side:THREE.DoubleSide});ribbon.rotation.x=.3;return group;},(d,v)=>{v.position.fromArray(d.pos);v.position.y+=Math.sin(g.sim_tick/12)*.2;v.rotation.y=g.sim_tick/30;});
 for(const c of g.charms){const view=charmViews.get(c.id);if(view){view.visible=c.available;view.rotation.y=g.sim_tick/50;}}
}
function hud(g){const lit=g.lanterns.filter(l=>l.lit).length,remaining=Math.max(0,Math.ceil(g.duration-g.sim_tick/60));
 $('flames').textContent=`${'● '.repeat(g.player.flames)}${'○ '.repeat(3-g.player.flames)} Ngọn Lửa`;
 $('timer').textContent=`${settings.colorblind&&remaining<=30?'⚠ ':''}${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;$('timer').classList.toggle('danger',remaining<=30);
 $('lantern-count').textContent=`Đèn ${lit}/${g.lanterns.length} · Bình minh cần ${Math.ceil(.6*g.lanterns.length)}`;$('score').textContent=`${g.score+(campaign.screen==='result'&&g.state==='won'?campaign.total-g.score:campaign.total)} điểm`;
 $('night-name').textContent=`Đêm ${g.night} · ${g.map.name}`;
 $('mote-bar').innerHTML=`<span>${g.player.carried} / ${capacity(g)}</span>`+Array.from({length:capacity(g)},(_,i)=>`<i class="${i<g.player.carried?'filled':''}"></i>`).join('');
 $('dash-status').textContent=`${keyLabel(settings.bindings.dash)} · Lướt ${g.charm?'không hồi chiêu':g.dashCd?`${(g.dashCd/60).toFixed(1)}s`:'sẵn sàng'}`;
 $('pulse-status').textContent=`${keyLabel(settings.bindings.pulse)} · Tỏa sáng ${g.pulseCd?`${(g.pulseCd/60).toFixed(1)}s`:g.player.carried>=3?'sẵn sàng':'cần 3 đom đóm'}`;$('charm-status').textContent=g.charm?`Bùa Gió ${(g.charm/60).toFixed(1)}s`:'';
 const distance=l=>Math.hypot(l.pos[0]-g.player.pos[0],l.pos[2]-g.player.pos[2]);const nearest=g.lanterns.filter(l=>!l.lit).sort((a,b)=>distance(a)-distance(b)||a.id.localeCompare(b.id))[0];
 const receiving=g.lanterns.filter(l=>canReceive(l)&&distance(l)<=2).sort((a,b)=>distance(a)-distance(b)||a.id.localeCompare(b.id))[0];
 $('interaction').textContent=receiving?receiving.lit?`${keyLabel(settings.bindings.interact)} — Châm dầu (${fuelValue(receiving)}/100)`:`${keyLabel(settings.bindings.interact)} — Nạp ánh sáng (${receiving.deposited}/${lightCost(receiving)})`:'';
 if(nearest){const point=new THREE.Vector3(...nearest.pos);point.y+=2;point.project(camera);const off=Math.abs(point.x)>1||Math.abs(point.y)>1||point.z>1;$('objective-arrow').hidden=!off;const angle=Math.atan2(-point.y,point.x)+(point.z>1?Math.PI:0);$('objective-arrow').innerHTML=`<span style="display:inline-block;transform:rotate(${angle}rad)">➤</span> ${nearest.id} · ${Math.round(distance(nearest))}m`;}else $('objective-arrow').hidden=true;
 const phase=g.sim_tick%1800,warning=g.night===3&&g.windEnabled&&phase>=1680;
 $('wind-warning').textContent=(settings.colorblind&&(g.wind.active||warning)?'⚠ ':'')+(g.wind.active?'Gió mạnh — giữ vững bước chân':warning?'Lá đang bay… gió sắp tới!':'');
 $('danger-indicator').textContent=settings.colorblind&&g.sim_tick-hitTick<15?'⚠ Mây vừa bị đánh':'';
 spawnNotices=spawnNotices.filter(n=>n.until>=g.sim_tick);
 $('captions').textContent=visualCues(g,spawnNotices).join(' · ');
 $('spawn-arrows').innerHTML=spawnNotices.map(n=>{const point=new THREE.Vector3(...n.pos).project(camera),flip=point.z>1?-1:1,dx=point.x*flip,dy=-point.y*flip,norm=Math.max(.001,Math.hypot(dx,dy)),ux=dx/norm,uy=dy/norm,scale=Math.min((innerWidth/2-70)/Math.max(.001,Math.abs(ux)),(innerHeight/2-90)/Math.max(.001,Math.abs(uy)));return `<span class="spawn-marker" style="left:${innerWidth/2+ux*scale}px;top:${innerHeight/2+uy*scale}px"><b style="display:inline-block;transform:rotate(${Math.atan2(uy,ux)}rad)">➤</b> ${n.id}</span>`;}).join('');
 for(let i=0;i<leaves.length;i++){const leaf=leaves[i];leaf.visible=warning||g.wind.active;leaf.position.set(g.player.pos[0]+Math.sin(g.sim_tick/25+i)*5,2+(i%4),g.player.pos[2]+Math.cos(g.sim_tick/35+i)*5);leaf.rotation.y=g.sim_tick/10+i;}
 ambient.intensity=.15+.55*lit/g.lanterns.length;
}
let frames=0,fpsTime=performance.now(),averageFPS=0,last=performance.now(),firstBenchFrame=null,lastBenchFrame=null,benchSamples=[];
resetVisuals();showPanel();
window.__gameDiagnostics=()=>({night:campaign.night,screen:campaign.screen,state:campaign.game.state,tick:campaign.game.tick,sim_tick:campaign.game.sim_tick,average_fps:averageFPS,ambient:ambient.intensity,player:[...campaign.game.player.pos],capacity:capacity(campaign.game),settings:structuredClone(settings),shade_accent:shadeAccent(settings.colorblind),shade_colors:campaign.game.shades.length?[shadeBatches.rim.material.color.getHexString(),shadeBatches.eyes.material.color.getHexString()]:[],warning_color:getComputedStyle(document.body).getPropertyValue('--warning-color').trim(),rendered_shades:shadeBatches.body.count,rendered_motes:moteBatches.body.count,lanterns:campaign.game.lanterns.map(l=>({id:l.id,fuel:fuelValue(l),...lanternPresentation(l,campaign.game.sim_tick),paper_scale_actual:lampViews.get(l.id)?.body.scale.y,tear_visible_actual:lampViews.get(l.id)?.tear.visible}))});
renderer.setAnimationLoop(()=>{
 const now=performance.now(),dt=Math.min((now-last)/1000,.1);last=now;frames++;if(now-fpsTime>=1000){averageFPS=frames*1000/(now-fpsTime);fpsTime=now;frames=0;}
 const g=campaign.game;
 if(campaign.screen==='playing'){
  accumulator+=dt;
  while(accumulator>=1/60){const grounded=g.player.grounded,wasJump=g.previous.jump;const input=isBenchmark?{}:{...mappedInput(keys,settings.bindings),cam_yaw_deg:yaw,pause:pendingPause&&!g.previous.pause};if(input.pause)pendingPause=false;
   const events=step(g,input);if(grounded&&!wasJump&&input.jump&&!g.player.grounded)sound.event('jump');
   for(const e of events){sound.event(e.name==='game_over'?e.data.result:e.name);if(e.name==='shade_spawned'){const shade=g.shades.find(s=>s.id===e.data.id);if(shade)spawnNotices.push({id:shade.id,pos:[...shade.pos],until:g.sim_tick+180});}if(e.name==='pulse'){pulseTick=g.sim_tick;pulseView.position.set(g.player.pos[0],g.player.pos[1]+.06,g.player.pos[2]);}if(e.name==='player_hit')hitTick=g.sim_tick;if(['paused','resumed'].includes(e.name)){keys.clear();showPanel();}}
   const remaining=Math.ceil(g.duration-g.sim_tick/60);if(remaining<=10&&remaining>0&&remaining!==lastCountdown){sound.event('countdown');lastCountdown=remaining;}
   if(g.night===3&&g.sim_tick%1800===1680&&lastWindWarning!==g.sim_tick){sound.event('wind');lastWindWarning=g.sim_tick;}
   campaign.settle();if(campaign.screen==='result')showPanel();accumulator-=1/60;if(campaign.screen!=='playing')break;
  }
 }else accumulator=0;
 player.position.fromArray(g.player.pos);player.rotation.y=Math.atan2(g.facing[0],g.facing[1]);player.visible=!g.respawn&&(!g.invuln||Math.floor(g.sim_tick/6)%2===0);
 const offset=cameraOffset(yaw,pitch);camera.position.set(player.position.x+offset[0],player.position.y+1+offset[1],player.position.z+offset[2]);camera.lookAt(player.position.x,player.position.y+1,player.position.z);
 if(isBenchmark){camera.position.fromArray(benchmarkCamera(firstBenchFrame?(now-firstBenchFrame.perf)/1000:0));camera.lookAt(0,0,0);}
 actorViews(g);
 for(const l of g.lanterns){const v=lampViews.get(l.id),look=lanternPresentation(l,g.sim_tick);v.body.scale.y=look.paperScale;v.roof.position.y=l.lit?3.7:3.6;v.tear.visible=look.torn;v.tear.scale.y=look.paperScale;v.body.material.color.set(l.lit?C.lit:C.unlit);v.body.material.emissive.set(l.lit?C.lit:'#000000');v.body.material.emissiveIntensity=l.lit?(look.blinkOn?1:.1):0;v.core.visible=l.lit&&look.blinkOn;v.safe.visible=hasSafeZone(l);v.light.intensity=l.lit?(look.blinkOn?25:2):0;v.bar.visible=look.barVisible;v.bar.quaternion.copy(camera.quaternion);v.fill.scale.x=look.fuelRatio;v.fill.position.x=-(1-look.fuelRatio)*.8;}
 const age=(g.sim_tick-pulseTick)/60;pulseView.visible=age>=0&&age<.4;pulseView.scale.setScalar(Math.max(.01,5*Math.min(1,age/.4)));pulseView.material.opacity=Math.max(0,1-age/.4);
 document.body.classList.toggle('hit',!settings.reducedMotion&&g.sim_tick-hitTick<15);hud(g);sound.music(!isBenchmark&&campaign.screen==='playing'&&g.state==='playing');renderer.render(scene,camera);
 if(isBenchmark){const timestamp=performance.now();if(!firstBenchFrame){firstBenchFrame={perf:timestamp,epoch:Date.now()};lastBenchFrame=timestamp;window.__benchReady={first_frame_epoch:firstBenchFrame.epoch,camera:camera.position.toArray(),width:innerWidth,height:innerHeight,shades:g.shades.length,motes:g.motes.length};}
  else{const start=firstBenchFrame.perf+3000,end=start+benchDuration*1000;if(lastBenchFrame>=start&&timestamp<=end)benchSamples.push(timestamp-lastBenchFrame);lastBenchFrame=timestamp;if(timestamp>=end&&!window.__benchResult){const gl=renderer.getContext(),info=gl.getExtension('WEBGL_debug_renderer_info');window.__benchResult={...frameMetrics(benchSamples),renderer:`Three.js r${THREE.REVISION}; ${info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}`,first_frame_epoch:firstBenchFrame.epoch,scene:{shades:g.shades.length,motes:g.motes.length,rendered_shades:shadeBatches.body.count,rendered_motes:moteBatches.body.count,shade_states:[...new Set(g.shades.map(s=>s.state))],player:[...g.player.pos],lit:g.lanterns.filter(l=>l.lit).map(l=>({id:l.id,fuel:fuelValue(l)}))},warmup_s:3,duration_s:benchDuration,samples:benchSamples};renderer.setAnimationLoop(null);}}
 }
});
