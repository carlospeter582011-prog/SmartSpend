import {it,expect} from 'vitest';
import {normalizeRealName,normalizeUsername} from '../src/identity';
it('keeps real names separate and supports Arabic and repeated spaces',()=>{expect(normalizeRealName('  كارلوس   بيتر  ')).toBe('كارلوس بيتر');expect(normalizeUsername(' Carlos_12 ')).toBe('Carlos_12');});
it('rejects missing, overlong and invalid identities',()=>{for(const name of ['', 'x','x'.repeat(101),'a\u0000b'])expect(()=>normalizeRealName(name)).toThrow();for(const name of ['ab','a b','a%b','a@b','x'.repeat(31)])expect(()=>normalizeUsername(name)).toThrow();});
