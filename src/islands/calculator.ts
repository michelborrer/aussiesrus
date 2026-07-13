import type { Rebates } from '../lib/schema';
import { calculateFederalRebate, formatAud } from '../lib/rebate';

export interface CalcConfig {
  rebates: Rebates;
  systems: { id: string; label: string; usableKwh: number; typicalInstalledCost: number }[];
  states: { code: string; name: string; schemes: SchemeView[] }[];
}

export interface SchemeView {
  name: string;
  type: string;
  stacksWithFederal: boolean;
  status: string;
  sourceUrl: string;
  note?: string;
  amountLabel: string;
}

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function parseHash(): { kwh?: number; state?: string; cost?: number; stc?: number } {
  const raw = location.hash.replace(/^#/, '');
  if (!raw) return {};
  const params = new URLSearchParams(raw);
  const kwh = Number(params.get('kwh'));
  const cost = Number(params.get('cost'));
  const stc = Number(params.get('stc'));
  return {
    kwh: Number.isFinite(kwh) && kwh > 0 ? kwh : undefined,
    state: params.get('state') ?? undefined,
    cost: Number.isFinite(cost) && cost > 0 ? cost : undefined,
    stc: Number.isFinite(stc) && stc > 0 ? stc : undefined,
  };
}

function writeHash(state: { kwh: number; state: string; cost?: number; stc: number }) {
  const params = new URLSearchParams();
  params.set('kwh', String(state.kwh));
  params.set('state', state.state);
  params.set('stc', String(state.stc));
  if (state.cost != null && state.cost > 0) params.set('cost', String(state.cost));
  history.replaceState(null, '', `#${params.toString()}`);
}

export function initCalculator(root: HTMLElement, config: CalcConfig) {
  const kwhInput = root.querySelector<HTMLInputElement>('#kwh')!;
  const kwhSlider = root.querySelector<HTMLInputElement>('#kwh-slider')!;
  const stateSelect = root.querySelector<HTMLSelectElement>('#state')!;
  const costInput = root.querySelector<HTMLInputElement>('#cost')!;
  const stcInput = root.querySelector<HTMLInputElement>('#stc-price')!;
  const primary = root.querySelector<HTMLElement>('[data-out="rebate"]')!;
  const stcOut = root.querySelector<HTMLElement>('[data-out="stcs"]')!;
  const netOut = root.querySelector<HTMLElement>('[data-out="net"]')!;
  const pctOut = root.querySelector<HTMLElement>('[data-out="pct"]')!;
  const notice = root.querySelector<HTMLElement>('[data-out="notice"]')!;
  const schemesEl = root.querySelector<HTMLElement>('[data-out="schemes"]')!;
  const marker = root.querySelector<HTMLElement>('[data-marker]')!;
  const copyBtn = root.querySelector<HTMLButtonElement>('[data-copy]')!;

  const hash = parseHash();
  if (hash.kwh) {
    kwhInput.value = String(hash.kwh);
    kwhSlider.value = String(hash.kwh);
  }
  if (hash.state) stateSelect.value = hash.state;
  if (hash.cost) costInput.value = String(hash.cost);
  if (hash.stc) stcInput.value = String(hash.stc);

  const syncKwh = (v: number) => {
    kwhInput.value = String(v);
    kwhSlider.value = String(v);
  };

  const syncPresetChips = () => {
    const kwh = Number(kwhInput.value);
    root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((btn) => {
      const sys = config.systems.find((s) => s.id === btn.dataset.preset);
      const active = Boolean(sys && Math.abs(sys.usableKwh - kwh) < 0.001);
      btn.classList.toggle('chip--active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };

  root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((btn) => {
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      const id = btn.dataset.preset!;
      const sys = config.systems.find((s) => s.id === id);
      if (!sys) return;
      syncKwh(sys.usableKwh);
      costInput.value = String(sys.typicalInstalledCost);
      recompute();
    });
  });

  const recompute = () => {
    const kwh = Number(kwhInput.value);
    const stcPrice = Number(stcInput.value);
    const costRaw = costInput.value.trim();
    const cost = costRaw === '' ? undefined : Number(costRaw);
    const stateCode = stateSelect.value;

    if (!Number.isFinite(kwh) || kwh <= 0 || !Number.isFinite(stcPrice)) {
      primary.textContent = '—';
      stcOut.textContent = '—';
      netOut.textContent = '—';
      pctOut.textContent = '—';
      notice.textContent = 'Enter your battery’s usable capacity to see the current federal discount.';
      return;
    }

    const result = calculateFederalRebate(kwh, config.rebates, stcPrice);
    primary.textContent = formatAud(result.federalRebate);
    stcOut.textContent = String(result.stcCount);

    if (cost != null && Number.isFinite(cost) && cost > 0) {
      const net = Math.max(0, cost - result.federalRebate);
      netOut.textContent = formatAud(net);
      pctOut.textContent = `${((result.federalRebate / cost) * 100).toFixed(0)}%`;
    } else {
      netOut.textContent = '—';
      pctOut.textContent = '—';
    }

    const notices: string[] = [];
    if (result.belowMinimum) {
      notices.push('This capacity is below the program’s typical nominal minimum (about 5 kWh). Confirm eligibility with your installer.');
    }
    if (result.capped) {
      notices.push('Only the first 50 kWh of usable capacity attracts the federal discount.');
    }
    notice.textContent = notices.join(' ') || '';

    const left = Math.min(100, Math.max(0, (result.eligibleKwh / config.rebates.current.usableCapCapKwh) * 100));
    marker.style.left = `${left}%`;
    marker.hidden = false;

    const state = config.states.find((s) => s.code === stateCode);
    if (!state || !state.schemes.length) {
      schemesEl.innerHTML = '<p class="calc-empty">No additional state schemes listed for this selection.</p>';
    } else {
      schemesEl.innerHTML = state.schemes
        .map(
          (s) => `<div class="scheme-row">
            <div>
              <strong>${s.name}</strong>
              <p class="meta">${s.amountLabel}${s.note ? ` — ${s.note}` : ''}</p>
            </div>
            <div class="scheme-badges">
              <span class="badge">${s.status}</span>
              ${s.stacksWithFederal ? '<span class="badge badge--stack">Stacks with federal</span>' : ''}
              <a href="${s.sourceUrl}" rel="noopener">Source</a>
            </div>
          </div>`,
        )
        .join('');
    }

    writeHash({
      kwh,
      state: stateCode,
      cost: cost != null && Number.isFinite(cost) ? cost : undefined,
      stc: stcPrice,
    });

    syncPresetChips();
  };

  const debounced = debounce(recompute, 150);

  kwhInput.addEventListener('input', () => {
    kwhSlider.value = kwhInput.value;
    debounced();
  });
  kwhSlider.addEventListener('input', () => {
    kwhInput.value = kwhSlider.value;
    debounced();
  });
  stateSelect.addEventListener('change', recompute);
  costInput.addEventListener('input', debounced);
  stcInput.addEventListener('input', debounced);

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copyBtn.textContent = 'Link copied';
      setTimeout(() => {
        copyBtn.textContent = 'Copy link to this result';
      }, 1500);
    } catch {
      copyBtn.textContent = 'Copy failed';
    }
  });

  recompute();
}
