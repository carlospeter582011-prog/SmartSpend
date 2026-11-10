// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
const mocks=vi.hoisted(()=>({rpc:vi.fn(async()=>({data:'family-b',error:null}))}));
vi.mock('../src/client',()=>({configured:true,supabase:{auth:{getSession:vi.fn(async()=>({data:{session:{user:{id:'family-fixture'},access_token:'fixture'}}})),onAuthStateChange:vi.fn(()=>({data:{subscription:{unsubscribe:vi.fn()}}}))},rpc:mocks.rpc,from:(table:string)=>({select:()=>table==='households'?Promise.resolve({data:[{id:'family-a',name:'Existing family'},{id:'family-b',name:'Invited family'}],error:null}):{eq:async()=>({data:table==='household_members'?[{user_id:'family-fixture',role:'adult'}]:[],error:null})}})}}));
import {db} from '../src/storage';
import {App} from '../src/main';
afterEach(async()=>{cleanup();sessionStorage.clear();localStorage.clear();mocks.rpc.mockClear();history.replaceState(null,'','/');await db.preferences.clear();await db.records.clear();await db.queue.clear();});
it('opens an invite after sign-in, requires acceptance, then opens the invited membership without a family selector',async()=>{const token='a'.repeat(64);sessionStorage.clear();history.replaceState(null,'','/?invite='+token);Object.defineProperty(navigator,'onLine',{configurable:true,value:false});await db.preferences.put({id:'family-fixture:onboarding',value:{currency:'EGP'}});render(<App/>);await screen.findByRole('heading',{name:/^Family$/});expect(screen.queryByRole('combobox',{name:'Select family'})).toBeNull();expect(mocks.rpc).not.toHaveBeenCalled();await screen.findByText('Existing family');fireEvent.click(screen.getByRole('button',{name:'Accept invitation'}));await screen.findByText('Invited family');await screen.findByText('Invitation accepted. Your family is ready.');await waitFor(()=>expect(mocks.rpc).toHaveBeenCalledWith('accept_invite',{token}));expect(location.search).toBe('');expect((await db.preferences.get('family-fixture:family'))?.value).toBe('family-b');});
