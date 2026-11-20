import * as THREE from 'three';
import { createGame, step, TUNING } from '../core/game.js';
import { cameraOffset, movementFromKeys, rotateCamera } from './controls.js';
import './style.css';

const scene = new THREE.Scene();
scene.background = new THREE.Color('#111329');
scene.fog = new THREE.FogExp2('#111329', .014);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 180);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.querySelector('#game').append(renderer.domElement);
scene.add(new THREE.HemisphereLight('#bcc9ff', '#272b36', 2));
const moon = new THREE.DirectionalLight('#b7caff', 2); moon.position.set(-10, 20, 5); scene.add(moon);
function mesh(geometry, color, parent = scene) {
  const object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: .85 }));
  parent.add(object); return object;
}
mesh(new THREE.CylinderGeometry(30, 25, 4, 64), '#354d49').position.y = -2;
const player = new THREE.Group(); scene.add(player);
mesh(new THREE.CylinderGeometry(.35, .5, 1, 8), '#e69d64', player).position.y = .75;
mesh(new THREE.SphereGeometry(.3, 12, 8), '#ffdeb4', player).position.y = 1.5;
mesh(new THREE.ConeGeometry(.8, .35, 24), '#e6cb86', player).position.y = 1.85;
const charm = mesh(new THREE.SphereGeometry(.13, 8, 8), '#ffbd58', player); charm.position.set(.55, 1.4, 0);
const glow = new THREE.PointLight('#ffb953', 8, 7); glow.position.set(.55, 1.5, 0); player.add(glow);
const seed = 7;
let game = createGame({}, seed), yaw = 0, pitch = .55, accumulator = 0;
let pulseTick = -100, hitTick = -100;
const lanternViews = new Map();
for (const lantern of game.lanterns) {
  const group = new THREE.Group(); group.position.fromArray(lantern.pos); scene.add(group);
  mesh(new THREE.CylinderGeometry(.12, .18, 3, 8), '#59444b', group).position.y = 1.5;
  const body = mesh(new THREE.CylinderGeometry(.65, .65, 1, 8), '#825c47', group); body.position.y = 3;
  mesh(new THREE.ConeGeometry(.85, .4, 8), '#352b46', group).position.y = 3.7;
  const light = new THREE.PointLight('#ffc66e', 0, 18); light.position.y = 3; group.add(light);
  lanternViews.set(lantern.id, { body, light });
}
const moteViews = new Map();
const moteGeometry = new THREE.SphereGeometry(.13, 8, 6);
const moteMaterial = new THREE.MeshBasicMaterial({ color: '#ffe68b' });
function resetMoteViews() {
  for (const view of moteViews.values()) scene.remove(view);
  moteViews.clear();
  for (const mote of game.motes) {
    const view = new THREE.Mesh(moteGeometry, moteMaterial);
    view.position.set(mote.pos[0], mote.pos[1] + .65, mote.pos[2]);
    scene.add(view); moteViews.set(mote.id, view);
  }
}
resetMoteViews();
const shadeViews = new Map();
const shadeGeometry = new THREE.SphereGeometry(.65, 16, 12);
const shadeMaterial = new THREE.MeshStandardMaterial({ color: '#21132f', emissive: '#481a66', emissiveIntensity: .5 });
function resetShadeViews() {
  for (const view of shadeViews.values()) scene.remove(view);
  shadeViews.clear();
  for (const shade of game.shades) {
    const view = new THREE.Group();
    const body = new THREE.Mesh(shadeGeometry, shadeMaterial); body.scale.y = 1.3; view.add(body);
    for (const x of [-.23, .23]) {
      const eye = mesh(new THREE.SphereGeometry(.09, 8, 6), '#c796ff', view); eye.position.set(x, .1, .55);
      eye.material.emissive.set('#9d56ff');
    }
    scene.add(view); shadeViews.set(shade.id, view);
  }
}
resetShadeViews();
const pulseView = new THREE.Mesh(new THREE.RingGeometry(.95, 1, 64), new THREE.MeshBasicMaterial({ color: '#ffdb8a', side: THREE.DoubleSide, transparent: true }));
pulseView.rotation.x = -Math.PI / 2; pulseView.visible = false; scene.add(pulseView);
const keys = new Set();
addEventListener('keydown', event => {
  if (['Space', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  keys.add(event.code); if (event.code === 'KeyR') restart();
});
addEventListener('keyup', event => keys.delete(event.code));
addEventListener('blur', () => keys.clear());
const canvas = renderer.domElement;
let dragging = false;
canvas.addEventListener('click', async () => {
  if (document.pointerLockElement === canvas) return;
  try {
    if (!canvas.requestPointerLock) throw new Error('Pointer lock unavailable');
    await canvas.requestPointerLock();
  } catch {
    document.querySelector('#camera-help').textContent = 'Giữ chuột phải và kéo để xoay camera.';
  }
});
canvas.addEventListener('contextmenu', event => event.preventDefault());
canvas.addEventListener('mousedown', event => { if (event.button === 2) dragging = true; });
addEventListener('mouseup', () => { dragging = false; });
addEventListener('blur', () => { dragging = false; });
document.addEventListener('pointerlockchange', () => {
  keys.clear(); dragging = false;
  document.querySelector('#camera-help').textContent = document.pointerLockElement === canvas
    ? 'Di chuột để nhìn · Esc: thả chuột' : 'Bấm vào đảo để dùng chuột · Hoặc giữ chuột phải và kéo';
});
document.addEventListener('mousemove', event => {
  if (document.pointerLockElement !== canvas && !dragging) return;
  ({ yaw, pitch } = rotateCamera(yaw, pitch, event.movementX, event.movementY));
});
function restart() {
  game = createGame({}, seed); accumulator = 0; yaw = 0; pitch = .55;
  pulseTick = hitTick = -100; keys.clear(); resetMoteViews(); resetShadeViews();
}
document.querySelector('#restart').onclick = restart;
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  accumulator += Math.min(clock.getDelta(), .1);
  while (accumulator >= 1 / 60) {
    yaw += (Number(keys.has('ArrowLeft')) - Number(keys.has('ArrowRight'))) * 1.5;
    const events = step(game, { move: movementFromKeys(keys), cam_yaw_deg: yaw, jump: keys.has('Space'), interact: keys.has('KeyE'), pulse: keys.has('KeyQ') });
    for (const event of events) {
      if (event.name === 'pulse') { pulseTick = game.tick; pulseView.position.set(game.player.pos[0], .06, game.player.pos[2]); }
      if (event.name === 'player_hit') hitTick = game.tick;
    }
    accumulator -= 1 / 60;
  }
  player.position.fromArray(game.player.pos);
  const offset = cameraOffset(yaw, pitch);
  camera.position.set(player.position.x + offset[0], player.position.y + 1 + offset[1], player.position.z + offset[2]);
  camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
  for (const shade of game.shades) {
    const view = shadeViews.get(shade.id);
    view.position.set(shade.pos[0], shade.pos[1] + .8, shade.pos[2]);
    view.lookAt(player.position.x, view.position.y, player.position.z);
    view.scale.setScalar(shade.state === 'stunned' ? .7 : 1);
  }
  const pulseAge = (game.tick - pulseTick) / 60;
  pulseView.visible = pulseAge >= 0 && pulseAge < .4;
  pulseView.scale.setScalar(Math.max(.01, TUNING.pulse_radius * Math.min(1, pulseAge / .4)));
  pulseView.material.opacity = Math.max(0, 1 - pulseAge / .4);
  player.visible = game.tick >= game.invulnerableUntil || Math.floor(game.tick / 6) % 2 === 0;
  document.body.classList.toggle('hit', game.tick - hitTick < 15);
  const active = new Set(game.motes.map(m => m.id));
  for (const [id, view] of moteViews) if (!active.has(id)) { scene.remove(view); moteViews.delete(id); }
  for (const lantern of game.lanterns) {
    const view = lanternViews.get(lantern.id);
    view.body.material.color.set(lantern.lit ? '#ffd080' : '#825c47');
    view.body.material.emissive.set(lantern.lit ? '#ff9c32' : '#000000');
    view.body.material.emissiveIntensity = lantern.lit ? 1.5 : 0;
    view.light.intensity = lantern.lit ? 35 : 0;
  }
  const lit = game.lanterns.filter(l => l.lit).length;
  scene.fog.density = .014 - lit * .0015;
  const status = game.state === 'won' ? 'Bạn đã thắp sáng Đảo Bến! Nhấn R để chơi lại.'
    : game.state === 'lost' ? `${game.player.flames <= 0 ? 'Mây đã hết ánh lửa.' : 'Đêm đã kết thúc.'} Nhấn R để thử lại.` : 'Tìm đom đóm, thắp đèn và tránh Bóng Mực.';
  const cooldown = Math.max(0, (game.pulseReadyTick - game.tick) / 60);
  const pulseStatus = cooldown > 0 ? `${cooldown.toFixed(1)}s` : game.player.carried >= TUNING.pulse_cost ? 'sẵn sàng' : 'cần 3 ánh sáng';
  document.querySelector('#hud').textContent = `Máu: ${game.player.flames} · Đom đóm: ${game.player.carried}/20 · Đèn: ${lit}/5 · Điểm: ${game.score} · ${Math.ceil(Math.max(0, game.duration - game.tick / 60))}s · Pulse: ${pulseStatus}`;
  document.querySelector('#status').textContent = status;
  const nearby = game.lanterns.filter(l => !l.lit && Math.hypot(l.pos[0] - player.position.x, l.pos[2] - player.position.z) <= 2)
    .sort((a, b) => Math.hypot(a.pos[0] - player.position.x, a.pos[2] - player.position.z) - Math.hypot(b.pos[0] - player.position.x, b.pos[2] - player.position.z) || a.id.localeCompare(b.id))[0];
  document.querySelector('#interaction').textContent = game.state === 'playing' && nearby
    ? `${nearby.id}: ${nearby.deposited}/10 · ${game.player.carried ? 'Nhấn E để nạp' : 'Cần mang thêm đom đóm'}` : '';
  renderer.render(scene, camera);
});
