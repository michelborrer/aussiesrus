import { describe, expect, it } from 'vitest';
import rebatesRaw from '../src/data/rebates.json';
import { calculateFederalRebate } from '../src/lib/rebate';
import { rebatesSchema } from '../src/lib/schema';

const rebates = rebatesSchema.parse(rebatesRaw);
const price = rebates.stcPrice.netAssumed;

describe('federal rebate worked examples (§7.2)', () => {
  it('10 kWh → 68 STCs → $2,516 @ $37', () => {
    const r = calculateFederalRebate(10, rebates, price);
    expect(r.stcsRaw).toBeCloseTo(68.0, 5);
    expect(r.stcCount).toBe(68);
    expect(r.federalRebate).toBe(2516);
  });

  it('13.5 kWh → 91 STCs → $3,367 @ $37', () => {
    const r = calculateFederalRebate(13.5, rebates, price);
    expect(r.stcsRaw).toBeCloseTo(91.8, 5);
    expect(r.stcCount).toBe(91);
    expect(r.federalRebate).toBe(3367);
  });

  it('30 kWh → 154 STCs → $5,698 @ $37', () => {
    const r = calculateFederalRebate(30, rebates, price);
    expect(r.stcsRaw).toBeCloseTo(154.36, 2);
    expect(r.stcCount).toBe(154);
    expect(r.federalRebate).toBe(5698);
  });

  it('caps eligible capacity at 50 kWh', () => {
    const r = calculateFederalRebate(80, rebates, price);
    expect(r.capped).toBe(true);
    expect(r.eligibleKwh).toBe(50);
  });

  it('flags below program minimum', () => {
    const r = calculateFederalRebate(4, rebates, price);
    expect(r.belowMinimum).toBe(true);
  });
});
