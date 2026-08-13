/* ===================================================
   HYROX PLAN QUIZ
   Step navigation + result rendering for the plan builder on
   /hyrox-training-plan. Deliberately separate from the homepage's client
   quiz in js/scripts.js, see the CSS comment on .hp-quiz-wrap for why.
=================================================== */
(function () {
    const wrap = document.getElementById('hp-quiz-wrap');
    if (!wrap || typeof HyroxPlan === 'undefined') return;

    const steps        = wrap.querySelectorAll('.hp-quiz-step');
    const progressFill = document.getElementById('hp-quiz-progress-fill');
    const stepCount     = document.getElementById('hp-quiz-step-count');
    const backBtn       = document.getElementById('hp-quiz-back');
    const restartBtn    = document.getElementById('hp-quiz-restart');
    const resultTitle   = document.getElementById('hp-result-title');
    const resultWeeks   = document.getElementById('hp-result-weeks');
    const emailSummary  = document.getElementById('hp-email-summary');

    const answers = {};
    let currentStep = 1;

    function setStepUI(step) {
        steps.forEach(s => s.classList.remove('active'));
        const target = wrap.querySelector(`[data-hp-step="${step}"]`);
        if (target) target.classList.add('active');

        const isResult = step === 'result';
        if (progressFill) progressFill.style.width = isResult ? '100%' : `${(step - 1) / 3 * 100}%`;
        if (stepCount) {
            stepCount.style.display = isResult ? 'none' : 'block';
            if (!isResult) stepCount.textContent = `Question ${step} of 3`;
        }
        if (backBtn) backBtn.hidden = (step === 1);
        currentStep = step;
    }

    function showStep(step) {
        setStepUI(step);
        if (step === 'result') renderResult();
    }

    const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
    const DAYS_LABEL = { '3-4': '3-4 days/week', '5': '5 days/week', '6': '6 days/week' };

    function renderResult() {
        const totalWeeks = parseInt(answers.weeks, 10) || 12;
        const levelKey = answers.level || 'intermediate';
        const daysPerWeek = answers.days || '5';

        const plan = HyroxPlan.generatePlan(totalWeeks, levelKey, daysPerWeek);

        if (resultTitle) {
            resultTitle.textContent = `${totalWeeks}-Week HYROX Plan, ${LEVEL_LABEL[levelKey]}, ${DAYS_LABEL[daysPerWeek]}`;
        }
        if (emailSummary) emailSummary.value = resultTitle ? resultTitle.textContent : '';

        if (resultWeeks) {
            resultWeeks.innerHTML = '';

            if (levelKey === 'beginner' && totalWeeks <= 6) {
                const note = document.createElement('p');
                note.className = 'hp-plan-note';
                note.innerHTML = '<strong>Worth knowing:</strong> six weeks is tight for a first HYROX. ' +
                    'This plan will get you to the start line able to finish it, but if you can push your ' +
                    'race back to 8-12 weeks out, you will arrive in noticeably better shape.';
                resultWeeks.appendChild(note);
            }

            let lastPhase = null;
            plan.weeks.forEach(w => {
                const container = document.createElement('div');
                container.className = 'hp-plan-week';

                const header = document.createElement('div');
                header.className = 'hp-plan-week-header';
                header.textContent = `Week ${w.weekNumber} · ${w.phaseLabel}`;
                container.appendChild(header);

                const table = document.createElement('table');
                table.className = 'loc-table gg-table';
                const tbody = document.createElement('tbody');
                w.sessions.forEach(([day, text]) => {
                    const tr = document.createElement('tr');
                    const th = document.createElement('th');
                    th.textContent = day;
                    const td = document.createElement('td');
                    td.textContent = text;
                    tr.appendChild(th);
                    tr.appendChild(td);
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                container.appendChild(table);

                resultWeeks.appendChild(container);
                lastPhase = w.phase;
            });
        }

        if (window.SharpeAnalytics) {
            window.SharpeAnalytics.track('hyrox_plan_generated', { weeks: totalWeeks, level: levelKey, days: daysPerWeek });
        }
    }

    wrap.querySelectorAll('.hp-quiz-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            answers[opt.dataset.key] = opt.dataset.val;

            opt.closest('.hp-quiz-options').querySelectorAll('.hp-quiz-opt').forEach(o => {
                o.classList.remove('selected');
                o.setAttribute('aria-pressed', 'false');
            });
            opt.classList.add('selected');
            opt.setAttribute('aria-pressed', 'true');

            setTimeout(() => {
                showStep(currentStep === 3 ? 'result' : currentStep + 1);
            }, 280);
        });
    });

    backBtn && backBtn.addEventListener('click', () => {
        if (currentStep === 'result') return showStep(3);
        if (currentStep > 1) showStep(currentStep - 1);
    });

    restartBtn && restartBtn.addEventListener('click', () => {
        Object.keys(answers).forEach(k => delete answers[k]);
        wrap.querySelectorAll('.hp-quiz-opt').forEach(o => {
            o.classList.remove('selected');
            o.setAttribute('aria-pressed', 'false');
        });
        const emailForm = document.getElementById('hp-email-form');
        const emailSuccess = document.getElementById('hp-email-success');
        if (emailForm) { emailForm.style.display = ''; emailForm.reset(); }
        if (emailSuccess) emailSuccess.hidden = true;
        showStep(1);
    });

    // === Soft email capture, non-blocking: the result is already visible ===
    const emailForm = document.getElementById('hp-email-form');
    if (emailForm) {
        const emailError = document.getElementById('hp-email-error');
        const emailSuccessEl = document.getElementById('hp-email-success');

        emailForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (emailError) emailError.hidden = true;

            const email = document.getElementById('hp-email-input').value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (emailError) {
                    emailError.textContent = 'That email address does not look right, please check it.';
                    emailError.hidden = false;
                }
                return;
            }

            const submitBtn = emailForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            const data = new FormData(emailForm);
            fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(data).toString()
            })
            .then(r => {
                if (!r.ok) throw new Error('Form submission failed: ' + r.status);
                emailForm.style.display = 'none';
                if (emailSuccessEl) emailSuccessEl.hidden = false;
                if (window.SharpeAnalytics) window.SharpeAnalytics.lead('hyrox-plan-email', {});
            })
            .catch(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Email Me This';
                if (emailError) {
                    emailError.textContent = 'Something went wrong sending that, message Dom on WhatsApp instead.';
                    emailError.hidden = false;
                }
            });
        });
    }

    showStep(1);
})();
