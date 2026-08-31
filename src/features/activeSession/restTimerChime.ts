/**
 * The two notes that say the rest is over.
 *
 * Synthesised rather than played from a file, because it is two sine tones and
 * shipping an audio asset for that would be 30 kB of download and a licence to
 * think about. `UserSettings.shouldPlayRestTimerSound` decides whether it is
 * reached at all.
 *
 * Everything here fails silently. A browser that blocks audio, a device on
 * silent, or an `AudioContext` that will not start is not worth interrupting a
 * session over — the timer is on the screen either way.
 */

/** A short two-note rise. Long enough to notice, short enough not to annoy. */
const FIRST_NOTE_HERTZ = 660;
const SECOND_NOTE_HERTZ = 880;
const NOTE_DURATION_SECONDS = 0.12;
const PEAK_GAIN = 0.18;

let sharedAudioContext: AudioContext | null = null;

/**
 * One `AudioContext` for the whole session.
 *
 * Browsers cap how many a page may create, and creating one per rest would run
 * a session straight into that. Created lazily, so a session with the sound
 * switched off never makes one at all.
 */
function resolveAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return null;
  }

  sharedAudioContext ??= new window.AudioContext();

  return sharedAudioContext;
}

function playNote(audioContext: AudioContext, frequencyHertz: number, startAt: number): void {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequencyHertz;

  // Ramped rather than switched, because a square-edged gain change is an
  // audible click on most speakers.
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(PEAK_GAIN, startAt + 0.01);
  gain.gain.linearRampToValueAtTime(0, startAt + NOTE_DURATION_SECONDS);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + NOTE_DURATION_SECONDS);
}

/** Plays the chime, or does nothing at all if it cannot. */
export function playRestFinishedChime(): void {
  try {
    const audioContext = resolveAudioContext();

    if (!audioContext) {
      return;
    }

    /*
     * Suspended is the normal state until the page has had a user gesture.
     * Starting a session is one, so by the time a rest ends this resolves.
     */
    void audioContext.resume().catch(() => {
      // Nothing to do. The visual timer is the real one.
    });

    playNote(audioContext, FIRST_NOTE_HERTZ, audioContext.currentTime);
    playNote(audioContext, SECOND_NOTE_HERTZ, audioContext.currentTime + NOTE_DURATION_SECONDS);
  } catch {
    // Audio is a nicety. Never let it break a session.
  }
}
