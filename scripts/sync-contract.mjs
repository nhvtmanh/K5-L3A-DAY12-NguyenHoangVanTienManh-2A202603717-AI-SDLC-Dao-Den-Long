import {readFileSync,writeFileSync} from 'node:fs';
import {TUNING} from '../src/core/tuning.js';
const contract=JSON.parse(readFileSync('game.contract.json','utf8'));
contract.contract_version='1.2';contract.tuning=TUNING;
writeFileSync('game.contract.json',JSON.stringify(contract,null,2)+'\n');
console.log('Contract v1.2 tuning synchronized with runtime constants.');
