/* ===================================================
   DOM SHARPE FITNESS — Admin Dashboard
=================================================== */

let token        = localStorage.getItem('ss_admin_token');
let currentClient = null;
let trendChart   = null;

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
  token ? showApp() : showLogin();

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', logout);

  document.getElementById('nav-consultations').addEventListener('click', () => showSection('consultations'));
  document.getElementById('nav-clients').addEventListener('click',       () => showSection('clients'));
  document.getElementById('nav-new-client').addEventListener('click',    () => showSection('new-client'));

  document.getElementById('new-client-form').addEventListener('submit', handleNewClient);
  document.getElementById('msg-form').addEventListener('submit',        handleSendMessage);
  document.getElementById('back-btn').addEventListener('click', () => {
    currentClient = null;
    showSection('clients');
  });

  // Mobile sidebar toggle
  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
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
  if (!data.user.is_dom) {
    errEl.textContent = 'This portal is for Dom only. Clients use portal.html';
    btn.disabled = false;
    btn.textContent = 'Log In';
    return;
  }

  token = data.token;
  localStorage.setItem('ss_admin_token', token);
  showApp();
}

function logout() {
  token = null;
  currentClient = null;
  localStorage.removeItem('ss_admin_token');
  showLogin();
}

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  showSection('consultations');
}

// ── Navigation ──────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const el  = document.getElementById(`section-${name}`);
  const nav = document.getElementById(`nav-${name}`);
  if (el)  el.classList.remove('hidden');
  if (nav) nav.classList.add('active');

  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('open');

  if (name === 'consultations') loadConsultations();
  if (name === 'clients')       loadClients();
  if (name === 'client-detail' && currentClient) loadClientDetail(currentClient);
}

// ── Consultations ────────────────────────────────────
async function loadConsultations() {
  const res = await api('/api/consultations');
  if (!res?.ok) return;
  renderConsultations(await res.json());
}

function renderConsultations(list) {
  const tbody = document.getElementById('consultations-tbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="td-empty">No consultations yet.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(c => `
    <tr>
      <td data-label="Name">${esc(c.name)}</td>
      <td data-label="Email"><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></td>
      <td data-label="Goal">${esc(c.goal) || '—'}</td>
      <td data-label="Availability">${esc(c.availability) || '—'}</td>
      <td data-label="Date">${new Date(c.created_at).toLocaleDateString('en-GB')}</td>
      <td data-label="Status">
        <select class="status-select status-${c.status}" onchange="updateStatus('${c.id}', this.value)">
          <option value="new"       ${c.status==='new'       ? 'selected':''}>New</option>
          <option value="contacted" ${c.status==='contacted' ? 'selected':''}>Contacted</option>
          <option value="converted" ${c.status==='converted' ? 'selected':''}>Converted</option>
        </select>
      </td>
    </tr>`).join('');
}

async function updateStatus(id, status) {
  await api(`/api/consultations/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
  const select = document.querySelector(`[onchange="updateStatus('${id}', this.value)"]`);
  if (select) select.className = `status-select status-${status}`;
}

// ── Clients ──────────────────────────────────────────
async function loadClients() {
  const res = await api('/api/clients');
  if (!res?.ok) return;
  renderClients(await res.json());
}

function renderClients(clients) {
  const grid = document.getElementById('clients-grid');
  if (!clients.length) {
    grid.innerHTML = '<p class="empty-state">No clients yet — add your first client below.</p>';
    return;
  }
  grid.innerHTML = clients.map(c => `
    <div class="client-card" onclick="openClient('${c.id}', '${esc(c.name)}')">
      <div class="client-card-top">
        <div class="client-avatar">${c.name.charAt(0).toUpperCase()}</div>
        <div class="client-card-info">
          <div class="client-name">${esc(c.name)}</div>
          <div class="client-email">${esc(c.email)}</div>
        </div>
        ${c.unread_count > 0 ? `<span class="unread-badge">${c.unread_count}</span>` : ''}
      </div>
      <div class="client-card-meta">
        <span>${esc(c.goal) || 'No goal set'}</span>
        <span>${c.check_in_count} check-in${c.check_in_count !== 1 ? 's':''}</span>
      </div>
      <div class="client-last">
        Last check-in: ${c.last_check_in ? new Date(c.last_check_in).toLocaleDateString('en-GB') : 'Never'}
      </div>
    </div>`).join('');
}

function openClient(id, name) {
  currentClient = id;
  document.getElementById('detail-client-name').textContent = name;
  showSection('client-detail');
}

// ── Client Detail ────────────────────────────────────
async function loadClientDetail(clientId) {
  const [clientRes, checkinsRes, msgsRes] = await Promise.all([
    api(`/api/clients/${clientId}`),
    api(`/api/checkins?clientId=${clientId}`),
    api(`/api/messages?clientId=${clientId}`)
  ]);

  if (clientRes?.ok)  renderClientInfo(await clientRes.json());
  if (checkinsRes?.ok) {
    const checkins = await checkinsRes.json();
    renderClientStats(checkins);
    renderCheckinTable(checkins);
    renderTrendChart(checkins);
    renderPhotoGrid(checkins);
  }
  if (msgsRes?.ok) renderMessages(await msgsRes.json());
}

function renderClientInfo(c) {
  document.getElementById('client-info').innerHTML = `
    <div class="info-row"><span class="info-label">Email</span><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></div>
    <div class="info-row"><span class="info-label">Goal</span><span>${esc(c.goal) || '—'}</span></div>
    <div class="info-row"><span class="info-label">Experience</span><span>${esc(c.experience) || '—'}</span></div>
    <div class="info-row"><span class="info-label">Client since</span><span>${new Date(c.created_at).toLocaleDateString('en-GB')}</span></div>`;
}

function renderClientStats(checkins) {
  if (!checkins.length) {
    document.getElementById('client-stats').innerHTML = '<p class="empty-state">No check-ins yet.</p>';
    return;
  }
  const latest = checkins[0];
  const stats = [
    ['Weight',   latest.weight_kg    ? `${latest.weight_kg} kg`  : null],
    ['Body Fat', latest.body_fat_pct ? `${latest.body_fat_pct}%` : null],
    ['Mood',     latest.mood_score   ? `${latest.mood_score}/10` : null],
    ['Energy',   latest.energy_score ? `${latest.energy_score}/10` : null],
    ['Sleep',    latest.sleep_hours  ? `${latest.sleep_hours} h` : null],
    ['Steps',    latest.steps        ? Number(latest.steps).toLocaleString() : null],
    ['Calories', latest.calories     ? Number(latest.calories).toLocaleString() : null]
  ].filter(s => s[1]);

  document.getElementById('client-stats').innerHTML = `
    <p class="stats-label">Latest check-in — ${latest.week_date}</p>
    <div class="stats-grid">${stats.map(([l, v]) => `
      <div class="stat-box"><span class="stat-val">${v}</span><span class="stat-lbl">${l}</span></div>`).join('')}
    </div>`;
}

function renderCheckinTable(checkins) {
  if (!checkins.length) { document.getElementById('checkin-table-wrap').innerHTML = ''; return; }
  document.getElementById('checkin-table-wrap').innerHTML = `
    <div class="table-scroll">
      <table class="data-table">
        <thead><tr>
          <th>Week</th><th>Weight</th><th>BF%</th>
          <th>Waist</th><th>Hips</th><th>Chest</th><th>L.Arm</th><th>R.Arm</th><th>L.Thigh</th><th>R.Thigh</th>
          <th>Steps</th><th>Sleep</th><th>Mood</th><th>Energy</th><th>Calories</th>
        </tr></thead>
        <tbody>${checkins.map(c => `
          <tr>
            <td>${c.week_date}</td>
            <td>${c.weight_kg    ? c.weight_kg    + ' kg' : '—'}</td>
            <td>${c.body_fat_pct ? c.body_fat_pct + '%'   : '—'}</td>
            <td>${c.waist_cm     ? c.waist_cm     + ' cm' : '—'}</td>
            <td>${c.hips_cm      ? c.hips_cm      + ' cm' : '—'}</td>
            <td>${c.chest_cm     ? c.chest_cm     + ' cm' : '—'}</td>
            <td>${c.left_arm_cm  ? c.left_arm_cm  + ' cm' : '—'}</td>
            <td>${c.right_arm_cm ? c.right_arm_cm + ' cm' : '—'}</td>
            <td>${c.left_thigh_cm  ? c.left_thigh_cm  + ' cm' : '—'}</td>
            <td>${c.right_thigh_cm ? c.right_thigh_cm + ' cm' : '—'}</td>
            <td>${c.steps        ? Number(c.steps).toLocaleString()    : '—'}</td>
            <td>${c.sleep_hours  ? c.sleep_hours  + ' h' : '—'}</td>
            <td>${c.mood_score   ? c.mood_score   + '/10': '—'}</td>
            <td>${c.energy_score ? c.energy_score + '/10': '—'}</td>
            <td>${c.calories     ? Number(c.calories).toLocaleString() : '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderTrendChart(checkins) {
  const canvas = document.getElementById('trend-chart');
  if (!canvas || !checkins.length) return;
  if (trendChart) trendChart.destroy();

  const sorted = [...checkins].reverse();
  trendChart = new Chart(canvas, {
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

function renderPhotoGrid(checkins) {
  const photos = checkins.filter(c => c.photo_url);
  const el = document.getElementById('photo-grid');
  if (!el) return;
  if (!photos.length) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <h3 class="sub-heading">Progress Photos</h3>
    <div class="photos">${photos.map(c => `
      <div class="photo-item">
        <img src="${esc(c.photo_url)}" alt="Progress ${c.week_date}" loading="lazy">
        <span class="photo-date">${c.week_date}</span>
      </div>`).join('')}
    </div>`;
}

// ── Messages ─────────────────────────────────────────
function renderMessages(messages) {
  const thread = document.getElementById('msg-thread');
  if (!messages.length) {
    thread.innerHTML = '<p class="empty-state" style="padding:1rem">No messages yet.</p>';
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
  if (!body || !currentClient) return;

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;

  const res = await api('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ body, clientId: currentClient })
  });

  if (res?.ok) {
    input.value = '';
    const msgsRes = await api(`/api/messages?clientId=${currentClient}`);
    if (msgsRes?.ok) renderMessages(await msgsRes.json());
  }
  btn.disabled = false;
}

// ── New Client ───────────────────────────────────────
async function handleNewClient(e) {
  e.preventDefault();
  const errEl  = document.getElementById('nc-error');
  const succEl = document.getElementById('nc-success');
  errEl.textContent = '';
  succEl.classList.add('hidden');

  const payload = {
    name:       document.getElementById('nc-name').value.trim(),
    email:      document.getElementById('nc-email').value.trim(),
    password:   document.getElementById('nc-password').value,
    goal:       document.getElementById('nc-goal').value.trim(),
    experience: document.getElementById('nc-experience').value
  };

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;

  const res    = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  const result = await res?.json();

  if (res?.ok) {
    e.target.reset();
    succEl.textContent = `Client "${payload.name}" created successfully.`;
    succEl.classList.remove('hidden');
  } else {
    errEl.textContent = result?.error || 'Failed to create client';
  }
  btn.disabled = false;
}
