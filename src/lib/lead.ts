import { z } from 'zod';

export const leadSchema = z.object({
  type: z.enum(['lead', 'contact']),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().optional(),
  postcode: z.string().regex(/^[0-9]{4}$/).optional(),
  message: z.string().max(5000).optional(),
  consent: z.literal('true').optional(),
  company: z.string().optional(),
  website: z.string().optional(),
  'cf-turnstile-response': z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export function isHoneypotTriggered(
  company: string | undefined,
  website?: string | undefined,
): boolean {
  return Boolean((company && company.trim() !== '') || (website && website.trim() !== ''));
}

export function isValidAuPhone(phone: string | undefined): boolean {
  return Boolean(phone && /^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$/.test(phone));
}

export type LeadValidationResult =
  | { ok: true; data: LeadInput }
  | { ok: false; error: 'invalid' | 'consent_required' | 'invalid_lead' | 'honeypot' };

/** Shared validation for the /api/lead Pages Function (zod + honeypot + lead rules). */
export function validateLeadPayload(raw: unknown): LeadValidationResult {
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const data = parsed.data;
  if (isHoneypotTriggered(data.company, data.website)) return { ok: false, error: 'honeypot' };

  if (data.type === 'lead' && data.consent !== 'true') {
    return { ok: false, error: 'consent_required' };
  }

  if (data.type === 'lead') {
    if (!isValidAuPhone(data.phone) || !data.postcode) {
      return { ok: false, error: 'invalid_lead' };
    }
  }

  return { ok: true, data };
}
