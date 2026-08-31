/**
 * Reading typed values out of an untyped Firestore document.
 *
 * Firestore hands back `DocumentData`, which is `Record<string, unknown>` in a
 * hat. Casting that straight to `UserProfile` would make the type system lie:
 * the compiler would believe every field is present and correctly typed, and the
 * first thing anyone would learn otherwise is a screen rendering `undefined`.
 *
 * So every field is read through a check that either produces the right type or
 * throws saying exactly which field on which document was wrong. That is not
 * paranoia about Firestore — it is about **our own** older writes. A document
 * written before a field existed is the normal case in an app that is still
 * being built, and the failure should name the field.
 *
 * **No Firebase import.** A Firestore timestamp is recognised by having a
 * `toDate()` method rather than by `instanceof Timestamp`, which keeps this
 * module and every mapping built on it unit testable without initialising an app
 * — the same reason `popupSignInFallback.ts` sits apart from the auth service.
 */

/** `YYYY-MM-DD`, and a real date rather than `2026-13-45`. */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsedTime = Date.parse(`${value}T00:00:00Z`);

  if (Number.isNaN(parsedTime)) {
    return false;
  }

  // Date.parse accepts 2026-02-31 and rolls it forward, so round-trip it.
  return new Date(parsedTime).toISOString().slice(0, 10) === value;
}

/**
 * Converts a stored instant to a `Date`, or null when it is not one.
 *
 * Accepts a Firestore timestamp (anything with `toDate()`) and a `Date`. The
 * second case matters because Firestore's local cache can hand back a value
 * written in this same session before the server has confirmed it.
 */
export function readInstantOrNull(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== 'object' || value === null || !('toDate' in value)) {
    return null;
  }

  const { toDate } = value as { toDate: unknown };

  if (typeof toDate !== 'function') {
    return null;
  }

  const convertedValue: unknown = (toDate as () => unknown).call(value);

  if (!(convertedValue instanceof Date) || Number.isNaN(convertedValue.getTime())) {
    return null;
  }

  return convertedValue;
}

export type DocumentReader = {
  requiredString: (fieldName: string) => string;
  optionalString: (fieldName: string) => string | null;
  requiredNumber: (fieldName: string) => number;
  optionalNumber: (fieldName: string) => number | null;
  requiredBoolean: (fieldName: string) => boolean;
  optionalBoolean: (fieldName: string) => boolean | null;
  requiredIsoDate: (fieldName: string) => string;
  optionalIsoDate: (fieldName: string) => string | null;
  requiredInstant: (fieldName: string) => Date;
  optionalInstant: (fieldName: string) => Date | null;
  stringArray: (fieldName: string) => string[];
  numberArray: (fieldName: string) => number[];
  objectArray: (fieldName: string) => Record<string, unknown>[];
  requiredMemberOf: <TMember extends string>(
    fieldName: string,
    allowedValues: readonly TMember[],
  ) => TMember;
  optionalMemberOf: <TMember extends string>(
    fieldName: string,
    allowedValues: readonly TMember[],
  ) => TMember | null;
  recognisedMemberOf: <TMember extends string>(
    fieldName: string,
    allowedValues: readonly TMember[],
  ) => TMember | null;
};

/**
 * Builds a reader bound to one document.
 *
 * `documentLabel` is the collection path as a person would say it —
 * `'profile/current'`, `'workoutSessions/{id}'` — and it is the difference
 * between "expected a number" and knowing where to look.
 */
export function createDocumentReader(documentLabel: string, documentData: unknown): DocumentReader {
  const fields: Record<string, unknown> =
    typeof documentData === 'object' && documentData !== null
      ? (documentData as Record<string, unknown>)
      : {};

  const fail = (fieldName: string, expectation: string): never => {
    throw new Error(
      `${documentLabel} is missing or malformed: "${fieldName}" ${expectation}, got ${describeValue(fields[fieldName])}.`,
    );
  };

  /** Firestore has no `undefined`, so both absent forms mean the same thing. */
  const isAbsent = (fieldName: string): boolean =>
    fields[fieldName] === undefined || fields[fieldName] === null;

  const requiredString = (fieldName: string): string => {
    const value = fields[fieldName];

    return typeof value === 'string' ? value : fail(fieldName, 'should be a string');
  };

  const requiredNumber = (fieldName: string): number => {
    const value = fields[fieldName];

    return typeof value === 'number' && Number.isFinite(value)
      ? value
      : fail(fieldName, 'should be a finite number');
  };

  const requiredIsoDate = (fieldName: string): string => {
    const value = requiredString(fieldName);

    return isValidIsoDate(value) ? value : fail(fieldName, 'should be an ISO date (YYYY-MM-DD)');
  };

  const requiredInstant = (fieldName: string): Date => {
    const instant = readInstantOrNull(fields[fieldName]);

    return instant ?? fail(fieldName, 'should be a timestamp');
  };

  const requiredBoolean = (fieldName: string): boolean => {
    const value = fields[fieldName];

    return typeof value === 'boolean' ? value : fail(fieldName, 'should be a boolean');
  };

  const requiredMemberOf = <TMember extends string>(
    fieldName: string,
    allowedValues: readonly TMember[],
  ): TMember => {
    const value = requiredString(fieldName);

    return (allowedValues as readonly string[]).includes(value)
      ? (value as TMember)
      : fail(fieldName, `should be one of ${allowedValues.join(', ')}`);
  };

  return {
    requiredString,
    requiredNumber,
    requiredBoolean,
    requiredIsoDate,
    requiredInstant,
    requiredMemberOf,

    optionalString: (fieldName) => (isAbsent(fieldName) ? null : requiredString(fieldName)),
    optionalNumber: (fieldName) => (isAbsent(fieldName) ? null : requiredNumber(fieldName)),
    optionalBoolean: (fieldName) => (isAbsent(fieldName) ? null : requiredBoolean(fieldName)),
    optionalIsoDate: (fieldName) => (isAbsent(fieldName) ? null : requiredIsoDate(fieldName)),
    optionalInstant: (fieldName) => (isAbsent(fieldName) ? null : requiredInstant(fieldName)),

    optionalMemberOf: (fieldName, allowedValues) =>
      isAbsent(fieldName) ? null : requiredMemberOf(fieldName, allowedValues),

    /*
     * Null for a value that is absent OR unrecognised, where `optionalMemberOf`
     * throws on the second case.
     *
     * The difference is whether an unrecognised value is a bug or a fact of
     * life. For a workout session's status it is a bug and should be heard
     * about. For a stored preference it is what happens when a later release
     * renames one of its own options, and falling back to the default is better
     * than a release that bricks the app until every document is migrated.
     */
    recognisedMemberOf: (fieldName, allowedValues) => {
      const value = fields[fieldName];

      return typeof value === 'string' && (allowedValues as readonly string[]).includes(value)
        ? (value as (typeof allowedValues)[number])
        : null;
    },

    stringArray: (fieldName) => {
      const value = fields[fieldName];

      if (value === undefined || value === null) {
        return [];
      }

      if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
        return fail(fieldName, 'should be an array of strings');
      }

      return value as string[];
    },

    numberArray: (fieldName) => {
      const value = fields[fieldName];

      if (value === undefined || value === null) {
        return [];
      }

      if (
        !Array.isArray(value) ||
        value.some((entry) => typeof entry !== 'number' || !Number.isFinite(entry))
      ) {
        return fail(fieldName, 'should be an array of finite numbers');
      }

      return value as number[];
    },

    objectArray: (fieldName) => {
      const value = fields[fieldName];

      if (value === undefined || value === null) {
        return [];
      }

      if (
        !Array.isArray(value) ||
        value.some((entry) => typeof entry !== 'object' || entry === null || Array.isArray(entry))
      ) {
        return fail(fieldName, 'should be an array of objects');
      }

      return value as Record<string, unknown>[];
    },
  };
}

/** Short, safe rendering of a bad value for an error message. */
function describeValue(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (Array.isArray(value)) {
    return `an array of ${String(value.length)}`;
  }

  if (typeof value === 'object') {
    return 'an object';
  }

  if (typeof value === 'string') {
    return `the string "${value}"`;
  }

  return `the ${typeof value} ${String(value)}`;
}
