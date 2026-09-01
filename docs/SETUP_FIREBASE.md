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
3. **Grant this service account access to project** and add **two** roles:

   | Role                                                               | Why it is needed                                                                                                                                                                                    |
   | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | **Firebase Rules Admin** (`roles/firebaserules.admin`)             | Publishing the ruleset. This is the one doing the actual work                                                                                                                                       |
   | **Service Usage Viewer** (`roles/serviceusage.serviceUsageViewer`) | Before deploying, the Firebase CLI checks that `firestore.googleapis.com` is enabled on the project. That check is a read against the Service Usage API, and Firebase Rules Admin does not grant it |

4. **Add no third role.** Service Usage Viewer is read-only metadata about which Google APIs
   are switched on — it cannot read the database, cannot read your training data and cannot
   change anything. Firebase Rules Admin can publish rules and nothing else. Between them
   that is the whole job.
5. Done.

> **The "Grant this service account access to project" panel in the creation wizard is
> optional and easy to click past.** If you skip it you get a valid service account with no
> permissions at all, and the deploy fails with a 403 that names no permission. After
> finishing, check the roles landed — see "Checking which roles are actually granted" in the
> troubleshooting section. They appear on the IAM page, **not** on the Service Accounts page.

> **If you only granted Firebase Rules Admin**, the deploy fails with
> `403, Permission denied to get service [firestore.googleapis.com]`. That is this exact
> missing role, and adding it is the whole fix — you do not need to recreate the service
> account or the key. See the troubleshooting table.

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

## Troubleshooting the rules deploy

These are failures of the `deploy-firestore-rules` job in Actions, not of the app.

**Read which URL the error names, not just the status code.** Every one of these is a 403,
and the host and path say which permission is short. `serviceusage.googleapis.com` is the
API-enabled precheck; `firebaserules.googleapis.com` is the deploy itself.

| Error in the job log                                                                              | What it means                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `403, Permission denied to get service [firestore.googleapis.com]`                                | The service account is missing **Service Usage Viewer**. The CLI checks Firestore is enabled before deploying, and Firebase Rules Admin does not cover that read. Add the role — step 8a. Nothing needs recreating                                                                                                                                        |
| `403, Permission denied to enable service [...]`                                                  | Different problem: the API genuinely is not switched on, and the account cannot switch it on. Enable it once yourself in the Google Cloud console. Do **not** grant Service Usage Admin to fix this                                                                                                                                                       |
| `firebaserules.googleapis.com/v1/projects/...:test` -> `403, The caller does not have permission` | **Firebase Rules Admin is not on the account.** `:test` is the CLI compiling the rules before uploading, and it is the first call needing a `firebaserules` permission — so this is where a missing role shows up. Note it names no permission at all, which is what an IAM denial looks like here. See "Checking which roles are actually granted" below |
| Any other `403` from `firebaserules.googleapis.com`                                               | Same cause: **Firebase Rules Admin** is missing, or was granted on a different project                                                                                                                                                                                                                                                                    |
| `Failed to get Firebase project` / the project cannot be found                                    | The key belongs to a different project. The job prints the service account and the key's project id before deploying — check that project id reads `second-body-osi`                                                                                                                                                                                      |
| The job fails immediately saying the secret is not set                                            | `FIREBASE_SERVICE_ACCOUNT` is missing or empty — step 8c                                                                                                                                                                                                                                                                                                  |

The job prints which identity it is deploying as before it does anything:

```
Deploying as:   github-actions-rules-deployer@second-body-osi.iam.gserviceaccount.com
Key's project:  second-body-osi
```

If the project id there is not `second-body-osi`, the key belongs to another project and no
amount of role-granting on this one will help.

### Checking which roles are actually granted

**Roles are not shown on the Service Accounts page.** That page proves the account exists,
which is a different question, and it is the usual reason someone is certain they granted a
role that is not there. The roles live on the IAM page:

**Google Cloud console -> IAM & Admin -> [IAM](https://console.cloud.google.com/iam-admin/iam)**,
with `second-body-osi` selected. Find the principal
`github-actions-rules-deployer@second-body-osi.iam.gserviceaccount.com` and read its Role
column. It should say **both**:

- Firebase Rules Admin
- Service Usage Viewer

If either is missing, **Grant access** -> add the role to that principal. Nothing needs
recreating: the key stays valid, and the change takes effect on the next run.

The commonest way to end up one role short is the service account creation wizard. Its
"Grant this service account access to project" panel is optional, it is easy to click
straight past, and doing so creates a perfectly good service account with no permissions at
all.

<details>
<summary>Or from the terminal, if you have the gcloud CLI</summary>

```bash
gcloud projects get-iam-policy second-body-osi   --flatten="bindings[].members"   --filter="bindings.members:github-actions-rules-deployer"   --format="value(bindings.role)"
```

Prints one role per line. Requires an account that can read the project's IAM policy — your
own login, not the service account, which deliberately cannot read it.

</details>

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
