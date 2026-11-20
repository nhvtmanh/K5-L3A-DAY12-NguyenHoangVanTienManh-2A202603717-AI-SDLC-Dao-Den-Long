import {readEntries,addEntry,validateSubmission} from './leaderboard.js';
export async function leaderboardApi(request,response,file){
 const path=new URL(request.url,'http://localhost').pathname;
 if(path!=='/api/leaderboard')return false;
 const send=(status,data)=>{response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});response.end(JSON.stringify(data));};
 try{
  if(request.method==='GET')send(200,{entries:readEntries(file)});
  else if(request.method==='POST'){
   let body='';for await(const chunk of request){body+=chunk;if(body.length>16384){send(413,{error:'Dữ liệu quá lớn'});return true;}}
   let value;try{value=JSON.parse(body);validateSubmission(value);}catch(error){send(400,{error:error.message});return true;}
   send(201,{entries:addEntry(file,value)});
  }else send(405,{error:'Chỉ hỗ trợ GET/POST'});
 }catch(error){send(500,{error:`Không đọc/lưu được bảng xếp hạng: ${error.message}`});}
 return true;
}
