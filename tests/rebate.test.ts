import { describe, expect, it } from 'vitest';
import rebatesRaw from '../src/data/rebates.json';
import { calculateFederalRebate, nextStepDown, scheduleStatus } from '../src/lib/rebate';
import { rebatesSchema } from '../src/lib/schema';

const rebates = rebatesSchema.parse(rebatesRaw);
const price = rebates.stcPrice.netAssumed;

const allDates = [
  ...rebates.history.map((h) => h.effectiveFrom),
  ...rebates.schedule.map((s) => s.effectiveFrom),
];

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

describe('scheduleStatus', () => {
  const dates = ['2025-07-01', '2026-01-01', '2026-05-01', '2027-01-01'];

  it('marks all rows Announced when today is before the first row', () => {
    const today = new Date('2025-06-01T00:00:00Z');
    expect(dates.map((d) => scheduleStatus(d, dates, today))).toEqual([
      'Announced',
      'Announced',
      'Announced',
      'Announced',
    ]);
  });

  it('marks Current between rows and Historical for earlier', () => {
    const today = new Date('2026-03-15T00:00:00Z');
    expect(scheduleStatus('2025-07-01', dates, today)).toBe('Historical');
    expect(scheduleStatus('2026-01-01', dates, today)).toBe('Current');
    expect(scheduleStatus('2026-05-01', dates, today)).toBe('Announced');
    expect(scheduleStatus('2027-01-01', dates, today)).toBe('Announced');
  });

  it('marks Current after the last in-force row and Announced for future', () => {
    const today = new Date('2026-07-13T00:00:00Z');
    const labels = allDates.map((d) => scheduleStatus(d, allDates, today));
    expect(labels.filter((l) => l === 'Current')).toHaveLength(1);
    expect(scheduleStatus('2026-05-01', allDates, today)).toBe('Current');
    expect(scheduleStatus('2026-01-01', allDates, today)).toBe('Historical');
    expect(scheduleStatus('2027-01-01', allDates, today)).toBe('Announced');
  });

  it('agrees with nextStepDown on the next announced date', () => {
    const today = new Date('2026-07-13T00:00:00Z');
    const next = nextStepDown(rebates, today);
    expect(next?.date).toBe('2027-01-01');
    expect(scheduleStatus(next!.date, allDates, today)).toBe('Announced');
  });
});
