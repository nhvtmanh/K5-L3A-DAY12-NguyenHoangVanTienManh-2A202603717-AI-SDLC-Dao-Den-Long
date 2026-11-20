export const TUNING = Object.freeze({
  player_speed: 5, night1_duration_s: 300, flames: 3,
  carry_capacity: 20, lantern_cost: 10, pickup_radius: 1, interact_radius: 2,
  pulse_cost: 3, pulse_radius: 5, pulse_stun_s: 2, pulse_push_m: 3, pulse_cooldown_s: 3,
  invuln_s: 2, hit_drop_ratio: 0, safe_radius: 4, shade_speed: 2, shade_hit_radius: .8,
  score: Object.freeze({ per_mote: 10, per_lantern: 100, per_stun: 5, per_second_left: 2, per_flame_left: 50 }),
});
const round = n => Math.round(n * 1000) / 1000;
const distance = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
function randomGenerator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
export function createGame(scenario = {}, seed = 7) {
  const lanterns = Array.from({ length: 5 }, (_, i) => {
    const angle = i * Math.PI * 2 / 5;
    return { id: `L${i + 1}`, pos: [Math.sin(angle) * 18, 0, Math.cos(angle) * 18], lit: false, deposited: 0 };
  });
  for (const patch of scenario.lanterns ?? []) {
    const lantern = lanterns.find(l => l.id === patch.id);
    Object.assign(lantern, structuredClone(patch));
    if (lantern.deposited >= TUNING.lantern_cost) lantern.lit = true;
  }
  const random = randomGenerator(seed);
  const positions = scenario.motes ?? (scenario.random_motes === false ? [] : Array.from({ length: 100 }, () => {
    const angle = random() * Math.PI * 2, radius = Math.sqrt(random()) * 28;
    return [Math.sin(angle) * radius, 0, Math.cos(angle) * radius];
  }));
  const shades = scenario.shades ?? (scenario.random_shades === false ? [] : Array.from({ length: 3 }, () => {
    const angle = random() * Math.PI * 2, radius = Math.sqrt(144 + random() * (28 * 28 - 144));
    return { pos: [Math.sin(angle) * radius, 0, Math.cos(angle) * radius] };
  }));
  const reservedShadeIds = new Set(shades.filter(s => s.id !== undefined).map(s => s.id));
  let nextShadeId = 1;
  const initialShades = shades.map(s => {
    let id = s.id;
    if (id === undefined) {
      while (reservedShadeIds.has(`S${nextShadeId}`)) nextShadeId++;
      id = `S${nextShadeId++}`; reservedShadeIds.add(id);
    }
    return { ...structuredClone(s), id, state: 'chase', stunnedUntil: 0 };
  });
  return {
    tick: 0, state: 'playing', score: 0,
    duration: scenario.time_left_s ?? TUNING.night1_duration_s,
    player: { pos: [0, 0, 0], carried: 0, flames: TUNING.flames, ...structuredClone(scenario.player ?? {}) },
    lanterns, shades: initialShades,
    motes: positions.map((pos, i) => ({ id: `M${i + 1}`, pos: [...pos] })),
    vy: 0, previousJump: false, previousInteract: false, previousPulse: false,
    pulseReadyTick: 0, invulnerableUntil: 0,
  };
}
export function step(game, input = {}) {
  if (game.state !== 'playing') return [];
  const [x, z] = input.move ?? [0, 0];
  const length = Math.max(1, Math.hypot(x, z));
  const theta = (input.cam_yaw_deg ?? 0) * Math.PI / 180;
  const p = game.player.pos;
  p[0] += (x * Math.cos(theta) + z * Math.sin(theta)) / length * TUNING.player_speed / 60;
  p[2] += (-x * Math.sin(theta) + z * Math.cos(theta)) / length * TUNING.player_speed / 60;
  // Island edge is a barrier in this initial scaffold; falling is disabled.
  const radius = Math.hypot(p[0], p[2]);
  if (radius > 29) { p[0] *= 29 / radius; p[2] *= 29 / radius; }
  if (input.jump && !game.previousJump && p[1] === 0) game.vy = 5;
  game.previousJump = Boolean(input.jump);
  if (p[1] > 0 || game.vy > 0) { p[1] = Math.max(0, p[1] + game.vy / 60); game.vy -= 9.8 / 60; }
  if (p[1] === 0 && game.vy < 0) game.vy = 0;
  game.tick++;
  const events = [];
  const emit = (name, data) => events.push({ type: 'event', tick: game.tick, name, data });
  game.motes = game.motes.filter(mote => {
    if (game.player.carried >= TUNING.carry_capacity || distance(p, mote.pos) > TUNING.pickup_radius) return true;
    game.player.carried++;
    game.score += TUNING.score.per_mote;
    emit('mote_picked', { carried: game.player.carried });
    return false;
  });
  if (input.interact && !game.previousInteract && game.player.carried > 0) {
    const lantern = game.lanterns.filter(l => !l.lit && distance(p, l.pos) <= TUNING.interact_radius)
      .sort((a, b) => distance(p, a.pos) - distance(p, b.pos) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
    if (lantern) {
      const amount = Math.min(game.player.carried, TUNING.lantern_cost - lantern.deposited);
      game.player.carried -= amount;
      lantern.deposited += amount;
      emit('deposit', { lantern_id: lantern.id, amount, deposited: lantern.deposited });
      if (lantern.deposited >= TUNING.lantern_cost) {
        lantern.lit = true;
        game.score += TUNING.score.per_lantern;
        emit('lantern_lit', { lantern_id: lantern.id });
      }
    }
  }
  game.previousInteract = Boolean(input.interact);
  if (input.pulse && !game.previousPulse && game.tick >= game.pulseReadyTick && game.player.carried >= TUNING.pulse_cost) {
    game.player.carried -= TUNING.pulse_cost;
    game.pulseReadyTick = game.tick + TUNING.pulse_cooldown_s * 60;
    const stunnedIds = [];
    for (const shade of game.shades) {
      const d = distance(p, shade.pos);
      if (d > TUNING.pulse_radius) continue;
      const dx = d ? (shade.pos[0] - p[0]) / d : 1, dz = d ? (shade.pos[2] - p[2]) / d : 0;
      shade.pos[0] += dx * TUNING.pulse_push_m;
      shade.pos[2] += dz * TUNING.pulse_push_m;
      shade.stunnedUntil = game.tick + TUNING.pulse_stun_s * 60;
      shade.state = 'stunned';
      stunnedIds.push(shade.id);
    }
    game.score += stunnedIds.length * TUNING.score.per_stun;
    emit('pulse', { stunned_ids: stunnedIds });
  }
  game.previousPulse = Boolean(input.pulse);
  const playerProtected = game.lanterns.some(l => l.lit && distance(p, l.pos) <= TUNING.safe_radius);
  for (const shade of game.shades) {
    shade.state = game.tick < shade.stunnedUntil ? 'stunned' : 'chase';
    if (shade.state !== 'stunned') {
      const d = distance(p, shade.pos), amount = Math.min(d, TUNING.shade_speed / 60);
      if (d) {
        shade.pos[0] += (p[0] - shade.pos[0]) / d * amount;
        shade.pos[2] += (p[2] - shade.pos[2]) / d * amount;
      }
    }
    for (const lantern of game.lanterns) {
      if (!lantern.lit) continue;
      const d = distance(shade.pos, lantern.pos);
      if (d <= TUNING.safe_radius) {
        const dx = d ? (shade.pos[0] - lantern.pos[0]) / d : 1;
        const dz = d ? (shade.pos[2] - lantern.pos[2]) / d : 0;
        shade.pos[0] = lantern.pos[0] + dx * (TUNING.safe_radius + 1e-6);
        shade.pos[2] = lantern.pos[2] + dz * (TUNING.safe_radius + 1e-6);
      }
    }
    if (!playerProtected && shade.state !== 'stunned' && game.player.flames > 0 && game.tick >= game.invulnerableUntil && distance(p, shade.pos) <= TUNING.shade_hit_radius) {
      game.player.flames--;
      game.invulnerableUntil = game.tick + TUNING.invuln_s * 60;
      emit('player_hit', { by: 'shade', flames: game.player.flames, dropped: 0 });
    }
  }
  let reason;
  if (game.player.flames <= 0) { game.state = 'lost'; reason = 'no_flames'; }
  else if (game.lanterns.every(l => l.lit)) { game.state = 'won'; reason = 'all_lit'; }
  else if (game.tick / 60 >= game.duration) { game.state = 'lost'; reason = 'dawn'; }
  if (game.state === 'won') game.score += Math.floor(Math.max(0, game.duration - game.tick / 60)) * TUNING.score.per_second_left
    + game.player.flames * TUNING.score.per_flame_left;
  if (reason) emit('game_over', { result: game.state, reason });
  return events;
}
export function snapshot(g) {
  return {
    type: 'snapshot', tick: g.tick, sim_tick: g.tick, state: g.state,
    time_left_s: Math.max(0, g.duration - g.tick / 60), score: g.score,
    player: { ...g.player, pos: g.player.pos.map(round) },
    lanterns: g.lanterns.map(l => ({ ...l, pos: l.pos.map(round) })),
    shades: g.shades.map(s => ({ id: s.id, state: s.state, pos: s.pos.map(round) })), motes_active: g.motes.length,
    motes: g.motes.map(m => ({ id: m.id, pos: m.pos.map(round) })),
  };
}
