import {useEffect,useRef,useState} from 'react';
import {Send,Sparkles,SquarePen} from 'lucide-react';
import {supabase} from './client';
import {db,sync} from './storage';
import {formatWait,retrySeconds} from './ai-errors';
function abortable<T>(work:Promise<T>,signal:AbortSignal):Promise<T>{return new Promise((resolve,reject)=>{const abort=()=>reject(new DOMException('Canceled','AbortError'));if(signal.aborted){abort();return;}signal.addEventListener('abort',abort,{once:true});work.then(value=>{signal.removeEventListener('abort',abort);resolve(value);},error=>{signal.removeEventListener('abort',abort);reject(error);});});}
interface Message{role:'user'|'assistant';content:string}
export function AiChat({owner,currency,language,active=true,recordedSummary,prepare}:{owner:string;currency:string;language:string;active?:boolean;recordedSummary?:string;prepare?:()=>Promise<void>}){
 const ar=language==='ar';
 const [messages,setMessages]=useState<Message[]>([]),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState(''),[elapsed,setElapsed]=useState(0),[retryAt,setRetryAt]=useState(0),[clock,setClock]=useState(Date.now()),[snapshot,setSnapshot]=useState<{asOf:string;recordCount:number}|null>(null);
 const controller=useRef<AbortController|null>(null),log=useRef<HTMLDivElement>(null),input=useRef<HTMLTextAreaElement>(null);
 const disabled=owner==='demo'||!supabase;const remaining=Math.max(0,Math.ceil((retryAt-clock)/1000));
 function newConversation(){const request=controller.current;controller.current=null;request?.abort();setMessages([]);setDraft('');setPending('');setBusy(false);setSnapshot(null);setError('');}
 // Only memory: section navigation keeps this component mounted; closing, reloading,
 // account/currency/language changes end the conversation, including bfcache restores.
 useEffect(()=>{const leave=()=>newConversation();window.addEventListener('pagehide',leave);return()=>{window.removeEventListener('pagehide',leave);const request=controller.current;controller.current=null;request?.abort();};},[]);
 useEffect(()=>{if(!busy&&retryAt<=Date.now())return;const start=Date.now();setElapsed(0);const timer=setInterval(()=>{setClock(Date.now());if(busy)setElapsed(Math.floor((Date.now()-start)/1000));else if(Date.now()>=retryAt)clearInterval(timer);},1000);return()=>clearInterval(timer);},[busy,retryAt]);
 useEffect(()=>{if(active&&(messages.length||busy))log.current?.scrollTo?.({top:log.current.scrollHeight,behavior:'smooth'});},[active,messages.length,busy]);
 useEffect(()=>{if(!input.current)return;input.current.style.height='auto';input.current.style.height=Math.min(input.current.scrollHeight,144)+'px';},[draft,active]);
 async function send(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(disabled||controller.current||retryAt>Date.now()||!draft.trim())return;
  if(!navigator.onLine){setError(ar?'اتصل بالإنترنت عشان تستخدم الشات.':'Connect to the internet to use AI chat.');return;}
  const question=draft.trim();const request=new AbortController();controller.current=request;setBusy(true);setPending(question);setError('');let timedOut=false;const timeout=setTimeout(()=>{timedOut=true;request.abort();},40000);
  try{
   await abortable((async()=>{if(prepare)await prepare();else{try{await sync(owner);}catch{throw Error('SYNC_FAILED');}if((await db.queue.where('owner_id').equals(owner).count())>0)throw Error('UNSYNCED');}})(),request.signal);
   if(request.signal.aborted)throw new DOMException('Canceled','AbortError');
   const {data}=await abortable(supabase!.auth.getSession(),request.signal);if(!data.session?.access_token)throw Error('AUTH_REQUIRED');
   // Sending a message explicitly requests AI; no separate consent toggle is needed.
   const response=await fetch('/api/analyze',{method:'POST',signal:request.signal,headers:{'Content-Type':'application/json',Authorization:`Bearer ${data.session.access_token}`},body:JSON.stringify({currency,purchase:0,consent:true,language:ar?'ar':'en',question,history:messages.slice(-8).map(m=>({...m,content:m.content.slice(0,2000)}))})});
   const result=await response.json();if(request.signal.aborted)throw new DOMException('Canceled','AbortError');if(controller.current!==request)return;
   if(response.status===429){const wait=retrySeconds(result.retryAfter??response.headers.get('Retry-After'));setRetryAt(Date.now()+wait*1000);setClock(Date.now());throw Error('RATE_LIMIT');}
   if(response.status===401)throw Error('AUTH_REQUIRED');if(!response.ok)throw Error('AI_UNAVAILABLE');if(typeof result.answer!=='string'||!result.answer.trim()||result.answer.length>5000)throw Error('AI_UNAVAILABLE');
   setMessages(previous=>[...previous,{role:'user',content:question},{role:'assistant',content:result.answer}]);setDraft('');setSnapshot({asOf:String(result.asOf||''),recordCount:Number(result.recordCount)||0});
  }catch(problem){
   if(controller.current!==request)return;
   const reason=(problem as Error).message;setError((problem as Error).name==='AbortError'?(timedOut?(ar?'الرد اتأخر. جرّب تاني بعد شوية.':'The reply took too long. Try again shortly.'):(ar?'اتلغى الانتظار. سؤالك لسه موجود.':'Waiting canceled. Your question is still here.')):reason==='UNSYNCED'?(ar?'في بيانات لسه مش متزامنة. راجع المزامنة والتعارضات في الإعدادات الأول.':'Some records are not synchronized yet. Resolve pending changes or conflicts in Settings, then retry.'):reason==='SYNC_FAILED'?(ar?'تعذّرت مزامنة أحدث بياناتك. جرّب المزامنة من الإعدادات.':'Could not synchronize your latest records. Retry synchronization in Settings.'):reason==='AUTH_REQUIRED'?(ar?'سجّل دخولك من جديد عشان تكمل الشات.':'Sign in again to continue AI chat.'):reason==='RATE_LIMIT'?(ar?'وصلت لحد الطلبات. استنى العدّاد قبل المحاولة.':'AI allowance reached. Wait for the countdown before retrying.'):(ar?'الشات مش متاح دلوقتي. سؤالك لسه موجود؛ جرّب تاني.':'AI chat is unavailable right now. Your question is still here; try again later.'));
  }finally{clearTimeout(timeout);if(controller.current===request){controller.current=null;setBusy(false);setPending('');}}
 }
 const examples=ar?['حلّل ميزانيتي واقترح خطوات','أكتر فلوسي بتروح في إيه؟','إيه الفواتير اللي جاية؟']:['Analyze my budget and suggest next steps','Where am I spending the most?','What bills are due next?'];
 return <section className="ai-chat" hidden={!active} aria-label={ar?'شات SmartSpend':'SmartSpend AI chat'}>
  <header className="chat-header"><div><h1>{ar?'المساعد':'Assistant'}</h1><span className="small muted">{ar?'محادثة مؤقتة · بتتمسح لما تقفل الموقع':'Temporary chat · clears when you close the site'}</span></div><button type="button" className="secondary-button" aria-label={ar?'محادثة جديدة':'New chat'} onClick={()=>{newConversation();input.current?.focus();}}><SquarePen size={17}/><span>{ar?'محادثة جديدة':'New chat'}</span></button></header>
  <div className="chat-messages" ref={log} role="log" aria-label={ar?'المحادثة':'Conversation'} aria-live="polite" aria-relevant="additions text">
   {!messages.length&&!busy&&<div className="chat-welcome"><span className="chat-spark"><Sparkles size={30}/></span><h2>{ar?'نفهم فلوسك سوا؟':'What would you like to know?'}</h2><p className="muted">{ar?'اسأل عن مصروفاتك، فواتيرك أو أهدافك، وكمّل كلامك عادي.':'Ask about your spending, bills or goals, then keep the conversation going.'}</p>{disabled&&<p className="notice">{ar?'سجّل دخولك بحسابك عشان تسأل الذكاء الاصطناعي عن بياناتك.':'Sign in to your account to ask AI about your saved records.'}</p>}<div className="chat-suggestions">{examples.map(text=><button type="button" className="secondary-button" key={text} disabled={disabled} onClick={()=>{setDraft(text);input.current?.focus();}}>{text}</button>)}</div>{recordedSummary&&<details className="chat-recorded-summary"><summary>{ar?'عرض الحسابات المسجلة بدون AI':'View recorded calculations without AI'}</summary><p>{recordedSummary}</p></details>}</div>}
   {messages.map((message,i)=><article className={`chat-message ${message.role}`} key={i}><strong>{message.role==='user'?(ar?'أنت':'You'):(ar?'مساعد SmartSpend':'SmartSpend AI')}</strong><p>{message.content}</p></article>)}
   {busy&&<><article className="chat-message user"><strong>{ar?'أنت':'You'}</strong><p>{pending}</p></article><div className="ai-wait" role="status"><span className="spinner"/><div><strong>{ar?'براجع بياناتك وبجهز الرد…':'Reviewing your records and preparing a reply…'}</strong><p>{elapsed}s{elapsed>=8?(ar?' · الرد ممكن ياخد شوية وقت.':' · This can take a little time.'):''}</p><button className="text-button" onClick={()=>controller.current?.abort()}>{ar?'إلغاء الانتظار':'Cancel chat waiting'}</button></div></div></>}
  </div>
  <div className="chat-bottom">{snapshot&&<p className="small muted chat-snapshot">{ar?'الرد مبني على':'Based on'} {snapshot.recordCount} {ar?'سجل متزامن':'synchronized records'} · {snapshot.asOf}</p>}{error&&<p className="ai-error" role="alert">{error}{remaining>0&&<> {formatWait(remaining)}</>}</p>}
   <form className="chat-composer" onSubmit={event=>void send(event)}><label className="sr-only" htmlFor="ai-message">{ar?'سؤالك للمساعد':'Message SmartSpend AI'}</label><textarea id="ai-message" ref={input} value={draft} onChange={e=>setDraft(e.target.value)} maxLength={1500} rows={1} placeholder={ar?'اسأل SmartSpend…':'Message SmartSpend…'} disabled={disabled||busy} required onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form?.requestSubmit();}}}/><div className="chat-composer-footer"><span className="small muted">{draft.length}/1500 · {ar?'الحد اليومي للذكاء الاصطناعي مطبّق':'Daily AI allowance applies'}</span><button className="primary" disabled={disabled||busy||remaining>0||!draft.trim()}><Send size={17}/>{busy?(ar?'جاري الرد…':'Replying…'):remaining>0?`${ar?'حاول بعد':'Retry in'} ${formatWait(remaining)}`:(ar?'إرسال':'Send message')}</button></div></form>
   <p className="chat-footnote muted">{ar?'الذكاء الاصطناعي ممكن يغلط؛ راجع الأرقام المهمة.':'AI can make mistakes. Check important figures.'}</p>
  </div>
 </section>;
}
