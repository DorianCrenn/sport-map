import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollInputIntoView } from '../../hooks/useScrollInputIntoView.js';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function makeContainer() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

describe('useScrollInputIntoView', () => {
  it('appelle scrollIntoView sur un INPUT après focusin', async () => {
    const container = makeContainer();
    const input = document.createElement('input');
    container.appendChild(input);
    const scrollIntoView = vi.fn();
    input.scrollIntoView = scrollIntoView;

    const ref = { current: container };
    renderHook(() => useScrollInputIntoView(ref));

    input.dispatchEvent(new Event('focusin', { bubbles: true }));
    vi.advanceTimersByTime(350);

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
    document.body.removeChild(container);
  });

  it('n\'appelle pas scrollIntoView sur un DIV', () => {
    const container = makeContainer();
    const div = document.createElement('div');
    const scrollIntoView = vi.fn();
    div.scrollIntoView = scrollIntoView;
    container.appendChild(div);

    const ref = { current: container };
    renderHook(() => useScrollInputIntoView(ref));

    div.dispatchEvent(new Event('focusin', { bubbles: true }));
    vi.advanceTimersByTime(350);

    expect(scrollIntoView).not.toHaveBeenCalled();
    document.body.removeChild(container);
  });

  it('appelle scrollIntoView sur un TEXTAREA', () => {
    const container = makeContainer();
    const textarea = document.createElement('textarea');
    const scrollIntoView = vi.fn();
    textarea.scrollIntoView = scrollIntoView;
    container.appendChild(textarea);

    const ref = { current: container };
    renderHook(() => useScrollInputIntoView(ref));

    textarea.dispatchEvent(new Event('focusin', { bubbles: true }));
    vi.advanceTimersByTime(350);

    expect(scrollIntoView).toHaveBeenCalled();
    document.body.removeChild(container);
  });

  it('ne fait rien si containerRef.current est null', () => {
    const ref = { current: null };
    // Ne doit pas throw
    expect(() => renderHook(() => useScrollInputIntoView(ref))).not.toThrow();
  });

  it('nettoie le listener au démontage', () => {
    const container = makeContainer();
    const input = document.createElement('input');
    const scrollIntoView = vi.fn();
    input.scrollIntoView = scrollIntoView;
    container.appendChild(input);

    const ref = { current: container };
    const { unmount } = renderHook(() => useScrollInputIntoView(ref));
    unmount();

    input.dispatchEvent(new Event('focusin', { bubbles: true }));
    vi.advanceTimersByTime(350);

    expect(scrollIntoView).not.toHaveBeenCalled();
    document.body.removeChild(container);
  });
});
