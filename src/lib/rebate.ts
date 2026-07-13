import type { Rebates } from './schema';

export interface RebateResult {
  eligibleKwh: number;
  stcsRaw: number;
  stcCount: number;
  federalRebate: number;
  capped: boolean;
  belowMinimum: boolean;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** Federal Cheaper Home Batteries rebate from usable kWh. */
export function calculateFederalRebate(
  usableKwh: number,
  rebates: Rebates,
  stcPrice = rebates.stcPrice.netAssumed,
): RebateResult {
  const { tiers, usableCapCapKwh, stcFactor, eligibleNominalRangeKwh } = rebates.current;
  const [minNom] = eligibleNominalRangeKwh;
  const belowMinimum = usableKwh > 0 && usableKwh < minNom;
  const capped = usableKwh > usableCapCapKwh;
  const eligible = clamp(usableKwh, 0, usableCapCapKwh);

  let stcs = 0;
  for (const tier of tiers) {
    const span = clamp(eligible, tier.fromKwh, tier.toKwh) - tier.fromKwh;
    if (span > 0) {
      stcs += span * stcFactor * (tier.factorPct / 100);
    }
  }

  const stcCount = Math.floor(stcs);
  return {
    eligibleKwh: eligible,
    stcsRaw: stcs,
    stcCount,
    federalRebate: stcCount * stcPrice,
    capped,
    belowMinimum,
  };
}

export function dollarsPerUsableKwh(rebates: Rebates, useNet = true): number {
  const price = useNet ? rebates.stcPrice.netAssumed : rebates.stcPrice.headline;
  return rebates.current.stcFactor * price;
}

export function nextStepDown(rebates: Rebates, today = new Date()): { date: string; days: number } | null {
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const upcoming = rebates.schedule
    .map((s) => s.effectiveFrom)
    .filter((d) => {
      const t = Date.parse(`${d}T00:00:00Z`);
      return t > todayUtc;
    })
    .sort();

  if (!upcoming.length) return null;
  const date = upcoming[0];
  const days = Math.ceil((Date.parse(`${date}T00:00:00Z`) - todayUtc) / (1000 * 60 * 60 * 24));
  return { date, days };
}

export type ScheduleStatusLabel = 'Current' | 'Historical' | 'Announced';

/** Display status for a step-down / history row. Exactly one row is Current. */
export function scheduleStatus(
  effectiveFrom: string,
  allEffectiveFrom: string[],
  today = new Date(),
): ScheduleStatusLabel {
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const rowUtc = Date.parse(`${effectiveFrom}T00:00:00Z`);
  if (rowUtc > todayUtc) return 'Announced';

  const current = [...allEffectiveFrom]
    .filter((d) => Date.parse(`${d}T00:00:00Z`) <= todayUtc)
    .sort()
    .at(-1);

  return effectiveFrom === current ? 'Current' : 'Historical';
}

/** Next announced (future) step-down — same date set the Rate Board countdown uses. */
export function announcedStepDowns(rebates: Rebates, today = new Date()): string[] {
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return rebates.schedule
    .map((s) => s.effectiveFrom)
    .filter((d) => Date.parse(`${d}T00:00:00Z`) > todayUtc)
    .sort();
}

export function formatAud(n: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDateLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function formatDateStamp(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .format(d)
    .toUpperCase()
    .replace(/,/g, '');
}

export function maxDate(...dates: (string | undefined)[]): string {
  const valid = dates.filter((d): d is string => Boolean(d));
  if (!valid.length) return new Date().toISOString().slice(0, 10);
  return valid.sort().at(-1)!;
}
