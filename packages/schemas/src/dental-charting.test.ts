import { describe, expect, it } from 'vitest';
import {
  CONDITION_CDT_MAP,
  fdiToUniversal,
  MANDIBLE_RENDER_ORDER,
  MAXILLA_RENDER_ORDER,
  universalToFdi,
} from './dental-charting';

describe('tooth numbering conversion', () => {
  it('converts universal to FDI across all quadrants', () => {
    expect(universalToFdi(1)).toBe(18);
    expect(universalToFdi(8)).toBe(11);
    expect(universalToFdi(9)).toBe(21);
    expect(universalToFdi(16)).toBe(28);
    expect(universalToFdi(17)).toBe(38);
    expect(universalToFdi(24)).toBe(31);
    expect(universalToFdi(25)).toBe(41);
    expect(universalToFdi(32)).toBe(48);
  });

  it('converts FDI to universal across all quadrants', () => {
    expect(fdiToUniversal(18)).toBe(1);
    expect(fdiToUniversal(11)).toBe(8);
    expect(fdiToUniversal(21)).toBe(9);
    expect(fdiToUniversal(28)).toBe(16);
    expect(fdiToUniversal(38)).toBe(17);
    expect(fdiToUniversal(31)).toBe(24);
    expect(fdiToUniversal(41)).toBe(25);
    expect(fdiToUniversal(48)).toBe(32);
  });

  it('is involutive', () => {
    for (let universal = 1; universal <= 32; universal += 1) {
      expect(fdiToUniversal(universalToFdi(universal))).toBe(universal);
    }
  });

  it('rejects invalid tooth numbers', () => {
    expect(() => universalToFdi(0)).toThrow();
    expect(() => universalToFdi(33)).toThrow();
    expect(() => fdiToUniversal(19)).toThrow();
    expect(() => fdiToUniversal(50)).toThrow();
  });
});

describe('render order', () => {
  it('renders maxilla patient-right to patient-left and mandible reversed', () => {
    expect(MAXILLA_RENDER_ORDER[0]).toBe(1);
    expect(MAXILLA_RENDER_ORDER[15]).toBe(16);
    expect(MANDIBLE_RENDER_ORDER[0]).toBe(32);
    expect(MANDIBLE_RENDER_ORDER[15]).toBe(17);
  });
});

describe('condition CDT map', () => {
  it('maps treatable conditions and skips restorative-history ones', () => {
    expect(CONDITION_CDT_MAP.caries?.code).toBe('D2392');
    expect(CONDITION_CDT_MAP.implant?.code).toBe('D6010');
    expect(CONDITION_CDT_MAP.filling).toBeNull();
    expect(CONDITION_CDT_MAP.missing).toBeNull();
  });
});
