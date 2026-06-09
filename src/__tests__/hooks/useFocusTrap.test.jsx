import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';

// ── Composant de test ─────────────────────────────────────────────────────────

function TrapFixture({ enabled = true, children }) {
  const ref = useRef(null);
  useFocusTrap(ref, enabled);
  return <div ref={ref}>{children}</div>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useFocusTrap', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('place le focus sur le premier élément focusable après 50ms', async () => {
    const { getByTestId } = render(
      <TrapFixture>
        <button data-testid="btn-1">Premier</button>
        <button data-testid="btn-2">Deuxième</button>
      </TrapFixture>
    );
    await act(async () => { vi.advanceTimersByTime(60); });
    expect(document.activeElement).toBe(getByTestId('btn-1'));
  });

  it('garde le focus dans le trap sur Tab depuis le dernier élément', async () => {
    const { getByTestId } = render(
      <TrapFixture>
        <button data-testid="first">Premier</button>
        <button data-testid="last">Dernier</button>
      </TrapFixture>
    );
    await act(async () => { vi.advanceTimersByTime(60); });
    getByTestId('last').focus();
    fireEvent.keyDown(getByTestId('last'), { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(getByTestId('first'));
  });

  it('gère Shift+Tab en revenant au dernier élément depuis le premier', async () => {
    const { getByTestId } = render(
      <TrapFixture>
        <button data-testid="first">Premier</button>
        <button data-testid="last">Dernier</button>
      </TrapFixture>
    );
    await act(async () => { vi.advanceTimersByTime(60); });
    getByTestId('first').focus();
    fireEvent.keyDown(getByTestId('first'), { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(getByTestId('last'));
  });

  it('restaure le focus sur l\'élément précédent au démontage', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(
      <TrapFixture>
        <button>Interne</button>
      </TrapFixture>
    );
    await act(async () => { vi.advanceTimersByTime(60); });
    unmount();
    expect(document.activeElement).toBe(trigger);
    document.body.removeChild(trigger);
  });

  it('ne trap pas si enabled=false', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    render(
      <TrapFixture enabled={false}>
        <button data-testid="inside">Interne</button>
      </TrapFixture>
    );
    await act(async () => { vi.advanceTimersByTime(60); });
    expect(document.activeElement).toBe(outside);
    document.body.removeChild(outside);
  });
});
