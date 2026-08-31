import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { summariseDailyHabits, summariseRecentHabitCompliance } from '@/domain/habitCompliance';
import { buildEmptyDailyHabitRecord, type DailyHabitRecord } from '@/types/dailyTrackingTypes';

import { DailyHabitChecklistPanel } from './DailyHabitChecklistPanel';

/**
 * The checklist is the one panel in the app somebody touches every day, and the
 * interactions it owns are worth protecting: a tick has to reach the caller, a
 * typed number must not save itself, and an untouched day must not be shown as a
 * day where five things went wrong.
 *
 * What was *met* is not tested here — `habitCompliance.test.ts` owns that, and
 * this passes the real summariser rather than a hand-built one so the two cannot
 * drift apart.
 */

const DAILY_STEP_TARGET = 6000;
const NIGHTLY_SLEEP_TARGET_HOURS = 7;

function renderChecklist(recordChanges: Partial<DailyHabitRecord> = {}, onHabitAnswered = vi.fn()) {
  const todayHabitRecord: DailyHabitRecord = {
    ...buildEmptyDailyHabitRecord('2026-09-10', new Date('2026-09-10T20:00:00Z')),
    ...recordChanges,
  };

  const habitDay = {
    record: todayHabitRecord,
    dailyStepTarget: DAILY_STEP_TARGET,
    nightlySleepTargetHours: NIGHTLY_SLEEP_TARGET_HOURS,
  };

  render(
    <DailyHabitChecklistPanel
      todayHabitRecord={todayHabitRecord}
      todaySummary={summariseDailyHabits(habitDay)}
      dailyStepTarget={DAILY_STEP_TARGET}
      streakLength={0}
      recentCompliance={summariseRecentHabitCompliance([habitDay])}
      coachLine={null}
      isSaving={false}
      saveErrorMessage={null}
      onHabitAnswered={onHabitAnswered}
    />,
  );

  return { onHabitAnswered };
}

describe('the daily habit checklist', () => {
  it('lists all five habits', () => {
    renderChecklist();

    /*
     * Each name appears twice — once as a row, once in the "Why these five"
     * disclosure — so this asserts on the rows themselves rather than on the
     * text, which would be ambiguous.
     */
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.getByRole('checkbox', { name: /Protein/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /No liquid calories/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Desk Undo/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Steps/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Sleep/ })).toBeInTheDocument();
  });

  /*
   * The distinction the panel exists to keep. A day opened at breakfast has not
   * gone wrong; it has not happened.
   */
  it('says nothing has been ticked rather than showing nought out of five', () => {
    renderChecklist();

    expect(screen.getByText('Nothing ticked yet today')).toBeInTheDocument();
  });

  it('counts what has been done once the day has been touched', () => {
    renderChecklist({ didHitProteinTarget: true, stepCount: 7000 });

    expect(screen.getByText('2 of 5 today')).toBeInTheDocument();
  });

  it('shows the step target it was given rather than a fixed one', () => {
    renderChecklist();

    expect(screen.getByText(/6,000 steps/)).toBeInTheDocument();
  });

  it('reports a tick to the caller', async () => {
    const user = userEvent.setup();
    const { onHabitAnswered } = renderChecklist();

    await user.click(screen.getByRole('checkbox', { name: /Protein/ }));

    expect(onHabitAnswered).toHaveBeenCalledWith({ didHitProteinTarget: true });
  });

  it('reports a habit being unticked, because a mis-tap has to be undoable', async () => {
    const user = userEvent.setup();
    const { onHabitAnswered } = renderChecklist({ didAvoidLiquidCalories: true });

    await user.click(screen.getByRole('checkbox', { name: /No liquid calories/ }));

    expect(onHabitAnswered).toHaveBeenCalledWith({ didAvoidLiquidCalories: false });
  });

  /*
   * A typed number must not save itself. The confirm button is what stops a
   * half-typed "8" from being recorded as eight steps on the way to eight
   * thousand.
   */
  it('offers no confirm button until a number has actually changed', () => {
    renderChecklist();

    expect(screen.queryByRole('button', { name: /Save steps/ })).not.toBeInTheDocument();
  });

  it('saves a typed number only when it is confirmed', async () => {
    const user = userEvent.setup();
    const { onHabitAnswered } = renderChecklist();

    await user.type(screen.getByRole('textbox', { name: /Steps/ }), '8200');

    expect(onHabitAnswered).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Save steps/ }));

    expect(onHabitAnswered).toHaveBeenCalledWith({ stepCount: 8200 });
  });

  it('shows a failed save rather than pretending the tick landed', () => {
    render(
      <DailyHabitChecklistPanel
        todayHabitRecord={buildEmptyDailyHabitRecord('2026-09-10', new Date())}
        todaySummary={summariseDailyHabits({
          record: buildEmptyDailyHabitRecord('2026-09-10', new Date()),
          dailyStepTarget: DAILY_STEP_TARGET,
          nightlySleepTargetHours: NIGHTLY_SLEEP_TARGET_HOURS,
        })}
        dailyStepTarget={DAILY_STEP_TARGET}
        streakLength={0}
        recentCompliance={summariseRecentHabitCompliance([])}
        coachLine={null}
        isSaving={false}
        saveErrorMessage="Could not reach the server."
        onHabitAnswered={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Could not reach the server.');
  });
});
