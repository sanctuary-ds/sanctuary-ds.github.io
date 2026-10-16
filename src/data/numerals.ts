// Roman numerals for the showcase's numbered inscriptions (I · Flavors, …), so a
// list can grow without a hand-written table running out.
const NUMERALS: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value < 1) throw new Error(`No Roman numeral for ${value}.`);
  let rest = value;
  let numeral = '';
  for (const [amount, symbol] of NUMERALS) {
    while (rest >= amount) {
      numeral += symbol;
      rest -= amount;
    }
  }
  return numeral;
}
