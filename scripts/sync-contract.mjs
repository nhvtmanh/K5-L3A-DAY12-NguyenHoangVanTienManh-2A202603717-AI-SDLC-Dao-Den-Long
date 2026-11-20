import {readFileSync,writeFileSync} from 'node:fs';
import {TUNING} from '../src/core/tuning.js';
const contract=JSON.parse(readFileSync('game.contract.json','utf8'));
contract.contract_version='1.3';contract.tuning=TUNING;contract.run_cmd='node scripts/run.mjs';contract.bench_cmd='node scripts/bench.mjs';contract.soak_cmd='node --jitless --max-semi-space-size=1 --max-old-space-size=32 scripts/soak.mjs';
writeFileSync('game.contract.json',JSON.stringify(contract,null,2)+'\n');
console.log('Contract v1.3 tuning and commands synchronized with runtime.');
