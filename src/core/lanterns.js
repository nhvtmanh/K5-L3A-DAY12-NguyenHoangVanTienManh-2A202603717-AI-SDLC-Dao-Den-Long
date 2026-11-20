export const FUEL_SCALE = 60;
export const fuelValue = lantern => lantern.lit ? Math.round(lantern.fuelUnits / 6) / 10 : 0;
export const hasSafeZone = lantern => lantern.lit && lantern.fuelUnits >= 30 * FUEL_SCALE;
export const capacity = game => Math.min(20, 10 + 2 * game.player.successful_lights);
export const lightCost = lantern => lantern.ever_lit ? 5 : 10;
export function canReceive(lantern) {
  return lantern.lit ? lantern.fuelUnits < 100 * FUEL_SCALE : lantern.deposited < lightCost(lantern);
}
export function initializeLantern(base, patch = {}) {
  const lantern = { ...structuredClone(base), ...structuredClone(patch) };
  if (patch.lit !== false && lantern.deposited >= (patch.ever_lit ? 5 : 10)) lantern.lit = true;
  lantern.ever_lit = lantern.lit || Boolean(patch.ever_lit);
  lantern.relit_count = 0;
  lantern.fuelUnits = lantern.lit ? Math.round((patch.fuel ?? 100) * FUEL_SCALE) : 0;
  delete lantern.fuel;
  return lantern;
}
export function updateFuel(game, emit) {
  for (const lantern of game.lanterns) {
    if (!lantern.lit) continue;
    const draining = game.shades.filter(shade => shade.state === 'drain'
      && shade.target_lantern_id === lantern.id && lantern.fuelUnits < 30 * FUEL_SCALE
      && Math.hypot(shade.pos[0] - lantern.pos[0], shade.pos[2] - lantern.pos[2]) <= 2);
    lantern.fuelUnits = Math.max(0, lantern.fuelUnits - 1 - 5 * draining.length);
    if (game.sim_tick % 60 === 0) for (const shade of draining)
      emit('fuel_drain', { lantern_id: lantern.id, shade_id: shade.id, fuel: fuelValue(lantern) });
    if (lantern.fuelUnits === 0) {
      lantern.lit = false; lantern.deposited = 0; lantern.ever_lit = true;
      emit('lantern_out', { lantern_id: lantern.id });
    }
  }
}
export function interactWithLantern(game, lantern, emit) {
  const player = game.player;
  if (!player.carried || !canReceive(lantern)) return;
  if (lantern.lit) {
    const amount = Math.min(player.carried, Math.ceil((6000 - lantern.fuelUnits) / 600));
    if (!amount) return;
    player.carried -= amount; lantern.fuelUnits = Math.min(6000, lantern.fuelUnits + amount * 600);
    game.score += amount * 5;
    emit('refuel', { lantern_id: lantern.id, amount, fuel: fuelValue(lantern) });
    return;
  }
  const amount = Math.min(player.carried, lightCost(lantern) - lantern.deposited);
  player.carried -= amount; lantern.deposited += amount; game.score += amount * 5;
  emit('deposit', { lantern_id: lantern.id, amount, deposited: lantern.deposited });
  if (lantern.deposited >= lightCost(lantern)) {
    const relight = lantern.ever_lit;
    lantern.lit = true; lantern.ever_lit = true; lantern.fuelUnits = 6000;
    if (relight) lantern.relit_count++;
    game.player.successful_lights++;
    game.score += relight ? 40 : 100;
    emit('lantern_lit', { lantern_id: lantern.id, relight });
  }
}
export function finishAtDawn(game, emit) {
  let reason;
  if (game.player.flames <= 0) { game.state = 'lost'; reason = 'no_flames'; }
  else if (game.sim_tick / 60 >= game.duration) {
    const lit = game.lanterns.filter(lantern => lantern.lit);
    if (lit.length >= Math.ceil(.6 * game.lanterns.length)) {
      game.state = 'won'; reason = 'dawn_survived';
      game.score += lit.reduce((sum, lantern) => sum + 50 + Math.floor(lantern.fuelUnits / 60), 0) + 50 * game.player.flames;
    } else { game.state = 'lost'; reason = 'dawn'; }
  }
  if (reason) emit('game_over', { result: game.state, reason });
}
