import { describe, expect, it } from 'vitest';
import {
  isValidToothNumber,
  ToothNumberSchema,
  CreateTreatmentPlanItemSchema,
  RecordEstimateDecisionSchema,
  ClinicalTimelineQuerySchema,
  PLAN_ITEM_TRANSITIONS,
} from './index';

describe('tooth numbering', () => {
  it('accepts FDI permanent numbers', () => {
    for (const tooth of ['11', '18', '21', '28', '31', '38', '41', '48']) {
      expect(isValidToothNumber(tooth)).toBe(true);
    }
  });

  it('accepts universal numbers 1-32', () => {
    expect(isValidToothNumber('1')).toBe(true);
    expect(isValidToothNumber('16')).toBe(true);
    expect(isValidToothNumber('32')).toBe(true);
  });

  it('rejects invalid teeth', () => {
    for (const tooth of ['19', '191', '0', '-3', '', '5a', '99']) {
      expect(isValidToothNumber(tooth)).toBe(false);
    }
  });

  it('surfaces parse errors as readable messages', () => {
    const result = ToothNumberSchema.safeParse('99');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/FDI|Universal/i);
    }
  });
});

describe('treatment plan item contracts', () => {
  it('applies defaults for quantity, discount, taxRate and priority', () => {
    const parsed = CreateTreatmentPlanItemSchema.parse({
      planId: '00000000-0000-4000-8000-000000000001',
      description: 'Composite',
      unitPrice: 220,
    });
    expect(parsed.quantity).toBe(1);
    expect(parsed.discount).toBe(0);
    expect(parsed.taxRate).toBe(0);
    expect(parsed.priority).toBe('routine');
  });

  it('keeps terminal statuses untransitionable', () => {
    expect(PLAN_ITEM_TRANSITIONS.completed).toEqual([]);
    expect(PLAN_ITEM_TRANSITIONS.planned).toContain('accepted');
    expect(PLAN_ITEM_TRANSITIONS.scheduled).toContain('in_progress');
  });
});

describe('estimate decision contract', () => {
  it('requires signer name, decision and method', () => {
    expect(
      RecordEstimateDecisionSchema.safeParse({ decision: 'approved' }).success,
    ).toBe(false);

    const ok = RecordEstimateDecisionSchema.parse({
      decision: 'rejected',
      signerName: 'Jane Citizen',
      method: 'written',
    });
    expect(ok.method).toBe('written');
  });
});

describe('clinical timeline query contract', () => {
  it('coerces pagination numbers', () => {
    const parsed = ClinicalTimelineQuerySchema.parse({ skip: '5', take: '50' });
    expect(parsed.skip).toBe(5);
    expect(parsed.take).toBe(50);
  });

  it('rejects oversized page sizes', () => {
    expect(ClinicalTimelineQuerySchema.safeParse({ take: '200' }).success).toBe(false);
  });

  it('validates event type filters', () => {
    expect(ClinicalTimelineQuerySchema.safeParse({ types: ['nope'] }).success).toBe(false);
    expect(ClinicalTimelineQuerySchema.safeParse({ types: ['finding'] }).success).toBe(true);
  });
});
