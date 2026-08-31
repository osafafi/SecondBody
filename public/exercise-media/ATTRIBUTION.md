# Exercise animation attribution

The `.gif` files in this directory were **not made for this project**. They are copied from
the open [`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset)
collection, and they belong to Gym Visual.

> **© Gym visual — https://gymvisual.com/**

## The terms

That dataset's own [NOTICE](https://github.com/hasaneyldrm/exercises-dataset/blob/main/NOTICE.md)
splits its licensing in two. The MIT licence covers the code, the structure and the
instruction text. It explicitly **does not** cover the media in `images/` and `videos/`,
which is Gym Visual's property, redistributed there with separate written permission on two
conditions:

| Condition   | What it means here                                                                      |
| ----------- | ----------------------------------------------------------------------------------------- |
| Resolution  | 180×180 only. The files here are copied byte-for-byte and nothing resizes or re-encodes them |
| Attribution | Every use carries the notice above. It ships in the app, from `src/content/exerciseMedia/exerciseMediaAttribution.ts` |

The dataset's notice is explicit that cloning it is not itself a licence, and that anyone
using the media should read
[Gym Visual's terms](https://gymvisual.com/content/3-terms-and-conditions-of-use) and obtain
their own licence where required.

**This repository is public.** Committing these files here is redistribution, which is the
thing those terms govern. That is a decision for Omar to make knowingly rather than something
to inherit by accident — it is written down here so it cannot be inherited by accident.

## Everything else in the pipeline

Which animation belongs to which exercise is this project's own work, and it is MIT-licensed
along with the rest of the repository. It lives in
[`src/content/exerciseMedia/exerciseMediaMatches.ts`](../../src/content/exerciseMedia/exerciseMediaMatches.ts),
with the reasoning attached to each row.

The nine exercises with no honest match have no file here at all. They draw a "No preview
yet" fallback that the app renders itself.

See [docs/EXERCISE_MEDIA_SPEC.md](../../docs/EXERCISE_MEDIA_SPEC.md) for the whole pipeline.
