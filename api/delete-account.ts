import type {VercelRequest,VercelResponse} from '@vercel/node';
import {allowed,admin,user} from './_server.js';
export default async function handler(req:VercelRequest,res:VercelResponse){if(!allowed(req,res))return;try{const u=await user(req);if(req.body?.confirmation!=='DELETE')return res.status(400).json({error:'Confirmation required'});const {error}=await admin().auth.admin.deleteUser(u.id);if(error)throw error;return res.json({deleted:true});}catch{return res.status(403).json({error:'Could not delete account'});}}
