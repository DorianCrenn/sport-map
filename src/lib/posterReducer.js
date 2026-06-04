/**
 * posterReducer — Reducer pur du state PosterStudio.
 *
 * Actions :
 *   { type: 'PATCH',    payload: object }  — merge partiel sur le state
 *   { type: 'RESET',   payload: object }  — remplace le state entier
 *   { type: clé,       value: any }       — met à jour une seule propriété
 */
export function posterReducer(state, action) {
  if (action.type === 'PATCH')  return { ...state, ...action.payload };
  if (action.type === 'RESET')  return { ...action.payload };
  return { ...state, [action.type]: action.value };
}
