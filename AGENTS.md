# Project instructions

- Stack: JavaScript ESM, Three.js, Vite, Node.js >=22.12.
- Shared gameplay belongs in src/core; no DOM, renderer, or wall-clock access there.
- Keep 60 fixed simulation steps per second. Input tick k produces state/event tick k+1.
- Headless entry: node src/headless/cli.js. Must not import Three.js or require a GPU.
- Current scope: Ticket-02 / Test Contract v1.1. Original Phase 1 remains immutable at tag phase-1.
- Fixed standard tuning and maps: src/core/tuning.js and src/core/maps.js; accepted decisions and validation plan: docs/phase-2-spec.md.
- Keep wall tick separate from sim_tick. Paused ticks consume input/snapshot cadence but never timers, physics or spawn schedules.
- Follow the ticket's exact order: input/pause, timers, movement/fall, pickup, deposit, safe zones, pulse, enemies, drifter steal then shade hit, spawn, end state, snapshot.
- Spawned/dropped entities cannot be picked or cause contact in their creation tick. Pulse uses 3D distance, pickup/contact include vertical thresholds.
- Keep game.contract.json tuning equal to implemented behavior; never claim unfinished mechanics pass.
- Check changes with npm test and npm run build. Save real evidence, never fabricate output.
- Record assumptions and AI usage under docs/notes. Do not commit secrets or .env.
- Ask before new ambiguous gameplay decisions. Ticket-02's mandatory numbers replace Phase 1 assumptions without further approval; the user approved all three Phase 2 clarification groups in docs/phase-2-spec.md.
- Check browser input against screen direction as well as the headless camera formula; tests/controls.test.js covers this regression.
- Never create a phase tag without completed verification and user authorization.
