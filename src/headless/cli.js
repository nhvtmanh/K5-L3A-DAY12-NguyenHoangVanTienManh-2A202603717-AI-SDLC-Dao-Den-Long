import { readFileSync, writeFileSync } from 'node:fs';
import { createGame, step, snapshot } from '../core/game.js';

const fail = message => { const error = new Error(message); error.exitCode = 2; throw error; };
const number = n => typeof n === 'number' && Number.isFinite(n);
const vector = v => Array.isArray(v) && v.length === 3 && v.every(number);
function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { fail(`Cannot read JSON: ${path}`); }
}
function validateScenario(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) fail('scenario must be an object');
  if (s.player !== undefined) {
    if (!s.player || typeof s.player !== 'object' || Array.isArray(s.player)) fail('Invalid player');
    if (s.player.pos !== undefined && !vector(s.player.pos)) fail('Invalid player.pos');
    for (const key of ['carried', 'flames']) if (s.player[key] !== undefined && (!Number.isInteger(s.player[key]) || s.player[key] < 0)) fail(`Invalid player.${key}`);
  }
  for (const key of ['random_motes', 'random_shades']) if (s[key] !== undefined && typeof s[key] !== 'boolean') fail(`Invalid ${key}`);
  if (s.time_left_s !== undefined && (!number(s.time_left_s) || s.time_left_s < 0)) fail('Invalid time_left_s');
  for (const key of ['motes', 'shades', 'lanterns']) if (s[key] !== undefined && !Array.isArray(s[key])) fail(`Invalid ${key}`);
  if (s.motes?.some(v => !vector(v))) fail('Invalid mote position');
  if (s.shades?.some(v => !v || !vector(v.pos) || (v.id !== undefined && typeof v.id !== 'string'))) fail('Invalid shade');
  const shadeIds = s.shades?.filter(v => v.id !== undefined).map(v => v.id) ?? [];
  if (new Set(shadeIds).size !== shadeIds.length) fail('Duplicate shade IDs');
  if (s.lanterns?.some(v => !v || !/^L[1-5]$/.test(v.id) || (v.pos !== undefined && !vector(v.pos)) || (v.lit !== undefined && typeof v.lit !== 'boolean') || (v.deposited !== undefined && (!Number.isInteger(v.deposited) || v.deposited < 0)))) fail('Invalid lantern');
}
function validateInputs(inputs) {
  if (!inputs || !Array.isArray(inputs.frames)) fail('inputs.frames must be an array');
  let previous = -1;
  for (const frame of inputs.frames) {
    if (!frame || !Number.isInteger(frame.tick) || frame.tick <= previous) fail('Frame ticks must strictly increase');
    previous = frame.tick;
    if (frame.move !== undefined && (!Array.isArray(frame.move) || frame.move.length !== 2 || !frame.move.every(n => number(n) && Math.abs(n) <= 1))) fail('Invalid move');
    if (frame.cam_yaw_deg !== undefined && !number(frame.cam_yaw_deg)) fail('Invalid camera yaw');
    for (const key of ['jump', 'interact', 'pulse', 'dash']) if (frame[key] !== undefined && typeof frame[key] !== 'boolean') fail(`Invalid ${key}`);
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
  if (!Number.isSafeInteger(seed) || options.night !== '1' || !Number.isSafeInteger(ticks) || ticks < 0 || !Number.isSafeInteger(every) || every < 1) fail('Invalid numeric arguments');
  const scenario = options.scenario ? readJson(options.scenario) : {};
  const inputs = options.inputs ? readJson(options.inputs) : { frames: [] };
  validateScenario(scenario); validateInputs(inputs);
  const game = createGame(scenario, seed), lines = [snapshot(game)];
  let cursor = 0;
  const input = { move: [0, 0], cam_yaw_deg: 0, jump: false, interact: false, pulse: false };
  while (game.tick < ticks && game.state === 'playing') {
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
