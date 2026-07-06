/* ========================= 04 AUDIO ========================= */
let AC = null;
function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return AC; }
function tone(freq, dur, type, vol, when) {
  const ac = audio(); if (!ac) return;
  const t0 = ac.currentTime + (when || 0);
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type || 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.12, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.05);
}
function sfxGoldCut(n)  { tone(440 * Math.pow(1.12246, n), 0.22, 'triangle', 0.14); tone(880 * Math.pow(1.12246, n), 0.10, 'sine', 0.05); }
function sfxAshCut()    { tone(150, 0.16, 'sine', 0.14); }
function sfxDeflect()   { tone(1900, 0.05, 'square', 0.05); tone(2600, 0.08, 'sine', 0.04); }
function sfxMiniLock()  { tone(660, 0.3, 'triangle', 0.12); tone(990, 0.2, 'sine', 0.05, 0.04); }
function sfxMiniAsh()   { tone(220, 0.25, 'sine', 0.1); }
function sfxLock()      { tone(196, 1.1, 'triangle', 0.16); tone(392, 0.9, 'sine', 0.07, 0.05); tone(587, 0.6, 'sine', 0.05, 0.1); }
function sfxFizzle()    { tone(300, 0.25, 'sine', 0.08); tone(210, 0.35, 'sine', 0.07, 0.08); }
// Ambient world-event cue hook (S1-D027): world events that happen while the
// world is receded must not be silent-missable. No caller exists until
// ecology E1 lands (M1c) — E1 events route through here.
function sfxWorldCue(kind) {
  if (!AC) return; // world events never initiate audio; a user gesture must have
  if (kind === 'crackle') tone(120 + Math.random() * 60, 0.12, 'sine', 0.04);
  else if (kind === 'startle') tone(520, 0.09, 'triangle', 0.05);
}
function speak(ch) {
  try {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(ch);
    u.lang = 'zh-CN'; u.rate = 0.75;
    const v = speechSynthesis.getVoices().find(v => /^zh/i.test(v.lang));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (e) {}
}
