import {describe,it,expect} from 'vitest';
import {minor,nextDue,analytics,affordability,csv,recordSchema,walletBalance,insights,type FinanceRecord} from '../src/finance';
const r=(patch:Partial<FinanceRecord>={}):FinanceRecord=>({id:crypto.randomUUID(),owner_id:'a',title:'test',amount:100,currency:'EGP',category:'Other',date:'2026-11-10',status:'paid',notes:'',version:0,updated_at:new Date().toISOString(),deleted:false,household_id:null,interval:'none',wallet_id:'main',destination_wallet_id:'',progress:0,kind:'income',...patch});
describe('exact money',()=>{it('parses decimals without drift',()=>{expect(minor('0.29')).toBe(29);expect(minor('100.1')).toBe(10010);});it('rejects ambiguous unsafe amounts',()=>{for(const value of ['-1','1e5','0.001','NaN','900719925474099.99'])expect(()=>minor(value)).toThrow();});});
it('clamps month ends and leap years in UTC',()=>{expect(nextDue('2024-01-31','monthly')).toBe('2024-02-29');expect(nextDue('2024-02-29','yearly')).toBe('2025-02-28');expect(nextDue('2026-12-29','weekly')).toBe('2027-01-05');});
it('excludes transfers, deleted, canceled and other currencies; reserves bills once',()=>{const a=analytics([r({amount:10000}),r({kind:'expense',amount:2000}),r({kind:'transfer',amount:3000}),r({kind:'bill',status:'planned',amount:1000}),r({deleted:true,amount:10000}),r({currency:'USD',amount:10000}),r({status:'canceled',amount:10000})],'EGP','2026-11-10');expect(a.balance).toBe(8000);expect(a.available).toBe(7000);expect(a.spending).toBe(2000);});
it('guards total overflow',()=>expect(()=>analytics([r({amount:Number.MAX_SAFE_INTEGER}),r()],'EGP','2026-11-10')).toThrow());
it('does not promise affordability with insufficient funds',()=>{expect(affordability(100,101).affordable).toBe(false);});
it('CSV blocks formula injection and escapes quotes',()=>{expect(csv([r({title:'=HYPERLINK("bad")'})])).toContain("'=HYPERLINK");});
it('rejects invalid data',()=>expect(()=>recordSchema.parse(r({amount:0.1}))).toThrow());

it('moves transfers between wallets without creating income',()=>{const records=[r({amount:1000,wallet_id:'cash'}),r({kind:'transfer',amount:300,wallet_id:'cash',destination_wallet_id:'bank'})];expect(walletBalance(records,'cash','EGP')).toBe(700);expect(walletBalance(records,'bank','EGP')).toBe(300);expect(analytics(records,'EGP','2026-11-10').balance).toBe(1000);});
it('shows explainable risk rules',()=>expect(insights([r({kind:'bill',status:'planned',amount:100})],'EGP','2026-11-10').join()).toContain('unpaid bills exceed'));
it('rejects invalid dates',()=>expect(()=>recordSchema.parse(r({date:'2026-02-30'}))).toThrow());
