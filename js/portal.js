/* ===================================================
   DOM SHARPE FITNESS — Client Portal
=================================================== */

let token        = localStorage.getItem('ss_portal_token');
let currentUser  = null;
let historyChart = null;

// ── API helper ──────────────────────────────────────
async function api(path, opts = {}) {
  const headers = { ...opts.headers };
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_URL + path, { ...opts, headers });
  if (res.status === 401) { logout(); return null; }
  return res;
}

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set default week_date to Monday of this week
  const weekInput = document.getElementById('ci-week-date');
  if (weekInput) {
    const today = new Date();
    const day   = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((day + 6) % 7));
    weekInput.value = monday.toISOString().split('T')[0];
  }

  token ? loadUser() : showLogin();

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('checkin-form').addEventListener('submit', handleCheckin);
  document.getElementById('msg-form').addEventListener('submit', handleSendMessage);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Score slider labels
  ['mood', 'energy'].forEach(field => {
    const slider = document.getElementById(`ci-${field}`);
    const label  = document.getElementById(`${field}-val`);
    if (slider && label) {
      slider.addEventListener('input', () => { label.textContent = slider.value; });
    }
  });

  // Photo file name preview
  const photoInput = document.getElementById('ci-photo');
  const photoLabel = document.getElementById('photo-label');
  if (photoInput && photoLabel) {
    photoInput.addEventListener('change', () => {
      photoLabel.textContent = photoInput.files[0]?.name || 'Choose photo…';
    });
  }
});

// ── Auth ────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  const btn      = e.target.querySelector('button[type=submit]');

  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent  = 'Logging in…';

  const res  = await fetch(`${API_URL}/api/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (!res.ok) {
    errEl.textContent = data.error || 'Login failed';
    btn.disabled = false;
    btn.textContent = 'Log In';
    return;
  }
  if (data.user.is_dom) {
    errEl.textContent = "That's Dom's account — use admin.html instead";
    btn.disabled = false;
    btn.textContent = 'Log In';
    return;
  }

  token = data.token;
  currentUser = data.user;
  localStorage.setItem('ss_portal_token', token);
  showApp();
}

async function loadUser() {
  const res = await api('/api/auth/me');
  if (!res?.ok) { showLogin(); return; }
  currentUser = await res.json();
  showApp();
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('ss_portal_token');
  showLogin();
}

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('portal-name').textContent = currentUser?.name || '';
  switchTab('checkin');
}

// ── Tabs ─────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('hidden', p.id !== `tab-${name}`));

  if (name === 'history')  loadHistory();
  if (name === 'messages') loadMessages();
}

// ── Check-in ─────────────────────────────────────────
async function handleCheckin(e) {
  e.preventDefault();
  const form   = e.target;
  const btn    = form.querySelector('button[type=submit]');
  const errEl  = document.getElementById('ci-error');
  const succEl = document.getElementById('ci-success');

  errEl.textContent = '';
  succEl.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Submitting…';

  const formData = new FormData(form);

  const res = await api('/api/checkins', { method: 'POST', body: formData, headers: {} });

  if (res?.ok) {
    form.reset();
    document.getElementById('mood-val').textContent   = '5';
    document.getElementById('energy-val').textContent = '5';
    document.getElementById('photo-label').textContent = 'Choose photo…';
    succEl.textContent = 'Check-in submitted! Great work this week.';
    succEl.classList.remove('hidden');
  } else {
    const data = await res?.json();
    errEl.textContent = data?.error || 'Submission failed, please try again.';
  }

  btn.disabled = false;
  btn.textContent = 'Submit Check-In';
}

// ── History ──────────────────────────────────────────
async function loadHistory() {
  const res = await api('/api/checkins');
  if (!res?.ok) return;
  const checkins = await res.json();
  renderHistory(checkins);
}

function renderHistory(checkins) {
  if (!checkins.length) {
    document.getElementById('history-content').innerHTML =
      '<p class="empty-state">No check-ins yet — submit your first one above!</p>';
    return;
  }

  const sorted = [...checkins].reverse();

  // Chart
  if (historyChart) historyChart.destroy();
  const canvas = document.getElementById('history-chart');
  if (canvas) {
    historyChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels:   sorted.map(c => c.week_date),
        datasets: [
          {
            label: 'Weight (kg)',
            data:  sorted.map(c => c.weight_kg),
            borderColor: '#C8923A', backgroundColor: 'rgba(200,146,58,0.1)',
            tension: 0.35, spanGaps: true, yAxisID: 'y'
          },
          {
            label: 'Body Fat %',
            data:  sorted.map(c => c.body_fat_pct),
            borderColor: '#4a9eff', backgroundColor: 'rgba(74,158,255,0.1)',
            tension: 0.35, spanGaps: true, yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { color: '#fff', font: { family: 'Montserrat' } } } },
        scales: {
          x:  { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.07)' } },
          y:  { ticks: { color: '#C8923A' }, grid: { color: 'rgba(255,255,255,0.07)' }, position: 'left' },
          y1: { ticks: { color: '#4a9eff' }, grid: { display: false }, position: 'right' }
        }
      }
    });
  }

  // Summary table
  document.getElementById('history-content').innerHTML = `
    <div class="table-scroll">
      <table class="data-table">
        <thead><tr>
          <th>Week</th><th>Weight</th><th>BF%</th>
          <th>Waist</th><th>Hips</th><th>Chest</th>
          <th>Steps</th><th>Sleep</th><th>Mood</th><th>Energy</th><th>Calories</th><th>Photo</th>
        </tr></thead>
        <tbody>${checkins.map(c => `
          <tr>
            <td>${c.week_date}</td>
            <td>${c.weight_kg    ? c.weight_kg    + ' kg' : '—'}</td>
            <td>${c.body_fat_pct ? c.body_fat_pct + '%'   : '—'}</td>
            <td>${c.waist_cm     ? c.waist_cm     + ' cm' : '—'}</td>
            <td>${c.hips_cm      ? c.hips_cm      + ' cm' : '—'}</td>
            <td>${c.chest_cm     ? c.chest_cm     + ' cm' : '—'}</td>
            <td>${c.steps        ? Number(c.steps).toLocaleString()    : '—'}</td>
            <td>${c.sleep_hours  ? c.sleep_hours  + ' h' : '—'}</td>
            <td>${c.mood_score   ? c.mood_score   + '/10': '—'}</td>
            <td>${c.energy_score ? c.energy_score + '/10': '—'}</td>
            <td>${c.calories     ? Number(c.calories).toLocaleString() : '—'}</td>
            <td>${c.photo_url    ? `<a href="${esc(c.photo_url)}" target="_blank">View</a>` : '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${checkins.filter(c => c.photo_url).length ? `
      <h3 class="sub-heading" style="margin-top:2rem">Progress Photos</h3>
      <div class="photos">${checkins.filter(c => c.photo_url).map(c => `
        <div class="photo-item">
          <img src="${esc(c.photo_url)}" alt="Progress ${c.week_date}" loading="lazy">
          <span class="photo-date">${c.week_date}</span>
        </div>`).join('')}
      </div>` : ''}`;
}

// ── Messages ─────────────────────────────────────────
async function loadMessages() {
  const res = await api('/api/messages');
  if (!res?.ok) return;
  renderMessages(await res.json());
}

function renderMessages(messages) {
  const thread = document.getElementById('msg-thread');
  if (!messages.length) {
    thread.innerHTML = '<p class="empty-state" style="padding:1rem">No messages yet — Dom will be in touch!</p>';
    return;
  }
  thread.innerHTML = messages.map(m => `
    <div class="msg msg-${m.sender}">
      <div class="msg-bubble">${esc(m.body)}</div>
      <div class="msg-time">${new Date(m.created_at).toLocaleString('en-GB', { dateStyle:'short', timeStyle:'short' })}</div>
    </div>`).join('');
  thread.scrollTop = thread.scrollHeight;
}

async function handleSendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('msg-input');
  const body  = input.value.trim();
  if (!body) return;

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;

  const res = await api('/api/messages', { method: 'POST', body: JSON.stringify({ body }) });
  if (res?.ok) {
    input.value = '';
    const msgsRes = await api('/api/messages');
    if (msgsRes?.ok) renderMessages(await msgsRes.json());
  }
  btn.disabled = false;
}
