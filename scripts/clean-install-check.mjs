import {spawnSync,spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {chromium} from 'playwright';

// Copy the current reviewable source, including uncommitted changes; never reuse dependencies/builds.
const root=process.cwd();mkdirSync('.scratch',{recursive:true});
const fresh=mkdtempSync(resolve('.scratch','clean-install-'));
const listed=spawnSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'});
if(listed.status!==0)throw new Error(listed.stderr);
let files=0;
for(const file of new Set(listed.stdout.split('\0').filter(Boolean))){
 if(file==='d'||file.startsWith('docs/proof/phase-4/')||file.endsWith('.mp4'))continue;
 const target=resolve(fresh,file);
 if(!target.startsWith(fresh+sep))throw new Error('Unsafe copy target');
 if(!existsSync(resolve(root,file)))continue;
 mkdirSync(resolve(target,'..'),{recursive:true});cpSync(resolve(root,file),target);files++;
}
const checks=[];
// npm's JS CLI avoids shell quoting and npm.ps1 execution policy issues.
const npmCli=join(resolve(process.execPath,'..'),'node_modules','npm','bin','npm-cli.js');
for(const args of [['ci','--offline','--no-audit','--no-fund'],['run','build'],['test']]){
 const result=spawnSync(process.execPath,[npmCli,...args],{cwd:fresh,encoding:'utf8'});
 writeFileSync(join(fresh,`${args[0]}.txt`),result.stdout+result.stderr);
 if(result.status!==0)throw new Error(`${args.join(' ')} failed; see ${fresh}`);
 checks.push(args.join(' '));
}
let browser,server;
try{
 server=spawn(process.execPath,['scripts/run.mjs','--port','0'],{cwd:fresh,stdio:['ignore','pipe','pipe']});let log='';server.stderr.on('data',d=>log+=d);
 const url=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error(log||'Server timed out')),10000);server.stdout.on('data',d=>{const match=String(d).match(/Local: (http:\/\/127\.0\.0\.1:\d+)/);if(match){clearTimeout(timeout);resolve(match[1]);}});server.on('exit',code=>{clearTimeout(timeout);reject(new Error(`Server exited ${code}`));});});
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL??'chrome',headless:true,args:['--enable-gpu','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();await page.getByRole('button',{name:'Vào Đêm',exact:true}).click();
 await page.waitForFunction(()=>window.__gameDiagnostics?.().sim_tick>30);
 if(errors.length)throw new Error(errors.join('\n'));
 checks.push('production server from freshly installed and built source','WebGL gameplay advances','no browser errors');
 const output='docs/proof/phase-4';mkdirSync(output,{recursive:true});
 writeFileSync(`${output}/clean-install.json`,JSON.stringify({method:'Copy git-listed current source into a new directory, no pre-existing node_modules/dist; npm ci uses npm cache only, no dependency directory reuse. This is not a committed Git clone.',source_files:files,node:process.version,browser:await browser.version(),checks,passed:true},null,2)+'\n');
 writeFileSync(`${output}/tests.txt`,readFileSync(join(fresh,'test.txt')));
 writeFileSync(`${output}/clean-build.txt`,readFileSync(join(fresh,'run.txt')));
 console.log(JSON.stringify({fresh,checks,passed:true},null,2));
}finally{await browser?.close();server?.kill();}
