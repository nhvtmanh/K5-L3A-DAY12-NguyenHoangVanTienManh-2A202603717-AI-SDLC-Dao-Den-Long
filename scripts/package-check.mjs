import {extractOwnZip} from './zip.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
mkdirSync('.scratch',{recursive:true});const temp=mkdtempSync('.scratch/release-check-'),files=extractOwnZip('release/dao-den-long-v1.0.0.zip',temp),root=resolve(temp,'dao-den-long-v1.0.0');let server,browser;
try{
 server=spawn(process.execPath,['scripts/run.mjs','--port','0'],{cwd:root,stdio:['ignore','pipe','pipe']});let log='';server.stderr.on('data',d=>log+=d);const url=await new Promise((r,j)=>{const t=setTimeout(()=>j(new Error(log||'Package server timeout')),10000);server.stdout.on('data',d=>{const m=String(d).match(/Local: (http:\/\/127\.0\.0\.1:\d+)/);if(m){clearTimeout(t);r(m[1]);}});server.on('exit',c=>{clearTimeout(t);j(new Error(`Package server exited ${c}: ${log}`));});});
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL??'chrome',headless:true,args:['--enable-gpu','--ignore-gpu-blocklist']});const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();await page.getByRole('button',{name:'Vào Đêm',exact:true}).click();await page.waitForFunction(()=>window.__gameDiagnostics?.().screen==='playing');assert.deepEqual(errors,[]);const response=await page.request.get(`${url}/api/leaderboard`);assert.equal(response.status(),200);assert.deepEqual(await response.json(),{entries:[]});
 mkdirSync('docs/proof/phase-4',{recursive:true});await page.screenshot({path:'docs/proof/phase-4/release-package.png'});const report={archive:'release/dao-den-long-v1.0.0.zip',files:files.length,requires_npm_install:false,passed:['ZIP CRC validation','clean extraction','Node-only server from extracted package','WebGL game loads','leaderboard API available'],page_errors:errors};writeFileSync('docs/proof/phase-4/package.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();server?.kill();await new Promise(r=>setTimeout(r,200));rmSync(temp,{recursive:true,force:true});}
