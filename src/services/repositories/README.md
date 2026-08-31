# Repositories

The only place in the application that talks to Firestore.

Features call these. Features never call `firebase/firestore` themselves - that is the rule
in CLAUDE.md section 3, and it is what keeps the storage shape changeable without hunting
through screens.

## The split, and why it exists

Each collection has two files, and the division is the point:

| File                  | Contains                                          | Tested          |
| --------------------- | ------------------------------------------------- | --------------- |
| `*DocumentMapping.ts` | Translating documents to and from the app's types | Yes, thoroughly |
| `*Repository.ts`      | The Firestore calls themselves                    | No              |

CLAUDE.md section 5 says not to test Firebase, and to test the repositories' translation
logic with fakes instead. So everything with a decision in it lives in the mapping files,
which import no Firebase and can be handed a plain object literal. What is left in the
repository files is a `getDoc` and a `setDoc` with nothing to get wrong.

`firestoreDocumentReading.ts` is the shared machinery underneath the mappings. It recognises
a Firestore timestamp by it having a `toDate()` method rather than by `instanceof Timestamp`,
which is what keeps the whole mapping layer free of a Firebase import.

## Strict or lenient, on purpose

The mappings do not treat every field the same way, and the difference is deliberate:

- **Closed, load-bearing unions are strict.** A `workoutSessions` document with a status of
  `paused` is a bug, not a degraded session, so reading one throws with the document id in
  the message.
- **Vocabulary lists are lenient.** An equipment id that content has since renamed is dropped
  from the profile rather than throwing. Locking Omar out of his own app over a machine that
  got renamed would be a poor trade.
- **Stored preferences are the most lenient of all.** A missing _or_ unrecognised value falls
  back to its default, because a later release both adds new preferences and renames the
  options of existing ones - and a release that bricks the app until every document is
  migrated is a bad release.

## Nulls are answers

An unmeasured waist and a 0 cm waist are different facts. So are an unanswered step count and
a day spent on the sofa. Every optional number here is stored and read as `null` rather than
defaulted to zero, because the charts average these and a defaulted zero drags a trend line
down while looking exactly like data.

## Queries are single-field

Every query is either a `where` or an `orderBy`, never both. Firestore indexes single-field
queries automatically; a composite index has to be declared and deployed, and `firebase.json`
deliberately ships rules only. If a screen ever genuinely needs a composite query, that is
the moment to add `firestore.indexes.json` - not before.

## Paths

`userCollectionPaths.ts` builds every path. A collection name appears as a string in exactly
one place, because a typo in a path does not fail - Firestore reads happily from a collection
nothing has ever written to and reports no documents.
