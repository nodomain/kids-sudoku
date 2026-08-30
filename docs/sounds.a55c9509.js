/*
 * sounds.js - Satisfying sound effects via Web Audio API
 * No external files needed. All synthesized.
 */

const Sounds = (() => {
  let ctx = null;
  let muted = false;

  function getCtx() {
    if (muted) return null;
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function setMuted(m) { muted = m; }
  function isMuted() { return muted; }

  // Play a tone with envelope
  function tone(freq, duration = 0.15, type = 'sine', vol = 0.3) {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  }

  // Soft click when placing a number
  function place() {
    tone(880, 0.08, 'sine', 0.2);
  }

  // Gentle "pop" when selecting a cell
  function tap() {
    tone(660, 0.05, 'sine', 0.12);
  }

  // Error / conflict sound
  function error() {
    tone(220, 0.12, 'square', 0.15);
    setTimeout(() => tone(180, 0.15, 'square', 0.12), 80);
  }

  // Undo sound
  function undo() {
    tone(440, 0.08, 'triangle', 0.15);
  }

  // Hint sound - gentle chime
  function hint() {
    tone(523, 0.12, 'sine', 0.2);
    setTimeout(() => tone(659, 0.12, 'sine', 0.2), 100);
  }

  // Win fanfare - ascending arpeggio (variant 1)
  function win() {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((f, i) => {
      setTimeout(() => tone(f, 0.25, 'sine', 0.25), i * 120);
    });
    setTimeout(() => {
      tone(1047, 0.4, 'sine', 0.2);
      tone(1319, 0.4, 'sine', 0.15);
    }, 500);
  }

  // Win fanfare variant 2 - triumphant
  function win2() {
    const notes = [392, 494, 587, 784]; // G4 B4 D5 G5
    notes.forEach((f, i) => {
      setTimeout(() => tone(f, 0.2, 'sine', 0.25), i * 100);
    });
    setTimeout(() => {
      tone(784, 0.3, 'sine', 0.2);
      tone(988, 0.3, 'sine', 0.15);
      tone(1175, 0.5, 'sine', 0.12);
    }, 450);
  }

  // Win fanfare variant 3 - playful
  function win3() {
    const notes = [440, 554, 659, 880, 1109, 880]; // A4 C#5 E5 A5 C#6 A5
    notes.forEach((f, i) => {
      setTimeout(() => tone(f, 0.15, 'triangle', 0.2), i * 90);
    });
    setTimeout(() => tone(1109, 0.5, 'sine', 0.18), 600);
  }

  // Randomly pick a win sound
  function winRandom() {
    const fns = [win, win2, win3];
    fns[Math.floor(Math.random() * fns.length)]();
  }

  // Star earned - bright ping
  function star() {
    tone(1200, 0.15, 'sine', 0.2);
  }

  // Button / navigation click
  function click() {
    tone(500, 0.04, 'sine', 0.1);
  }

  // Erase sound
  function erase() {
    tone(350, 0.06, 'triangle', 0.12);
  }

  return { place, tap, error, undo, hint, win, winRandom, star, erase, click, setMuted, isMuted };
})();
