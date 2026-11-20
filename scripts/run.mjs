import {createServer} from 'node:http';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {readEntries} from '../src/server/leaderboard.js';
import {leaderboardApi} from '../src/server/api.js';
const root=fileURLToPath(new URL('../',import.meta.url));
try{
 const args=process.argv.slice(2),options={};for(let i=0;i<args.length;i+=2){if(!['--port','--data-dir','--export-leaderboard'].includes(args[i])||args[i+1]===undefined)throw new Error('Invalid server arguments');options[args[i].slice(2)]=args[i+1];}
 const file=process.env.LEADERBOARD_FILE??resolve(options['data-dir']??resolve(root,'data'),'leaderboard.json');
 if(options['export-leaderboard']){writeFileSync(options['export-leaderboard'],JSON.stringify({entries:readEntries(file)},null,2)+'\n');}
 else{
  const port=Number(options.port??4173),dist=resolve(root,'dist');if(!Number.isInteger(port)||port<0||port>65535)throw new Error('Invalid port');if(!existsSync(resolve(dist,'index.html')))throw new Error('Run npm run build first');
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.mp4':'video/mp4','.svg':'image/svg+xml'};
  const server=createServer(async(req,res)=>{
   if(await leaderboardApi(req,res,file))return;
   try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const path=resolve(dist,`.${pathname==='/'?'/index.html':pathname}`);if(!path.startsWith(dist+sep)){res.writeHead(403);res.end();return;}
    const bytes=readFileSync(path);res.writeHead(200,{'Content-Type':types[extname(path)]??'application/octet-stream','Cache-Control':'no-cache'});res.end(bytes);
   }catch{res.writeHead(404);res.end('Not found');}
  });
  server.on('error',error=>{console.error(error.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${server.address().port}`));
 }
}catch(error){console.error(error.message);process.exitCode=1;}
