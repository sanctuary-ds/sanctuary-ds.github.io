import { expect, test } from '@playwright/test';
import { toRoman } from '../src/data/numerals';

// The numbered inscriptions grow with their lists, so the numerals must be right
// beyond the first ten, including the subtractive forms.

test('Roman numerals, including subtractive forms', () => {
  const cases: [number, string][] = [
    [1, 'I'], [3, 'III'], [4, 'IV'], [5, 'V'], [9, 'IX'], [10, 'X'], [11, 'XI'], [14, 'XIV'],
    [40, 'XL'], [49, 'XLIX'], [90, 'XC'], [400, 'CD'], [944, 'CMXLIV'], [1994, 'MCMXCIV'],
  ];
  for (const [value, numeral] of cases) expect(toRoman(value), String(value)).toBe(numeral);
});

test('no numeral for zero, negatives or fractions', () => {
  for (const value of [0, -1, 1.5]) expect(() => toRoman(value)).toThrow();
});
