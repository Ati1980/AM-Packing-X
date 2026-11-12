/**
 * AM Packing X - Modern Engine Controller
 */
const MACHINES = [
  { id: 1, name: 'เครื่องบรรจุ 1Kg No.1', color: '#f87171' },
  { id: 2, name: 'เครื่องบรรจุ 1Kg No.2', color: '#fbbf24' },
  { id: 3, name: 'เครื่องบรรจุ 1Kg No.3', color: '#facc15' },
  { id: 4, name: 'เครื่องบรรจุ 1Kg No.4', color: '#34d399' },
  { id: 5, name: 'เครื่องบรรจุ 1Kg No.5', color: '#60a5fa' },
  { id: 6, name: 'เครื่องบรรจุ 1Kg No.6', color: '#a78bfa' },
  { id: 7, name: 'เครื่องบรรจุ 1Kg No.7', color: '#f472b6' }
];

const MACHINE_DEFAULTS = {
  1: {
    group1: { tempFront: [175, 210], tempBack: [175, 210], tempMid: [175, 210], timeFrontBack: null, timeMid: null },
    group2: { tempFront: [170, 190], tempBack: [170, 190], tempMid: [170, 185], timeFrontBack: null, timeMid: null }
  },
  2: { tempFront: [175, 210], tempBack: [175, 210], tempMid: [175, 210], timeFrontBack: null, timeMid: null },
  3: { tempFront: [175, 190], tempBack: [175, 190], tempMid: [165, 185], timeFrontBack: [80, 350], timeMid: [120, 320] },
  4: { tempFront: [170, 185], tempBack: [170, 185], tempMid: [170, 185], timeFrontBack: [150, 1300], timeMid: [150, 900] },
  5: { tempFront: [160, 180], tempBack: [160, 180], tempMid: [165, 175], timeFrontBack: [150, 1300], timeMid: [150, 900] },
  6: { tempFront: [160, 180], tempBack: [160, 180], tempMid: [165, 175], timeFrontBack: [110, 350], timeMid: [120, 320] },
  7: { tempFront: [145, 170], tempBack: [145, 170], tempMid: [150, 175], timeFrontBack: [110, 350], timeMid: [120, 320] }
};

let selectedMachine = 1;
let records = [];
let currentISOString = new Date().toISOString();
let currentView = 'form';

let selVals = {
  seg_lot: null, seg_teflon: null, seg_packseal_top: null,
  seg_packseal_mid: null, seg_packseal_bot: null, seg_hole: null
};

const pad = n => String(n).padStart(2, '0');
const machineById = id => MACHINES.find(m => m.id === id);

// ==========================================
// THEME MANAGER
// ==========================================
function initTheme() {
  const saved = localStorage.getItem('am_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));

  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('am_theme', theme);

  const icon = document.getElementById('themeIcon');
  const meta = document.getElementById('metaThemeColor');

  if (theme === 'light') {
    icon.className = 'fa-solid fa-moon';
    if (meta) meta.setAttribute('content', '#f8fafc');
  } else {
    icon.className = 'fa-solid fa-sun';
    if (meta) meta.setAttribute('content', '#090d16');
  }

  if (currentView === 'dashboard') renderDashboard();
}

function fmtDT(v) {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d) ? v : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isToday(dt) {
  if (!dt) return false;
  const d = new Date(dt), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('show'), 2400);
}

function showPopup(msg) {
  if (msg) document.getElementById('modalDesc').textContent = msg;
  document.getElementById('successModal').classList.add('active');
}
function hidePopup() {
  document.getElementById('successModal').classList.remove('active');
}

function updateLiveClock() {
  const d = new Date();
  currentISOString = d.toISOString();
  const timeStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  document.getElementById('clock').textContent = timeStr;
  const dtChip = document.getElementById('f_datetime_view');
  if (dtChip) dtChip.textContent = `📅 ${timeStr}`;
}

function checkRangeStatus(valId, minId, maxId, targetLiveId) {
  const rawVal = document.getElementById(valId).value.trim();
  const min = parseFloat(document.getElementById(minId).value);
  const max = parseFloat(document.getElementById(maxId).value);
  const box = document.getElementById(targetLiveId);

  if (!rawVal) {
    box.textContent = '—';
    box.className = 'status-indicator-tag';
    return 'unknown';
  }

  let isOk = false;
  if (rawVal.includes('-')) {
    const parts = rawVal.split('-').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      isOk = isNaN(min) || isNaN(max) ? true : (parts[0] >= min && parts[1] <= max);
    }
  } else {
    const v = parseFloat(rawVal);
    if (isNaN(v)) {
      box.textContent = '—';
      box.className = 'status-indicator-tag';
      return 'unknown';
    }
    isOk = isNaN(min) || isNaN(max) ? true : (v >= min && v <= max);
  }

  box.textContent = isOk ? `✔ ปกติ (${min}-${max})` : `✘ หลุดสเปค (${min}-${max})`;
  box.className = 'status-indicator-tag ' + (isOk ? 'pass' : 'fail');
  return isOk ? 'pass' : 'fail';
}

function updateAllLiveStatus() {
  checkRangeStatus('f_temp_front', 'f_temp_front_min', 'f_temp_front_max', 'live_temp_front');
  checkRangeStatus('f_temp_back', 'f_temp_back_min', 'f_temp_back_max', 'live_temp_back');
  checkRangeStatus('f_temp_mid', 'f_temp_mid_min', 'f_temp_mid_max', 'live_temp_mid');
  if (selectedMachine !== 1 && selectedMachine !== 2) {
    checkRangeStatus('f_time_frontback', 'f_time_frontback_min', 'f_time_frontback_max', 'live_time_frontback');
    checkRangeStatus('f_time_mid', 'f_time_mid_min', 'f_time_mid_max', 'live_time_mid');
  }
}

function applyMachineDefaults() {
  const isNo12 = (selectedMachine === 1 || selectedMachine === 2);
  document.getElementById('lbl_temp_front').textContent = isNo12 ? '🌡️ ซีลบน (°C)' : '🌡️ ซีลหน้า (°C)';
  document.getElementById('lbl_temp_back').textContent = isNo12 ? '🌡️ ซีลล่าง (°C)' : '🌡️ ซีลหลัง (°C)';

  document.getElementById('row_time_frontback').style.display = isNo12 ? 'none' : 'flex';
  document.getElementById('row_time_mid').style.display = isNo12 ? 'none' : 'flex';
  document.getElementById('no1GroupSelector').style.display = (selectedMachine === 1) ? 'block' : 'none';

  let defs = (selectedMachine === 1)
    ? MACHINE_DEFAULTS[1][document.getElementById('f_no1_group_select').value]
    : MACHINE_DEFAULTS[selectedMachine];

  const setVal = (idMin, idMax, range) => {
    document.getElementById(idMin).value = range ? range[0] : '';
    document.getElementById(idMax).value = range ? range[1] : '';
  };

  if (defs) {
    setVal('f_temp_front_min', 'f_temp_front_max', defs.tempFront);
    setVal('f_temp_back_min', 'f_temp_back_max', defs.tempBack);
    setVal('f_temp_mid_min', 'f_temp_mid_max', defs.tempMid);
    if (!isNo12) {
      setVal('f_time_frontback_min', 'f_time_frontback_max', defs.timeFrontBack);
      setVal('f_time_mid_min', 'f_time_mid_max', defs.timeMid);
    }
  }
  updateAllLiveStatus();
}

function recordOk(r) {
  return r.tfStatus !== 'fail' && r.tbStatus !== 'fail' && r.tmStatus !== 'fail' &&
         r.timeFbStatus !== 'fail' && r.timeMStatus !== 'fail' &&
         (r.lot === 'pass' || r.lot === 'ผ่าน') &&
         r.teflon === 'pass' && r.packSealTop === 'pass' && r.packSealMid === 'pass' &&
         r.packSealBot === 'pass' && r.hole === 'pass';
}

function renderMachineChips() {
  const wrap = document.getElementById('mScroller');
  if (!wrap) return;

  const items = MACHINES.map(m => {
    const cnt = records.filter(r => (r.machine === m.id || r.machine === m.name) && isToday(r.datetime)).length;
    return `
      <div class="machine-chip ${selectedMachine === m.id ? 'active' : ''}" data-m="${m.id}">
        <span class="chip-dot" style="background:${m.color};box-shadow:0 0 6px ${m.color};"></span>
        <span class="chip-name">No.${m.id}</span>
        <span class="chip-count">${cnt}</span>
      </div>`;
  }).join('');

  wrap.innerHTML = items;

  wrap.querySelectorAll('.machine-chip').forEach(el => {
    el.addEventListener('click', () => {
      const v = Number(el.dataset.m);
      selectedMachine = v;
      applyMachineDefaults();
      renderAll();
    });
  });
}

function renderSummary() {
  const today = records.filter(r => isToday(r.datetime));
  const passToday = today.filter(recordOk).length;
  const failToday = today.length - passToday;
  const rate = today.length ? Math.round((passToday / today.length) * 100) : 100;

  document.getElementById('summary').innerHTML = `
    <div class="hud-tile"><div class="hud-val" style="color:var(--accent-cyan);">${today.length}</div><div class="hud-lbl">บันทึกวันนี้ (ชุด)</div></div>
    <div class="hud-tile"><div class="hud-val" style="color:var(--status-good);">${passToday}</div><div class="hud-lbl">ผ่านเกณฑ์สมบูรณ์</div></div>
    <div class="hud-tile"><div class="hud-val" style="color:var(--status-bad);">${failToday}</div><div class="hud-lbl">พบจุดหลุดสเปค</div></div>
    <div class="hud-tile"><div class="hud-val" style="color:var(--accent-violet);">${rate}%</div><div class="hud-lbl">Pass Rate ประจำวัน</div></div>
  `;

  const mBadge = document.getElementById('todayBadge');
  const dBadge = document.getElementById('deskTodayBadge');
  mBadge.style.display = today.length > 0 ? 'inline-block' : 'none';
  mBadge.textContent = today.length;
  dBadge.textContent = today.length;
}

function renderHeaderBits() {
  const m = machineById(selectedMachine);
  const tag = document.getElementById('formMachineTag');
  const title = document.getElementById('formTitle');

  if (selectedMachine === 'all') {
    tag.textContent = 'เลือกเครื่องตรวจ';
    title.innerHTML = '⚡ บันทึกพารามิเตอร์ประจำวัน';
  } else {
    tag.textContent = m.name;
    title.innerHTML = `⚡ บันทึกพารามิเตอร์ — <span style="color:${m.color}">${m.name}</span>`;
  }
}

function renderRecordCards() {
  const fResult = document.getElementById('filterResult').value;
  const fMachine = document.getElementById('filterMachine').value;
  const fDate = document.getElementById('filterDate').value;

  let list = records.slice();
  if (fDate) list = list.filter(r => r.datetime && r.datetime.startsWith(fDate));
  if (fMachine !== 'all') {
    const m = machineById(Number(fMachine));
    if (m) list = list.filter(r => r.machine === m.name || r.machine === m.id);
  }
  if (fResult === 'pass') list = list.filter(recordOk);
  if (fResult === 'fail') list = list.filter(r => !recordOk(r));

  const wrap = document.getElementById('recList');
  const empty = document.getElementById('emptyState');

  if (list.length === 0) {
    wrap.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  wrap.innerHTML = list.map(r => {
    const m = MACHINES.find(it => it.name === r.machine || it.id === r.machine) || { name: r.machine, color: '#38bdf8' };
    const ok = recordOk(r);
    return `<div class="ticket-card">
      <div class="ticket-head" onclick="this.nextElementSibling.classList.toggle('hidden')">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="width:10px;height:10px;border-radius:50%;background:${m.color};box-shadow:0 0 8px ${m.color};"></span>
          <div>
            <div class="ticket-meta-title">${m.name}</div>
            <div class="ticket-meta-sub">${fmtDT(r.datetime)} | กะ ${r.shift} | ผู้ตรวจ: ${r.operator}</div>
          </div>
        </div>
        <span class="ticket-pill ${ok ? 'pass' : 'fail'}">${ok ? '✔ ผ่านครบ' : '✘ ไม่ผ่าน'}</span>
      </div>
      <div class="ticket-drawer hidden">
        <div class="drawer-grid">
          <div class="drawer-metric"><span>ความเร็วบรรจุ:</span><b>${r.speed} bag/m</b></div>
          <div class="drawer-metric"><span>เวลาแช่จอ:</span><b>${r.timeFrontBack || '-'} / ${r.timeMid || '-'} ms</b></div>
          <div class="drawer-metric"><span>อุณหภูมิหน้า/หลัง:</span><b>${r.tempFront || '-'} / ${r.tempBack || '-'} °C</b></div>
          <div class="drawer-metric"><span>อุณหภูมิกลาง:</span><b>${r.tempMid || '-'} °C</b></div>
        </div>
        ${r.notes ? `<div class="drawer-notes"><b>หมายเหตุ:</b> ${r.notes}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function renderDashboard() {
  const wrap = document.getElementById('dashContent');
  if (selectedMachine === 'all') {
    wrap.innerHTML = `<div class="deck-empty"><i class="fa-solid fa-chart-radar empty-symbol"></i><h3>กรุณาเลือกเครื่องจักรที่แถบด้านบน</h3><p>เพื่อเรนเดอร์กราฟวิเคราะห์แนวโน้มพารามิเตอร์แบบเจาะจง</p></div>`;
    return;
  }

  const m = machineById(selectedMachine);
  const recs = records.filter(r => r.machine === m.name || r.machine === selectedMachine)
                      .slice().sort((a, b) => new Date(a.datetime) - new Date(b.datetime)).slice(-30);

  if (recs.length === 0) {
    wrap.innerHTML = `<div class="deck-empty"><i class="fa-solid fa-chart-simple empty-symbol"></i><h3>ยังไม่มีข้อมูลบันทึก</h3><p>ไม่พบรายการข้อมูลสำหรับเครื่อง ${m.name}</p></div>`;
    return;
  }

  const labels = recs.map(r => fmtDT(r.datetime).slice(0, 10));
  const speeds = recs.map(r => r.speed);

  wrap.innerHTML = `
    <div class="analytics-grid-dual">
      <div class="analytics-card">
        <h3><i class="fa-solid fa-gauge-high" style="color:var(--accent-cyan)"></i> แนวโน้มความเร็วบรรจุ Speed (bag/min)</h3>
        <div class="chart-frame"><canvas id="chart_speed"></canvas></div>
      </div>
      <div class="analytics-card">
        <h3><i class="fa-solid fa-temperature-sun" style="color:var(--status-warn)"></i> แนวโน้มค่าอุณหภูมิความร้อน (°C)</h3>
        <div class="chart-frame"><canvas id="chart_temp"></canvas></div>
      </div>
    </div>
  `;

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const gridColor = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)';
  const textColor = isLight ? '#64748b' : '#8b98a5';

  new Chart(document.getElementById('chart_speed'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Speed (bag/min)',
        data: speeds,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        tension: 0.35,
        fill: true,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: textColor }, grid: { display: false } },
        y: { ticks: { color: textColor }, grid: { color: gridColor } }
      }
    }
  });

  new Chart(document.getElementById('chart_temp'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'ซีลหน้า/บน', data: recs.map(r => r.tempFront), borderColor: '#f87171', tension: 0.25 },
        { label: 'ซีลหลัง/ล่าง', data: recs.map(r => r.tempBack), borderColor: '#60a5fa', tension: 0.25 },
        { label: 'ซีลกลาง', data: recs.map(r => r.tempMid), borderColor: '#34d399', tension: 0.25 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: textColor }, grid: { display: false } },
        y: { ticks: { color: textColor }, grid: { color: gridColor } }
      }
    }
  });
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.deck-view').forEach(p => p.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');

  document.querySelectorAll('.tab-item, .dock-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });

  if (view === 'dashboard') renderDashboard();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function onSubmit(e) {
  e.preventDefault();
  if (selectedMachine === 'all') {
    showToast('กรุณาเลือกเครื่องที่ต้องการบันทึกก่อน');
    return;
  }

  const tfStatus = checkRangeStatus('f_temp_front', 'f_temp_front_min', 'f_temp_front_max', 'live_temp_front');
  const tbStatus = checkRangeStatus('f_temp_back', 'f_temp_back_min', 'f_temp_back_max', 'live_temp_back');
  const tmStatus = checkRangeStatus('f_temp_mid', 'f_temp_mid_min', 'f_temp_mid_max', 'live_temp_mid');

  let timeFbStatus = 'pass', timeMStatus = 'pass';
  if (selectedMachine !== 1 && selectedMachine !== 2) {
    timeFbStatus = checkRangeStatus('f_time_frontback', 'f_time_frontback_min', 'f_time_frontback_max', 'live_time_frontback');
    timeMStatus = checkRangeStatus('f_time_mid', 'f_time_mid_min', 'f_time_mid_max', 'live_time_mid');
  }

  const m = machineById(selectedMachine);
  const rec = {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    machine: m.name,
    datetime: currentISOString,
    shift: document.querySelector('input[name="f_shift"]:checked').value,
    operator: document.getElementById('f_operator').value,
    speed: parseFloat(document.getElementById('f_speed').value) || 0,
    tempFront: parseFloat(document.getElementById('f_temp_front').value) || null,
    tempFrontMin: parseFloat(document.getElementById('f_temp_front_min').value) || null,
    tempFrontMax: parseFloat(document.getElementById('f_temp_front_max').value) || null,
    tfStatus,
    tempBack: parseFloat(document.getElementById('f_temp_back').value) || null,
    tempBackMin: parseFloat(document.getElementById('f_temp_back_min').value) || null,
    tempBackMax: parseFloat(document.getElementById('f_temp_back_max').value) || null,
    tbStatus,
    tempMid: parseFloat(document.getElementById('f_temp_mid').value) || null,
    tempMidMin: parseFloat(document.getElementById('f_temp_mid_min').value) || null,
    tempMidMax: parseFloat(document.getElementById('f_temp_mid_max').value) || null,
    tmStatus,
    timeFrontBack: (selectedMachine === 1 || selectedMachine === 2) ? null : document.getElementById('f_time_frontback').value.trim() || null,
    timeFrontBackMin: (selectedMachine === 1 || selectedMachine === 2) ? null : parseFloat(document.getElementById('f_time_frontback_min').value) || null,
    timeFrontBackMax: (selectedMachine === 1 || selectedMachine === 2) ? null : parseFloat(document.getElementById('f_time_frontback_max').value) || null,
    timeFbStatus,
    timeMid: (selectedMachine === 1 || selectedMachine === 2) ? null : document.getElementById('f_time_mid').value.trim() || null,
    timeMidMin: (selectedMachine === 1 || selectedMachine === 2) ? null : parseFloat(document.getElementById('f_time_mid_min').value) || null,
    timeMidMax: (selectedMachine === 1 || selectedMachine === 2) ? null : parseFloat(document.getElementById('f_time_mid_max').value) || null,
    timeMStatus,
    lot: selVals.seg_lot,
    teflon: selVals.seg_teflon,
    packSealTop: selVals.seg_packseal_top,
    packSealMid: selVals.seg_packseal_mid,
    packSealBot: selVals.seg_packseal_bot,
    hole: selVals.seg_hole,
    notes: document.getElementById('f_notes').value.trim()
  };

  records.unshift(rec);
  renderAll();
  showPopup(`บันทึกข้อมูล ${m.name} เรียบร้อยแล้ว`);
  document.getElementById('entryForm').reset();
  applyMachineDefaults();

  try {
    await DatabaseService.submitRecord(rec);
    showToast('ซิงค์ข้อมูลลงฐานข้อมูลสำเร็จ ✔');
  } catch (err) {
    showToast('บันทึกลงแคชในเครื่องแล้ว (รอซิงค์เมื่อออนไลน์)');
  }
}

function renderAll() {
  renderMachineChips();
  renderSummary();
  renderHeaderBits();
  renderRecordCards();
  if (currentView === 'dashboard') renderDashboard();
}

function initEventHandlers() {
  ['seg_lot', 'seg_teflon', 'seg_packseal_top', 'seg_packseal_mid', 'seg_packseal_bot', 'seg_hole'].forEach(id => {
    document.getElementById(id).querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        selVals[id] = btn.dataset.val;
        document.getElementById(id).querySelectorAll('button').forEach(b => b.classList.remove('on', 'pass', 'fail'));
        btn.classList.add('on', btn.dataset.val);
      });
    });
  });

  ['f_temp_front', 'f_temp_back', 'f_temp_mid', 'f_time_frontback', 'f_time_mid'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateAllLiveStatus);
  });

  document.getElementById('f_no1_group_select').addEventListener('change', applyMachineDefaults);
  document.getElementById('entryForm').addEventListener('submit', onSubmit);
  document.getElementById('closeModalBtn').addEventListener('click', hidePopup);
  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('entryForm').reset();
    applyMachineDefaults();
  });

  document.querySelectorAll('.tab-item, .dock-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.getElementById('filterDate').addEventListener('change', renderRecordCards);
  document.getElementById('filterResult').addEventListener('change', renderRecordCards);
  document.getElementById('filterMachine').addEventListener('change', renderRecordCards);

  document.getElementById('refreshBtn').addEventListener('click', async () => {
    showToast('กำลังซิงค์ข้อมูลล่าสุด...');
    const res = await DatabaseService.fetchRecords(true);
    records = res.data;
    renderAll();
    showToast(res.synced ? 'อัปเดตข้อมูลล่าสุดเรียบร้อย ✔' : 'ใช้ข้อมูลออฟไลน์');
  });
}

(async function init() {
  initTheme();
  document.getElementById('filterMachine').innerHTML = '<option value="all">ทุกเครื่อง</option>' + MACHINES.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  initEventHandlers();
  applyMachineDefaults();
  updateLiveClock();
  setInterval(updateLiveClock, 1000);

  records = DatabaseService.getLocalRecords();
  renderAll();

  const res = await DatabaseService.fetchRecords();
  records = res.data;
  renderAll();
})();