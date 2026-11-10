import {it,expect} from 'vitest';
import {occurrenceId,scheduleBills,forecast} from '../src/schedules';
import {demoRecords} from '../src/demo';
it('generates stable deduplicatable installment IDs and never invents payments',async()=>{const parent={...demoRecords()[4],date:'2026-01-31' as string};const schedule=await scheduleBills(parent,3);expect(schedule.map(r=>r.date)).toEqual(['2026-01-31','2026-02-28','2026-03-31']);expect(schedule.every(r=>r.status==='planned')).toBe(true);expect(schedule[0].id).toBe(await occurrenceId(parent.id,'2026-01-31'));});
it('forecasts only explicit entries',()=>{const base={...demoRecords()[4],date:'2026-11-30',amount:100};expect(forecast([base],'EGP',1000,'2026-11-10').amount).toBe(900);expect(forecast([{...base,status:'paid'}],'EGP',1000,'2026-11-10').amount).toBe(1000);});
