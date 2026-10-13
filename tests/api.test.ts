import {afterAll,beforeAll,describe,it,expect} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {Server} from 'node:http';
import {createApp} from '../server/app';
let server:Server;let base:string;const dir=mkdtempSync(join(tmpdir(),'time-restorer-test-'));
beforeAll(async()=>{delete process.env.AI_API_KEY;await new Promise<void>(resolve=>{server=createApp(dir).listen(0,'127.0.0.1',()=>resolve());});base=`http://127.0.0.1:${(server.address() as {port:number}).port}/api`;});
afterAll(async()=>{await new Promise<void>(resolve=>server.close(()=>resolve()));rmSync(dir,{recursive:true,force:true});});
async function post(path:string,body:unknown={}){const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
describe('后端强制确认',()=>{
 it('器类不关联史实，导出与重新确认均由服务端校验',async()=>{let {data:s}=await post('/sessions');const path='/sessions/'+s.id;expect(s.facts.find((f:{field:string})=>f.field==='年代').value).toBe('未核验');expect((await post(path+'/generate',{style:'专业导览'})).status).toBe(400);await post(path+'/events',{action:'确认方鼎示意'});s=(await post(path+'/generate',{style:'专业导览'})).data;expect(s.draft.mode).toContain('离线示例');expect((await post(path+'/export',{revision:s.revision,acknowledged:true})).status).toBe(409);expect((await post(path+'/confirm',{revision:s.revision-1,draftId:s.draft.id})).status).toBe(409);await post(path+'/confirm',{revision:s.revision,draftId:s.draft.id});expect((await post(path+'/export',{revision:s.revision,acknowledged:true})).status).toBe(200);s=(await post(path+'/generate',{style:'器物自述'})).data;expect((await post(path+'/export',{revision:s.revision,acknowledged:true})).status).toBe(409);await post(path+'/confirm',{revision:s.revision,draftId:s.draft.id});await post(path+'/events',{action:'调整参数',detail:{width:3}});expect((await post(path+'/export',{revision:s.revision,acknowledged:true})).status).toBe(409);});
 it('非法语体、跨站请求、未知会话被拒绝',async()=>{const {data:s}=await post('/sessions');expect((await post('/sessions/'+s.id+'/generate',{style:'任意指令'})).status).toBe(400);expect((await post('/sessions/not-found/export')).status).toBe(404);expect((await fetch(base+'/sessions',{method:'POST',headers:{Origin:'https://unknown.example'}})).status).toBe(403);});
});
