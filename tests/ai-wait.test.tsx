// @vitest-environment jsdom
import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,act,cleanup} from '@testing-library/react';
vi.mock('../src/client',()=>({supabase:{auth:{getSession:vi.fn(async()=>({data:{session:{access_token:'synthetic-token'}}}))}}}));
import {AiChat} from '../src/ai-chat';
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
async function start(){Object.defineProperty(navigator,'onLine',{configurable:true,value:true});render(<AiChat owner="fixture-owner" currency="EGP" language="en" prepare={async()=>{}}/>);fireEvent.change(screen.getByLabelText('Message SmartSpend AI'),{target:{value:'Explain my budget'}});await act(async()=>{fireEvent.submit(screen.getByRole('button',{name:'Send message'}).closest('form')!);});}
it('shows slow feedback and stops waiting after forty seconds without losing the draft',async()=>{
 vi.useFakeTimers();vi.stubGlobal('fetch',vi.fn((_url:unknown,options:RequestInit)=>new Promise((_resolve,reject)=>{options.signal?.addEventListener('abort',()=>reject(new DOMException('Canceled','AbortError')));})));
 await start();expect(screen.getByText('Reviewing your records and preparing a reply…')).toBeTruthy();await act(async()=>{vi.advanceTimersByTime(9000);});expect(screen.getByText(/This can take a little time/)).toBeTruthy();await act(async()=>{vi.advanceTimersByTime(31000);});expect(screen.getByRole('alert').textContent).toContain('took too long');expect((screen.getByLabelText('Message SmartSpend AI') as HTMLTextAreaElement).value).toBe('Explain my budget');
});
it('honors the server cooldown and re-enables sending after the countdown',async()=>{
 vi.useFakeTimers();const fetch=vi.fn(async()=>({status:429,ok:false,json:async()=>({retryAfter:60}),headers:{get:()=> '60'}}));vi.stubGlobal('fetch',fetch);await start();expect(screen.getByRole('alert').textContent).toContain('AI allowance reached');const button=screen.getByRole('button',{name:/Retry in/});expect((button as HTMLButtonElement).disabled).toBe(true);fireEvent.click(button);expect(fetch).toHaveBeenCalledTimes(1);await act(async()=>{vi.advanceTimersByTime(61000);});expect((screen.getByRole('button',{name:'Send message'}) as HTMLButtonElement).disabled).toBe(false);
});
