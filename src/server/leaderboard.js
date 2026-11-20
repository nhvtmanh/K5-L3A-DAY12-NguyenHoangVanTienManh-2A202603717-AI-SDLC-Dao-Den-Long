import {readFileSync,writeFileSync,renameSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
export const validName=name=>typeof name==='string'&&/^[A-Za-z0-9_]{3,12}$/.test(name);
export function validateSubmission(value){
 if(!value||!validName(value.name))throw new Error('Tên cần 3–12 ký tự A–Z, a–z, 0–9 hoặc _');
 if(!Number.isSafeInteger(value.score)||value.score<0)throw new Error('Điểm không hợp lệ');
 if(!Number.isInteger(value.nights_won)||value.nights_won<0||value.nights_won>3)throw new Error('Số Đêm thắng không hợp lệ');
 if(!Number.isSafeInteger(value.seed))throw new Error('Seed không hợp lệ');
}
export function sortedEntries(entries){return [...entries].sort((a,b)=>b.score-a.score||Date.parse(a.achieved_at)-Date.parse(b.achieved_at)).slice(0,10);}
export function readEntries(file){
 let raw;try{raw=readFileSync(file,'utf8');}catch(error){if(error.code==='ENOENT')return[];throw error;}
 const data=JSON.parse(raw);if(!Array.isArray(data.entries))throw new Error('File bảng xếp hạng không hợp lệ');
 for(const entry of data.entries){validateSubmission(entry);if(typeof entry.achieved_at!=='string'||!/(Z|[+-]\d\d:\d\d)$/.test(entry.achieved_at)||!Number.isFinite(Date.parse(entry.achieved_at)))throw new Error('Thời điểm thành tích không hợp lệ');}
 return sortedEntries(data.entries);
}
export function addEntry(file,value,now=new Date()){
 validateSubmission(value);const entry={name:value.name,score:value.score,nights_won:value.nights_won,achieved_at:now.toISOString(),seed:value.seed};
 const entries=sortedEntries([...readEntries(file),entry]);mkdirSync(dirname(file),{recursive:true});const temporary=`${file}.${process.pid}.tmp`;
 writeFileSync(temporary,JSON.stringify({entries},null,2)+'\n');renameSync(temporary,file);return entries;
}
