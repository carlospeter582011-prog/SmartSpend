import process from 'node:process';
import console from 'node:console';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const dir=await mkdtemp(path.resolve('.api-check-'));
try{
 const entries=['status','login','analyze','delete-account'];
 const result=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','--skipLibCheck','--outDir',dir,...entries.map(n=>`api/${n}.ts`)],{stdio:'inherit'});
 if(result.status!==0)throw Error('API compilation failed');
 await writeFile(path.join(dir,'package.json'),'{"type":"module"}');
 for(const entry of entries){const module=await import(pathToFileURL(path.join(dir,'api',entry+'.js')).href);if(typeof module.default!=='function')throw Error(`Missing handler: ${entry}`);}
 console.log('All four emitted API handlers import successfully in Node ESM. No credentials or user requests used.');
}finally{await rm(dir,{recursive:true,force:true});}
