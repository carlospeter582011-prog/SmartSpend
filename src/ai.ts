import {z} from 'zod';
export const explanationSchema=z.object({summary:z.string().max(1500),suggestions:z.array(z.string().max(400)).max(5),assumptions:z.array(z.string().max(400)).max(5),uncertainty:z.string().max(500)}).strict();
export const analysisRequestSchema=z.object({currency:z.string().regex(/^[A-Z]{3}$/),purchase:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),consent:z.literal(true),household:z.uuid().optional()}).strict();
export function normalizeAI(input:unknown){const result=explanationSchema.parse(JSON.parse(String(input)));const text=JSON.stringify(result);if(/\b(stocks?|crypto(currency)?|securities|tax advice|legal advice|guaranteed returns?|loan approval)\b|أسهم|عملات رقمية|استثمار مضمون|استشارة قانونية|تهرب ضريبي/i.test(text))throw Error('Out-of-domain explanation');return result;}
export const defaultModels=['gemini-3.8-flash','gemini-3.5-flash-lite'];
export function configuredModels(raw?:string){const models=[...new Set((raw||defaultModels.join(',')).split(',').map(m=>m.trim()).filter(Boolean))];if(models.length<1||models.length>2||models.some(m=>!/^gemini-[\w.-]+$/.test(m)))throw Error('Invalid AI model configuration');return models;}
export function configuredKeys(raw?:string,legacy?:string){
 let parsed:unknown;
 if(raw?.trim()){try{parsed=raw.trim().startsWith('[')?JSON.parse(raw):raw.split(/[,\r\n]+/);}catch{throw Error('Invalid AI key configuration');}}
 else parsed=legacy?[legacy]:[];
 if(!Array.isArray(parsed)||parsed.some(k=>typeof k!=='string'))throw Error('Invalid AI key configuration');
 const keys=[...new Set((parsed as string[]).map(k=>k.trim()).filter(Boolean))];
 if(keys.length>8||keys.some(k=>k.length>512||/\s/.test(k)))throw Error('Invalid AI key configuration');return keys;
}
export function selectKey(keys:string[],index:number){if(!keys.length||!Number.isSafeInteger(index)||index<0)throw Error('AI key unavailable');return keys[index%keys.length];}
export async function modelFallback<T>(models:string[],invoke:(m:string)=>Promise<T>):Promise<T>{let last:unknown;for(const model of models.slice(0,2)){try{return await invoke(model);}catch(e){last=e;const status=Number((e as {status?:number}).status);if(status===429||status===401||status===403)throw e;if(status&&status<500&&status!==404)throw e;}}throw last??Error('AI unavailable');}
