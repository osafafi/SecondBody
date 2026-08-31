import { describe, expect, it } from 'vitest';

import { allCoachLines, findCoachLinesByCategory } from './allCoachLines';
import { selectCoachLine } from '@/domain/coachLineSelection';
import { COACH_LINE_CATEGORIES } from '@/types/coachVoiceTypes';

/**
 * Integrity tests for Harout's voice.
 *
 * Two of these are worth more than the rest: that every moment has something to
 * say at the quietest verbosity setting, so the app never falls silent where it
 * should speak; and that praise only exists in the two places where praise has
 * actually been earned, so it keeps meaning something.
 */

/** The only moments where a praise line is legitimate. */
const CATEGORIES_WHERE_PRAISE_IS_EARNED = ['loadIncreased', 'sessionCompleted'];

describe('the coach line registry', () => {
  it('gives every line a unique id', () => {
    const coachLineIds = allCoachLines.map((coachLine) => coachLine.coachLineId);

    expect(new Set(coachLineIds).size).toBe(coachLineIds.length);
  });

  it('names every line after the category it belongs to', () => {
    for (const coachLine of allCoachLines) {
      expect(coachLine.coachLineId).toMatch(new RegExp(`^${coachLine.category}\\.`));
    }
  });

  it('writes lines short enough to read mid-set', () => {
    for (const coachLine of allCoachLines) {
      expect(coachLine.text.length, `line "${coachLine.coachLineId}"`).toBeGreaterThan(10);
      expect(coachLine.text.length, `line "${coachLine.coachLineId}"`).toBeLessThanOrEqual(220);
    }
  });
});

describe('every moment the coach speaks at', () => {
  it.each(COACH_LINE_CATEGORIES)('has something written for "%s"', (category) => {
    expect(findCoachLinesByCategory(category).length).toBeGreaterThan(0);
  });

  it.each(COACH_LINE_CATEGORIES)(
    'has something to say at minimal verbosity for "%s"',
    (category) => {
      const selected = selectCoachLine({
        candidateLines: findCoachLinesByCategory(category),
        configuredVerbosity: 'minimal',
        rotationIndex: 0,
        mayUsePraise: true,
      });

      expect(selected).not.toBeNull();
    },
  );

  it.each(COACH_LINE_CATEGORIES)(
    'can stay factual without reaching for praise for "%s"',
    (category) => {
      const selected = selectCoachLine({
        candidateLines: findCoachLinesByCategory(category),
        configuredVerbosity: 'minimal',
        rotationIndex: 0,
        mayUsePraise: false,
      });

      expect(selected).not.toBeNull();
    },
  );

  it('offers more than one line wherever it will be heard repeatedly', () => {
    // Anything said after a set is heard several times a session. One line there
    // would stop sounding like a person very quickly.
    const repeatedCategories = ['setFeltEasy', 'setFeltJustRight', 'setFeltBrutal'] as const;

    for (const category of repeatedCategories) {
      expect(findCoachLinesByCategory(category).length, category).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('praise is earned and rationed', () => {
  it('only exists where something was actually achieved', () => {
    const categoriesWithPraise = new Set(
      allCoachLines
        .filter((coachLine) => coachLine.isPraise)
        .map((coachLine) => coachLine.category),
    );

    expect([...categoriesWithPraise].sort()).toEqual([...CATEGORIES_WHERE_PRAISE_IS_EARNED].sort());
  });

  it('is never the only thing available in its category', () => {
    for (const category of CATEGORIES_WHERE_PRAISE_IS_EARNED) {
      const linesInCategory = allCoachLines.filter((coachLine) => coachLine.category === category);
      const nonPraiseLines = linesInCategory.filter((coachLine) => !coachLine.isPraise);

      expect(nonPraiseLines.length, category).toBeGreaterThan(0);
    }
  });

  it('never praises a load coming down or a session being missed', () => {
    const categoriesThatMustNotPraise = [
      'setFeltBrutal',
      'sharpPainReported',
      'loadReduced',
      'sessionMissed',
      'returningFromLayoff',
    ];

    for (const category of categoriesThatMustNotPraise) {
      const praiseLines = allCoachLines.filter(
        (coachLine) => coachLine.category === category && coachLine.isPraise,
      );

      expect(praiseLines, category).toEqual([]);
    }
  });
});

describe('the week 1 calibration instruction', () => {
  it('is written out in full, because it is quoted verbatim in the training document', () => {
    const calibrationLine = findCoachLinesByCategory('calibrationInstruction').find(
      (coachLine) => coachLine.coachLineId === 'calibrationInstruction.findTheStartingLine',
    );

    expect(calibrationLine?.text).toContain('about 15 reps');
    expect(calibrationLine?.text).toContain('stop at 12');
    expect(calibrationLine?.text).toContain('starting line');
  });
});
