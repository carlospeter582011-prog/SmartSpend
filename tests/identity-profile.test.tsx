// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
vi.mock('../src/client',()=>({configured:true,supabase:{auth:{getSession:vi.fn(async()=>({data:{session:{user:{id:'identity-fixture'},access_token:'fixture'}}})),onAuthStateChange:vi.fn(()=>({data:{subscription:{unsubscribe:vi.fn()}}})),signOut:vi.fn(async()=>{})}}}));
import {db} from '../src/storage';
import {App} from '../src/main';
afterEach(async()=>{cleanup();localStorage.clear();sessionStorage.clear();await db.preferences.clear();await db.records.clear();await db.queue.clear();});
it('displays the real name from owner-scoped offline identity and clears it on logout',async()=>{localStorage.clear();sessionStorage.clear();window.history.replaceState(null,'','/#Settings');Object.defineProperty(navigator,'onLine',{configurable:true,value:false});await db.preferences.put({id:'identity-fixture:onboarding',value:{currency:'EGP'}});await db.preferences.put({id:'identity-fixture:identity',value:{real_name:'Fixture Real Name',username:'private_login_name'}});render(<App/>);expect((await screen.findByLabelText('Account name')).textContent).toBe('Fixture Real Name');expect((screen.getByLabelText('Real name') as HTMLInputElement).value).toBe('Fixture Real Name');expect(screen.queryByText('private_login_name')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Sign out'}));await screen.findByRole('button',{name:'Sign in'});expect(screen.queryByLabelText('Account name')).toBeNull();expect(await db.preferences.get('identity-fixture:identity')).toBeUndefined();});
