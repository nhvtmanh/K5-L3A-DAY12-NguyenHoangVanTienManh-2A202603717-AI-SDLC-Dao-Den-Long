import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync,writeFileSync,readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const url='http://127.0.0.1:4179',phase3=JSON.parse(readFileSync('game.contract.json','utf8')).contract_version==='1.2',folder=phase3?'docs/proof/phase-3':'docs/proof/phase-2';mkdirSync(folder,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4179','--strictPort'],{stdio:['ignore','pipe','pipe']});
let logs='',browser;server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);
try{
 for(let i=0;i<100;i++){if(server.exitCode!==null)throw new Error(logs);try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL??'chrome',headless:true,args:process.env.BROWSER_SOFTWARE==='1'?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:['--enable-gpu','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();await page.getByText('Ông Đăng:',{exact:false}).waitFor();await page.getByRole('button',{name:'Vào Đêm',exact:true}).click();
 await page.waitForFunction(()=>window.__gameDiagnostics?.().screen==='playing');
 if(phase3){const initial=await page.evaluate(()=>window.__gameDiagnostics());assert.equal(initial.capacity,10);assert.ok(initial.lanterns.every(l=>l.paper_scale_actual===.8&&l.tear_visible_actual));}
 await page.screenshot({path:`${folder}/game-night1.png`});
 await page.mouse.move(900,360);await page.mouse.down({button:'right'});await page.mouse.move(1050,400,{steps:10});await page.mouse.up({button:'right'});
 await page.keyboard.down('KeyD');await page.waitForTimeout(250);await page.keyboard.up('KeyD');await page.keyboard.press('Space');await page.keyboard.press('Shift');
 await page.waitForTimeout(2000);
 const fps=await page.evaluate(async()=>{const timestamps=[];return await new Promise(resolve=>{const begin=performance.now();function frame(t){timestamps.push(t);if(t-begin<5000)requestAnimationFrame(frame);else resolve((timestamps.length-1)*1000/(timestamps.at(-1)-timestamps[0]));}requestAnimationFrame(frame);});});
 await page.keyboard.press('KeyP');await page.waitForFunction(()=>window.__gameDiagnostics().state==='paused');
 const before=await page.evaluate(()=>window.__gameDiagnostics());await page.waitForTimeout(300);const after=await page.evaluate(()=>window.__gameDiagnostics());assert.equal(before.sim_tick,after.sim_tick);assert.ok(after.tick>before.tick);
 await page.screenshot({path:`${folder}/pause.png`});
 await page.getByRole('button',{name:'Cài đặt',exact:true}).click();await page.locator('#volume').fill('30');await page.locator('#sensitivity').fill('0.25');
 if(phase3){await page.getByRole('checkbox',{name:'Bảng màu dễ phân biệt',exact:true}).check();await page.waitForFunction(()=>{const d=window.__gameDiagnostics();return d.settings.colorblind&&d.shade_colors.length>0&&d.shade_colors.every(c=>c==='00b3ff');});const color=await page.evaluate(()=>window.__gameDiagnostics());assert.equal(color.shade_accent,'#00B3FF');assert.equal(color.warning_color,'#FFFFFF');assert.ok(color.shade_colors.every(c=>c==='00b3ff'));}
 await page.reload();await page.getByRole('button',{name:'Cài đặt',exact:true}).click();assert.equal(await page.locator('#volume').inputValue(),'30');assert.equal(await page.locator('#sensitivity').inputValue(),'0.25');
 if(phase3)assert.equal(await page.getByRole('checkbox',{name:'Bảng màu dễ phân biệt',exact:true}).isChecked(),true);
 await page.screenshot({path:`${folder}/settings.png`});await page.getByRole('button',{name:'Quay lại',exact:true}).click();
 await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();await page.getByRole('button',{name:'Vào Đêm',exact:true}).click();await page.keyboard.press('KeyP');await page.waitForFunction(()=>window.__gameDiagnostics().state==='paused');await page.getByRole('button',{name:'Chơi lại Đêm',exact:true}).click();await page.getByRole('button',{name:'Vào Đêm',exact:true}).click();const reset=await page.evaluate(()=>window.__gameDiagnostics());assert.ok(reset.sim_tick<30);assert.equal(reset.night,1);
 assert.deepEqual(errors,[]);
 const gpu=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2');const info=gl.getExtension('WEBGL_debug_renderer_info');return info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
 const report={browser:await browser.version(),viewport:'1280x720',renderer:gpu,average_fps:fps,fps_requirement_met:fps>=30,measurement:'5s requestAnimationFrame after 2s warmup; normal Night1 with default entities; browser GPU reported in renderer field',page_errors:errors,passed:['menu/intro/playing','mouse/keyboard smoke','pause freezes sim but advances tick','settings survive reload','restart same night',...(phase3?['colorblind setting persists','alternate shade colors and warning color','off lantern actual paper scale0.8 and visible tear']:[])],limits:['No listening test of synthesized audio','No manual playthrough of all three nights','FPS measured in this browser environment, not the common grading machine']};
 writeFileSync(`${folder}/browser.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));assert.ok(fps>=30,'Measured normal game FPS below30');
}finally{await browser?.close();server.kill();}
