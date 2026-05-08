import { describe, it, expect } from 'vitest';
import {
  validateSuggestion,
  coverHue,
  SUGGESTION_COMMENT_MAX,
  SUGGESTION_DESCRIPTION_MAX,
  SUGGESTION_REPLY_MAX,
} from './suggestions.js';

describe('validateSuggestion', () => {
  it('returnerar null för giltig suggestion', () => {
    expect(validateSuggestion({ title: 'Foo', author: 'Bar' })).toBe(null);
  });

  it('returnerar felsträng om title är tom', () => {
    expect(typeof validateSuggestion({ title: '', author: 'Bar' })).toBe('string');
  });

  it('returnerar felsträng om author är tom', () => {
    expect(typeof validateSuggestion({ title: 'Foo', author: '' })).toBe('string');
  });

  it('returnerar felsträng om title är null', () => {
    expect(typeof validateSuggestion({ title: null, author: 'Bar' })).toBe('string');
  });

  it('returnerar felsträng om title är whitespace-only', () => {
    expect(typeof validateSuggestion({ title: '   ', author: 'Bar' })).toBe('string');
  });
});

describe('coverHue', () => {
  it('returnerar ett tal mellan 0 och 359', () => {
    const h = coverHue('test');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
  });

  it('är deterministisk', () => {
    expect(coverHue('test')).toBe(coverHue('test'));
  });

  it('hanterar tom sträng', () => {
    expect(typeof coverHue('')).toBe('number');
  });

  it('hanterar undefined', () => {
    expect(typeof coverHue(undefined)).toBe('number');
  });
});

describe('konstanter', () => {
  it('SUGGESTION_COMMENT_MAX är positivt heltal', () => {
    expect(Number.isInteger(SUGGESTION_COMMENT_MAX)).toBe(true);
    expect(SUGGESTION_COMMENT_MAX).toBeGreaterThan(0);
  });

  it('SUGGESTION_DESCRIPTION_MAX är positivt heltal', () => {
    expect(Number.isInteger(SUGGESTION_DESCRIPTION_MAX)).toBe(true);
    expect(SUGGESTION_DESCRIPTION_MAX).toBeGreaterThan(0);
  });

  it('SUGGESTION_REPLY_MAX är positivt heltal', () => {
    expect(Number.isInteger(SUGGESTION_REPLY_MAX)).toBe(true);
    expect(SUGGESTION_REPLY_MAX).toBeGreaterThan(0);
  });
});
