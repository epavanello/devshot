import { describe, expect, it } from 'vitest';
import { beautifyOptionsSchema, ratioValue } from './options';

describe('beautify options', () => {
  it('keeps defaults opinionated', () => {
    expect(beautifyOptionsSchema.parse({})).toMatchObject({ background: 'lemonade', aspectRatio: '16:9', shadow: 'float', style: 'clean', look: 'clean', effect: 'glow', zoom: 1 });
  });

  it('rejects oversized renders', () => {
    expect(() => beautifyOptionsSchema.parse({ width: 9000 })).toThrow();
  });

  it('resolves ratios', () => {
    expect(ratioValue('1:1')).toBe(1);
    expect(ratioValue('original', 1.5)).toBe(1.5);
  });
});
