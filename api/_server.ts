import {createClient} from '@supabase/supabase-js';
import type {VercelRequest,VercelResponse} from '@vercel/node';
export const admin=()=>createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
export function allowed(req:VercelRequest,res:VercelResponse){res.setHeader('Cache-Control','no-store');if(req.method!=='POST'){res.status(405).json({error:'Method not allowed'});return false;}if(!process.env.APP_ORIGIN||req.headers.origin!==process.env.APP_ORIGIN){res.status(403).json({error:'Request denied'});return false;}return true;}
export async function user(req:VercelRequest){const token=req.headers.authorization?.replace(/^Bearer /,'');if(!token)throw Error('Unauthorized');const {data,error}=await admin().auth.getUser(token);if(error||!data.user)throw Error('Unauthorized');return data.user;}
