# Project instructions

- Stack: JavaScript ESM, Three.js, Vite, Node.js >=22.12.
- Shared gameplay belongs in src/core; no DOM, renderer, or wall-clock access there.
- Keep 60 fixed simulation steps per second. Input tick k produces state/event tick k+1.
- Headless entry: node src/headless/cli.js. Must not import Three.js or require a GPU.
- Current scope: Ticket-03 / Test Contract v1.2. Original phases remain immutable at phase-1 and phase-2.
- Fixed tuning/maps: src/core/tuning.js and src/core/maps.js. Phase3 approved decisions/plan: docs/phase-3-spec.md; design rationale: docs/adr/0001-lantern-fuel-and-dawn.md.
- Keep wall tick separate from sim_tick. Paused ticks consume input/snapshot cadence but never timers, physics or spawn schedules.
- Follow tick order: input/pause, timers including fuel decay+drain then extinguish, movement/fall, pickup, deposit/refuel, safe zones, pulse, enemies, drifter steal then shade hit, spawn, dawn/death evaluation, snapshot.
- Fuel uses integer 1/60 units. Never use rounded snapshot fuel for thresholds or bonuses. Safe requires lit AND fuel>=30; all_lit must never end a night early.
- After stun expiration keep wander for the recovery step, with targeting/contact starting next step. fuel_drain cadence is sim_tick%60===0, never wall tick.
- Spawned/dropped entities cannot be picked or cause contact in their creation tick. Pulse uses 3D distance, pickup/contact include vertical thresholds.
- Keep game.contract.json tuning equal to implemented behavior; never claim unfinished mechanics pass.
- Check changes with npm test and npm run build. Save real evidence, never fabricate output.
- Record assumptions and AI usage under docs/notes. Do not commit secrets or .env.
- Ask before new ambiguous gameplay decisions; do not re-ask approved Phase2/3 assumptions. Mandatory ticket replacements do not require another choice. Update changed tests with reasons, never silently skip them.
- Current proof output belongs under docs/proof/phase-3; never overwrite historical proofPhase1/2 when rerunning inherited scripts.
- Check browser input against screen direction as well as the headless camera formula; tests/controls.test.js covers this regression.
- Never create a phase tag without completed verification and user authorization.
