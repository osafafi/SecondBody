# The Training Programme

This is the specification that `src/content/programs/` implements. If you change training
logic in code, change it here first. If the two disagree, this document is wrong and should
be corrected — code is the source of truth for behaviour, this is the source of truth for
_intent_.

---

## 1. Who this is built for

|                   |                                                                        |
| ----------------- | ---------------------------------------------------------------------- |
| Age               | 35                                                                     |
| Height            | 190 cm                                                                 |
| Starting weight   | 90 kg (up from ~80 kg)                                                 |
| Background        | Software developer, remote, ~6 years almost entirely sedentary         |
| Training history  | A few false starts. Effectively a beginner                             |
| Medical           | Seen by a physio. **No structural findings, no movement restrictions** |
| Pain              | Neck / upper traps, lower back, shoulders, knees / hips / ankles       |
| Other             | Snoring, poor sleep, low energy                                        |
| Baseline activity | 3,000-6,000 steps per day                                              |
| Available         | 3 days per week (Mon / Wed / Fri), 45-60 minutes, full commercial gym  |
| Home equipment    | Mat, resistance bands, foam roller                                     |

### The insight that drives everything

At 190 cm and 90 kg the BMI is **24.9 — inside the normal range**. At ~80 kg he was
genuinely lean for his height.

**So the problem is body composition, not weight.** Fat has been added to a frame carrying
very little muscle. A pure weight-loss approach would strip the small amount of muscle he
has and leave him lighter, softer, and still in pain.

**Target: ~82-84 kg with meaningfully more muscle.** Not "lose 10 kg".

Building muscle on the posterior chain — glutes, hamstrings, mid-back, rear delts — is
the actual fix for the neck and lower back pain, because those are the muscles six years
of sitting switched off. It also raises resting energy expenditure, which does the fat
loss quietly in the background.

---

## 2. Programme principles

1. **Connective tissue adapts slower than muscle.** Tendons, ligaments and joint capsules
   take longer to strengthen than the muscles pulling on them. This is exactly why
   enthusiastic beginners get hurt in week three. Phase 1 is deliberately, almost
   insultingly easy. That is the design working.
2. **Machines first.** A machine enforces the movement path, so a beginner with no form
   experience and four aching joints cannot get it badly wrong. Free weights are earned in
   Phase 2 once the patterns are grooved.
3. **Every session is full body.** Training three times a week, each movement pattern gets
   hit 2-3 times weekly. A body-part split would leave each muscle trained once a week,
   which is a poor trade at this training age.
4. **Effort is capped, not maximised.** Phase 1 runs at RPE 5-6 — meaning at the end of a
   set you could comfortably do another 4-5 reps. We are teaching movement and building
   tissue tolerance, not chasing fatigue.
5. **The warm-up is training.** It is where mobility actually improves. It is not optional
   and it is not padding.

### Movements deliberately excluded from Phase 1

| Excluded                                                     | Reason                                                                            |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Overhead pressing                                            | Shoulder pain. Needs scapular control built first                                 |
| Loaded spinal flexion (sit-ups, crunches, machine ab twists) | Lower back pain. No upside that a plank-family movement does not give more safely |
| Barbell back squat                                           | Requires ankle and hip mobility he does not have yet, and loads the knees         |
| Rowing machine                                               | Repeatedly loads a rounded lower back under fatigue. Enters in Phase 3            |
| Deadlifts from the floor                                     | Same reason, plus it demands a hinge pattern that is still being taught           |

The building gym has bars but no rack anyone has confirmed. Until there is one, any
movement that would have to be lifted off the floor to get started is out — which is why
the hinge stays on dumbbells for all twelve weeks rather than moving to a barbell in
Phase 3.

---

## 3. The weekly structure

**Monday / Wednesday / Friday**, cycling through three sessions: A, B, C.
Because there are three sessions and three training days, each session lands on the same
weekday each week. That is intentional — it makes the habit predictable.

Every session:

```
6-10 min   Warm-up (adaptive; longer for morning sessions)
30-40 min  Main work
10 min     Low-intensity cardio finisher
```

### The warm-up (every session)

The longer version is used when the session starts before 10:00, because a body that has
just got out of bed is measurably stiffer.

| Movement                   | Volume       | What it is for                                         |
| -------------------------- | ------------ | ------------------------------------------------------ |
| Stationary bike, easy      | 3 min        | Raise tissue temperature. Nothing more                 |
| Ankle wall rocks           | 10 per side  | Ankle mobility — the root cause of most squat problems |
| Cat-cow                    | 8 reps       | Segmental spine movement                               |
| Band pull-aparts           | 15 reps      | Wakes up the mid-back and rear delts                   |
| Wall slides                | 10 reps      | Shoulder blade control before anything gets pressed    |
| Chin tucks                 | 10 reps      | Deep neck flexors — directly targets the neck pain     |
| Bodyweight hip hinge       | 10 reps      | Rehearses the hinge before it gets loaded              |
| Ramp set on first exercise | 1 x 10 light | Movement-specific preparation                          |

**How "adaptive" works.** The volumes above are the morning dose. Later in the day every
movement is still performed — dropping the shoulder work because it is the afternoon would be
a strange way to treat a shoulder — but at a lighter dose: the bike drops to 2 minutes and
each drill loses two or three reps. That brings the routine from roughly ten minutes to
roughly six. Both doses are written out per movement in `src/content/programs/`, rather than
one being computed from the other, because the right afternoon dose is a judgement about a
specific drill and not a percentage.

The ramp set is half the first exercise's working weight.

---

## 4. Session A - Legs & Pull

| #   | Exercise                  | Sets x Reps     | Phase 1 start      | Rest |
| --- | ------------------------- | --------------- | ------------------ | ---- |
| 1   | Goblet Squat to bench     | 2 x 10          | 10 kg dumbbell     | 90 s |
| 2   | Low Row, neutral grip     | 2 x 12          | 25 kg              | 90 s |
| 3   | Seated Leg Curl (machine) | 2 x 12          | 15 kg              | 75 s |
| 4   | Leg Extension (machine)   | 2 x 12          | 30 kg              | 75 s |
| 5   | Pallof Press (cable)      | 2 x 10 per side | 10 kg              | 60 s |
| 6   | Incline treadmill walk    | 10 min          | 5% incline, 5 km/h | -    |

**Why these:** there is no leg press in the building, so the goblet squat is the biggest
leg movement of the day and it goes first, where he is freshest — it teaches the squat
pattern with a counterweight that makes good form easier than bad form, and the bench gives
a consistent depth to hit. The leg extension then loads the quads directly with the back
supported, which is what the leg press was there for. The low row is the single
highest-value exercise in the whole programme for the neck pain — it trains exactly what
six years of reaching for a mouse switched off.

## 5. Session B - Push & Hinge

| #   | Exercise                                        | Sets x Reps    | Phase 1 start       | Rest |
| --- | ----------------------------------------------- | -------------- | ------------------- | ---- |
| 1   | Chest Press machine (converging / neutral grip) | 2 x 12         | 20 kg               | 90 s |
| 2   | Lat Pulldown, neutral grip                      | 2 x 12         | 25 kg               | 90 s |
| 3   | Dumbbell Romanian Deadlift                      | 2 x 10         | 2 x 8 kg            | 90 s |
| 4   | Cable Face Pull (rope)                          | 2 x 15         | 10 kg               | 60 s |
| 5   | Dead Bug                                        | 2 x 8 per side | bodyweight          | 60 s |
| 6   | Stationary bike, easy                           | 10 min         | conversational pace | -    |

**Why these:** a converging or neutral-grip chest press keeps the shoulders in a much
friendlier position than a barbell bench. The face pull is the most important small exercise
here — it directly opposes the desk posture driving the neck and shoulder pain, and it is
almost impossible to do badly. The dumbbell RDL is where the hinge gets taught: light,
slow, and drilled until it is automatic, because everything in Phase 3 depends on it.

## 6. Session C - Glutes & Carry

| #   | Exercise                            | Sets x Reps    | Phase 1 start      | Rest |
| --- | ----------------------------------- | -------------- | ------------------ | ---- |
| 1   | Dumbbell Hip Thrust (off a bench)   | 2 x 12         | 12 kg dumbbell     | 90 s |
| 2   | Chest-Supported Dumbbell Row        | 2 x 12         | 2 x 8 kg           | 90 s |
| 3   | Split Squat (rear foot on floor)    | 2 x 8 per side | bodyweight         | 75 s |
| 4   | Seated Hip Abduction (machine)      | 2 x 15         | 25 kg              | 60 s |
| 5   | Incline Dumbbell Press (30 degrees) | 2 x 10         | 2 x 8 kg           | 75 s |
| 6   | Farmer's Carry                      | 2 x 30 m       | 2 x 12 kg          | 60 s |
| 7   | Incline treadmill walk              | 10 min         | 5% incline, 5 km/h | -    |

**Why these:** the hip thrust is the most direct glute exercise that exists, and weak glutes
are very often the real cause of a sore lower back — the back ends up doing the hips' job.
There is no hip thrust machine in the building, so it is done off a flat bench with a single
dumbbell across the hips. The chest-supported row moves to an incline bench and dumbbells
for the same reason, and keeps the property that mattered: all the mid-back benefit of a row
with literally zero load on the lumbar spine. The abductor machine follows the split squat
because it trains the exact muscle that stops the front knee falling inwards on it. The
farmer's carry looks trivial and is quietly excellent: grip, core, posture and conditioning
at once, with essentially no injury risk.

This is the only seven-slot session. It is still inside the hour because four of the seven
are seated machines or a carry.

---

## 7. Progression: double progression

The only rule, applied per exercise:

> **When every set in a session hits the top of the rep range, and none of them were rated
> "brutal", add the smallest available increment next time.**

| Equipment             | Increment                                      |
| --------------------- | ---------------------------------------------- |
| Weight-stack machines | +2.5 kg (or one plate if the stack is coarser) |
| Cable machines        | +2.5 kg                                        |
| Dumbbells             | +2 kg total (i.e. the next dumbbell up)        |
| Bodyweight            | +2 reps, then add load                         |

**Auto-regulation:** after each set the app asks how it felt — _easy / just right / brutal_.

- Any set rated **brutal** -> the next prescription for that exercise drops by 10%.
- All sets **easy** at the top of the range -> increment as above, and the app suggests the
  jump explicitly rather than waiting.
- Anything else -> hold.

### The rep numbers in the session tables are the top of a range

"2 x 12" means two sets of **10 to 12**, not two sets of exactly 12. Double progression needs
somewhere to climb: the weight only moves once every set reaches the top of the range, so
without a range there is nothing to progress through. The ranges used are 10-12, 8-10, 12-15
and 6-8, each ending on the number printed in sections 4 to 6.

### Three conventions the code needs and the tables do not state

| Convention                            | What it means                                                                                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dumbbell weights are per dumbbell** | "2 x 8 kg" is the weight written on each dumbbell. The increment of +2 kg is the next dumbbell up. Volume calculations count both                                                                                   |
| **Carries progress on feel**          | A carry has a distance, not a rep range, so there is no top of the range to reach. It goes up only when every set felt _easy_. A carry that felt _just right_ is already doing its job on grip and posture          |
| **Reductions round down**             | 40 kg less 20% is 32 kg, and the nearest selectable weight is 32.5 — heavier than the reduction asked for. Reductions round down to 30. Increases round to the nearest selectable weight and then add the increment |

### Week 1 is a calibration week

There are no prescribed weights in week 1 beyond the conservative starting points above.
The app instructs, for each exercise:

> _"Pick a weight you think you could do about 15 reps with. Then stop at 12. If 12 felt
> like nothing, go up next set. We are finding your starting line, not testing you."_

Whatever he lands on becomes the baseline the rest of the programme progresses from.

---

## 8. The three phases

### Phase 1 — Weeks 1-4: "Groove the patterns"

Machine-dominant. **2 working sets** in weeks 1-2, **3 working sets** in weeks 3-4.
RPE 5-6 throughout. The goal is attendance and technique, not progress.

### Phase 2 — Weeks 5-8: "Add load"

3 working sets, RPE 6-7. Free-weight variants are introduced where the pattern is solid:
goblet squat gets heavier, the RDL progresses properly, incline dumbbell press replaces
some machine pressing. If the shoulders have gone quiet, the machine shoulder press is
introduced as the first overhead movement.

Concretely, three changes and no others:

| Change                                                                                         | Why                                                                                                                                           |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| The two presses swap places: incline dumbbell press becomes B1, chest press machine becomes C4 | The free-weight press goes where he is freshest. The machine stays for the tired slot, which is what machines are good for                    |
| Machine shoulder press enters as B5, **only while the shoulders are clear**                    | The first overhead movement. The machine holds the path, which is what a new overhead press needs. First thing to drop if a session runs long |
| Session A does not change at all                                                               | The goblet squat getting heavier is progression doing its job, not a different exercise                                                       |

**Week 8 is a deload:** drop to 2 sets and reduce every load by 20%. It will feel like a
waste of a week. It is not — it is where accumulated fatigue clears and the joints catch
up. Do not skip it.

### Phase 3 — Weeks 9-12: "Train properly"

RPE 7-8. The rowing machine is introduced now that the hinge is reliable. More free weights.
An optional fourth day becomes available for anyone who wants it — and only then.

Concretely, three movements grow up:

| Change                                      | Why                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| Goblet squat to bench -> goblet squat       | Eight weeks of touching the bench accurately means the bench has done its job         |
| Split squat -> dumbbell split squat         | The "+2 reps, then add load" rule in section 7 finally reaching the "add load" half   |
| Session B's bike finisher -> rowing machine | B is the day the hinge is trained, so the pattern is fresh when the rower asks for it |

**The hinge does not move to a barbell.** It was going to: dumbbell RDL to barbell RDL, out
of the rack, never from the floor. The building gym has bars and no rack anyone has
confirmed, and starting an RDL by deadlifting the bar off the floor is exactly the movement
section 2 excludes. So the dumbbell RDL keeps the slot for all twelve weeks and simply gets
heavier. `barbellRomanianDeadlift` stays defined in `src/content/exercises/` and is listed
as the dumbbell RDL's first substitute, so the day a rack turns up this is a one-line change
to the Phase 3 template.

Two exercise ids change, which means two movements with no history. That is handled rather
than worked around: an exercise with no history is prescribed as a calibration, so the app
asks him to find the weight instead of inventing one.

The optional fourth day is not built. It becomes reasonable here; it is not scheduled.

---

## 9. Daily habits

Four checkboxes per day. Nothing is logged, weighed or counted beyond this. High compliance
beats high precision, and a food diary is the single most common reason a beginner quits.

| Habit              | Target                       | Why this one                                                                                                                        |
| ------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Protein            | >= 150 g                     | ~1.7 g per kg of target bodyweight. This is the one that protects muscle while losing fat. If only one habit survives, make it this |
| Steps              | 5,000 -> 9,000 over 12 weeks | Will drive more fat loss than the gym does in the early weeks                                                                       |
| No liquid calories | Zero                         | Soft drinks, juice, sugary coffee. The easiest few hundred calories anyone ever removes                                             |
| Sleep              | 7 hours                      | Given the snoring and low energy, this is a health target, not just a recovery one                                                  |

## 10. Daily mobility — "Desk Undo"

10 minutes, at home, on non-gym days as well as gym days. Mat, bands and foam roller.
**This is the part that fixes the stiffness.** The gym work supports it; it does not replace it.

| Movement                    | Volume        |
| --------------------------- | ------------- |
| Foam roll thoracic spine    | 60 s          |
| Cat-cow                     | 10 reps       |
| Thread the needle           | 8 per side    |
| 90/90 hip switches          | 10 reps       |
| Couch stretch (hip flexors) | 45 s per side |
| Ankle wall rocks            | 12 per side   |
| Band pull-aparts            | 20 reps       |
| Chin tucks                  | 12 reps       |
| Doorway pec stretch         | 30 s per side |

---

## 11. What to expect, honestly

**Expected rate of loss: 0.4-0.5 kg per week.** Faster than that and muscle goes with it.

> **The scale will barely move for the first 2-3 weeks — and it may go UP.**

New training pulls water and glycogen into muscle. That is a good sign wearing a bad
disguise. This single fact is the most common reason beginners quit in week three, so the
app must surface it proactively during that window rather than waiting to be asked.

What to watch instead in weeks 1-3: the weights going up, and how the stairs feel.

Realistic 14-week outcome: ~83-84 kg, visibly less belly fat, meaningfully more strength,
and — most importantly for quality of life — significantly less neck and back pain.

---

## 12. Safety rails the app must enforce

- Never schedule two strength sessions less than 48 hours apart.
- If a set is marked as causing **sharp or joint pain** (as distinct from muscle burn), that
  exercise is flagged and its load drops 20% next session.
- After a gap of 10+ days, restart at the beginning of the current phase at 80% load rather
  than resuming where he left off.
- The app is not a doctor and must never behave like one. It may say "worth mentioning to a
  GP" once per topic. It may never diagnose, and it may never repeat itself into nagging.
