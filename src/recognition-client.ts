type Candidate={name:string;category:string;basis:string[];uncertainties:string[]};
type Result={candidates:Candidate[];message:string;source:string;provider:string;model:string;verified:false;databaseMatched:false};
const node=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
export function createRecognitionController(){
 let image:string|null=null,configured=false,busy=false,version=0,provider='图片识别服务',statusReady=false;let abort:AbortController|undefined;
 const consentLabel=document.createElement('label');consentLabel.className='recognition-consent';consentLabel.innerHTML='<input id="vision-consent" type="checkbox"><span id="vision-consent-text">同意将此照片发送给图片识别服务，仅用于本次识别。</span>';node('identify').before(consentLabel);
 const results=document.createElement('section');results.id='recognition-results';results.className='recognition-results';results.setAttribute('aria-live','polite');document.querySelector('.next-stages')!.before(results);
 const stage=document.querySelector('.next-stages section')!;stage.querySelector('h3')!.textContent='等待识别结果';stage.querySelector('p')!.textContent='返回的是候选名称和照片可见依据，不自动关联年代、出土信息等历史事实。';
 document.querySelector('.privacy')!.textContent='照片预览在浏览器本地完成。勾选同意并点击“识别文物”后，压缩照片会经后端发送给识别服务；本站不保存图片。';
 const button=node<HTMLButtonElement>('identify'),consent=node<HTMLInputElement>('vision-consent');
 function render(){button.disabled=!configured||!image||!consent.checked||busy;button.textContent=busy?'正在识别…':'识别文物 →';consent.disabled=busy;document.querySelector('.service-state')!.textContent=statusReady?(configured?'图片识别已配置 · 三维生成待接入':'图片识别待配置 · 三维生成待接入'):'正在检查识别服务';}
 function message(){node('identify-note').textContent=!statusReady?'正在检查识别服务…':!configured?(image?'照片已就绪。':'')+'图片识别服务尚未配置，当前不能返回真实候选。':!image?'请选择照片，再授权本次识别。':!consent.checked?'照片已就绪。请同意将此照片发送给'+provider+'。':'照片已就绪，可以开始识别。';}
 function clearResults(){results.replaceChildren();document.querySelector('.outline-badge')!.textContent='等待识别';stage.querySelector('h3')!.textContent='等待识别结果';document.querySelector('.next-stages section:nth-child(2) h3')!.textContent='尚无可确认的候选';}
 function showResult(result:Result){
  document.querySelector('.next-stages section:nth-child(2) h3')!.textContent=result.candidates.length?'候选已返回，待人工核对':'尚无可确认的候选';results.replaceChildren();const title=document.createElement('h3');title.textContent=result.candidates.length?'候选文物 · AI 推测，待核验':'未能确认文物';results.append(title);
  const source=document.createElement('p');source.className='recognition-source';source.textContent=result.source+' 服务：'+result.provider+' / '+result.model;results.append(source);
  for(const candidate of result.candidates){const card=document.createElement('article');card.className='candidate';const name=document.createElement('h4');name.textContent=candidate.name;const category=document.createElement('p');category.textContent='候选器类：'+candidate.category+' · 非鉴定结论';card.append(name,category);for(const [label,items] of [['判断依据（照片可见特征）',candidate.basis],['仍需核对',candidate.uncertainties]] as const){const strong=document.createElement('strong');strong.textContent=label;const list=document.createElement('ul');for(const item of items){const li=document.createElement('li');li.textContent=item;list.append(li);}card.append(strong,list);}results.append(card);}
  const note=document.createElement('p');note.textContent=result.message;results.append(note);document.querySelector('.outline-badge')!.textContent=result.candidates.length?'候选待核验':'未能确认';stage.querySelector('h3')!.textContent=result.candidates.length?'识别完成，结果见上方':'证据不足，请更换照片';node('identify-note').textContent='本次识别完成。结果为 AI 推测，未核验文物身份；三维生成尚未接入。';
 }
 consent.onchange=()=>{render();message();};
 button.onclick=async()=>{if(!image||!configured||!consent.checked||busy)return;const current=++version;abort?.abort();abort=new AbortController();busy=true;clearResults();render();node('identify-note').textContent='正在分析照片，通常需要数秒，请稍候…';const timer=setTimeout(()=>abort?.abort(),50000);
  try{const response=await fetch('/api/vision/identify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,consent:true}),signal:abort.signal});const data=await response.json();if(current!==version)return;if(!response.ok)throw Error(data.error||'识别失败，请重试。');showResult(data);}
  catch(error){if(current!==version)return;clearResults();node('identify-note').textContent=error instanceof Error&&error.name==='AbortError'?'识别已超时或取消，请重试。':error instanceof Error?error.message:'识别失败，请重试。';}
  finally{clearTimeout(timer);if(current===version){busy=false;render();}}
 };
 void fetch('/api/vision/status',{signal:AbortSignal.timeout(10000)}).then(async response=>{if(!response.ok)throw Error();return response.json();}).then(data=>{configured=data.configured===true;provider=data.provider||provider;statusReady=true;node('vision-consent-text').textContent='同意将此照片发送给'+provider+'，仅用于本次识别。';render();message();}).catch(()=>{statusReady=true;configured=false;render();node('identify-note').textContent='无法连接识别后端，请稍后刷新。';});
 render();
 return {setPhoto(value:string|null){version++;abort?.abort();image=value;busy=false;consent.checked=false;clearResults();render();message();}};
}
