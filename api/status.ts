import type {VercelRequest,VercelResponse} from '@vercel/node';
import {admin} from './_server';
import {configuredKeys,configuredModels} from '../src/ai';
// No credentials, user rows or financial values are returned by this readiness probe.
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 let databaseReady=false;let keyCount=0;let models:string[]=[];let aiConfigurationValid=true;
 try{if(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY){const {error}=await admin().from('profiles').select('id',{head:true}).limit(1);databaseReady=!error;}}catch{databaseReady=false;}
 try{keyCount=configuredKeys(process.env.GEMINI_API_KEYS,process.env.GEMINI_API_KEY).length;models=configuredModels(process.env.GEMINI_MODELS);}catch{aiConfigurationValid=false;}
 return res.status(databaseReady?200:503).json({database:databaseReady?'ready':'unavailable',ai:{enabled:process.env.AI_ENABLED==='true',keyCount,models,configurationValid:aiConfigurationValid},note:'Database readiness does not verify Auth redirects, sessions or synchronization.'});
}
