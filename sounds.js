/*
 * sounds.js - Satisfying sound effects via Web Audio API
 * No external files needed. All synthesized.
 */

const Sounds = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Play a tone with envelope
  function tone(freq, duration = 0.15, type = 'sine', vol = 0.3) {
    const c = getCtx();
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

  // Win fanfare - ascending arpeggio
  function win() {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((f, i) => {
      setTimeout(() => tone(f, 0.25, 'sine', 0.25), i * 120);
    });
    // Final sparkle
    setTimeout(() => {
      tone(1047, 0.4, 'sine', 0.2);
      tone(1319, 0.4, 'sine', 0.15);
    }, 500);
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

  return { place, tap, error, undo, hint, win, star, erase, click };
})();
