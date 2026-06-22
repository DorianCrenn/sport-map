export function haptic(pattern: number | number[] = 8) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch {}
  }
}

export const hapticLight   = () => haptic(6);
export const hapticMedium  = () => haptic(18);
export const hapticSuccess = () => haptic([10, 60, 10]);
export const hapticError   = () => haptic([20, 40, 20, 40, 20]);
