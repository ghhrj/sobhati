'use strict';
/* ===== Data ===== */
const DHIKR = ['سبحان الله','الحمد لله','الله أكبر','أستغفر الله','لا إله إلا الله','سبحان الله وبحمده','سبحان الله العظيم','الصلاة على النبي ﷺ'];
const GOALS = [33, 100, 500, 1000];
const KEY = 'sobhati:v1';
const $ = (s) => document.querySelector(s);
const openDlg = (d) => (d.showModal ? d.showModal() : d.setAttribute('open', ''));
const closeDlg = (d) => (d.close ? d.close() : d.removeAttribute('open'));
const defaults = { count: 0, dhikr: 0, goal: 33, settings: { sound: true, vibrate: true, dark: false, size: 'md' }, days: {} };

/* ===== Storage ===== */
const Store = {
  load() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY)) || {};
      return { ...defaults, ...p, settings: { ...defaults.settings, ...(p.settings || {}) }, days: p.days || {} };
    } catch { return JSON.parse(JSON.stringify(defaults)); }
  },
  save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* التخزين غير متاح */ } }
};
let S = Store.load();
let sessionActive = false, goalShown = false;
const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA');
const today = () => { const k = dayKey(); return S.days[k] || (S.days[k] = { n: 0, sessions: 0, by: {} }); };

/* ===== Feedback (sound / vibration / toast) ===== */
let audio;
function click() {
  if (S.settings.sound) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = 660; o.type = 'sine';
      g.gain.setValueAtTime(.12, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .08);
      o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + .09);
    } catch { /* تجاهل */ }
  }
  if (S.settings.vibrate && navigator.vibrate) navigator.vibrate(15);
}
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200);
}
function confirmBox(text, onYes) {
  const d = $('#confirm'); $('#cText').textContent = text;
  $('#cYes').onclick = () => { closeDlg(d); onYes(); };
  openDlg(d);
}

/* ===== Counter ===== */
function increment(ev) {
  S.count++;
  const t = today(); t.n++;
  t.by[DHIKR[S.dhikr]] = (t.by[DHIKR[S.dhikr]] || 0) + 1;
  if (!sessionActive) { sessionActive = true; t.sessions++; }
  click(); bumpFx(ev); renderAll(); Store.save();
  if (S.count === S.goal && !goalShown) celebrate();
}
function bumpFx(ev) {
  const n = $('#count'); n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump');
  const c = $('#counter'), r = c.getBoundingClientRect();
  const x = ev && ev.clientX ? ev.clientX - r.left : r.width / 2, y = ev && ev.clientY ? ev.clientY - r.top : r.height / 2;
  const el = document.createElement('span'); el.className = 'ripple';
  el.style.cssText = `width:${r.width}px;height:${r.width}px;left:${x - r.width / 2}px;top:${y - r.width / 2}px`;
  c.appendChild(el); setTimeout(() => el.remove(), 650);
}
function celebrate() {
  goalShown = true;
  document.body.classList.add('celebrate'); setTimeout(() => document.body.classList.remove('celebrate'), 2100);
  toast(`🌙 تقبّل الله منك! أتممت ${S.goal} من «${DHIKR[S.dhikr]}»`);
}
function resetCounter() { S.count = 0; sessionActive = false; goalShown = false; renderAll(); Store.save(); }

/* ===== Goal ===== */
function setGoal(n) {
  n = Math.floor(Number(n));
  if (!n || n < 1 || n > 100000) return toast('أدخل رقمًا بين 1 و 100000');
  S.goal = n; goalShown = S.count >= n; renderAll(); Store.save();
}

/* ===== Render ===== */
function renderAll() {
  $('#count').textContent = S.count;
  $('#currentDhikr').textContent = DHIKR[S.dhikr];
  const pct = Math.min(100, Math.round(S.count / S.goal * 100));
  $('#ringBar').style.strokeDashoffset = 302.8 * (1 - pct / 100);
  $('#ringBar').style.opacity = pct ? 1 : 0;
  $('#pFill').style.width = pct + '%'; $('#pBar').setAttribute('aria-valuenow', pct);
  $('#gCur').textContent = S.count; $('#gGoal').textContent = S.goal;
  $('#gPct').textContent = pct + '%'; $('#gLeft').textContent = Math.max(0, S.goal - S.count);
  document.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(+c.dataset.g === S.goal)));
  document.querySelectorAll('.dhikr').forEach((d, i) => d.setAttribute('aria-checked', String(i === S.dhikr)));
  renderStats();
}
function renderStats() {
  const t = today(), all = Object.values(S.days);
  $('#stToday').textContent = t.n; $('#stSessions').textContent = t.sessions;
  $('#stTotal').textContent = all.reduce((a, d) => a + d.n, 0);
  const tot = {}; all.forEach((d) => Object.entries(d.by).forEach(([k, v]) => (tot[k] = (tot[k] || 0) + v)));
  const top = Object.entries(tot).sort((a, b) => b[1] - a[1])[0];
  $('#stTop').textContent = top ? `${top[0]} (${top[1]})` : '—';
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const vals = days.map((d) => (S.days[dayKey(d)] || {}).n || 0), max = Math.max(...vals, 1);
  $('#chart').innerHTML = days.map((d, i) =>
    `<div class="col"><i style="height:${vals[i] / max * 100}%"></i><b>${vals[i]}</b><span>${d.toLocaleDateString('ar', { weekday: 'short' })}</span></div>`).join('');
}
function applySettings() {
  document.body.classList.toggle('dark', S.settings.dark);
  document.body.dataset.size = S.settings.size;
  $('#optSound').checked = S.settings.sound; $('#optVibrate').checked = S.settings.vibrate; $('#optDark').checked = S.settings.dark;
  document.querySelectorAll('#optSize button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.size === S.settings.size)));
  (document.querySelector('meta[name=theme-color]') || {}).content = S.settings.dark ? '#050f20' : '#071A36';
}

/* ===== Init & events ===== */
function build() {
  $('#goalChips').innerHTML = GOALS.map((g) => `<button class="chip" data-g="${g}" aria-pressed="false">${g} مرة</button>`).join('');
  $('#dhikrGrid').innerHTML = DHIKR.map((d, i) => `<button class="dhikr" role="radio" aria-checked="false" data-i="${i}">${d}</button>`).join('');
}
function bind() {
  $('#counter').addEventListener('click', increment);
  $('#plusBtn').addEventListener('click', increment);
  $('#resetBtn').addEventListener('click', () => confirmBox('هل تريد تصفير العداد؟', resetCounter));
  $('#goalChips').addEventListener('click', (e) => e.target.dataset.g && setGoal(e.target.dataset.g));
  $('#setCustom').addEventListener('click', () => { setGoal($('#customGoal').value); $('#customGoal').value = ''; });
  $('#customGoal').addEventListener('keydown', (e) => e.key === 'Enter' && $('#setCustom').click());
  $('#dhikrGrid').addEventListener('click', (e) => {
    const b = e.target.closest('.dhikr'); if (!b || +b.dataset.i === S.dhikr) return;
    S.dhikr = +b.dataset.i; sessionActive = false; renderAll(); Store.save();
    const c = $('#currentDhikr'); c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
  });
  $('#openSettings').addEventListener('click', () => openDlg($('#settings')));
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeDlg(b.closest('dialog'))));
  document.querySelectorAll('dialog').forEach((d) => d.addEventListener('click', (e) => e.target === d && closeDlg(d)));
  const opt = (id, k) => $(id).addEventListener('change', (e) => { S.settings[k] = e.target.checked; applySettings(); Store.save(); });
  opt('#optSound', 'sound'); opt('#optVibrate', 'vibrate'); opt('#optDark', 'dark');
  $('#optSize').addEventListener('click', (e) => { if (e.target.dataset.size) { S.settings.size = e.target.dataset.size; applySettings(); Store.save(); } });
  $('#resetStats').addEventListener('click', () => confirmBox('سيتم حذف كل الإحصائيات نهائيًا. متابعة؟', () => {
    S.days = {}; sessionActive = false; renderAll(); Store.save(); toast('تمت إعادة تعيين الإحصائيات');
  }));
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('dialog[open]') || /INPUT|TEXTAREA/.test(e.target.tagName) || e.target.closest('button:not(#counter)')) return;
    if ((e.code === 'Space' && e.target.id !== 'counter') || e.key === 'Enter' || e.key === '+') { e.preventDefault(); increment(); }
    else if (e.key.toLowerCase() === 'r' || e.key === 'ر') confirmBox('هل تريد تصفير العداد؟', resetCounter);
  });
  $('#counter').addEventListener('keydown', (e) => { if (e.code === 'Space') e.preventDefault(); }); // يمنع التكرار المزدوج
  $('#counter').addEventListener('keyup', (e) => { if (e.code === 'Space') { e.preventDefault(); increment(); } });
}
build(); bind(); applySettings(); goalShown = S.count >= S.goal; renderAll();

/* ===== PWA ===== */
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
