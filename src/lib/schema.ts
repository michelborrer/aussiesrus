import { z } from 'zod';

const MAX_VERIFIED_AGE_DAYS = 120;

export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const rebatesSchema = z.object({
  meta: z.object({
    program: z.string(),
    administrator: z.string(),
    sourceUrl: z.string().url(),
    lastVerified: dateString,
    programEnd: z.number().int(),
  }),
  stcPrice: z.object({
    headline: z.number().positive(),
    netAssumed: z.number().positive(),
    note: z.string(),
  }),
  current: z.object({
    effectiveFrom: dateString,
    stcFactor: z.number().positive(),
    tiers: z
      .array(
        z.object({
          fromKwh: z.number().nonnegative(),
          toKwh: z.number().positive(),
          factorPct: z.number().positive(),
        }),
      )
      .min(1),
    usableCapCapKwh: z.number().positive(),
    eligibleNominalRangeKwh: z.tuple([z.number(), z.number()]),
  }),
  schedule: z.array(
    z.object({
      effectiveFrom: dateString,
      stcFactor: z.number().positive().nullable(),
      status: z.enum(['announced', 'confirmed']),
    }),
  ),
  history: z.array(
    z.object({
      effectiveFrom: dateString,
      stcFactor: z.number().positive(),
      flat: z.boolean(),
    }),
  ),
});

const schemeValueSchema = z.object({
  kind: z.enum(['perKwh', 'fixed']),
  amount: z.number().nonnegative(),
  unit: z.string(),
  note: z.string().optional(),
});

export const statesSchema = z.object({
  states: z.array(
    z.object({
      name: z.string(),
      code: z.string().min(2).max(3),
      schemes: z.array(
        z.object({
          name: z.string(),
          type: z.enum(['rebate', 'loan', 'vpp']),
          value: schemeValueSchema,
          cap: z.number().nullable(),
          eligibility: z.array(z.string()),
          stacksWithFederal: z.boolean(),
          sourceUrl: z.string().url(),
          lastVerified: dateString,
          status: z.enum(['open', 'paused', 'closed']),
        }),
      ),
    }),
  ),
});

export const fitsSchema = z.object({
  states: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      minCPerKwh: z.number(),
      maxCPerKwh: z.number(),
      referenceRetailers: z.array(z.string()),
      note: z.string(),
      sourceUrl: z.string().url(),
      lastVerified: dateString,
    }),
  ),
});

export const systemsSchema = z.object({
  systems: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      usableKwh: z.number().positive(),
      typicalInstalledCost: z.number().positive(),
    }),
  ),
});

export const changelogSchema = z.object({
  entries: z.array(
    z.object({
      date: dateString,
      summary: z.string(),
      affectedPages: z.array(z.string()),
    }),
  ),
  programHistory: z
    .array(
      z.object({
        date: dateString,
        summary: z.string(),
      }),
    )
    .default([]),
});

export type Rebates = z.infer<typeof rebatesSchema>;
export type States = z.infer<typeof statesSchema>;
export type Fits = z.infer<typeof fitsSchema>;
export type Systems = z.infer<typeof systemsSchema>;
export type Changelog = z.infer<typeof changelogSchema>;

export function assertFresh(lastVerified: string, label: string, now = new Date()): void {
  const verified = new Date(`${lastVerified}T00:00:00Z`);
  const ageMs = now.getTime() - verified.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays > MAX_VERIFIED_AGE_DAYS) {
    throw new Error(
      `${label} lastVerified ${lastVerified} is ${Math.floor(ageDays)} days old (max ${MAX_VERIFIED_AGE_DAYS}).`,
    );
  }
}

export { MAX_VERIFIED_AGE_DAYS };
