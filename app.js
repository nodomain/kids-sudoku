/*
 * app.js - Kids Sudoku PWA main application
 */

// --- Symbol sets for picture mode ---
const SYMBOL_SETS = {
  animals:   ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🦁', '🐮'],
  fruits:    ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍌'],
  vehicles:  ['🚗', '🚌', '🚀', '✈️', '🚂', '⛵', '🚁', '🏎️', '🛸'],
  shapes:    ['⭐', '❤️', '🔵', '🟢', '🔶', '🟣', '💎', '🌙', '☀️'],
  dinosaurs: ['🦕', '🦖', '🐊', '🦎', '🐢', '🐉', '🦴', '🌋', '🥚'],
  space:     ['🚀', '🌍', '🌙', '⭐', '🛸', '👽', '☄️', '🪐', '🌌'],
  colors:    ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '🟤', '⚪']
};

const AVATARS = ['🦄', '🐉', '🦋', '🐙', '🦖', '🐬', '🦜', '🐝', '🌈', '🍭'];

const MODES = {
  young: [
    { id: '4x4-pics', size: 4, type: 'pictures', icon: '🐾', label: '4×4 Tiere', desc: 'Mit Tierbildern', difficulty: 'easy', symbolSet: 'animals' },
    { id: '4x4-fruits', size: 4, type: 'pictures', icon: '🍎', label: '4×4 Obst', desc: 'Mit Obstbildern', difficulty: 'easy', symbolSet: 'fruits', unlock: 3 },
    { id: '4x4-vehicles', size: 4, type: 'pictures', icon: '🚗', label: '4×4 Fahrzeuge', desc: 'Autos & Raketen', difficulty: 'easy', symbolSet: 'vehicles', unlock: 6 },
    { id: '4x4-dinos', size: 4, type: 'pictures', icon: '🦕', label: '4×4 Dinos', desc: 'Dinosaurier!', difficulty: 'easy', symbolSet: 'dinosaurs', unlock: 10 },
    { id: '4x4-space', size: 4, type: 'pictures', icon: '🚀', label: '4×4 Weltraum', desc: 'Planeten & Sterne', difficulty: 'easy', symbolSet: 'space', unlock: 15 },
    { id: '4x4-colors', size: 4, type: 'pictures', icon: '🌈', label: '4×4 Farben', desc: 'Bunte Kreise', difficulty: 'easy', symbolSet: 'colors', unlock: 8 },
    { id: '4x4-shapes', size: 4, type: 'pictures', icon: '⭐', label: '4×4 Formen', desc: 'Mit bunten Formen', difficulty: 'easy', symbolSet: 'shapes', unlock: 12 },
  ],
  old: [
    { id: '4x4-nums', size: 4, type: 'numbers', icon: '🔢', label: '4×4 Zahlen', desc: 'Aufwärmen', difficulty: 'easy' },
    { id: '6x6-nums', size: 6, type: 'numbers', icon: '🧠', label: '6×6 Zahlen', desc: 'Standard', difficulty: 'easy' },
    { id: '6x6-med', size: 6, type: 'numbers', icon: '🔥', label: '6×6 Knifflig', desc: 'Mehr Lücken', difficulty: 'medium', unlock: 5 },
    { id: '4x4-pics', size: 4, type: 'pictures', icon: '🐾', label: '4×4 Bilder', desc: 'Tierbilder', difficulty: 'easy', symbolSet: 'animals' },
    { id: '4x4-dinos', size: 4, type: 'pictures', icon: '🦕', label: '4×4 Dinos', desc: 'Dinosaurier!', difficulty: 'easy', symbolSet: 'dinosaurs', unlock: 8 },
    { id: '9x9-nums', size: 9, type: 'numbers', icon: '🏆', label: '9×9 Klassisch', desc: 'Das echte Sudoku', difficulty: 'easy', unlock: 10 },
    { id: '9x9-med', size: 9, type: 'numbers', icon: '💪', label: '9×9 Schwer', desc: 'Für Profis', difficulty: 'medium', unlock: 20 },
    { id: '9x9-pics', size: 9, type: 'pictures', icon: '🐾', label: '9×9 Bilder', desc: '9 Tiere!', difficulty: 'easy', symbolSet: 'animals', unlock: 15 },
  ]
};

// --- Difficulty progression ---
// After N solves in a mode, auto-increase difficulty
function getEffectiveDifficulty(mode, solveCount) {
  if (mode.difficulty === 'medium' || mode.difficulty === 'hard') return mode.difficulty;
  if (solveCount >= 10) return 'hard';
  if (solveCount >= 5) return 'medium';
  return 'easy';
}

// --- Daily puzzle ---
function getDailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

function getDailyPuzzle(size) {
  const seed = getDailySeed();
  const rng = seededRandom(seed + size);
  // Use seeded shuffle for reproducible daily puzzle
  const { puzzle, solution } = Sudoku.generateSeeded(size, 'medium', rng);
  return { puzzle, solution, seed };
}

// --- State ---
let state = {
  profiles: [],
  currentProfile: null,
  game: null
};

let timerInterval = null;

// --- Timer ---
function startTimer() {
  stopTimer();
  if (!state.game) return;
  if (!state.game.startTime) state.game.startTime = Date.now();
  if (!state.game.elapsed) state.game.elapsed = 0;
  state.game.startTime = Date.now() - state.game.elapsed * 1000;
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function updateTimerDisplay() {
  if (!state.game) return;
  const elapsed = Math.floor((Date.now() - state.game.startTime) / 1000);
  state.game.elapsed = elapsed;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const el = document.getElementById('game-timer');
  if (el) el.textContent = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
}

const TIME_TARGETS = {
  '4x4-pics':   [60, 120],  '4x4-fruits': [60, 120],  '4x4-vehicles': [60, 120],
  '4x4-dinos':  [60, 120],  '4x4-space':  [60, 120],  '4x4-colors':   [60, 120],
  '4x4-shapes': [60, 120],  '4x4-nums':   [45, 90],
  '6x6-nums':   [120, 240], '6x6-med':    [180, 360],
  '9x9-nums':   [300, 600], '9x9-med':    [360, 720], '9x9-pics': [360, 720],
  'daily-6':    [180, 360],  'daily-9':    [360, 720],
};

function getTimeStars(modeId, seconds) {
  const targets = TIME_TARGETS[modeId] || [120, 240];
  if (seconds <= targets[0]) return 3;
  if (seconds <= targets[1]) return 2;
  return 1;
}

// --- Persistence ---
function save() {
  localStorage.setItem('kids-sudoku', JSON.stringify({
    profiles: state.profiles,
    currentProfile: state.currentProfile
  }));
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem('kids-sudoku'));
    if (data) {
      state.profiles = data.profiles || [];
      state.currentProfile = data.currentProfile;
    }
  } catch (e) { /* fresh start */ }
}

function getProfile() {
  return state.profiles.find(p => p.id === state.currentProfile);
}

function saveGame() {
  if (!state.game) return;
  const profile = getProfile();
  if (profile) {
    profile.currentGame = {
      mode: state.game.mode,
      puzzle: state.game.puzzle,
      solution: state.game.solution,
      board: state.game.board,
      given: state.game.given,
      history: state.game.history,
      hints: state.game.hints,
      elapsed: state.game.elapsed || 0,
      pencilMarks: state.game.pencilMarks || null
    };
    save();
  }
}

// --- Screen Navigation ---
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${id}`).classList.add('active');
}

// --- Profile Screen ---
function renderProfiles() {
  const list = document.getElementById('profile-list');
  list.innerHTML = '';
  for (const p of state.profiles) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.innerHTML = `
      <span class="avatar">${p.avatar}</span>
      <div class="name">${p.name}</div>
      <div class="stars-count">⭐ ${p.stars || 0}</div>
    `;
    card.onclick = () => selectProfile(p.id);
    list.appendChild(card);
  }
}

function selectProfile(id) {
  state.currentProfile = id;
  save();
  showModes();
}

// --- Profile Creation ---
let newProfile = { avatar: null, name: '', age: null };

function renderAvatarPicker() {
  const grid = document.getElementById('avatar-picker');
  grid.innerHTML = '';
  for (const a of AVATARS) {
    const btn = document.createElement('div');
    btn.className = 'avatar-option';
    btn.textContent = a;
    btn.onclick = () => {
      newProfile.avatar = a;
      grid.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      checkProfileReady();
    };
    grid.appendChild(btn);
  }
}

function setupProfileCreation() {
  renderAvatarPicker();
  const nameInput = document.getElementById('profile-name');
  nameInput.value = '';
  newProfile = { avatar: null, name: '', age: null };

  nameInput.oninput = () => {
    newProfile.name = nameInput.value.trim();
    checkProfileReady();
  };

  document.querySelectorAll('.age-btn').forEach(btn => {
    btn.classList.remove('selected');
    btn.onclick = () => {
      newProfile.age = btn.dataset.age;
      document.querySelectorAll('.age-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      checkProfileReady();
    };
  });
}

function checkProfileReady() {
  document.getElementById('btn-save-profile').disabled =
    !(newProfile.avatar && newProfile.name && newProfile.age);
}

function createProfile() {
  const profile = {
    id: Date.now().toString(36),
    avatar: newProfile.avatar,
    name: newProfile.name,
    age: newProfile.age,
    stars: 0,
    puzzlesSolved: 0,
    currentGame: null,
    solvedByMode: {},
    dailySeed: 0
  };
  state.profiles.push(profile);
  state.currentProfile = profile.id;
  save();
  showModes();
}

// --- Mode Selection ---
function showModes() {
  const profile = getProfile();
  if (!profile) { showScreen('profiles'); return; }

  showScreen('modes');
  document.getElementById('greeting').textContent =
    `Hallo ${profile.name}! ${profile.avatar}`;
  document.getElementById('current-profile-badge').innerHTML =
    `<span class="avatar">${profile.avatar}</span> ${profile.name}`;

  const grid = document.getElementById('mode-grid');
  grid.innerHTML = '';

  const modes = MODES[profile.age] || MODES.young;

  // Daily puzzle card (for "old" age group or if > 5 puzzles solved)
  if (profile.age === 'old' || profile.puzzlesSolved >= 5) {
    const dailySize = profile.age === 'old' ? 6 : 4;
    const dailyDone = profile.dailySeed === getDailySeed();
    const dailyCard = document.createElement('div');
    dailyCard.className = `mode-card${dailyDone ? '' : ' daily-highlight'}`;
    dailyCard.style.position = 'relative';
    dailyCard.innerHTML = `
      <span class="mode-icon">📅</span>
      <div class="mode-label">Tägliches Puzzle</div>
      <div class="mode-desc">${dailyDone ? '✅ Heute gelöst!' : `${dailySize}×${dailySize} Herausforderung`}</div>
    `;
    if (!dailyDone) {
      dailyCard.onclick = () => startDailyPuzzle(dailySize);
    }
    grid.appendChild(dailyCard);
  }

  for (const mode of modes) {
    const solved = profile.solvedByMode?.[mode.id] || 0;
    const locked = mode.unlock && profile.puzzlesSolved < mode.unlock;
    const card = document.createElement('div');
    card.className = `mode-card${locked ? ' locked' : ''}`;
    card.style.position = 'relative';

    // Show difficulty progression indicator
    const effDiff = getEffectiveDifficulty(mode, solved);
    const diffLabel = effDiff === 'hard' ? ' 🔥🔥' : effDiff === 'medium' ? ' 🔥' : '';

    card.innerHTML = `
      <span class="mode-icon">${mode.icon}</span>
      <div class="mode-label">${mode.label}${diffLabel}</div>
      <div class="mode-desc">${locked ? `${mode.unlock} Puzzle lösen` : mode.desc}</div>
      ${solved > 0 ? `<div class="mode-desc">✅ ${solved} gelöst</div>` : ''}
    `;
    if (!locked) {
      card.onclick = () => startGame(mode);
    }
    grid.appendChild(card);
  }

  document.getElementById('stats-bar').innerHTML =
    `⭐ ${profile.stars} Sterne &nbsp; 🧩 ${profile.puzzlesSolved} Puzzle`;
}

// --- Game ---
let selectedCell = null;
let pencilMode = false;

function startDailyPuzzle(size) {
  const profile = getProfile();
  if (!profile) return;
  const modeId = `daily-${size}`;
  const { puzzle, solution } = getDailyPuzzle(size);
  const given = puzzle.map(r => r.map(c => c !== 0));
  const mode = {
    id: modeId, size, type: 'numbers', icon: '📅',
    label: `Tägliches ${size}×${size}`, desc: 'Tagesrätsel',
    difficulty: 'medium', isDaily: true
  };
  state.game = {
    mode, puzzle: puzzle.map(r => [...r]), solution,
    board: puzzle.map(r => [...r]), given, history: [],
    hints: 0, startTime: null, elapsed: 0,
    pencilMarks: Array.from({ length: size }, () => Array.from({ length: size }, () => new Set()))
  };
  selectedCell = null;
  pencilMode = false;
  showScreen('game');
  renderGame();
  startTimer();
  saveGame();
  Sounds.click();
}

function startGame(mode) {
  const profile = getProfile();
  Sounds.click();

  if (profile.currentGame && profile.currentGame.mode.id === mode.id) {
    state.game = { ...profile.currentGame };
    // Restore pencil marks as Sets
    if (state.game.pencilMarks) {
      state.game.pencilMarks = state.game.pencilMarks.map(row =>
        row.map(cell => new Set(cell))
      );
    }
  } else {
    const solved = profile.solvedByMode?.[mode.id] || 0;
    const effDiff = getEffectiveDifficulty(mode, solved);
    const { puzzle, solution } = Sudoku.generate(mode.size, effDiff);
    const given = puzzle.map(r => r.map(c => c !== 0));
    state.game = {
      mode, puzzle: puzzle.map(r => [...r]), solution,
      board: puzzle.map(r => [...r]), given, history: [],
      hints: 0, startTime: null, elapsed: 0,
      pencilMarks: Array.from({ length: mode.size }, () =>
        Array.from({ length: mode.size }, () => new Set()))
    };
  }

  selectedCell = null;
  pencilMode = false;
  showScreen('game');
  renderGame();
  startTimer();
  saveGame();
}

function renderGame() {
  const { mode, board, given } = state.game;
  const size = mode.size;
  const symbols = mode.type === 'pictures' ? SYMBOL_SETS[mode.symbolSet] : null;

  document.getElementById('game-info').textContent = mode.label;

  // Show/hide pencil button
  const pencilBtn = document.getElementById('btn-pencil');
  if (pencilBtn) {
    pencilBtn.style.display = size >= 6 ? '' : 'none';
    pencilBtn.classList.toggle('active', pencilMode);
  }

  const container = document.getElementById('board-container');
  container.className = `board-container size-${size}`;
  container.innerHTML = '';

  const { boxRows, boxCols } = Sudoku.getConfig(size);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement('div');
      const val = board[r][c];

      cell.className = 'cell';
      if (given[r][c]) cell.classList.add('given');
      else if (val !== 0) cell.classList.add('user');
      if (selectedCell && selectedCell[0] === r && selectedCell[1] === c) {
        cell.classList.add('selected');
      }
      if (selectedCell) {
        const [sr, sc] = selectedCell;
        const sameRow = r === sr;
        const sameCol = c === sc;
        const sameBox =
          Math.floor(r / boxRows) === Math.floor(sr / boxRows) &&
          Math.floor(c / boxCols) === Math.floor(sc / boxCols);
        if ((sameRow || sameCol || sameBox) && !(r === sr && c === sc)) {
          cell.classList.add('highlight');
        }
      }

      if ((c + 1) % boxCols === 0 && c < size - 1) {
        cell.style.marginRight = '3px';
      }
      if ((r + 1) % boxRows === 0 && r < size - 1) {
        cell.style.marginBottom = '3px';
      }

      if (val !== 0) {
        cell.textContent = symbols ? symbols[val - 1] : val;
      } else if (state.game.pencilMarks && state.game.pencilMarks[r][c].size > 0) {
        // Render pencil marks
        const marks = state.game.pencilMarks[r][c];
        const markDiv = document.createElement('div');
        markDiv.className = 'pencil-marks';
        for (let v = 1; v <= size; v++) {
          const span = document.createElement('span');
          span.textContent = marks.has(v) ? (symbols ? symbols[v-1] : v) : '';
          markDiv.appendChild(span);
        }
        cell.appendChild(markDiv);
      }

      if (!given[r][c]) {
        cell.onclick = () => {
          selectedCell = [r, c];
          Sounds.tap();
          renderGame();
        };
      }

      container.appendChild(cell);
    }
  }

  // Input bar
  const inputBar = document.getElementById('input-bar');
  inputBar.innerHTML = '';

  for (let v = 1; v <= size; v++) {
    const btn = document.createElement('button');
    btn.className = 'input-btn';
    btn.textContent = symbols ? symbols[v - 1] : v;

    let count = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === v) count++;
      }
    }
    if (count >= size) btn.classList.add('completed');

    btn.onclick = () => placeValue(v);
    inputBar.appendChild(btn);
  }
}

function placeValue(val) {
  if (!selectedCell || !state.game) return;
  const [r, c] = selectedCell;
  if (state.game.given[r][c]) return;

  if (pencilMode && state.game.pencilMarks) {
    const marks = state.game.pencilMarks[r][c];
    if (marks.has(val)) marks.delete(val);
    else marks.add(val);
    Sounds.tap();
    renderGame();
    saveGame();
    return;
  }

  const prev = state.game.board[r][c];
  state.game.history.push({ r, c, prev, pencil: state.game.pencilMarks ? [...state.game.pencilMarks[r][c]] : [] });
  state.game.board[r][c] = val;
  // Clear pencil marks when placing a value
  if (state.game.pencilMarks) state.game.pencilMarks[r][c].clear();
  Sounds.place();

  renderGame();
  saveGame();

  if (Sudoku.isComplete(state.game.board, state.game.mode.size)) {
    setTimeout(() => showWin(), 300);
  }
}

function eraseCell() {
  if (!selectedCell || !state.game) return;
  const [r, c] = selectedCell;
  if (state.game.given[r][c]) return;

  const prev = state.game.board[r][c];
  if (prev === 0 && (!state.game.pencilMarks || state.game.pencilMarks[r][c].size === 0)) return;
  state.game.history.push({ r, c, prev, pencil: state.game.pencilMarks ? [...state.game.pencilMarks[r][c]] : [] });
  state.game.board[r][c] = 0;
  if (state.game.pencilMarks) state.game.pencilMarks[r][c].clear();
  Sounds.erase();
  renderGame();
  saveGame();
}

function undo() {
  if (!state.game || state.game.history.length === 0) return;
  const last = state.game.history.pop();
  state.game.board[last.r][last.c] = last.prev;
  if (state.game.pencilMarks && last.pencil) {
    state.game.pencilMarks[last.r][last.c] = new Set(last.pencil);
  }
  Sounds.undo();
  renderGame();
  saveGame();
}

function checkBoard() {
  if (!state.game) return;
  const conflicts = Sudoku.findConflicts(state.game.board, state.game.mode.size);
  const cells = document.querySelectorAll('.cell');
  const size = state.game.mode.size;

  cells.forEach((cell, i) => {
    const r = Math.floor(i / size);
    const c = i % size;
    cell.classList.remove('conflict', 'shake');
    if (conflicts.has(`${r},${c}`) && !state.game.given[r][c]) {
      cell.classList.add('conflict', 'shake');
    }
  });

  if (conflicts.size > 0) Sounds.error();

  if (conflicts.size === 0) {
    let hasEmpty = false;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (state.game.board[r][c] === 0) { hasEmpty = true; break; }
      }
      if (hasEmpty) break;
    }
    if (!hasEmpty) showWin();
  }
}

function giveHint() {
  if (!state.game) return;
  const hint = Sudoku.getHint(state.game.board, state.game.solution, state.game.mode.size);
  if (!hint) return;

  state.game.hints++;
  state.game.board[hint.row][hint.col] = hint.value;
  state.game.given[hint.row][hint.col] = true;
  if (state.game.pencilMarks) state.game.pencilMarks[hint.row][hint.col].clear();
  selectedCell = [hint.row, hint.col];
  Sounds.hint();
  renderGame();
  saveGame();

  const size = state.game.mode.size;
  const idx = hint.row * size + hint.col;
  const cells = document.querySelectorAll('.cell');
  if (cells[idx]) cells[idx].classList.add('hint-glow');

  if (Sudoku.isComplete(state.game.board, state.game.mode.size)) {
    setTimeout(() => showWin(), 400);
  }
}

// --- Confetti ---
function launchConfetti(stars) {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
  canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;

  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6fb7', '#c084fc', '#fb923c'];
  const count = stars * 40;
  const pieces = [];

  for (let i = 0; i < count; i++) {
    pieces.push({
      x: W / 2 + (Math.random() - 0.5) * 60,
      y: H * 0.5,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 14 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      opacity: 1
    });
  }

  let frame = 0;
  const maxFrames = 120;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pieces) {
      p.x += p.vx;
      p.vy += 0.3;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.opacity = Math.max(0, 1 - frame / maxFrames);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    frame++;
    if (frame < maxFrames) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
  }

  requestAnimationFrame(draw);
}

// --- Win ---
function showWin() {
  const profile = getProfile();
  if (!profile || !state.game) return;

  stopTimer();
  const elapsed = state.game.elapsed || 0;
  const stars = getTimeStars(state.game.mode.id, elapsed);

  Sounds.winRandom();
  for (let i = 0; i < stars; i++) {
    setTimeout(() => Sounds.star(), 700 + i * 250);
  }

  profile.stars = (profile.stars || 0) + stars;
  profile.puzzlesSolved = (profile.puzzlesSolved || 0) + 1;
  profile.solvedByMode = profile.solvedByMode || {};
  profile.solvedByMode[state.game.mode.id] =
    (profile.solvedByMode[state.game.mode.id] || 0) + 1;

  // Mark daily as done
  if (state.game.mode.isDaily) {
    profile.dailySeed = getDailySeed();
  }

  profile.currentGame = null;
  save();

  document.getElementById('win-stars').textContent =
    '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('win-animation').textContent = '🎉';

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  document.getElementById('win-time').textContent =
    `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;

  const messages3 = ['Blitzschnell!', 'Wahnsinn, so schnell!', 'Turbo-Löser!', 'Unschlagbar!'];
  const messages2 = ['Gut gemacht!', 'Toll gelöst!', 'Klasse!', 'Stark!'];
  const messages1 = ['Geschafft!', 'Weiter so!', 'Du wirst schneller!', 'Nicht aufgeben!'];
  const pool = stars === 3 ? messages3 : stars === 2 ? messages2 : messages1;
  document.getElementById('win-message').textContent =
    pool[Math.floor(Math.random() * pool.length)];

  showScreen('win');
  setTimeout(() => launchConfetti(stars), 200);
}

function nextPuzzle() {
  if (!state.game) { showModes(); return; }
  if (state.game.mode.isDaily) { showModes(); return; }
  startGame(state.game.mode);
}

// --- Dark mode ---
function initDarkMode() {
  const saved = localStorage.getItem('kids-sudoku-dark');
  if (saved === '1' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
}

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('kids-sudoku-dark', isDark ? '1' : '0');
  const btn = document.getElementById('btn-dark');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// --- Init ---
function init() {
  load();
  initDarkMode();
  renderProfiles();

  if (state.currentProfile && getProfile()) {
    showModes();
  } else {
    showScreen('profiles');
  }

  // Event listeners
  document.getElementById('btn-add-profile').onclick = () => {
    setupProfileCreation();
    showScreen('create-profile');
  };
  document.getElementById('btn-save-profile').onclick = createProfile;
  document.getElementById('btn-cancel-profile').onclick = () => {
    renderProfiles();
    showScreen('profiles');
  };
  document.getElementById('btn-back-profiles').onclick = () => {
    state.currentProfile = null;
    save();
    renderProfiles();
    showScreen('profiles');
  };
  document.getElementById('btn-back-modes').onclick = () => {
    stopTimer();
    saveGame();
    showModes();
  };
  document.getElementById('btn-undo').onclick = undo;
  document.getElementById('btn-erase').onclick = eraseCell;
  document.getElementById('btn-check').onclick = checkBoard;
  document.getElementById('btn-hint').onclick = giveHint;
  document.getElementById('btn-sound').onclick = () => {
    Sounds.setMuted(!Sounds.isMuted());
    document.getElementById('btn-sound').textContent = Sounds.isMuted() ? '🔇' : '🔊';
    localStorage.setItem('kids-sudoku-muted', Sounds.isMuted() ? '1' : '0');
  };
  if (localStorage.getItem('kids-sudoku-muted') === '1') {
    Sounds.setMuted(true);
    document.getElementById('btn-sound').textContent = '🔇';
  }

  const pencilBtn = document.getElementById('btn-pencil');
  if (pencilBtn) {
    pencilBtn.onclick = () => {
      pencilMode = !pencilMode;
      pencilBtn.classList.toggle('active', pencilMode);
      Sounds.click();
    };
  }

  const darkBtn = document.getElementById('btn-dark');
  if (darkBtn) {
    darkBtn.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
    darkBtn.onclick = toggleDarkMode;
  }

  document.getElementById('btn-next-puzzle').onclick = nextPuzzle;
  document.getElementById('btn-back-menu').onclick = showModes;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
