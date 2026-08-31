# Authentication

The only screen anybody sees while signed out.

Everything the app knows about Omar lives behind a Google account, so there is nothing
useful to show before sign-in and no guest mode to fall back to.

## What is built

- **`SignInScreen`** - fully working. One button, Google only. Shows a coach line from the
  `signInWelcome` category and whatever error message the last attempt produced.

## What lives elsewhere

This feature is deliberately thin. Almost all of the authentication work sits outside it,
because features may not import from each other and several other places need it:

| Concern                                    | Where it lives                                        |
| ------------------------------------------ | ----------------------------------------------------- |
| Sign in, sign out, watching the session    | `src/services/auth/googleAuthenticationService.ts`    |
| Popup-versus-redirect fallback rule        | `src/services/auth/popupSignInFallback.ts`            |
| Turning error codes into sentences         | `src/services/auth/authenticationErrorMessages.ts`    |
| Who is signed in, as React state           | `src/app/AuthenticationProvider.tsx`                  |
| Reading that state from a screen           | `src/app/useAuthentication.ts`                        |
| Standing in front of the signed-in screens | `src/app/AuthenticationGate.tsx`                      |
| The wait-a-moment screen both gates use    | `src/components/PendingScreen/PendingScreen.tsx`      |
| Creating `users/{userId}`                  | `src/services/repositories/userDocumentRepository.ts` |

The sign-out control is not here either - it is in Settings, next to the account it signs
out of, as `src/features/settings/components/SignedInAccountPanel.tsx`.

Signing in is not the last gate. `src/app/OnboardingGate.tsx` sits inside this one and holds
a signed-in user at `src/features/onboarding/` until a profile exists.

## Notes

The welcome line is fixed at `standard` verbosity with a rotation index of `0`. Both are
placeholders with the same cause: verbosity is a user setting, settings live in Firestore,
and on this screen there is nobody to load them for. When M8 adds a settings repository,
this screen can read the real value.

Coach copy is never inlined into the JSX here. The lines live in
`src/content/coachVoice/authenticationCoachLines.ts` like every other thing Harout says -
see CLAUDE.md section 7.
