import { readFileSync, writeFileSync } from 'node:fs';
import { createGame, step, snapshot } from '../core/game.js';

const fail = message => { const error = new Error(message); error.exitCode = 2; throw error; };
const number = n => typeof n === 'number' && Number.isFinite(n);
const vector = v => Array.isArray(v) && v.length === 3 && v.every(number);
function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { fail(`Cannot read JSON: ${path}`); }
}
function validateScenario(s, night) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) fail('scenario must be an object');
  if (s.player !== undefined) {
    if (!s.player || typeof s.player !== 'object' || Array.isArray(s.player)) fail('Invalid player');
    if (s.player.pos !== undefined && !vector(s.player.pos)) fail('Invalid player.pos');
    for (const key of ['carried', 'flames']) if (s.player[key] !== undefined && (!Number.isInteger(s.player[key]) || s.player[key] < 0)) fail(`Invalid player.${key}`);
    for (const key of ['invuln_ticks','dash_cd_ticks','pulse_cd_ticks','charm_ticks']) if(s.player[key]!==undefined&&(!Number.isSafeInteger(s.player[key])||s.player[key]<0)) fail(`Invalid player.${key}`);
  }
  for (const key of ['random_motes', 'random_shades','random_drifters','wind_enabled']) if (s[key] !== undefined && typeof s[key] !== 'boolean') fail(`Invalid ${key}`);
  if (s.time_left_s !== undefined && (!number(s.time_left_s) || s.time_left_s < 0)) fail('Invalid time_left_s');
  for (const key of ['motes', 'shades', 'lanterns','drifters','charms']) if (s[key] !== undefined && !Array.isArray(s[key])) fail(`Invalid ${key}`);
  if (s.motes?.some(v => !vector(v))) fail('Invalid mote position');
  if (s.shades?.some(v => !v || !vector(v.pos) || (v.id !== undefined && typeof v.id !== 'string'))) fail('Invalid shade');
  const shadeIds = s.shades?.filter(v => v.id !== undefined).map(v => v.id) ?? [];
  if (new Set(shadeIds).size !== shadeIds.length) fail('Duplicate shade IDs');
  if (s.lanterns?.some(v => !v || !new RegExp(`^L[1-${night+4}]$`).test(v.id) || (v.pos !== undefined && !vector(v.pos)) || (v.lit !== undefined && typeof v.lit !== 'boolean') || (v.deposited !== undefined && (!Number.isInteger(v.deposited) || v.deposited < 0||v.deposited>10)))) fail('Invalid lantern');
  for(const shade of s.shades??[]){if(shade.state!==undefined&&!['spawning','wander','chase','recoil','stunned'].includes(shade.state))fail('Invalid shade state');if(shade.state_ticks_left!==undefined&&(!Number.isSafeInteger(shade.state_ticks_left)||shade.state_ticks_left<0))fail('Invalid shade timer');}
  for(const d of s.drifters??[])if(!d||!vector(d.pos)||(d.id!==undefined&&typeof d.id!=='string')||(d.state!==undefined&&!['idle','chase','flee','removed'].includes(d.state))||(d.stolen!==undefined&&(!Number.isInteger(d.stolen)||d.stolen<0))||(d.state_ticks_left!==undefined&&(!Number.isInteger(d.state_ticks_left)||d.state_ticks_left<0)))fail('Invalid drifter');
  for(const c of s.charms??[])if(!c||!['C1','C2'].includes(c.id)||(c.pos!==undefined&&!vector(c.pos))||(c.available!==undefined&&typeof c.available!=='boolean')||(c.respawn_s!==undefined&&(!number(c.respawn_s)||c.respawn_s<0))||(c.respawn_ticks!==undefined&&(!Number.isInteger(c.respawn_ticks)||c.respawn_ticks<0)))fail('Invalid charm');
  for(const list of [s.lanterns,s.drifters,s.charms]){const ids=list?.filter(v=>v.id!==undefined).map(v=>v.id)??[];if(new Set(ids).size!==ids.length)fail('Duplicate entity IDs');}
}
function validateInputs(inputs) {
  if (!inputs || !Array.isArray(inputs.frames)) fail('inputs.frames must be an array');
  let previous = -1;
  for (const frame of inputs.frames) {
    if (!frame || !Number.isInteger(frame.tick) || frame.tick <= previous) fail('Frame ticks must strictly increase');
    previous = frame.tick;
    if (frame.move !== undefined && (!Array.isArray(frame.move) || frame.move.length !== 2 || !frame.move.every(n => number(n) && Math.abs(n) <= 1))) fail('Invalid move');
    if (frame.cam_yaw_deg !== undefined && !number(frame.cam_yaw_deg)) fail('Invalid camera yaw');
    for (const key of ['jump', 'interact', 'pulse', 'dash','pause']) if (frame[key] !== undefined && typeof frame[key] !== 'boolean') fail(`Invalid ${key}`);
  }
}
try {
  const args = process.argv.slice(2), options = {};
  const allowed = ['seed', 'night', 'scenario', 'inputs', 'ticks', 'out', 'snapshot-every'];
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].slice(2);
    if (!args[i].startsWith('--') || !allowed.includes(key) || args[i + 1] === undefined || options[key] !== undefined) fail('Invalid CLI arguments');
    options[key] = args[i + 1];
  }
  for (const key of ['seed', 'night', 'ticks', 'out']) if (options[key] === undefined) fail(`Missing --${key}`);
  const seed = Number(options.seed), ticks = Number(options.ticks), every = Number(options['snapshot-every'] ?? 10);
  const night=Number(options.night);
  if (!Number.isSafeInteger(seed) || ![1,2,3].includes(night) || !Number.isSafeInteger(ticks) || ticks < 0 || !Number.isSafeInteger(every) || every < 1) fail('Invalid numeric arguments');
  const scenario = options.scenario ? readJson(options.scenario) : {};
  const inputs = options.inputs ? readJson(options.inputs) : { frames: [] };
  validateScenario(scenario,night); validateInputs(inputs);
  const game = createGame(scenario, seed,night), lines = [snapshot(game),{type:'event',tick:0,name:'night_start',data:{night}}];
  let cursor = 0;
  const input = { move: [0, 0], cam_yaw_deg: 0, jump: false, interact: false, pulse: false };
  while (game.tick < ticks && (game.state === 'playing'||game.state === 'paused')) {
    if (inputs.frames[cursor]?.tick === game.tick) Object.assign(input, inputs.frames[cursor++]);
    lines.push(...step(game, input));
    if (game.tick % every === 0) lines.push(snapshot(game));
  }
  lines.push({ type: 'end', ticks: game.tick, state: game.state, score: game.score });
  writeFileSync(options.out, lines.map(row => JSON.stringify(row)).join('\n') + '\n');
} catch (error) {
  console.error(error.message);
  process.exitCode = error.exitCode ?? 1;
}
