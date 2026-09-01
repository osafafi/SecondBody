# Deployment

The app is a pile of static files served by GitHub Pages, built by GitHub Actions on every
push to `main`.

**It is live at https://osafafi.github.io/SecondBody/**, and the one-time setup in section 3
is done. That section is kept as a rebuild guide, not as a to-do list.

---

## 1. The flow

```
  feature branch                 (Claude commits here, locally)
        |
        |  Omar pushes, opens a pull request, reviews it
        v
      main
        |
        |  .github/workflows/deploy.yml
        v
  build            npm ci, format, typecheck, lint, test, verify media,
        |          verify icons, npm run build
        |
        v
  deploy rules     firebase deploy --only firestore:rules
        |
        v
  deploy pages     GitHub Pages  -->  https://osafafi.github.io/SecondBody/
```

**The rules and the app are one release.** They deploy from the same workflow run and the
same commit, in that order, and section 6 explains why the order is that way round.

## 2. Git conventions

**Claude never pushes and never opens pull requests.** Work happens on a local feature
branch; Omar handles everything involving a remote. This is stated in
[CLAUDE.md](../CLAUDE.md) and it is not negotiable.

|                   |                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------- |
| Branch naming     | `feat/<slug>` for new behaviour, `fix/<slug>` for a defect, `docs/<slug>` for paperwork |
| One branch        | One item from [FEEDBACK.md](FEEDBACK.md). Never mix two                                 |
| Before committing | `npm run verify` must pass                                                              |
| Commit messages   | Imperative mood, explain **why** in the body when it is not obvious                     |

## 3. One-time GitHub setup — done

**All five steps below have been performed.** They are kept because this is how the project
is stood up again if it ever has to be, not because anything here is outstanding. Do not ask
Omar to do any of it.

| #   | Step                                                                                                                             | Value it ended up with                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | Create a public repository                                                                                                       | `osafafi/SecondBody`                            |
| 2   | Add it as a remote and push `main`                                                                                               | `https://github.com/osafafi/SecondBody.git`     |
| 3   | **Settings -> Pages -> Source: GitHub Actions.** Not "Deploy from a branch" — the workflow here uses the Actions deployment path | Serving `https://osafafi.github.io/SecondBody/` |
| 4   | Add the Pages domain to Firebase's authorised domains — [SETUP_FIREBASE.md](SETUP_FIREBASE.md) step 6                            | `osafafi.github.io`                             |
| 5   | Add the `FIREBASE_SERVICE_ACCOUNT` secret — [SETUP_FIREBASE.md](SETUP_FIREBASE.md) step 8                                        | Set. See section 7                              |

**The repository name is `SecondBody` and the Pages path is therefore `/SecondBody/`**, with
that capitalisation. The npm package is still `second-body` and the Firebase project is still
`second-body-osi`; none of the three has to match, and the build does not know any of them —
see section 4.

## 4. Why the build does not know the repository name

`vite.config.ts` sets `base: './'`, so all asset URLs in the built `index.html` are
relative. The app works from `https://osafafi.github.io/SecondBody/`, from a custom domain, or
from `npm run preview` on `localhost`, with no configuration and no rebuild.

Combined with `HashRouter` (see [ARCHITECTURE.md](ARCHITECTURE.md#7-routing)) this removes
the two things that normally make a React SPA annoying to host on GitHub Pages: the sub-path
and the 404-on-refresh.

## 5. The workflow

`.github/workflows/deploy.yml` runs on push to `main`, as three jobs that each depend on the
one before it. Nothing is deployed until everything has been checked.

**Job 1 — `build`.** `npm ci`, then formatting, type-check, lint, tests, the exercise media
verifier, the app icon verifier, and `npm run build`. **Any failure here stops the entire
release, rules included.** The built `dist/` is uploaded as the Pages artifact.

**Job 2 — `deploy-firestore-rules`.** `firebase deploy --only firestore:rules`, against the
project id in `.firebaserc`. The CLI compiles the rules before uploading, so a syntax error
fails here — and because this job runs before Pages, a broken ruleset stops the whole
release rather than half of it.

**Job 3 — `deploy-pages`.** Publishes the artifact job 1 built.

`.github/workflows/ci.yml` runs the same checks on pull requests, without deploying — so a
pull request shows green or red before it is merged.

The workflow is `concurrency: deploy-production` with **`cancel-in-progress: false`**. A
second push waits rather than killing the first. A cancelled deploy is one of the ways the
rules and the app come apart: rules released, app not.

## 6. Why the rules deploy from CI, and in that order

The security rules used to be deployed by hand, from a laptop, with `firebase deploy`. That
is how the two halves drift: the ruleset live on the project stops matching the ruleset in
the commit that is live, nobody can tell by looking, and the symptom is a permission denied
mid-session in a gym.

So the rules deploy from the same run as the app, and three details make that guarantee
hold.

**They deploy on every push, not only when `firestore.rules` changed.** Redeploying an
identical ruleset is a no-op, and conditioning on the diff would reintroduce exactly the
drift this exists to prevent — most obviously when somebody edits the rules in the Firebase
console. `main` always wins.

**Rules go before Pages.** A new app version that needs a permission must never meet the old
ruleset. Rule changes are almost always additive — a new collection gets a new rule — and an
additive rule deployed a minute early is harmless to the version still live.

**The exception, which needs two releases.** A rules change that _removes_ a permission the
live app still uses will break it for the seconds between the two jobs, and for longer if the
Pages deploy fails. When you are tightening a rule rather than adding one: ship the app
change first, let it go out, then ship the rules change. This is rare enough not to be worth
automating and dangerous enough to be worth writing down.

**What is not guaranteed.** Two deploys cannot be atomic. If job 2 succeeds and job 3 fails,
the rules are ahead of the app until the next successful run. That direction is the safe one,
and it is why the order is what it is.

## 7. The one secret this repository needs

Deploying rules from CI needs credentials, which means one GitHub Actions secret:

| Secret                     | What it is                                                           |
| -------------------------- | -------------------------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT` | The full JSON of a Google Cloud service account key, pasted verbatim |

Creating it is [SETUP_FIREBASE.md](SETUP_FIREBASE.md) step 8. It is the only secret in the
repository, and the only credential this project has ever had — see
[DATA_MODEL.md section 5](DATA_MODEL.md#5-what-is-and-is-not-a-secret-here) for what it can
do and what protects it.

The workflow writes it to a file on the runner's temporary disk through an environment
variable, so the key never appears on a command line, and deletes the file afterwards. If
the secret is missing the deploy **fails** with a message pointing at the setup step, rather
than skipping the rules and shipping the app against whatever happens to be live.

## 8. Installing it on your phone

There is no app store step. Once it is deployed:

**iOS (Safari):** open the Pages URL -> Share -> Add to Home Screen.
**Android (Chrome):** open the URL -> menu -> Add to Home screen / Install app.

`index.html` and `public/manifest.webmanifest` set it to launch full-screen with no browser
chrome, in portrait, so it behaves like a native app. During an active session the app also
holds a
[screen wake lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) so
the phone does not sleep between sets.

The icons are generated from code rather than committed as artwork — see
[tools/appIcon/README.md](../tools/appIcon/README.md). Seven files cover the three ways
platforms crop an icon, and `npm run icons:verify` fails the build if the committed files
stop matching the artwork.

**Everything in the manifest is a relative path, and `id` is deliberately absent.** `id`
resolves against the _origin_ rather than the manifest URL, so setting it to `./` on a
GitHub Pages site would claim `https://osafafi.github.io/` — the whole account, shared with
every other project hosted there. Omitting it makes it default to `start_url`, which resolves
to `/SecondBody/` and is unique.

## 9. Rolling back

Pages serves whatever the last successful workflow run produced. To roll back, revert the
commit on `main` and push — the workflow redeploys the earlier state. There is no separate
deployment history to manage.

## 10. Local checks before pushing

```bash
npm run verify     # type-check + lint + test
npm run build      # production build
npm run preview    # serve dist/ exactly as Pages will
```

`npm run verify` covers the icons too: the test suite runs the same check
`npm run icons:verify` does, so a regenerated-icon omission fails before the commit rather
than in CI.

`npm run preview` is worth doing before a deploy that touches routing or assets — it is the
only local check that exercises the real relative-path setup.
