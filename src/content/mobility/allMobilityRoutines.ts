import type { MobilityRoutine } from '@/types/programTypes';

import { deskUndoRoutine } from './deskUndoRoutine';

/** Every mobility routine the app knows about. One ships today. */
export const allMobilityRoutines: MobilityRoutine[] = [deskUndoRoutine];

/** The routine offered on the Today screen every day. */
export const dailyMobilityRoutineId = deskUndoRoutine.mobilityRoutineId;

const mobilityRoutinesById = new Map<string, MobilityRoutine>(
  allMobilityRoutines.map((routine) => [routine.mobilityRoutineId, routine]),
);

/** Looks a routine up by id. Returns null when there is no such routine. */
export function findMobilityRoutineById(mobilityRoutineId: string): MobilityRoutine | null {
  return mobilityRoutinesById.get(mobilityRoutineId) ?? null;
}
