# Project instructions

- Stack: JavaScript ESM, Three.js, Vite, Node.js >=22.12.
- Shared gameplay belongs in src/core; no DOM, renderer, or wall-clock access there.
- Keep 60 fixed simulation steps per second. Input tick k produces state/event tick k+1.
- Headless entry: node src/headless/cli.js. Must not import Three.js or require a GPU.
- Test Contract v1.0 controls input persistence, scenario overrides and JSONL output.
- Keep game.contract.json tuning equal to implemented behavior; never claim unfinished mechanics pass.
- Check changes with npm test and npm run build. Save real evidence, never fabricate output.
- Record assumptions and AI usage under docs/notes. Do not commit secrets or .env.
- Ask the user before choosing or changing gameplay rules and tuning. The approved Phase 1 assumptions are in docs/notes/assumptions.md; do not ask again for those same choices.
- Check browser input against screen direction as well as the headless camera formula; tests/controls.test.js covers this regression.
- Never create a phase tag without completed verification and user authorization.
