import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {type,release,arch,cpus,totalmem} from 'node:os';
const processStarted=Date.now()-process.uptime()*1000;
let server,browser;
try{
 const args=process.argv.slice(2),o={};for(let i=0;i<args.length;i+=2){if(!['--seed','--duration','--out'].includes(args[i])||args[i+1]===undefined)throw new Error('Use --seed <int> --duration <seconds> --out <file>');o[args[i].slice(2)]=args[i+1];}
 const seed=Number(o.seed),duration=Number(o.duration);if(!Number.isSafeInteger(seed)||!Number.isFinite(duration)||duration<.1||!o.out)throw new Error('Invalid benchmark arguments');
 server=spawn(process.execPath,['scripts/run.mjs','--port','0'],{stdio:['ignore','pipe','pipe']});let serverLog='';server.stderr.on('data',d=>serverLog+=d);
 const url=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error(`Server did not start: ${serverLog}`)),10000);server.stdout.on('data',d=>{const match=String(d).match(/Local: (http:\/\/127\.0\.0\.1:\d+)/);if(match){clearTimeout(timeout);resolve(match[1]);}});server.on('exit',code=>{clearTimeout(timeout);reject(new Error(`Server exited ${code}: ${serverLog}`));});});
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL??'chrome',headless:false,args:['--enable-gpu','--ignore-gpu-blocklist','--window-size=1280,720']});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${url}/?benchmark=1&seed=${seed}&duration=${duration}`);
 await page.waitForFunction(()=>window.__benchResult,null,{timeout:(duration+63)*1000});
 if(errors.length)throw new Error(errors.join('\n'));
 const measured=await page.evaluate(()=>window.__benchResult),ready=await page.evaluate(()=>window.__benchReady);
 if(measured.scene.shades!==200||measured.scene.motes!==100||measured.scene.rendered_shades!==200||measured.scene.rendered_motes!==100||measured.scene.shade_states.join(',')!=='wander'||measured.scene.lit.length!==3||measured.scene.lit.some(l=>l.fuel!==100)||measured.scene.player.some(n=>n!==0))throw new Error('Benchmark scene invariant failed');
 const report={contract_version:'1.3',avg_fps:measured.avg_fps,p1_low_fps:measured.p1_low_fps,frame_ms_p95:measured.frame_ms_p95,frames:measured.frames,load_ms:Math.max(0,measured.first_frame_epoch-processStarted),peak_mem_mb:null,vsync_off:false,renderer:measured.renderer,os:`${type()} ${release()} ${arch()}`};
 writeFileSync(o.out,JSON.stringify(report,null,2)+'\n');
 writeFileSync(`${o.out}.metadata.json`,JSON.stringify({seed,duration_s:duration,warmup_s:3,headed:true,viewport:'1280x720',browser:await browser.version(),cpu:cpus()[0]?.model,ram_mb:totalmem()/1048576,ready,scene:measured.scene,dt_ms:measured.samples,measurement:'Full frame intervals whose two timestamps are inside the exact requested measurement window; boundary-crossing intervals excluded.',memory:'Web renderer is multi-process; reliable renderer RSS unavailable, peak_mem_mb is null.',vsync:'Browser requestAnimationFrame scheduling; no reliable vsync disable API. vsync_off is false.'},null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}catch(error){console.error(error.stack??error.message);process.exitCode=1;}
finally{await browser?.close();server?.kill();}
