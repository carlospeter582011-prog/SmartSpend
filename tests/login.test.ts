import {it,expect,vi,beforeEach} from 'vitest';
import type {VercelRequest,VercelResponse} from '@vercel/node';
const mocks=vi.hoisted(()=>({rpc:vi.fn(async()=>({data:true,error:null})),ilike:vi.fn(),getUserById:vi.fn(async()=>({data:{user:{email:'fixture@example.invalid'}}})),signIn:vi.fn(async()=>({data:{session:{access_token:'test-access',refresh_token:'test-refresh'}},error:null}))}));
vi.mock('../api/_server.js',()=>({allowed:()=>true,admin:()=>({rpc:mocks.rpc,from:()=>({select:()=>({ilike:(...args:unknown[])=>{mocks.ilike(...args);return {maybeSingle:async()=>({data:{id:'fixture-user'}})};}})}),auth:{admin:{getUserById:mocks.getUserById}}})}));
vi.mock('@supabase/supabase-js',()=>({createClient:()=>({auth:{signInWithPassword:mocks.signIn}})}));
import handler from '../api/login';
beforeEach(()=>vi.clearAllMocks());
async function login(identifier:string){let status=200;let body:unknown;const req={body:{identifier,password:'fixture-password'},headers:{}} as unknown as VercelRequest;const response={status(n:number){status=n;return response;},json(value:unknown){body=value;return response;}};await handler(req,response as unknown as VercelResponse);return {status,body};}
it('resolves unique usernames case-insensitively and escapes literal underscores',async()=>{const result=await login('FiXtUrE_User');expect(result.status).toBe(200);expect(mocks.ilike).toHaveBeenCalledWith('username','fixture\\_user');expect(mocks.signIn).toHaveBeenCalledWith({email:'fixture@example.invalid',password:'fixture-password'});expect(JSON.stringify(result.body)).not.toContain('fixture@example.invalid');});
it('accepts an email directly without profile enumeration',async()=>{expect((await login('Fixture@Example.Invalid')).status).toBe(200);expect(mocks.getUserById).not.toHaveBeenCalled();expect(mocks.ilike).not.toHaveBeenCalled();expect(mocks.signIn).toHaveBeenCalledWith({email:'fixture@example.invalid',password:'fixture-password'});});
it('does not interpret display names or wildcard patterns as usernames',async()=>{expect((await login('Fixture Real Name')).status).toBe(401);expect((await login('fixture%')).status).toBe(401);expect(mocks.ilike).not.toHaveBeenCalled();});
