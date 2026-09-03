/**
 * The copyright notice the dataset's exercise animations are used under.
 *
 * It covers the files whose `mediaSource` is `gymVisualDataset`, which is most
 * of them. The rest were generated for this app and are its own — see
 * `exerciseMediaMatches.ts`.
 *
 * **This is a licence condition, not a courtesy.** Those animations come from
 * `hasaneyldrm/exercises-dataset`, whose media is the property of Gym Visual and
 * is redistributed there with permission on two terms: that it stays at 180×180,
 * and that every use carries this notice. Removing it from the interface breaks
 * the terms the files are used under.
 *
 * It lives here rather than inline in a component so there is one place to
 * change if the source of the media ever changes, and so it is impossible to
 * ship the animations without shipping the notice.
 *
 * See `public/exercise-media/ATTRIBUTION.md` and docs/EXERCISE_MEDIA_SPEC.md
 * section 2.
 */
export const exerciseMediaAttribution = {
  /** The notice itself, exactly as the dataset's own records carry it. */
  noticeText: '© Gym visual',

  /** Who the media belongs to. */
  rightsHolderName: 'Gym visual',

  rightsHolderUrl: 'https://gymvisual.com/',

  /** Where this app got the files, which is not the same as who owns them. */
  datasetName: 'hasaneyldrm/exercises-dataset',

  datasetUrl: 'https://github.com/hasaneyldrm/exercises-dataset',
} as const;
