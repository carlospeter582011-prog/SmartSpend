// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import React from 'react';
import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
vi.mock('../src/client',()=>({configured:true,supabase:{auth:{getSession:vi.fn(async()=>({data:{session:{user:{id:'ui-test-owner'},access_token:'fixture-token'}}})),onAuthStateChange:vi.fn(()=>({data:{subscription:{unsubscribe:vi.fn()}}}))}}}));
import {db} from '../src/storage';
import {App} from '../src/main';
beforeEach(async()=>{localStorage.clear();sessionStorage.clear();window.history.replaceState(null,'','/#Assistant');Object.defineProperty(navigator,'onLine',{configurable:true,value:false});await db.preferences.put({id:'ui-test-owner:onboarding',value:{currency:'EGP'}});});
afterEach(async()=>{cleanup();vi.unstubAllGlobals();await db.records.clear();await db.queue.clear();await db.preferences.clear();});
async function start(){render(<App/>);await screen.findByRole('heading',{name:/^Assistant$/});fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Analyze my finances'}));}
it('shows pending feedback and cancel, then preserves deterministic report on cancellation',async()=>{
 vi.stubGlobal('fetch',vi.fn((_url:unknown,options:RequestInit)=>new Promise((_resolve,reject)=>{if(options.signal?.aborted)reject(new DOMException('Canceled','AbortError'));else options.signal?.addEventListener('abort',()=>reject(new DOMException('Canceled','AbortError')));})));
 await start();await screen.findByText('Preparing your explanation. Please wait…');expect((screen.getByRole('button',{name:'Analyzing…'}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Cancel waiting'}));await screen.findByText('Waiting canceled. Your calculated report is available.');expect(screen.getByText(/Only recorded data is included/)).toBeTruthy();
});
it('honors server rate limit and prevents a second request during cooldown',async()=>{
 const fetch=vi.fn(async()=>({status:429,ok:false,json:async()=>({error:'AI rate limit reached',retryAfter:60}),headers:{get:()=> '60'}}));vi.stubGlobal('fetch',fetch);
 await start();await screen.findByText(/AI rate limit reached/);const button=await screen.findByRole('button',{name:/Retry in/});expect((button as HTMLButtonElement).disabled).toBe(true);fireEvent.click(button);await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));expect(screen.getByText(/Only recorded data is included/)).toBeTruthy();
});
