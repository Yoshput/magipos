import { describe, it, expect } from 'vitest';
import { escapeCsvField, generateCsv } from '../src/lib/csv';

describe('CSV Escaping and Generation', () => {
  it('escapes fields with commas, double quotes, and newlines per RFC 4180', () => {
    expect(escapeCsvField('Mango Sago')).toBe('Mango Sago');
    expect(escapeCsvField('Mango, Strawberry')).toBe('"Mango, Strawberry"');
    expect(escapeCsvField('Cup 300 ml "Special"')).toBe('"Cup 300 ml ""Special"""');
    expect(escapeCsvField("Baris 1\nBaris 2")).toBe('"Baris 1\nBaris 2"');
  });

  it('generates multi-row CSV properly with header', () => {
    const headers = ['No', 'Menu', 'Harga'];
    const rows = [
      ['1', 'Dragon Sago, 200 ml', 13000],
      ['2', 'Mango Sago "Special"', 17000],
    ];

    const csv = generateCsv(headers, rows);
    expect(csv).toContain('No,Menu,Harga');
    expect(csv).toContain('"Dragon Sago, 200 ml",13000');
    expect(csv).toContain('"Mango Sago ""Special""",17000');
  });
});
