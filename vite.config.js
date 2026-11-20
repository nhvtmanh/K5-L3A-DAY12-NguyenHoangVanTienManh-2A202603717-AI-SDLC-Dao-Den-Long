import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import {leaderboardApi} from './src/server/api.js';
export default defineConfig({base:'./',plugins:[{name:'local-leaderboard',configureServer(server){
 const file=process.env.LEADERBOARD_FILE??resolve('data/leaderboard.json');server.middlewares.use(async(req,res,next)=>{if(!await leaderboardApi(req,res,file))next();});
}}]});
