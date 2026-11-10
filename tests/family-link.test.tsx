// @vitest-environment jsdom
import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {JoinByLink,inviteToken,pendingInvitation,pendingInviteKey,activeFamily} from '../src/family';
const token='a'.repeat(64);
afterEach(()=>{cleanup();sessionStorage.clear();history.replaceState(null,'','/');});
it('accepts only this-site invitation links with a valid token',()=>{expect(inviteToken(location.origin+'/?invite='+token,location.origin)).toBe(token);for(const link of [token,'https://foreign.example/?invite='+token,'/?invite=bad','/other?invite='+token])expect(()=>inviteToken(link,location.origin)).toThrow();});
it('restores a pending link across sign-in without accepting automatically',async()=>{sessionStorage.setItem(pendingInviteKey,token);expect(pendingInvitation()).toContain(token);const accept=vi.fn(async()=>{});render(<JoinByLink onAccept={accept}/>);expect((screen.getByLabelText('Invitation link') as HTMLInputElement).value).toContain(token);expect(accept).not.toHaveBeenCalled();expect(screen.queryByRole('combobox')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Accept invitation'}));await screen.findByText('Invitation accepted. Your family is ready.');expect(accept).toHaveBeenCalledWith(token);expect(sessionStorage.getItem(pendingInviteKey)).toBeNull();});
it('shows expired invitation failure and keeps membership acceptance explicit',async()=>{const accept=vi.fn(async()=>{throw Error('expired');});render(<JoinByLink onAccept={accept}/>);fireEvent.change(screen.getByLabelText('Invitation link'),{target:{value:location.origin+'/?invite='+token}});fireEvent.click(screen.getByRole('button',{name:'Accept invitation'}));await waitFor(()=>expect(screen.getByRole('status').textContent).toContain('expired'));expect(accept).toHaveBeenCalledTimes(1);});
it('chooses active context only from already authorized memberships',()=>{const memberships=[{id:'allowed',name:'Family'}];expect(activeFamily(memberships,'forbidden')?.id).toBe('allowed');expect(activeFamily([],'forbidden')).toBeNull();});
