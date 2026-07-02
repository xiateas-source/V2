import { describe, it, expect, beforeEach } from 'vitest';
import { reconcile } from 'solid-js/store';
import { store, setStore } from '../src/state/index.js';
import { recordFailure, isHealthy } from '../src/ai/providers.js';

// Audit finding #3: recordFailure mutated the Solid store proxy directly,
// which Solid silently ignores — failures stayed 0 forever, isHealthy() was
// always true, and the exponential cooldown never engaged. These tests pin
// the fixed write-through-setStore behavior.

describe('provider health tracking', () => {
  beforeEach(() => {
    // setStore with a plain object MERGES into the existing value — an empty
    // object is a no-op. reconcile() actually clears the previous test's state.
    setStore('system', 'providers', 'health', reconcile({}));
  });

  it('a fresh provider is healthy', () => {
    expect(isHealthy('gemini')).toBe(true);
  });

  it('recordFailure actually persists into the store (was a silent no-op)', () => {
    recordFailure('gemini');
    expect(store.system.providers.health.gemini.failures).toBe(1);
    recordFailure('gemini');
    expect(store.system.providers.health.gemini.failures).toBe(2);
    expect(store.system.providers.health.gemini.lastFail).toBeGreaterThan(0);
  });

  it('a just-failed provider is inside its cooldown window', () => {
    recordFailure('gemini');
    expect(isHealthy('gemini')).toBe(false);
  });

  it('failures on one provider do not affect the other', () => {
    recordFailure('gemini');
    expect(isHealthy('openrouter')).toBe(true);
  });

  it('a provider becomes healthy again once the cooldown elapses', () => {
    recordFailure('gemini');
    // failures=1 → cooldown 60s; backdate the failure past it.
    setStore('system', 'providers', 'health', 'gemini', 'lastFail', Date.now() - 61000);
    expect(isHealthy('gemini')).toBe(true);
  });
});
