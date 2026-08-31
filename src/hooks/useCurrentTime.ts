import { useEffect, useState } from 'react';

/** Once a second is the finest a rest timer is ever read at. */
const ONE_SECOND_IN_MILLISECONDS = 1000;

/**
 * The current time, re-read on an interval for as long as the component is
 * mounted.
 *
 * Everything in `src/domain/` takes `now` as an argument rather than reading a
 * clock — that is what makes "what happens when the phone sleeps through the
 * whole rest" a test. Something still has to read the real one, and this is it:
 * the single place a component turns the passage of time into a re-render.
 *
 * It re-reads the clock rather than counting its own ticks, so a timer stays
 * correct through a backgrounded tab, where intervals are throttled to whatever
 * the browser feels like.
 *
 * **Mount it only where the time is actually being shown.** There is no "off"
 * switch on purpose: the first reading is taken as the component mounts, which
 * is what makes a rest timer correct on its very first frame, and it re-renders
 * whatever is holding it once a second — which is a reason to hold it in a small
 * component rather than in a screen.
 */
export function useCurrentTime(intervalMilliseconds: number = ONE_SECOND_IN_MILLISECONDS): Date {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, intervalMilliseconds);

    return () => {
      clearInterval(intervalId);
    };
  }, [intervalMilliseconds]);

  return currentTime;
}
