/* ===================================================
   HYROX PLAN GENERATOR
   Turns three quiz answers (weeks until race, level, days per week) into a
   full week-by-week plan. Every number and exercise name comes from a small
   set of hand-written building blocks below, scaled by phase and level, not
   freely generated, so any of the 36 possible outputs is traceable back to
   something a coach actually wrote.
=================================================== */

const HyroxPlan = (function () {

    // How the total weeks split into phases. Chosen by hand per duration
    // rather than computed proportionally, so each split stays sane at the
    // edges (a 6-week base phase of 1 week is fine, a computed 0.4 isn't).
    const PHASE_SPLITS = {
        6:  [{ phase: 'base', weeks: 1 }, { phase: 'build', weeks: 2 }, { phase: 'race-prep', weeks: 2 }, { phase: 'taper', weeks: 1 }],
        8:  [{ phase: 'base', weeks: 2 }, { phase: 'build', weeks: 3 }, { phase: 'race-prep', weeks: 2 }, { phase: 'taper', weeks: 1 }],
        12: [{ phase: 'base', weeks: 4 }, { phase: 'build', weeks: 4 }, { phase: 'race-prep', weeks: 3 }, { phase: 'taper', weeks: 1 }],
        16: [{ phase: 'base', weeks: 6 }, { phase: 'build', weeks: 5 }, { phase: 'race-prep', weeks: 4 }, { phase: 'taper', weeks: 1 }],
    };

    const PHASE_LABELS = {
        'base': 'Base',
        'build': 'Build',
        'race-prep': 'Race Prep',
        'taper': 'Taper & Race Week',
    };

    const LEVELS = {
        beginner: {
            label: 'Beginner',
            squat: 'Goblet Squat', pull: 'Assisted Pull-Up or Lat Pulldown', press: 'Dumbbell Push Press',
            compromisedDelayWeeks: 1,
            note: 'Stay a notch below what feels hard, technique before load.',
        },
        intermediate: {
            label: 'Intermediate',
            squat: 'Back Squat', pull: 'Pull-Up or Lat Pulldown', press: 'Push Press',
            compromisedDelayWeeks: 0,
            note: '',
        },
        advanced: {
            label: 'Advanced',
            squat: 'Back Squat', pull: 'Weighted Pull-Up', press: 'Push Press',
            compromisedDelayWeeks: 0,
            note: 'Push the last set of every strength session to RPE 8-9.',
        },
    };

    const STRENGTH_TIER = {
        only:   { sets: 4, reps: 6, note: '@RPE7' },
        early:  { sets: 4, reps: 6, note: '@RPE7' },
        mid:    { sets: 4, reps: 6, note: '@RPE7-8, a little heavier than last week' },
        late:   { sets: 4, reps: 5, note: '@RPE8, heavier than the early weeks' },
        deload: { sets: 3, reps: 6, note: '@70%, light' },
    };

    const COMPROMISED_TIER = {
        only:   { reps: 6, dist: 400 },
        early:  { reps: 6, dist: 400 },
        mid:    { reps: 6, dist: 500 },
        late:   { reps: 8, dist: 400 },
        deload: { reps: 4, dist: 400 },
    };

    function tierFor(weekInPhase, phaseWeeks) {
        if (phaseWeeks <= 1) return 'only';
        if (weekInPhase === phaseWeeks && phaseWeeks >= 3) return 'deload';
        const pos = (weekInPhase - 1) / (phaseWeeks - 1);
        if (pos < 0.34) return 'early';
        if (pos < 0.7) return 'mid';
        return 'late';
    }

    // The six possible session "slots" for a training week. daysPerWeek
    // decides which of these survive; Saturday's long session and the two
    // strength days are the last things cut, matching the FAQ's own answer
    // for people short on training days.
    function weekSlots(daysPerWeek) {
        if (daysPerWeek === '6') {
            return ['strengthA', 'compromised', 'strengthB', 'steady', 'technique', 'long'];
        }
        if (daysPerWeek === '5') {
            return ['strengthA', 'compromised', 'strengthB', 'steady', 'long'];
        }
        return ['strengthA', 'compromised', 'strengthB', 'long']; // 3-4 days
    }

    function dayLabelsFor(daysPerWeek) {
        if (daysPerWeek === '6') return { strengthA: 'Monday', compromised: 'Tuesday', strengthB: 'Wednesday', steady: 'Thursday', technique: 'Friday', long: 'Saturday', rest: ['Sunday'] };
        if (daysPerWeek === '5') return { strengthA: 'Monday', compromised: 'Tuesday', strengthB: 'Wednesday', steady: 'Thursday', long: 'Saturday', rest: ['Friday', 'Sunday'] };
        return { strengthA: 'Monday', compromised: 'Wednesday', strengthB: 'Friday', long: 'Saturday', rest: ['Tuesday', 'Thursday', 'Sunday'] };
    }

    function strengthSession(kind, tier, level) {
        const t = STRENGTH_TIER[tier];
        if (kind === 'A') {
            return `Strength, lower body + core: ${level.squat} ${t.sets}x${t.reps} ${t.note}, Romanian Deadlift 3x8, Walking Lunges 3x10/leg, Plank 3x40s`;
        }
        return `Strength, upper pull + sled: ${level.pull} ${t.sets}x${t.reps} ${t.note}, Bent-Over Row 4x8, Sled Pull 4x20m`;
    }

    function compromisedSession(tier, delayed) {
        if (delayed) {
            return 'Technique focus: SkiErg and Sled Push drills at an easy pace, no run intervals yet, building the movement before the fatigue.';
        }
        const t = COMPROMISED_TIER[tier];
        return `Compromised running: ${t.reps} x (${t.dist}m run + station), rotate stations through the week`;
    }

    function steadySession(tier) {
        const mins = tier === 'deload' ? 25 : (tier === 'late' ? 50 : 40);
        return `Steady state: ${mins} min easy pace (Zone 2)`;
    }

    function techniqueSession() {
        return 'Station technique: rotate through stations you feel weakest at, quality over volume, full recovery between attempts';
    }

    function longSession(tier, weekInPhase, phaseWeeks) {
        if (tier === 'deload') return 'Easy 30 min, no intervals, shake the legs out';
        const reps = tier === 'late' ? 6 : (tier === 'mid' ? 5 : 4);
        return `Long compromised session: ${reps} x (800m run + station), rotate all stations across the session`;
    }

    function buildWeekSessions(phase, weekInPhase, phaseWeeks, level, daysPerWeek) {
        const tier = tierFor(weekInPhase, phaseWeeks);
        const slots = weekSlots(daysPerWeek);
        const labels = dayLabelsFor(daysPerWeek);
        const delayed = phase === 'build' && level.compromisedDelayWeeks >= weekInPhase;
        const rows = [];

        if (slots.includes('strengthA')) rows.push([labels.strengthA, strengthSession('A', tier, level)]);
        if (slots.includes('compromised')) {
            const text = phase === 'base'
                ? `Easy run: ${tier === 'deload' ? 25 : 30 + weekInPhase * 5} min, conversational pace`
                : compromisedSession(tier, delayed);
            rows.push([labels.compromised, text]);
        }
        if (slots.includes('strengthB')) rows.push([labels.strengthB, strengthSession('B', tier, level)]);
        if (slots.includes('steady')) rows.push([labels.steady, steadySession(tier)]);
        if (slots.includes('technique')) rows.push([labels.technique, techniqueSession()]);
        if (slots.includes('long')) rows.push([labels.long, longSession(tier, weekInPhase, phaseWeeks)]);

        labels.rest.forEach(d => rows.push([d, 'Rest']));

        // Keep printed order Monday -> Sunday regardless of slot order above.
        const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        rows.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
        return rows;
    }

    function racePrepWeek(weekInPhase, phaseWeeks, level, daysPerWeek) {
        // Narrative rather than progressive-overload: build to one big
        // session, then sharpen. Position within the phase (not a tier)
        // drives which week this is, since the shape only makes sense in
        // sequence regardless of how many weeks the phase has.
        //
        // Beginners never get the full 8km/8-station simulation at race
        // intensity: someone a handful of weeks into structured training
        // attempting the entire event at 80-85% effort is a real
        // overexertion risk, not just an intensity preference. They cap at
        // a half-distance session and gentler effort language throughout.
        const isBeginner = level && level.compromisedDelayWeeks > 0;
        const fromEnd = phaseWeeks - weekInPhase; // 0 = last race-prep week

        if (fromEnd === 1 && phaseWeeks >= 2) {
            if (isBeginner) {
                return [
                    ['Monday', 'Strength maintenance: short session, ~30 min, nothing new'],
                    ['Tuesday', 'Controlled intervals: 3 x (1km + station) at a strong but sustainable pace, not flat out'],
                    ['Wednesday', 'Easy 25 min'],
                    ['Thursday', 'Rest'],
                    ['Friday', 'Short activation: light movement, 15-20 min, stay loose'],
                    ['Saturday', 'Half-HYROX rehearsal: 4km running (4x1km) + 4 stations at a comfortable, controlled effort, the goal is finishing feeling in charge, not racing it'],
                    ['Sunday', 'Rest, easy walk only'],
                ];
            }
            return [
                ['Monday', 'Strength maintenance: short session, ~30 min, nothing new'],
                ['Tuesday', 'Race-pace intervals: 3 x (1km + station) at full race intensity'],
                ['Wednesday', 'Easy 25 min'],
                ['Thursday', 'Rest'],
                ['Friday', 'Short activation: light movement, 15-20 min, stay loose'],
                ['Saturday', 'Full HYROX simulation: all 8km running + all 8 stations at 80-85% effort, the big dress rehearsal'],
                ['Sunday', 'Rest, easy walk only'],
            ];
        }
        if (fromEnd === 0) {
            return [
                ['Monday', 'Strength maintenance, light'],
                ['Tuesday', isBeginner ? 'Sharpening: 3 x (600m run + station) at a controlled pace, short and sharp' : 'Sharpening: 3 x (600m run + station) at race pace, short and sharp'],
                ['Wednesday', 'Easy 25 min'],
                ['Thursday', 'Rest'],
                ['Friday', 'Technique touches, 2 stations only, light'],
                ['Saturday', 'Moderate compromised: 4 x (1km + station) at a controlled effort, confidence-building not exhausting'],
                ['Sunday', 'Rest'],
            ];
        }
        return [
            ['Monday', 'Strength maintenance: short session, ~30 min total'],
            ['Tuesday', isBeginner ? 'Controlled intervals: 4 x (1km run + station) at a strong, sustainable pace' : 'Race-pace intervals: 4 x (1km run at race pace + station at race intensity)'],
            ['Wednesday', 'Short compromised: 4 x 400m run / station, sharp not long'],
            ['Thursday', 'Easy 30 min recovery'],
            ['Friday', 'Technique sharpening: 2-3 stations' + (isBeginner ? '' : ' at race-day loads if accessible')],
            ['Saturday', isBeginner ? 'Half-HYROX rehearsal: 4km running (4x1km) + 4 stations at a comfortable, controlled effort' : 'Half-HYROX simulation: 4km running (4x1km) + 4 stations at 80-85% effort'],
            ['Sunday', 'Rest'],
        ];
    }

    function taperWeek() {
        return [
            ['Monday', 'Easy 20 min movement, technique touches only, very light'],
            ['Tuesday', 'Rest'],
            ['Wednesday', 'Short primer: 2 x (400m run + station) at race pace, brief, stay sharp'],
            ['Thursday', 'Rest'],
            ['Friday', 'Rest / light mobility only'],
            ['Saturday', 'Travel and logistics, or an easy shakeout if racing Sunday'],
            ['Sunday', 'RACE DAY'],
        ];
    }

    // Public: generate the full plan as [{weekNumber, phase, phaseLabel, weekInPhase, phaseWeeks, sessions}]
    function generatePlan(totalWeeks, levelKey, daysPerWeek) {
        const split = PHASE_SPLITS[totalWeeks];
        const level = LEVELS[levelKey];
        const weeks = [];
        let weekNumber = 1;

        split.forEach(({ phase, weeks: phaseWeeks }) => {
            for (let weekInPhase = 1; weekInPhase <= phaseWeeks; weekInPhase++) {
                let sessions;
                if (phase === 'taper') {
                    sessions = taperWeek();
                } else if (phase === 'race-prep') {
                    sessions = racePrepWeek(weekInPhase, phaseWeeks, level, daysPerWeek);
                } else {
                    sessions = buildWeekSessions(phase, weekInPhase, phaseWeeks, level, daysPerWeek);
                }
                weeks.push({
                    weekNumber, phase, phaseLabel: PHASE_LABELS[phase],
                    weekInPhase, phaseWeeks, sessions,
                });
                weekNumber++;
            }
        });

        return { totalWeeks, level, levelKey, daysPerWeek, weeks };
    }

    return { generatePlan, LEVELS, PHASE_SPLITS };
})();
