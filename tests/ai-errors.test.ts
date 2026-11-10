import {it,expect} from 'vitest';
import {providerFailure,retrySeconds,formatWait} from '../src/ai-errors';
it('normalizes provider 429 without leaking provider messages or keys',()=>{const r=providerFailure({status:429,message:'key-secret-do-not-return',headers:{'retry-after':'45'}});expect(r.status).toBe(429);expect(r.retryAfter).toBe(45);expect(JSON.stringify(r)).not.toContain('key-secret');});
it('parses seconds and HTTP date and bounds unreasonable delays',()=>{expect(retrySeconds('2.5')).toBe(3);expect(retrySeconds('Tue, 10 Nov 2026 12:01:00 GMT',Date.parse('2026-11-10T12:00:00Z'))).toBe(60);expect(retrySeconds('9999999')).toBe(86400);expect(retrySeconds('bad')).toBe(60);});
it('does not expose authentication or server errors',()=>{expect(providerFailure({status:403,message:'sensitive'}).code).toBe('AI_CONFIGURATION');expect(providerFailure(Error('Unauthorized')).status).toBe(401);expect(providerFailure(Error('secret')).error).not.toContain('secret');});
it('formats long waits without huge overflowing seconds',()=>{expect(formatWait(65)).toBe('1m 5s');expect(formatWait(7200)).toBe('2h 0m');expect(formatWait(-1)).toBe('0s');});
