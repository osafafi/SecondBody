import type { EquipmentId } from '@/types/trainingVocabulary';

/**
 * The human-readable name for each piece of equipment, and where it is expected
 * to be found.
 *
 * Exercises reference equipment by id. This is the one place those ids turn into
 * words, so "Requires: leg extension machine" reads the same everywhere, and so
 * the onboarding question in M4 ("what does your gym actually have?") has a list
 * to offer.
 *
 * The `gym` entries are the actual inventory of Omar's building gym, counted in
 * person. Nothing is listed here on the assumption that a gym probably has it.
 */
export type EquipmentDefinition = {
  equipmentId: EquipmentId;
  displayName: string;

  /**
   * Where this is expected to be. `home` covers the mat, bands and foam roller
   * Omar already owns; `none` is for movements that need nothing but a floor.
   */
  location: 'gym' | 'home' | 'none';
};

export const gymEquipment: EquipmentDefinition[] = [
  { equipmentId: 'bodyweightOnly', displayName: 'No equipment', location: 'none' },

  // Resistance machines.
  { equipmentId: 'legExtensionMachine', displayName: 'Leg extension machine', location: 'gym' },
  { equipmentId: 'seatedLegCurlMachine', displayName: 'Leg curl machine', location: 'gym' },
  { equipmentId: 'hipAdductorMachine', displayName: 'Adductor machine', location: 'gym' },
  { equipmentId: 'hipAbductorMachine', displayName: 'Abductor machine', location: 'gym' },
  { equipmentId: 'shoulderPressMachine', displayName: 'Shoulder press machine', location: 'gym' },
  { equipmentId: 'chestPressMachine', displayName: 'Chest press machine', location: 'gym' },
  { equipmentId: 'latPulldownMachine', displayName: 'Lat pulldown machine', location: 'gym' },
  { equipmentId: 'seatedCableRowMachine', displayName: 'Low row', location: 'gym' },
  { equipmentId: 'cableStation', displayName: 'Cable crossover', location: 'gym' },

  // The free weight area.
  { equipmentId: 'dumbbells', displayName: 'Dumbbells', location: 'gym' },
  { equipmentId: 'barbell', displayName: 'Barbell', location: 'gym' },
  { equipmentId: 'flatBench', displayName: 'Flat bench', location: 'gym' },
  { equipmentId: 'adjustableBench', displayName: 'Adjustable bench', location: 'gym' },

  // Cardio.
  { equipmentId: 'treadmill', displayName: 'Treadmill', location: 'gym' },
  { equipmentId: 'stationaryBike', displayName: 'Stationary bike', location: 'gym' },
  { equipmentId: 'rowingMachine', displayName: 'Rowing machine', location: 'gym' },
  { equipmentId: 'ellipticalTrainer', displayName: 'Elliptical trainer', location: 'gym' },

  // Owned at home, or needing nothing at all.
  { equipmentId: 'exerciseMat', displayName: 'Exercise mat', location: 'home' },
  { equipmentId: 'resistanceBand', displayName: 'Resistance band', location: 'home' },
  { equipmentId: 'foamRoller', displayName: 'Foam roller', location: 'home' },
  { equipmentId: 'wall', displayName: 'A wall or door frame', location: 'none' },
];

const equipmentById = new Map<EquipmentId, EquipmentDefinition>(
  gymEquipment.map((equipment) => [equipment.equipmentId, equipment]),
);

/** The display name for an equipment id, or the id itself if it is somehow unknown. */
export function describeEquipment(equipmentId: EquipmentId): string {
  return equipmentById.get(equipmentId)?.displayName ?? equipmentId;
}
