import rebatesRaw from '../data/rebates.json';
import statesRaw from '../data/states.json';
import fitsRaw from '../data/fits.json';
import systemsRaw from '../data/systems.json';
import changelogRaw from '../data/changelog.json';
import {
  assertFresh,
  changelogSchema,
  fitsSchema,
  rebatesSchema,
  statesSchema,
  systemsSchema,
  type Changelog,
  type Fits,
  type Rebates,
  type States,
  type Systems,
} from './schema';

let cached: {
  rebates: Rebates;
  states: States;
  fits: Fits;
  systems: Systems;
  changelog: Changelog;
} | null = null;

export function loadValidatedData() {
  if (cached) return cached;

  const rebates = rebatesSchema.parse(rebatesRaw);
  const states = statesSchema.parse(statesRaw);
  const fits = fitsSchema.parse(fitsRaw);
  const systems = systemsSchema.parse(systemsRaw);
  const changelog = changelogSchema.parse(changelogRaw);

  assertFresh(rebates.meta.lastVerified, 'rebates.meta');
  for (const state of states.states) {
    for (const scheme of state.schemes) {
      assertFresh(scheme.lastVerified, `states.${state.code}.${scheme.name}`);
    }
  }
  for (const fit of fits.states) {
    assertFresh(fit.lastVerified, `fits.${fit.code}`);
  }

  cached = { rebates, states, fits, systems, changelog };
  return cached;
}

export function getRebates(): Rebates {
  return loadValidatedData().rebates;
}

export function getStates(): States {
  return loadValidatedData().states;
}

export function getState(code: string) {
  return getStates().states.find((s) => s.code === code);
}

export function getFits(): Fits {
  return loadValidatedData().fits;
}

export function getSystems(): Systems {
  return loadValidatedData().systems;
}

export function getChangelog(): Changelog {
  return loadValidatedData().changelog;
}
