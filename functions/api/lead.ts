import { validateLeadPayload, type LeadInput } from '../../src/lib/lead';

interface Env {
  GHL_WEBHOOK_URL?: string;
  TURNSTILE_SECRET_KEY?: string;
  OWNER_EMAIL?: string;
}

async function verifyTurnstile(token: string | undefined, secret: string | undefined, ip: string) {
  if (!secret) return { ok: false, reason: 'missing_secret' };
  if (!token) return { ok: false, reason: 'missing_token' };

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  body.set('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  const data = (await res.json()) as { success?: boolean };
  return { ok: Boolean(data.success) };
}

async function forwardToGhl(url: string, payload: Record<string, unknown>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function emailFallback(env: Env, payload: Record<string, unknown>) {
  const to = env.OWNER_EMAIL ?? 'hello@aussiesrus.com.au';
  try {
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: 'noreply@aussiesrus.com.au', name: 'Aussies R Us forms' },
        subject: `Form fallback: ${payload.type}`,
        content: [{ type: 'text/plain', value: JSON.stringify(payload, null, 2) }],
      }),
    });
  } catch {
    // swallow — user already gets success UX; ops can inspect CF logs
  }
}

function buildPayload(data: LeadInput) {
  return {
    type: data.type,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    postcode: data.postcode ?? null,
    message: data.message ?? null,
    consent: data.consent === 'true',
    source: 'aussiesrus.com.au',
    submittedAt: new Date().toISOString(),
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const ip = request.headers.get('CF-Connecting-IP') ?? '0.0.0.0';
  const form = await request.formData();
  const raw = Object.fromEntries(form.entries());

  const validated = validateLeadPayload(raw);
  if (!validated.ok) {
    if (validated.error === 'honeypot') {
      return Response.redirect(new URL('/quotes/thanks/', request.url), 303);
    }
    return new Response(JSON.stringify({ ok: false, error: validated.error }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const data = validated.data;

  const turnstile = await verifyTurnstile(
    data['cf-turnstile-response'],
    env.TURNSTILE_SECRET_KEY,
    ip,
  );
  if (!turnstile.ok) {
    return new Response(JSON.stringify({ ok: false, error: 'turnstile' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const payload = buildPayload(data);

  let delivered = false;
  if (env.GHL_WEBHOOK_URL) {
    delivered = await forwardToGhl(env.GHL_WEBHOOK_URL, payload);
  }
  if (!delivered) {
    await emailFallback(env, payload);
  }

  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  if (wantsJson) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const dest = data.type === 'lead' ? '/quotes/thanks/' : '/contact/?sent=1';
  return Response.redirect(new URL(dest, request.url), 303);
};
