import type { PosterState } from '../types/sportlink.js';

type PatchAction = { type: 'PATCH'; payload: Partial<PosterState> };
type ResetAction = { type: 'RESET'; payload: PosterState };
type KeyAction   = { type: keyof PosterState; value: PosterState[keyof PosterState] };

export type PosterAction = PatchAction | ResetAction | KeyAction;

export function posterReducer(state: PosterState, action: PosterAction): PosterState {
  if (action.type === 'PATCH') return { ...state, ...(action as PatchAction).payload };
  if (action.type === 'RESET') return { ...(action as ResetAction).payload };
  const { type, value } = action as KeyAction;
  return { ...state, [type]: value };
}
