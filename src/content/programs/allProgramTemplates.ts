import type { ProgramTemplate } from '@/types/programTypes';

import { twelveWeekFoundationProgram } from './twelveWeekFoundation/twelveWeekFoundationProgram';

/**
 * Every programme the app knows about.
 *
 * One ships today. The registry exists because the block after this one — see
 * docs/ROADMAP.md — should be a content change and a pull request, not a
 * refactor.
 */
export const allProgramTemplates: ProgramTemplate[] = [twelveWeekFoundationProgram];

/** The programme a new user is put on. */
export const defaultProgramTemplateId = twelveWeekFoundationProgram.programTemplateId;

const programTemplatesById = new Map<string, ProgramTemplate>(
  allProgramTemplates.map((programTemplate) => [
    programTemplate.programTemplateId,
    programTemplate,
  ]),
);

/** Looks a programme up by id. Returns null when there is no such programme. */
export function findProgramTemplateById(programTemplateId: string): ProgramTemplate | null {
  return programTemplatesById.get(programTemplateId) ?? null;
}
