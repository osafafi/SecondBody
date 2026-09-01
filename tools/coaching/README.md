# The coaching export

Pulls everything the app knows about your training into one JSON file, so a conversation about
it can happen somewhere an LLM already is.

```bash
gcloud auth application-default login   # once, ever
npm run coach:export
```

The file lands in `.coaching/`, named for the day it was built —
`coaching-bundle-2026-09-01.json`. That directory is gitignored, and that is the point rather
than an afterthought: a bundle is body weight, every session and every journal entry, which is
exactly what [CLAUDE.md](../../CLAUDE.md) rule 2 exists to keep out of a public repository.

## What it needs from you

One thing, once: `gcloud auth application-default login`. The script then authenticates **as
you**, using Application Default Credentials.

**There is deliberately no service account key for this.** The only credential this project has
is a GitHub Actions secret scoped to publishing security rules, and it cannot read the database
— see [DATA_MODEL.md section 5](../../docs/DATA_MODEL.md#5-what-is-and-is-not-a-secret-here).
Adding a second key that could read everything, and leaving it on a laptop, would be a much
bigger credential than the one this project was careful about. ADC has no file to leak and
nothing new to revoke.

If the login has expired the script fails with Google's own message about credentials. Run the
`gcloud` line again.

## Which account

Nothing, normally. This is a single-user application, so with no arguments the script lists the
accounts in Firebase Auth and uses the only one.

If there is more than one, it says so and stops:

```bash
npm run coach:export -- --user-id <uid>
npm run coach:export -- --email <address>
```

## The same file, two ways

Settings has a **Download my training data** button that produces the identical file on a phone.

That is not a coincidence and it is not maintained by hand. Both callers read Firestore their
own way — the app with the web SDK, this script with `firebase-admin` — and then hand what they
read to `assembleCoachingBundle` in `src/domain/`, asking `findCoachingContentFacts` for the
content half. Everything after the read is one pure function, so the two files match to the
byte. `coachingBundleAssembly.test.ts` pins the half of that claim a test can reach: the same
stored documents always produce the same bytes.

## How a `.mjs` script imports TypeScript

Through Vite. `ssrLoadModule` resolves the `@/` alias and strips the types, so this script loads
`src/domain/` and `src/services/repositories/*DocumentMapping.ts` directly.

The mapping modules import no Firebase at all — they recognise a stored timestamp by it having
a `toDate()` method rather than by `instanceof Timestamp`, which was done in M4 to make them
unit testable and turns out to be exactly what lets an admin-SDK document go through the same
translation the app uses.

The alternative was a second copy of the bundle shape written in JavaScript. That copy would
have started identical and drifted, which is the whole failure this design avoids. It costs
about a second of Vite start-up and no new dependency.

## What is duplicated, and why

The **queries** are written out again here rather than reused, because a Node process has no
browser to sign in with and cannot use `src/services/repositories/`. Each query in
`readStoredCoachingData` mirrors the repository function it copies, named in a comment above
it. If one of those repositories changes its ordering or its field, the line here has to change
with it.

The limits are not duplicated: they come from `COACHING_EXPORT_LIMITS` in
`src/domain/coachingBundleAssembly.ts`, so the two callers cannot read different windows.

## Reading the bundle

The `coach-review` skill in `.claude/skills/` does this — it finds the newest bundle, reads it,
and knows what is in it. Ask Claude Code to review your training and it will pick the skill up.
