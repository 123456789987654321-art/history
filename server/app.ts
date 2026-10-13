import express from 'express';
import {randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {resolve} from 'node:path';
import {canExport,compose,disclosure,facts,invalidate,passages,styles,type Session,type Style} from './domain';
export function createApp(dataDir=resolve('data')){
 const app=express(); const sessions=new Map<string,Session>(); mkdirSync(dataDir,{recursive:true});
 app.set('trust proxy',1);
 const limits=new Map<string,{count:number;until:number}>();
 app.use('/api',(req,res,next)=>{if(req.method!=='POST'){next();return;}const now=Date.now();for(const [key,value] of limits)if(value.until<now)limits.delete(key);const generation=req.path.endsWith('/generate');const key=(req.ip||'unknown')+(generation?':generation':':events');const limit=generation?6:180;const current=limits.get(key)||{count:0,until:now+60000};current.count++;limits.set(key,current);if(current.count>limit){res.status(429).json({error:'操作过于频繁，请一分钟后重试'});return;}next();});
 app.use(express.json({limit:'40kb'}));
 app.use('/api',(req,res,next)=>{const origin=req.headers.origin;if(origin && !['http://127.0.0.1:5173','http://localhost:5173',`http://${req.headers.host}`].includes(origin)){res.status(403).json({error:'不允许的请求来源'});return;}res.setHeader('Cache-Control','no-store');next();});
 const save=(s:Session,action:string,detail:unknown)=>{s.logs.push({at:new Date().toISOString(),action,detail});writeFileSync(resolve(dataDir,s.id+'.tmp'),JSON.stringify(s,null,2));renameSync(resolve(dataDir,s.id+'.tmp'),resolve(dataDir,s.id+'.json'));};
 app.get('/api/health',(_,res)=>res.json({ok:true,mode:process.env.AI_API_KEY?'online':'offline'}));
 app.post('/api/sessions',(_,res)=>{if(sessions.size>=1000){res.status(503).json({error:'会话容量已满，请重启本地服务'});return;}const s:Session={id:randomUUID(),revision:0,confirmedRevision:null,typeConfirmed:false,draft:null,logs:[]};sessions.set(s.id,s);save(s,'创建会话',{disclosure});res.json({...s,facts});});
 app.use('/api/sessions/:id',(req,res,next)=>{const s=sessions.get(req.params.id);if(!s){res.status(404).json({error:'会话已失效，请刷新页面'});return;}if(s.logs.length>=3000){res.status(429).json({error:'本次操作记录已满，请刷新开始新会话'});return;}res.locals.session=s;next();});
 app.post('/api/sessions/:id/events',(req,res)=>{const s:Session=res.locals.session;const {action,detail}=req.body;if(!['确认方鼎示意','上传照片','调整参数','调整贴图','拆解部件','复合部件','查看热点','复核推定','调整视角'].includes(action)){res.status(400).json({error:'未知操作'});return;}if(action==='确认方鼎示意')s.typeConfirmed=true;if(['上传照片','调整参数','调整贴图','复核推定'].includes(action))invalidate(s);save(s,action,detail);res.json(s);});
 app.post('/api/sessions/:id/generate',async(req,res)=>{const s:Session=res.locals.session;const style=req.body.style as Style;if(!styles.includes(style)||!s.typeConfirmed){res.status(400).json({error:'请先确认方鼎示意，并选择有效语体'});return;}invalidate(s);const revision=s.revision;s.draft=null;save(s,'请求生成讲解',{style,revision});const prompt='只能返回 JSON {"order":[0,1,2]}，将给定语体的三句组织为导览顺序，不可新增、删改事实或数字，不对争议下结论。语体：'+style+'；固定句库：'+JSON.stringify(passages[style]);let mode='离线示例讲解（固定模板，未调用 AI）',model='本地模板 v1',text=compose(style,[0,1,2]);
 if(process.env.AI_API_KEY){try{const response=await fetch((process.env.AI_BASE_URL||'https://api.deepseek.com').replace(/\/$/,'')+'/chat/completions',{method:'POST',signal:AbortSignal.timeout(18000),headers:{Authorization:`Bearer ${process.env.AI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.AI_MODEL||'deepseek-chat',messages:[{role:'user',content:prompt}],response_format:{type:'json_object'},temperature:0.2,max_tokens:120})});if(!response.ok)throw Error('上游服务不可用');const result=await response.json() as {choices:{message:{content:string}}[]};text=compose(style,JSON.parse(result.choices[0].message.content).order);mode='AI 辅助编排（受限句库）';model=process.env.AI_MODEL||'deepseek-chat';}catch{mode='离线示例讲解（在线请求失败，已降级固定模板）';}}
 if(s.revision!==revision){res.status(409).json({error:'内容已变化，请重新生成讲解'});return;}s.draft={id:randomUUID(),style,text,mode,model,prompt};save(s,'生成讲解',s.draft);res.json(s);});
 app.post('/api/sessions/:id/confirm',(req,res)=>{const s:Session=res.locals.session;if(!s.draft||req.body.revision!==s.revision||req.body.draftId!==s.draft.id){res.status(409).json({error:'讲解版本已变化，请重新核对'});return;}s.confirmedRevision=s.revision;save(s,'人工确认讲解',{revision:s.revision,draftId:s.draft.id});res.json(s);});
 app.post('/api/sessions/:id/export',(req,res)=>{const s:Session=res.locals.session;if(!canExport(s)||req.body.revision!==s.revision||req.body.acknowledged!==true){res.status(409).json({error:'请完成当前版本讲解确认及导出披露确认'});return;}save(s,'确认导出',{revision:s.revision,disclosure});res.json({...s,facts,disclosure,exportedAt:new Date().toISOString()});});
 app.get('/api/sessions/:id/logs',(_,res)=>res.json(res.locals.session));
 app.use('/api',(_,res)=>res.status(404).json({error:'接口不存在'}));
 app.use(express.static(resolve('dist')));
 app.use((err:Error,req:express.Request,res:express.Response,next:express.NextFunction)=>{void req;void next;res.status(400).json({error:err instanceof SyntaxError?'请求格式无效':'请求无法完成，请检查服务与数据大小'});});
 return app;
}
