import {readdirSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,relative,basename,resolve,dirname,sep} from 'node:path';
import {deflateRawSync,inflateRawSync} from 'node:zlib';
const crcTable=Array.from({length:256},(_,i)=>{let n=i;for(let k=0;k<8;k++)n=n&1?0xEDB88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let c=0xFFFFFFFF;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0;}
export function zipDirectory(directory,output){
 const files=[];function walk(path){for(const e of readdirSync(path,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=join(path,e.name);if(e.isDirectory())walk(p);else if(e.isFile())files.push(p);}}walk(directory);
 const chunks=[],central=[];let offset=0;const now=new Date(),date=((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate(),time=(now.getHours()<<11)|(now.getMinutes()<<5)|Math.floor(now.getSeconds()/2);
 for(const path of files){const name=Buffer.from(`${basename(directory)}/${relative(directory,path).split(sep).join('/')}`),bytes=readFileSync(path),compressed=deflateRawSync(bytes),crc=crc32(bytes),header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(8,8);header.writeUInt16LE(time,10);header.writeUInt16LE(date,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(compressed.length,18);header.writeUInt32LE(bytes.length,22);header.writeUInt16LE(name.length,26);chunks.push(header,name,compressed);
  const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(8,10);c.writeUInt16LE(time,12);c.writeUInt16LE(date,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(compressed.length,20);c.writeUInt32LE(bytes.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);central.push(c,name);offset+=header.length+name.length+compressed.length;
 }
 const centralBytes=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(centralBytes.length,12);end.writeUInt32LE(offset,16);writeFileSync(output,Buffer.concat([...chunks,centralBytes,end]));return files.length;
}
export function extractOwnZip(archive,directory){
 const data=readFileSync(archive),target=resolve(directory);let offset=0;const files=[];
 while(data.readUInt32LE(offset)===0x04034b50){const method=data.readUInt16LE(offset+8),size=data.readUInt32LE(offset+18),nameLength=data.readUInt16LE(offset+26),extra=data.readUInt16LE(offset+28),name=data.subarray(offset+30,offset+30+nameLength).toString('utf8'),start=offset+30+nameLength+extra,path=resolve(target,name);if(!path.startsWith(target+sep))throw new Error('Unsafe zip path');const bytes=method===8?inflateRawSync(data.subarray(start,start+size)):data.subarray(start,start+size);if(crc32(bytes)!==data.readUInt32LE(offset+14))throw new Error('ZIP CRC mismatch');mkdirSync(dirname(path),{recursive:true});writeFileSync(path,bytes);files.push(path);offset=start+size;}
 return files;
}
