# Firebase Setup

One-time setup. **Omar has to do most of this himself** — creating projects, enabling auth
providers and clicking through consoles are not things an agent can or should do.

Estimated time: 15 minutes.

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
[DATA_MODEL.md](DATA_MODEL.md#5-what-is-and-is-not-a-secret-here) for the full
explanation. Security comes from the rules in step 5 and the domain restriction in step 6.

## Step 5 — Deploy the security rules

The rules live in `firestore.rules` at the repository root, alongside `firebase.json`
(which points the deploy at that file) and `.firebaserc` (which pins the project id, so
there is no interactive `firebase use --add` step). All three are committed. Deploy them:

```bash
firebase deploy --only firestore:rules
```

The CLI compiles the rules before uploading, so a syntax error fails the deploy rather than
shipping a broken ruleset. A successful run ends with `released rules to cloud.firestore`.

Then verify in the console under **Firestore -> Rules** that the published rules match the
file. Until this succeeds the database is closed, which is the correct failure direction.

**This is the only time you run that command by hand.** From M9 onwards every push to `main`
redeploys the rules from CI, so that what is live and what is in the repository cannot drift
apart — [DEPLOYMENT.md section 6](DEPLOYMENT.md#6-why-the-rules-deploy-from-ci-and-in-that-order).
Step 8 sets that up. Deploying by hand afterwards is not forbidden, but it is pointless: the
next push overwrites it.

## Step 6 — Restrict the authorised domains

This is the step people skip, and it is the one doing real security work.

**Authentication -> Settings -> Authorised domains.** Add your GitHub Pages host:

- `<your-github-username>.github.io`

The finished list has four entries, and that is correct:

| Domain                         | Why it is there                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `localhost`                    | Local development                                                                                                                                                  |
| `<username>.github.io`         | Where the app is actually served                                                                                                                                   |
| `<project-id>.firebaseapp.com` | **Do not delete.** This is the `authDomain` in the config, and it hosts the OAuth redirect handler that Google Sign-In bounces through. Deleting it breaks sign-in |
| `<project-id>.web.app`         | The Firebase Hosting alias. Unused here, and not removable separately                                                                                              |

The console hides the delete icon on the last two on purpose. Neither is a hole: both are
Google-controlled hosts belonging to **this project**, and serving a page from either one
requires access to the project itself. Someone who copies the config out of the public repo
still cannot sign in from their own site, because their domain is not on this list.

Add nothing else. This list is half of the security model — the rules in step 5 are the
other half.

## Step 7 — Check it works

```bash
npm run dev
```

Open the app, sign in with Google, and confirm:

- Sign-in completes and your name appears.
- **Firestore -> Data** in the console shows a `users/{yourUid}` document appear.
- Signing out and back in returns you to the same data.

## Step 8 — Give CI its own credentials

Everything up to here can be done once and forgotten. This step is what lets the deploy
workflow publish the security rules, so that they always match the app that is live.

**Why a key at all.** Deploying rules requires authenticating as something. Your own
`firebase login` session cannot travel to a CI runner, so the runner gets a service account
of its own — narrowly scoped, and revocable without touching your account.

### 8a — Create the service account

In the [Google Cloud console](https://console.cloud.google.com/iam-admin/serviceaccounts),
with the `second-body-osi` project selected:

1. **Create service account**.
2. Name it `github-actions-rules-deployer`. The description is worth filling in — future you
   will want to know what it is for: _"Publishes Firestore security rules from the GitHub
   Actions deploy workflow."_
3. **Grant this service account access to project** -> role **Firebase Rules Admin**
   (`roles/firebaserules.admin`).
4. Add no other role. It needs to publish rules and nothing else — it has no reason to be
   able to read the database, and section 5 of DATA_MODEL.md says so out loud.
5. Done.

### 8b — Create a key

1. Open the service account -> **Keys** tab -> **Add key** -> **Create new key** -> **JSON**.
2. It downloads immediately. **This is the credential.** Do not put it in the repository, do
   not put it in a chat window, and delete it from your downloads folder once step 8c is done.

### 8c — Paste it into GitHub

**Repository -> Settings -> Secrets and variables -> Actions -> New repository secret.**

| Field | Value                                                                   |
| ----- | ----------------------------------------------------------------------- |
| Name  | `FIREBASE_SERVICE_ACCOUNT`                                              |
| Value | The entire contents of the JSON file, pasted verbatim — braces included |

Then delete the downloaded file.

### 8d — Check it

Push anything to `main`, or run the **Deploy** workflow manually from the Actions tab. The
`deploy-firestore-rules` job should end with `released rules to cloud.firestore`. If the
secret is missing the job fails with a message saying exactly that, on purpose — see
[DEPLOYMENT.md section 7](DEPLOYMENT.md#7-the-one-secret-this-repository-needs).

**Keep the pinned CLI version honest.** `.github/workflows/deploy.yml` pins
`firebase-tools@15.22.4` so a CLI release cannot silently change what a deploy does. If you
upgrade your local CLI, bump the pin and the version at the top of this document to match.

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

## What to do if the service account key leaks

This one is a real incident, and it is the only credential this project has.

1. **Google Cloud console -> IAM & Admin -> Service Accounts ->
   `github-actions-rules-deployer` -> Keys -> delete the key.** It stops working
   immediately.
2. Create a new key (step 8b) and update the `FIREBASE_SERVICE_ACCOUNT` secret (step 8c).

Nothing in the app breaks while you do this. The key publishes security rules and can do
nothing else — it cannot read your training data — so the blast radius is that deploys fail
until you replace it. That is the correct failure direction, and it is why the role in step
8a is as narrow as it is.
