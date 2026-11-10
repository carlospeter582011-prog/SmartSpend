// Optional one-release production smoke test. Never logs key values or model output.
import process from 'node:process';
import console from 'node:console';
import {GoogleGenAI} from '@google/genai';
import {z} from 'zod';
import {configuredKeys,configuredModels,modelFallback,normalizeAI,explanationSchema} from '../src/ai.ts';
if(process.env.AI_VERIFY_ON_BUILD==='true'){
 const keys=configuredKeys(process.env.GEMINI_API_KEYS,process.env.GEMINI_API_KEY);
 const models=configuredModels(process.env.GEMINI_MODELS);
 if(!keys.length||process.env.AI_ENABLED!=='true')throw Error('AI verification requires configured server keys and enabled AI.');
 for(let index=0;index<keys.length;index++){
  const ai=new GoogleGenAI({apiKey:keys[index],httpOptions:{timeout:15000,retryOptions:{attempts:1}}});
  try{
   let selected='';
   await modelFallback(models,async model=>{const interaction=await ai.interactions.create({model,input:'Synthetic deployment connectivity check. Return a short JSON explanation: summary confirms test connectivity, suggestions and assumptions are empty arrays, uncertainty says synthetic test only. No user data is supplied.',store:false,generation_config:{max_output_tokens:512,thinking_level:'low'},response_format:{type:'text',mime_type:'application/json',schema:z.toJSONSchema(explanationSchema)}});const result=normalizeAI(interaction.output_text);selected=model;return result;});
   console.log(`AI_VERIFY_OK key_index=${index+1} model=${selected} structured_response=valid synthetic_only=true`);
  }catch(error){const status=Number(error?.status||error?.statusCode)||0;console.error(`AI_VERIFY_FAILED key_index=${index+1} status=${status} no_secret_values_logged=true`);process.exitCode=1;break;}
 }
}else console.log('Live AI verification skipped; enable only for an authorized production smoke check.');
