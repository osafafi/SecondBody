import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildMediaFilePathForExercise,
  EXEMPLAR_FILE_NAME,
  EXERCISE_MEDIA_DIRECTORY,
  loadAllExercises,
} from './exerciseMediaContract.mjs';
import { validateExerciseSvgSource } from './validateExerciseSvg.mjs';

/**
 * A file that satisfies every requirement, so each test can break exactly one
 * thing and assert that the validator notices.
 *
 * Without this the tests would only prove that a broken file produces *some*
 * complaint, which a validator that rejected everything would also pass.
 */
const contractSatisfyingSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-labelledby="exerciseMediaTitle">
  <title id="exerciseMediaTitle">Test Movement</title>
  <desc>A figure raising one arm from beside the body to shoulder height, then lowering it.</desc>
  <style>
    .segment { transform-box: view-box; transform-origin: 0 0; }
    .upper-arm { transform: rotate(0deg); }
    .muscle-highlight-primary { opacity: 0.85; }

    @media (prefers-reduced-motion: no-preference) {
      .upper-arm { animation: raiseArm 3s ease-in-out infinite; }

      @keyframes raiseArm {
        0% { transform: rotate(0deg); }
        50% { transform: rotate(-80deg); }
        100% { transform: rotate(0deg); }
      }
    }
  </style>
  <g transform="translate(200,160)">
    <g class="segment upper-arm">
      <rect x="-11" y="-11" width="22" height="90" rx="11" fill="var(--muscle-body-fill, #1C1934)" stroke="var(--muscle-body-stroke, #4A4470)" stroke-width="3" />
      <ellipse class="muscle-highlight-primary" cx="0" cy="34" rx="8" ry="18" fill="var(--muscle-highlight-primary, #A855F7)" stroke="none" />
    </g>
  </g>
</svg>
`;

/** Every failure message, joined, so assertions can look for a phrase. */
function validationReportFor(svgSource) {
  return validateExerciseSvgSource(svgSource).join('\n');
}

describe('validateExerciseSvgSource', () => {
  it('accepts a file that satisfies the whole contract', () => {
    expect(validateExerciseSvgSource(contractSatisfyingSvg)).toEqual([]);
  });

  it('accepts the committed exemplar, which every generated file is asked to match', async () => {
    const exemplarSource = await readFile(
      join(EXERCISE_MEDIA_DIRECTORY, EXEMPLAR_FILE_NAME),
      'utf8',
    );

    expect(validateExerciseSvgSource(exemplarSource)).toEqual([]);
  });

  it('rejects a file that is not well-formed XML', () => {
    expect(validationReportFor('<svg><g></svg>')).toContain('not well-formed XML');
  });

  it('rejects a viewBox that is not the shared canvas', () => {
    const svg = contractSatisfyingSvg.replace('viewBox="0 0 400 400"', 'viewBox="0 0 512 512"');

    expect(validationReportFor(svg)).toContain('Requirement 2');
  });

  it('rejects a width or height on the root element', () => {
    const svg = contractSatisfyingSvg.replace('<svg ', '<svg width="400" height="400" ');
    const report = validationReportFor(svg);

    expect(report).toContain('width="400"');
    expect(report).toContain('height="400"');
  });

  it('rejects a literal hex colour', () => {
    const svg = contractSatisfyingSvg.replace(
      'fill="var(--muscle-body-fill, #1C1934)"',
      'fill="#1C1934"',
    );

    expect(validationReportFor(svg)).toContain('Requirement 3');
  });

  it('rejects a named colour', () => {
    const svg = contractSatisfyingSvg.replace(
      'stroke="var(--muscle-body-stroke, #4A4470)"',
      'stroke="rebeccapurple"',
    );

    expect(validationReportFor(svg)).toContain('rebeccapurple');
  });

  it('rejects an rgb() colour', () => {
    const svg = contractSatisfyingSvg.replace(
      'fill="var(--muscle-body-fill, #1C1934)"',
      'fill="rgb(28, 25, 52)"',
    );

    expect(validationReportFor(svg)).toContain('Requirement 4');
  });

  it('rejects a custom property that no palette defines', () => {
    const svg = contractSatisfyingSvg.replace(
      'var(--muscle-body-fill, #1C1934)',
      'var(--muscle-torso-tint, #1C1934)',
    );

    expect(validationReportFor(svg)).toContain('--muscle-torso-tint');
  });

  it('rejects an approved property paired with the wrong fallback', () => {
    const svg = contractSatisfyingSvg.replace(
      'var(--muscle-body-fill, #1C1934)',
      'var(--muscle-body-fill, #000111)',
    );

    expect(validationReportFor(svg)).toContain('#1C1934');
  });

  it('allows the keyword none, which is an absence of paint rather than a colour', () => {
    const svg = contractSatisfyingSvg.replace(
      'fill="var(--muscle-body-fill, #1C1934)"',
      'fill="none"',
    );

    expect(validateExerciseSvgSource(svg)).toEqual([]);
  });

  it('does not read the description as though it were paint', () => {
    const svg = contractSatisfyingSvg.replace(
      'then lowering it.',
      'then lowering it. The figure stands on a black rubber mat beside a silver rack.',
    );

    expect(validateExerciseSvgSource(svg)).toEqual([]);
  });

  it('rejects SMIL animation', () => {
    const svg = contractSatisfyingSvg.replace(
      '<ellipse class="muscle-highlight-primary"',
      '<animateTransform attributeName="transform" dur="3s" /><ellipse class="muscle-highlight-primary"',
    );

    expect(validationReportFor(svg)).toContain('animateTransform');
  });

  it('rejects a script element', () => {
    const svg = contractSatisfyingSvg.replace('</svg>', '<script>alert(1)</script></svg>');

    expect(validationReportFor(svg)).toContain('<script>');
  });

  it('rejects an external reference', () => {
    const svg = contractSatisfyingSvg.replace(
      '<g transform="translate(200,160)">',
      '<image href="https://example.com/figure.png" /><g transform="translate(200,160)">',
    );
    const report = validationReportFor(svg);

    expect(report).toContain('Requirement 1');
    expect(report).toContain('example.com');
  });

  it('rejects an animation that is not wrapped in the reduced-motion query', () => {
    const svg = contractSatisfyingSvg
      .replace('@media (prefers-reduced-motion: no-preference) {', '')
      .replace('    }\n  </style>', '  </style>');

    expect(validationReportFor(svg)).toContain('Requirement 7');
  });

  it('rejects an animation that does not loop over three seconds', () => {
    const svg = contractSatisfyingSvg.replace('raiseArm 3s', 'raiseArm 1.5s');

    expect(validationReportFor(svg)).toContain('Requirement 6');
  });

  it('rejects an animation that does not repeat forever', () => {
    const svg = contractSatisfyingSvg.replace('3s ease-in-out infinite', '3s ease-in-out');

    expect(validationReportFor(svg)).toContain('animation-iteration-count');
  });

  it('rejects a file with nothing animated at all', () => {
    const svg = contractSatisfyingSvg.replace(
      '.upper-arm { animation: raiseArm 3s ease-in-out infinite; }',
      '',
    );

    expect(validationReportFor(svg)).toContain('not an exercise animation');
  });

  it('rejects a stroke width that is neither a body outline nor equipment', () => {
    const svg = contractSatisfyingSvg.replace('stroke-width="3"', 'stroke-width="1.5"');

    expect(validationReportFor(svg)).toContain('Requirement 8');
  });

  it('rejects a file that highlights no muscle', () => {
    const svg = contractSatisfyingSvg.replace(
      'fill="var(--muscle-highlight-primary, #A855F7)"',
      'fill="var(--muscle-body-fill, #1C1934)"',
    );

    expect(validationReportFor(svg)).toContain('Requirement 10');
  });

  it('rejects a missing title, description or accessible name', () => {
    const withoutTitle = contractSatisfyingSvg.replace(
      '<title id="exerciseMediaTitle">Test Movement</title>',
      '',
    );
    const withoutDescription = contractSatisfyingSvg.replace(
      /<desc>[\s\S]*?<\/desc>/,
      '<desc>Arm.</desc>',
    );
    const withoutRole = contractSatisfyingSvg.replace(' role="img"', '');

    expect(validationReportFor(withoutTitle)).toContain('Requirement 11');
    expect(validationReportFor(withoutDescription)).toContain('Requirement 11');
    expect(validationReportFor(withoutRole)).toContain('Requirement 12');
  });

  it('rejects aria-labelledby that points at nothing', () => {
    const svg = contractSatisfyingSvg.replace('id="exerciseMediaTitle"', 'id="somethingElse"');

    expect(validationReportFor(svg)).toContain('Requirement 12');
  });

  it('rejects an XML comment', () => {
    const svg = contractSatisfyingSvg.replace('<title', '<!-- drawn by hand --><title');

    expect(validationReportFor(svg)).toContain('Requirement 14');
  });

  it('rejects a file over the size budget', () => {
    const padding = ' '.repeat(13 * 1024);
    const svg = contractSatisfyingSvg.replace('<desc>', `${padding}<desc>`);

    expect(validationReportFor(svg)).toContain('Requirement 13');
  });
});

/**
 * The same check CI runs, run again by `npm run verify`.
 *
 * The generator cannot write a file that breaks the contract, but a person
 * editing one by hand can — section 10 of the specification explicitly allows
 * hand-written animations. This is what stops one being committed.
 */
describe('every committed exercise animation', () => {
  it('satisfies the contract', async () => {
    const fileNames = (await readdir(EXERCISE_MEDIA_DIRECTORY)).filter((fileName) =>
      fileName.endsWith('.svg'),
    );

    const reportsByFileName = {};

    for (const fileName of fileNames) {
      const source = await readFile(join(EXERCISE_MEDIA_DIRECTORY, fileName), 'utf8');
      const failures = validateExerciseSvgSource(source);

      if (failures.length > 0) {
        reportsByFileName[fileName] = failures;
      }
    }

    expect(reportsByFileName).toEqual({});
  });
});

/**
 * The one thing the validator cannot check on its own, because it needs the
 * training content to know the answer.
 *
 * Requirement 10 asks for both a primary and a secondary highlight. The
 * validator only insists on the primary, because plenty of exercises genuinely
 * have no secondary muscle group. Whether a given file *should* have one is a
 * question about that exercise, so it is asked here instead — and a generated
 * file that quietly ignored half its brief fails the build rather than teaching
 * an incomplete picture.
 */
describe('a generated animation against its exercise definition', () => {
  it('highlights a secondary muscle exactly when the exercise has one', async () => {
    const exercises = await loadAllExercises();
    const disagreements = [];

    for (const exercise of exercises) {
      const source = await readFile(
        buildMediaFilePathForExercise(exercise.exerciseId),
        'utf8',
      ).catch(() => null);

      if (source === null) {
        continue;
      }

      const highlightsSecondary = source.includes('--muscle-highlight-secondary');
      const hasSecondaryMuscles = exercise.secondaryMuscleGroups.length > 0;

      if (highlightsSecondary !== hasSecondaryMuscles) {
        disagreements.push(
          `${exercise.exerciseId}: content lists ${exercise.secondaryMuscleGroups.length} ` +
            `secondary muscle groups, the drawing ` +
            `${highlightsSecondary ? 'does' : 'does not'} highlight one`,
        );
      }
    }

    expect(disagreements).toEqual([]);
  });
});
