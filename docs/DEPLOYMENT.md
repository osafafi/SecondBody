# Deployment

The app is a pile of static files served by GitHub Pages, built by GitHub Actions on every
push to `main`.

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
  build (npm ci, npm run verify, npm run build)
        |
        v
  GitHub Pages  -->  https://<username>.github.io/second-body/
```

## 2. Git conventions

**Claude never pushes and never opens pull requests.** Work happens on a local feature
branch; Omar handles everything involving a remote. This is stated in
[CLAUDE.md](../CLAUDE.md) and it is not negotiable.

|                   |                                                                                 |
| ----------------- | ------------------------------------------------------------------------------- |
| Branch naming     | `feat/<milestone-slug>` — see the milestone table in [PROGRESS.md](PROGRESS.md) |
| One branch        | One milestone. Never mix two                                                    |
| Before committing | `npm run verify` must pass                                                      |
| Commit messages   | Imperative mood, explain **why** in the body when it is not obvious             |

## 3. One-time GitHub setup (Omar)

1. Create a public repository named `second-body`.
2. Add it as a remote and push `main`:
   ```bash
   git remote add origin https://github.com/<username>/second-body.git
   git push -u origin main
   ```
3. **Settings -> Pages -> Source: GitHub Actions.** Not "Deploy from a branch" — the
   workflow in this repo uses the Actions deployment path.
4. Add the Pages domain to Firebase's authorised domains — see
   [SETUP_FIREBASE.md](SETUP_FIREBASE.md) step 6. **Sign-in will fail until you do this.**

## 4. Why the build does not know the repository name

`vite.config.ts` sets `base: './'`, so all asset URLs in the built `index.html` are
relative. The app works from `https://user.github.io/second-body/`, from a custom domain, or
from `npm run preview` on `localhost`, with no configuration and no rebuild.

Combined with `HashRouter` (see [ARCHITECTURE.md](ARCHITECTURE.md#7-routing)) this removes
the two things that normally make a React SPA annoying to host on GitHub Pages: the sub-path
and the 404-on-refresh.

## 5. The workflow

`.github/workflows/deploy.yml` runs on push to `main`:

1. `npm ci`
2. `npm run verify` — type-check, lint, test. **A failing test blocks the deploy.**
3. `node tools/exercise-media/verifyExerciseMedia.mjs` — a missing exercise animation
   blocks the deploy too.
4. `npm run build`
5. Upload `dist/` and deploy to Pages.

`.github/workflows/ci.yml` runs the same checks on pull requests, without deploying — so a
pull request shows green or red before it is merged.

## 6. Installing it on your phone

There is no app store step. Once it is deployed:

**iOS (Safari):** open the Pages URL -> Share -> Add to Home Screen.
**Android (Chrome):** open the URL -> menu -> Add to Home screen / Install app.

`index.html` and the web manifest set it to launch full-screen with no browser chrome, so it
behaves like a native app. During an active session the app also holds a
[screen wake lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) so
the phone does not sleep between sets.

## 7. Rolling back

Pages serves whatever the last successful workflow run produced. To roll back, revert the
commit on `main` and push — the workflow redeploys the earlier state. There is no separate
deployment history to manage.

## 8. Local checks before pushing

```bash
npm run verify     # type-check + lint + test
npm run build      # production build
npm run preview    # serve dist/ exactly as Pages will
```

`npm run preview` is worth doing before a deploy that touches routing or assets — it is the
only local check that exercises the real relative-path setup.
