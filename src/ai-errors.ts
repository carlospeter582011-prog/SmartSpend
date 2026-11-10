export function retrySeconds(value:unknown,now=Date.now()){
 if(typeof value!=='string'&&typeof value!=='number')return 60;
 const numeric=Number(value);const seconds=Number.isFinite(numeric)?numeric:(Date.parse(String(value))-now)/1000;
 return Number.isFinite(seconds)&&seconds>0?Math.min(86400,Math.max(1,Math.ceil(seconds))):60;
}
export function formatWait(seconds:number){const n=Math.max(0,Math.ceil(seconds));if(n>=3600)return `${Math.floor(n/3600)}h ${Math.ceil((n%3600)/60)}m`;if(n>=60)return `${Math.floor(n/60)}m ${n%60}s`;return `${n}s`;}
export function providerFailure(error:unknown){
 const e=error as {status?:number;statusCode?:number;message?:string;headers?:Headers|Record<string,string>};
 const status=Number(e?.status??e?.statusCode);
 if(status===429){const headers=e.headers;const retry=headers&&typeof (headers as Headers).get==='function'?(headers as Headers).get('retry-after'):(headers as Record<string,string>|undefined)?.['retry-after'];return {status:429,code:'AI_PROVIDER_RATE_LIMIT',error:'AI request limit reached. Wait before retrying; daily quota may need to reset. Your calculated report is still available.',retryAfter:retrySeconds(retry)};}
 if(e?.message==='Unauthorized')return {status:401,code:'AUTH_REQUIRED',error:'Sign in again to request an AI explanation.',retryAfter:0};
 if(status===401||status===403)return {status:503,code:'AI_CONFIGURATION',error:'AI access is unavailable. Your calculated report is still available.',retryAfter:0};
 return {status:503,code:'AI_UNAVAILABLE',error:'AI could not respond in time. Your calculated report is still available; try again later.',retryAfter:0};
}
