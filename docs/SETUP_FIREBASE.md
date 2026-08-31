# Firebase Setup

One-time setup. **Omar has to do most of this himself** — creating projects, enabling auth
providers and clicking through consoles are not things an agent can or should do.

Estimated time: 10 minutes.

---

## Before you start

The Firebase CLI is already installed and signed in on this machine:

```bash
firebase --version      # 15.22.4
firebase login:list     # safadi.omar5@gmail.com
```

There is already an unrelated project on this account (`collectivekhatma`). We are
deliberately **not** reusing it — separate apps get separate projects so their security
rules and data can never affect each other.

---

## Step 1 — Create the project

In the [Firebase console](https://console.firebase.google.com/):

1. **Add project**.
2. Name it `second-body`. Accept the generated project id (it may get a suffix if the name
   is taken — note down whatever it becomes).
3. **Disable Google Analytics.** It is not needed and it adds a consent obligation for no
   benefit here.
4. Create.

<details>
<summary>Or from the terminal</summary>

```bash
firebase projects:create second-body --display-name "second body"
```

You still have to do steps 2 and 3 in the console, because enabling an auth provider has no
CLI equivalent.
</details>

## Step 2 — Turn on Google Sign-In

1. **Build -> Authentication -> Get started**.
2. **Sign-in method** tab -> **Google** -> enable.
3. Set the support email to your own address.
4. Save.

Google Sign-In is the only provider. There is no email/password, no anonymous auth. One
person uses this app.

## Step 3 — Create the Firestore database

1. **Build -> Firestore Database -> Create database**.
2. **Start in production mode.** Our own rules get deployed in step 5 and are stricter than
   the test-mode defaults, which expire after 30 days and would silently break the app.
3. Pick the region closest to you. **This cannot be changed later.**

## Step 4 — Register the web app and copy the config

1. **Project settings** (gear icon) -> **Your apps** -> **Web** (`</>`).
2. Nickname: `second-body-web`. Do **not** tick "Also set up Firebase Hosting" — we deploy
   to GitHub Pages.
3. Copy the `firebaseConfig` object it shows you.
4. Paste the values into `src/services/firebase/firebaseConfiguration.ts`.

**Yes, these values get committed to a public repository, and that is fine.** They are
identifiers, not secrets — see
[DATA_MODEL.md](DATA_MODEL.md#5-why-the-firebase-config-is-not-a-secret) for the full
explanation. Security comes from the rules in step 5 and the domain restriction in step 6.

## Step 5 — Deploy the security rules

The rules live in `firestore.rules` in this repository. Deploy them:

```bash
firebase use --add            # select the second-body project, alias it "default"
firebase deploy --only firestore:rules
```

Then verify in the console under **Firestore -> Rules** that the published rules match the
file. Until this succeeds the database is closed, which is the correct failure direction.

## Step 6 — Restrict the authorised domains

This is the step people skip, and it is the one doing real security work.

**Authentication -> Settings -> Authorised domains.** The list should contain only:

- `localhost`
- `<your-github-username>.github.io`

**Delete anything else**, including the default `*.firebaseapp.com` and `*.web.app` entries
if you are not using Firebase Hosting. With this list locked down, someone who copies the
config out of the public repo still cannot sign in from their own site.

## Step 7 — Check it works

```bash
npm run dev
```

Open the app, sign in with Google, and confirm:

- Sign-in completes and your name appears.
- **Firestore -> Data** in the console shows a `users/{yourUid}` document appear.
- Signing out and back in returns you to the same data.

---

## Troubleshooting

| Symptom                               | Cause                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `auth/unauthorized-domain`            | The domain you are on is not in the step 6 list                                             |
| `Missing or insufficient permissions` | Rules were not deployed (step 5), or you are signed out                                     |
| `auth/popup-blocked`                  | Browser blocked the popup. The app falls back to redirect sign-in                           |
| Data appears then vanishes            | You are signed in as a different Google account than before                                 |
| Nothing writes, no error shown        | Check the browser console — Firestore rule denials are logged there, not surfaced in the UI |

## What to do if the config leaks somewhere it should not

Nothing urgent. Confirm the step 6 authorised-domain list is still correct and that the
step 5 rules are published. Those two things are the entire security model, and neither is
weakened by the config being public.

If a **service account key** ever leaks, that is a real incident: revoke it immediately in
the Google Cloud console. This app does not use one and should never need one.
