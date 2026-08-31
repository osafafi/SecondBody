# Dashboard (the Today screen)

The screen the app opens on: what is on today, the streak, the daily habit checklist and a
quick weight log.

**Status:** placeholder, with one real thing on it. Built in **M6**.

The session card is the only finished part. M5 built the session player and it has to be
reachable from somewhere, so this screen carries the smallest possible way in: a link to
`#/session`. M6 replaces it with the real briefing — which session is due, whether today is
a training day, and how long since the last one.

Depends on the training content layer (M2) for the session definition, and on the Firebase
repositories (M4) for the streak, habits and weight.
