import type { AppContextKind, RoutineDefinition } from '@/types/context';

export const BUILT_IN_ROUTINES: RoutineDefinition[] = [
  { id: 'leavingHome', title: 'Leaving home', contextKind: 'leavingHome' },
  { id: 'startingTrip', title: 'Going on a trip', contextKind: 'trip' },
  { id: 'returningFromTrip', title: 'Coming back', contextKind: 'onTheWayBack' },
];

export function routineMatchesContext(
  routinesEnabled: boolean,
  contextKind: AppContextKind,
): boolean {
  if (!routinesEnabled) return false;
  return BUILT_IN_ROUTINES.some((routine) => routine.contextKind === contextKind);
}
