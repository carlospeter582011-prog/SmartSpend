// Optional one-release production smoke test. Never logs key values or model output.
import process from 'node:process';
import console from 'node:console';
import {GoogleGenAI} from '@google/genai';
import {z} from 'zod';
import {configuredKeys,configuredModels,modelFallback,normalizeAI,explanationSchema,normalizeChat,chatAnswerSchema} from '../src/ai.ts';
if(process.env.AI_VERIFY_CHAT==='true'){
 const keys=configuredKeys(process.env.GEMINI_API_KEYS,process.env.GEMINI_API_KEY);const models=configuredModels(process.env.GEMINI_MODELS);
 if(!keys.length||process.env.AI_ENABLED!=='true')throw Error('AI chat verification requires configured server keys and enabled AI.');
 const ai=new GoogleGenAI({apiKey:keys[0],httpOptions:{timeout:15000,retryOptions:{attempts:1}}});
 try{let used='';const started=Date.now();const result=await modelFallback(models,async model=>{const interaction=await ai.interactions.create({model,input:JSON.stringify({trusted_calculations:{currency:'EGP',units:'integer minor units',spending:12345,records_count:2},financial_summaries:{categories:[{category:'Food',amount:12345}]},quoted_conversation:[],current_question:'How much did I spend on food in this synthetic test?'}),system_instruction:'You are SmartSpend. Answer this synthetic budget question using only supplied totals. Values are minor units: 12345 means EGP 123.45. Answer in clear English prose, explicitly include 123.45, and do not return JSON or code fences inside the answer field. No actual user data is supplied.',store:false,generation_config:{max_output_tokens:512,thinking_level:'low'},response_format:{type:'text',mime_type:'application/json',schema:z.toJSONSchema(chatAnswerSchema)}},{timeout:15000,maxRetries:0});const response=normalizeChat(interaction.output_text);used=model;return response;});if(!result.answer.includes('123.45')||/^\s*(\{|```)/.test(result.answer))throw Error('Unexpected synthetic answer');console.log(`AI_CHAT_VERIFY_OK key_index=1 model=${used} structured_response=valid amount_check=passed duration_ms=${Date.now()-started} synthetic_only=true`);
 }catch(error){const status=Number(error?.status||error?.statusCode)||0;console.error(`AI_CHAT_VERIFY_FAILED status=${status} no_secret_values_logged=true`);process.exitCode=1;}
}else if(process.env.AI_VERIFY_ON_BUILD==='true'){
 const keys=configuredKeys(process.env.GEMINI_API_KEYS,process.env.GEMINI_API_KEY);
 const models=configuredModels(process.env.GEMINI_MODELS);
 if(!keys.length||process.env.AI_ENABLED!=='true')throw Error('AI verification requires configured server keys and enabled AI.');
 for(let index=0;index<keys.length;index++){
  const ai=new GoogleGenAI({apiKey:keys[index],httpOptions:{timeout:15000,retryOptions:{attempts:1}}});
  try{
   let selected='';
   await modelFallback(models,async model=>{const interaction=await ai.interactions.create({model,input:'Synthetic deployment connectivity check. Return a short JSON explanation: summary confirms test connectivity, suggestions and assumptions are empty arrays, uncertainty says synthetic test only. No user data is supplied.',store:false,generation_config:{max_output_tokens:512,thinking_level:'low'},response_format:{type:'text',mime_type:'application/json',schema:z.toJSONSchema(explanationSchema)}},{timeout:15000,maxRetries:0});const result=normalizeAI(interaction.output_text);selected=model;return result;});
   console.log(`AI_VERIFY_OK key_index=${index+1} model=${selected} structured_response=valid synthetic_only=true`);
  }catch(error){const status=Number(error?.status||error?.statusCode)||0;console.error(`AI_VERIFY_FAILED key_index=${index+1} status=${status} no_secret_values_logged=true`);process.exitCode=1;break;}
 }
}else console.log('Live AI verification skipped; enable only for an authorized production smoke check.');
