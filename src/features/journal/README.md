# Journal

Free text, written during the week, stored exactly as it was written.

**Status:** built in **M10**.

## What this is for

It is the capture half of something Omar asked for during M7: being able to write things down
in the app as they happen, then open Claude Code at home and have the context already there to
talk about them.

**The app does not get an LLM.** There is no server, no API key that could survive in a public
static site, and no cost. The app becomes the memory instead. The other half of that idea is
`src/domain/coachingBundle.ts`, the download button in Settings, and `npm run coach:export` —
see [tools/coaching/README.md](../../../tools/coaching/README.md).

## The three rules this screen exists to keep

1. **Stored verbatim.** Trimmed at the ends, because leading whitespace is a textarea artefact.
   Never anywhere else. The line breaks are how the person wrote it, and the whole value of the
   collection is that it is the raw thing rather than a summary somebody made on the way in.
   The list renders it with `white-space: pre-wrap` for the same reason.
2. **Append only.** There is no edit control and no delete control, and that is the design
   rather than an omission — an entry is a record of what somebody thought on a day, and an
   edit would rewrite the history a coaching review reads. If a note turns out to be wrong, the
   honest fix is another note saying so.
3. **Nothing gets in the way.** The text box is first and it is big. Every other field has a
   working default, so a note about today, about nothing in particular, is one tap and a
   paragraph. Nothing is validated while typing — a form that turns red halfway through a
   sentence about a sore knee is a form that teaches you not to write sentences about sore
   knees.

## Where the screen lives

At `/journal`, inside the app shell, and **not in the bottom navigation**. Four targets across
a phone is comfortable and five is fiddly, which is the note already sitting on
`BottomNavigation`. The way in is `JournalPromptPanel` on Today.

That panel reads nothing. Today is the most-opened screen in the app and already makes two
round trips before it can draw anything; a count of journal entries on it would be a third read
to render a number nobody needs.

## The one write in this app that is not optimistic

Every other write in the app applies on screen first and rolls back on failure — a checkbox
that waits for a round trip gets pressed twice. This one waits.

The difference is what a rollback costs. A tick that rolls back has cost nobody anything. A
paragraph that appears in the list and then vanishes because the write failed has thrown away
something that only existed in the person's head. So `useJournal` keeps what was typed until
Firestore has taken it, and the composer only empties once the entry has actually landed.

## Tagging

An entry can name a session, a movement, both or neither, and most name neither.

The movement list is drawn from the selected session when there is one, and from every recent
session when there is not — because "my knee clicks on leg press" is a fact about a movement
rather than about one afternoon, which is why `buildJournalEntryToStore` allows an exercise tag
with no session behind it.

Changing the session clears the movement, rather than silently storing a tag the new session
does not contain.

## What is not here

`reviewStatus` is written on every entry and **nothing sets it to `reviewed`**. That is
deliberate: storing what a coaching review concluded is the write-back half of this idea and it
is not scheduled — see the M10 section of [docs/PROGRESS.md](../../../docs/PROGRESS.md). The
field is written from the first entry anyway, because adding it later would mean backfilling
every document that predates it, and `readJournalEntriesAwaitingReview` already reads it.
