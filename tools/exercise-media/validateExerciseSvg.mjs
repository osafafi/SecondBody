#!/usr/bin/env node

/**
 * Enforces the contract in docs/EXERCISE_MEDIA_SPEC.md section 3.
 *
 * The point of this script is that consistency across three dozen generated
 * files cannot rest on asking a language model nicely. Every requirement in the
 * contract that a machine can check is checked here, the failure messages name
 * the requirement number, and CI runs it on every push — so a file that breaks
 * the contract cannot merge. The generator runs it too, before writing
 * anything, so a broken asset never reaches disk in the first place.
 *
 *   node tools/exercise-media/validateExerciseSvg.mjs                 # everything
 *   node tools/exercise-media/validateExerciseSvg.mjs legExtension    # one file
 */

import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { argv, exit } from 'node:process';
import { fileURLToPath } from 'node:url';

import { JSDOM } from 'jsdom';

import {
  APPROVED_CUSTOM_PROPERTIES,
  APPROVED_STROKE_WIDTHS,
  EXERCISE_MEDIA_DIRECTORY,
  MAXIMUM_FILE_SIZE_BYTES,
  REQUIRED_ANIMATION_DURATION,
  REQUIRED_VIEW_BOX,
} from './exerciseMediaContract.mjs';

/** SVG elements that would pull in something the file does not contain. */
const FORBIDDEN_ELEMENT_NAMES = ['script', 'image', 'foreignObject', 'metadata', 'a'];

/** SMIL. Requirement 5 says the animation is CSS, and only CSS. */
const SMIL_ELEMENT_NAMES = ['animate', 'animateTransform', 'animateMotion', 'set', 'mpath'];

/** Attributes whose value is a paint, and therefore must be an approved `var()`. */
const PAINT_ATTRIBUTE_NAMES = ['fill', 'stroke', 'stop-color', 'color', 'flood-color'];

/** CSS properties whose value is a colour, checked inside the `<style>` block. */
const COLOR_DECLARATION_NAMES = [
  'fill',
  'stroke',
  'color',
  'background',
  'background-color',
  'stop-color',
  'flood-color',
];

/**
 * Every CSS named colour, so that `fill="rebeccapurple"` is caught as firmly as
 * `fill="#663399"`. Requirement 4 forbids all three spellings of a literal.
 */
const CSS_NAMED_COLORS = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue
   blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk
   crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki
   darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
   darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue
   dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite
   gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
   lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
   lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
   lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen
   magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen
   mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream
   mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid
   palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum
   powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown
   seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen
   steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow
   yellowgreen`
    .split(/\s+/)
    .filter(Boolean),
);

/** Paint keywords that are not colours, so they carry no palette obligation. */
const NON_COLOR_PAINT_KEYWORDS = new Set(['none', 'inherit']);

const APPROVED_CUSTOM_PROPERTY_NAMES = Object.keys(APPROVED_CUSTOM_PROPERTIES);

const sharedDom = new JSDOM();
const xmlParser = new sharedDom.window.DOMParser();

/**
 * `var(--muscle-body-fill, #1C1934)` and nothing else. The fallback is required
 * so the file still reads correctly outside the app — in a diff viewer, or in
 * the operating system's file preview, where no palette has been applied.
 */
const APPROVED_PAINT_PATTERN = /^var\(\s*(--[a-z-]+)\s*,\s*(#[0-9A-Fa-f]{3,8})\s*\)$/;

function describeApprovedPaint(customPropertyName) {
  const fallback = APPROVED_CUSTOM_PROPERTIES[customPropertyName];

  return `var(${customPropertyName}, ${fallback})`;
}

function checkPaintValue(value, whereItWasFound, failures) {
  const trimmedValue = value.trim();

  if (NON_COLOR_PAINT_KEYWORDS.has(trimmedValue)) {
    return;
  }

  const match = APPROVED_PAINT_PATTERN.exec(trimmedValue);

  if (!match) {
    failures.push(
      `Requirement 3: ${whereItWasFound} is "${trimmedValue}". Every colour must be ` +
        `written as var(--approved-property, #fallback), or be the keyword "none".`,
    );

    return;
  }

  const [, customPropertyName, fallback] = match;

  if (!APPROVED_CUSTOM_PROPERTY_NAMES.includes(customPropertyName)) {
    failures.push(
      `Requirement 3: ${whereItWasFound} uses ${customPropertyName}, which no palette ` +
        `defines. Spec section 4 lists the seven that exist: ` +
        `${APPROVED_CUSTOM_PROPERTY_NAMES.join(', ')}.`,
    );

    return;
  }

  const expectedFallback = APPROVED_CUSTOM_PROPERTIES[customPropertyName];

  if (fallback.toUpperCase() !== expectedFallback.toUpperCase()) {
    failures.push(
      `Requirement 3: ${whereItWasFound} falls back to ${fallback}, but section 4 pairs ` +
        `${customPropertyName} with ${expectedFallback}. Use ` +
        `${describeApprovedPaint(customPropertyName)}.`,
    );
  }
}

/**
 * Removes every approved `var()` call from the source, so that the leftover text
 * can be scanned for literal colours without the sanctioned fallbacks — which
 * are literal colours — tripping the check.
 */
function removeApprovedPaintCalls(source) {
  return source.replace(/var\(\s*--[a-z-]+\s*,\s*#[0-9A-Fa-f]{3,8}\s*\)/g, 'var()');
}

/**
 * Blanks out the prose in `<title>` and `<desc>`.
 *
 * The literal-colour scan runs over the whole file, and a description is
 * ordinary English — "rests on the black rubber mat" would otherwise be reported
 * as a palette violation. The requirement is about colours the file *draws*
 * with, not about words it contains.
 */
function removeAccessibleTextContent(source) {
  return source.replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/g, '<$1></$1>');
}

function checkForLiteralColors(source, failures) {
  const sourceWithoutApprovedPaints = removeApprovedPaintCalls(removeAccessibleTextContent(source));

  const hexLiterals = sourceWithoutApprovedPaints.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? [];

  for (const hexLiteral of new Set(hexLiterals)) {
    failures.push(
      `Requirement 4: the literal colour ${hexLiteral} appears outside a var() fallback.`,
    );
  }

  const functionalLiterals =
    sourceWithoutApprovedPaints.match(/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g) ?? [];

  for (const functionalLiteral of new Set(functionalLiterals)) {
    failures.push(
      `Requirement 4: the colour function ${functionalLiteral}) appears outside a ` +
        `var() fallback.`,
    );
  }

  const words = sourceWithoutApprovedPaints.match(/\b[a-z]{3,20}\b/g) ?? [];

  for (const word of new Set(words)) {
    if (CSS_NAMED_COLORS.has(word)) {
      failures.push(`Requirement 4: the named colour "${word}" appears in the file.`);
    }
  }
}

function collectStyleText(rootElement) {
  return [...rootElement.getElementsByTagName('style')]
    .map((element) => element.textContent)
    .join('\n');
}

function findMediaQueryBlockRanges(styleText, mediaQueryPrefix) {
  const ranges = [];
  let searchFrom = 0;

  for (;;) {
    const queryStart = styleText.indexOf(mediaQueryPrefix, searchFrom);

    if (queryStart === -1) {
      return ranges;
    }

    const blockStart = styleText.indexOf('{', queryStart);

    if (blockStart === -1) {
      return ranges;
    }

    let depth = 0;

    for (let index = blockStart; index < styleText.length; index += 1) {
      if (styleText[index] === '{') {
        depth += 1;
      } else if (styleText[index] === '}') {
        depth -= 1;

        if (depth === 0) {
          ranges.push({ start: queryStart, end: index });
          break;
        }
      }
    }

    searchFrom = blockStart + 1;
  }
}

const REDUCED_MOTION_QUERY = '@media (prefers-reduced-motion: no-preference)';

function checkStyleBlock(styleText, failures) {
  if (styleText.trim() === '') {
    failures.push(
      'Requirement 5: there is no <style> element. The animation must be CSS @keyframes ' +
        'declared inside the file.',
    );

    return;
  }

  if (!styleText.includes('@keyframes')) {
    failures.push('Requirement 5: the <style> block declares no @keyframes.');
  }

  if (!styleText.includes(REDUCED_MOTION_QUERY)) {
    failures.push(
      `Requirement 7: the file has no "${REDUCED_MOTION_QUERY}" block. Every animation ` +
        'must sit inside one, so the figure holds its start position when motion is reduced.',
    );

    return;
  }

  const reducedMotionRanges = findMediaQueryBlockRanges(styleText, REDUCED_MOTION_QUERY);
  const isInsideReducedMotionBlock = (index) =>
    reducedMotionRanges.some((range) => index > range.start && index < range.end);

  const animationDeclarationPattern = /animation(?:-name)?\s*:\s*([^;}]+)/g;
  let animationDeclarationCount = 0;
  let match;

  while ((match = animationDeclarationPattern.exec(styleText)) !== null) {
    animationDeclarationCount += 1;

    const declarationValue = match[1].trim();

    if (!isInsideReducedMotionBlock(match.index)) {
      failures.push(
        `Requirement 7: the declaration "animation: ${declarationValue}" sits outside the ` +
          'reduced-motion media query, so it would still run for someone who has asked ' +
          'for less motion.',
      );
    }

    if (!declarationValue.includes(REQUIRED_ANIMATION_DURATION)) {
      failures.push(
        `Requirement 6: "animation: ${declarationValue}" does not loop over ` +
          `${REQUIRED_ANIMATION_DURATION}. Every exercise animation runs on the same clock.`,
      );
    }

    if (!declarationValue.includes('infinite')) {
      failures.push(
        `Requirement 6: "animation: ${declarationValue}" is not set to ` +
          'animation-iteration-count: infinite.',
      );
    }
  }

  if (animationDeclarationCount === 0) {
    failures.push(
      'Requirement 6: nothing in the file is animated. A still figure is not an ' +
        'exercise animation.',
    );
  }

  const declarationPattern = /([-a-zA-Z]+)\s*:\s*([^;{}]+)/g;
  let declaration;

  while ((declaration = declarationPattern.exec(styleText)) !== null) {
    const [, propertyName, propertyValue] = declaration;

    if (COLOR_DECLARATION_NAMES.includes(propertyName)) {
      checkPaintValue(propertyValue, `the CSS declaration "${propertyName}"`, failures);
    }
  }
}

function checkRootElement(rootElement, failures) {
  const viewBox = rootElement.getAttribute('viewBox');

  if (viewBox !== REQUIRED_VIEW_BOX) {
    failures.push(
      `Requirement 2: viewBox is ${viewBox === null ? 'missing' : `"${viewBox}"`}, and must ` +
        `be exactly "${REQUIRED_VIEW_BOX}". Every animation shares one canvas so they are ` +
        'interchangeable wherever the app draws one.',
    );
  }

  for (const attributeName of ['width', 'height']) {
    if (rootElement.hasAttribute(attributeName)) {
      failures.push(
        `Requirement 2: the root <svg> carries ${attributeName}="${rootElement.getAttribute(
          attributeName,
        )}". It must have neither, so the component sizes it.`,
      );
    }
  }

  if (rootElement.getAttribute('role') !== 'img') {
    failures.push('Requirement 12: the root <svg> is missing role="img".');
  }

  const labelledBy = rootElement.getAttribute('aria-labelledby');
  const titleElements = [...rootElement.getElementsByTagName('title')];
  const descriptionElements = [...rootElement.getElementsByTagName('desc')];

  if (titleElements.length === 0) {
    failures.push('Requirement 11: the file has no <title> element.');
  } else if (titleElements[0].textContent.trim() === '') {
    failures.push('Requirement 11: the <title> element is empty.');
  }

  if (descriptionElements.length === 0) {
    failures.push('Requirement 11: the file has no <desc> element.');
  } else if (descriptionElements[0].textContent.trim().length < 20) {
    failures.push(
      'Requirement 11: the <desc> is too short to describe the movement to someone who ' +
        'cannot see it.',
    );
  }

  if (labelledBy === null) {
    failures.push('Requirement 12: the root <svg> is missing aria-labelledby.');
  } else if (!titleElements.some((element) => element.getAttribute('id') === labelledBy)) {
    failures.push(
      `Requirement 12: aria-labelledby points at "${labelledBy}", but no <title> has that id.`,
    );
  }
}

function checkElements(rootElement, failures) {
  const allElements = [rootElement, ...rootElement.getElementsByTagName('*')];
  let usesPrimaryHighlight = false;

  for (const element of allElements) {
    const elementName = element.tagName;

    if (FORBIDDEN_ELEMENT_NAMES.includes(elementName)) {
      failures.push(
        `Requirement 1: the file contains a <${elementName}> element. A generated ` +
          'animation is self-contained markup and nothing else.',
      );
    }

    if (SMIL_ELEMENT_NAMES.includes(elementName)) {
      failures.push(
        `Requirement 5: the file animates with <${elementName}>. SMIL is not used here — ` +
          'the animation must be CSS @keyframes.',
      );
    }

    for (const attribute of element.attributes) {
      const attributeName = attribute.name;
      const attributeValue = attribute.value;

      if (PAINT_ATTRIBUTE_NAMES.includes(attributeName)) {
        checkPaintValue(attributeValue, `<${elementName} ${attributeName}="…">`, failures);
      }

      if (attributeName === 'stroke-width' && !APPROVED_STROKE_WIDTHS.includes(attributeValue)) {
        failures.push(
          `Requirement 8: <${elementName}> has stroke-width="${attributeValue}". Body ` +
            'outlines are 3 and equipment is 2, so that every animation has the same ' +
            'weight of line.',
        );
      }

      if (
        (attributeName === 'href' || attributeName.endsWith(':href')) &&
        !attributeValue.startsWith('#')
      ) {
        failures.push(
          `Requirement 1: ${attributeName}="${attributeValue}" reaches outside the file.`,
        );
      }

      if (attributeValue.includes('--muscle-highlight-primary')) {
        usesPrimaryHighlight = true;
      }
    }
  }

  if (!usesPrimaryHighlight) {
    failures.push(
      'Requirement 10: nothing in the file uses --muscle-highlight-primary. The whole ' +
        'point of the drawing is to show which muscle is working.',
    );
  }
}

function checkRawSource(source, failures) {
  if (source.includes('<!--')) {
    failures.push('Requirement 14: the file contains an XML comment.');
  }

  if (/@import|url\(\s*['"]?(?:https?:)?\/\//.test(source)) {
    failures.push('Requirement 1: the file references something outside itself.');
  }

  const byteLength = Buffer.byteLength(source, 'utf8');

  if (byteLength > MAXIMUM_FILE_SIZE_BYTES) {
    failures.push(
      `Requirement 13: the file is ${byteLength} bytes, over the ` +
        `${MAXIMUM_FILE_SIZE_BYTES} byte limit. A whole session's worth of these loads on ` +
        'gym wifi.',
    );
  }
}

/**
 * Checks one file's contents against the contract.
 *
 * Returns the list of failures, most structural first. An empty list means the
 * file satisfies every requirement a machine can check — section 8 of the
 * specification covers the ones only a person can.
 */
export function validateExerciseSvgSource(source) {
  const document = xmlParser.parseFromString(source, 'image/svg+xml');
  const rootElement = document.documentElement;

  if (
    rootElement.tagName === 'parsererror' ||
    rootElement.getElementsByTagName('parsererror').length > 0
  ) {
    return [`Requirement 1: the file is not well-formed XML. ${rootElement.textContent.trim()}`];
  }

  if (rootElement.tagName !== 'svg') {
    return [`Requirement 1: the root element is <${rootElement.tagName}>, not <svg>.`];
  }

  const failures = [];

  checkRootElement(rootElement, failures);
  checkElements(rootElement, failures);
  checkStyleBlock(collectStyleText(rootElement), failures);
  checkForLiteralColors(source, failures);
  checkRawSource(source, failures);

  return failures;
}

async function validateFile(filePath) {
  const source = await readFile(filePath, 'utf8');

  return { filePath, failures: validateExerciseSvgSource(source) };
}

async function listEveryMediaFile() {
  const fileNames = await readdir(EXERCISE_MEDIA_DIRECTORY);

  return fileNames
    .filter((fileName) => fileName.endsWith('.svg'))
    .sort()
    .map((fileName) => join(EXERCISE_MEDIA_DIRECTORY, fileName));
}

async function main() {
  const requestedNames = argv.slice(2);

  const filePaths =
    requestedNames.length === 0
      ? await listEveryMediaFile()
      : requestedNames.map((name) =>
          join(EXERCISE_MEDIA_DIRECTORY, name.endsWith('.svg') ? name : `${name}.svg`),
        );

  if (filePaths.length === 0) {
    console.log('No exercise animations to validate yet.');

    return;
  }

  const results = [];

  for (const filePath of filePaths) {
    try {
      results.push(await validateFile(filePath));
    } catch (error) {
      results.push({
        filePath,
        failures: [`The file could not be read: ${error.message}`],
      });
    }
  }

  const failedResults = results.filter((result) => result.failures.length > 0);

  for (const result of failedResults) {
    console.error(`\n${basename(result.filePath)}`);

    for (const failure of result.failures) {
      console.error(`  - ${failure}`);
    }
  }

  const passedCount = results.length - failedResults.length;

  if (failedResults.length === 0) {
    console.log(`All ${passedCount} exercise animations satisfy the contract.`);

    return;
  }

  console.error(
    `\n${failedResults.length} of ${results.length} files break the contract in ` +
      'docs/EXERCISE_MEDIA_SPEC.md section 3.',
  );

  exit(1);
}

const wasRunDirectly = argv[1] !== undefined && fileURLToPath(import.meta.url) === argv[1];

if (wasRunDirectly) {
  await main();
}
