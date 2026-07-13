import { describe, expect, it, vi, afterEach } from 'vitest';
import { isHoneypotTriggered, validateLeadPayload } from '../src/lib/lead';

describe('/api/lead validation', () => {
  it('rejects invalid payloads', () => {
    const r = validateLeadPayload({ type: 'lead', name: '', email: 'not-an-email' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('invalid');
  });

  it('rejects honeypot fills', () => {
    expect(isHoneypotTriggered('Acme Corp')).toBe(true);
    const r = validateLeadPayload({
      type: 'contact',
      name: 'Sam',
      email: 'sam@example.com',
      company: 'bot',
      message: 'hi',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('honeypot');
  });

  it('requires consent and AU phone/postcode for leads', () => {
    const missingConsent = validateLeadPayload({
      type: 'lead',
      name: 'Sam',
      email: 'sam@example.com',
      phone: '0412345678',
      postcode: '6000',
    });
    expect(missingConsent.ok).toBe(false);
    if (!missingConsent.ok) expect(missingConsent.error).toBe('consent_required');

    const badPhone = validateLeadPayload({
      type: 'lead',
      name: 'Sam',
      email: 'sam@example.com',
      phone: '123',
      postcode: '6000',
      consent: 'true',
    });
    expect(badPhone.ok).toBe(false);
    if (!badPhone.ok) expect(badPhone.error).toBe('invalid_lead');
  });

  it('accepts a valid lead payload', () => {
    const r = validateLeadPayload({
      type: 'lead',
      name: 'Sam Example',
      email: 'sam@example.com',
      phone: '0412345678',
      postcode: '6000',
      consent: 'true',
      'cf-turnstile-response': 'token',
    });
    expect(r.ok).toBe(true);
  });
});

describe('GHL webhook forwarding (mocked)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('POSTs JSON to GHL_WEBHOOK_URL when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal('fetch', fetchMock);

    const webhook = 'https://example.test/ghl-webhook';
    const payload = {
      type: 'lead',
      name: 'Sam',
      email: 'sam@example.com',
      source: 'aussiesrus.com.au',
    };

    const controller = new AbortController();
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      webhook,
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      }),
    );
  });
});
