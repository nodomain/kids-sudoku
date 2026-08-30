/*
 * app.js - Kids Sudoku PWA main application
 */

// --- Symbol sets for picture mode ---
const SYMBOL_SETS = {
  animals: ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🦁', '🐮'],
  fruits:  ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍌'],
  vehicles:['🚗', '🚌', '🚀', '✈️', '🚂', '⛵', '🚁', '🏎️', '🛸'],
  shapes:  ['⭐', '❤️', '🔵', '🟢', '🔶', '🟣', '💎', '🌙', '☀️']
};

const AVATARS = ['🦄', '🐉', '🦋', '🐙', '🦖', '🐬', '🦜', '🐝', '🌈', '🍭'];

const MODES = {
  young: [
    { id: '4x4-pics', size: 4, type: 'pictures', icon: '🐾', label: '4×4 Bilder', desc: 'Mit Tierbildern', difficulty: 'easy', symbolSet: 'animals' },
    { id: '4x4-fruits', size: 4, type: 'pictures', icon: '🍎', label: '4×4 Obst', desc: 'Mit Obstbildern', difficulty: 'easy', symbolSet: 'fruits', unlock: 5 },
    { id: '4x4-shapes', size: 4, type: 'pictures', icon: '⭐', label: '4×4 Formen', desc: 'Mit bunten Formen', difficulty: 'easy', symbolSet: 'shapes', unlock: 10 },
  ],
  old: [
    { id: '4x4-nums', size: 4, type: 'numbers', icon: '🔢', label: '4×4 Zahlen', desc: 'Aufwärmen', difficulty: 'easy' },
    { id: '6x6-nums', size: 6, type: 'numbers', icon: '🧠', label: '6×6 Zahlen', desc: 'Standard', difficulty: 'easy' },
    { id: '6x6-med', size: 6, type: 'numbers', icon: '🔥', label: '6×6 Knifflig', desc: 'Mehr Lücken', difficulty: 'medium', unlock: 5 },
    { id: '4x4-pics', size: 4, type: 'pictures', icon: '🐾', label: '4×4 Bilder', desc: 'Tierbilder', difficulty: 'easy', symbolSet: 'animals' },
    { id: '9x9-nums', size: 9, type: 'numbers', icon: '🏆', label: '9×9 Klassisch', desc: 'Das echte Sudoku', difficulty: 'easy', unlock: 15 },
  ]
};

// --- State ---
let state = {
  profiles: [],
  currentProfile: null,
  game: null  // { mode, puzzle, solution, board, given, history, hints }
};

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
      hints: state.game.hints
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
    solvedByMode: {}
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
  for (const mode of modes) {
    const solved = profile.solvedByMode?.[mode.id] || 0;
    const locked = mode.unlock && profile.puzzlesSolved < mode.unlock;
    const card = document.createElement('div');
    card.className = `mode-card${locked ? ' locked' : ''}`;
    card.style.position = 'relative';
    card.innerHTML = `
      <span class="mode-icon">${mode.icon}</span>
      <div class="mode-label">${mode.label}</div>
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

function startGame(mode) {
  const profile = getProfile();

  // Check for saved game
  if (profile.currentGame && profile.currentGame.mode.id === mode.id) {
    state.game = { ...profile.currentGame };
  } else {
    const { puzzle, solution } = Sudoku.generate(mode.size, mode.difficulty);
    const given = puzzle.map(r => r.map(c => c !== 0));
    state.game = {
      mode,
      puzzle: puzzle.map(r => [...r]),
      solution,
      board: puzzle.map(r => [...r]),
      given,
      history: [],
      hints: 0
    };
  }

  selectedCell = null;
  showScreen('game');
  renderGame();
  saveGame();
}

function renderGame() {
  const { mode, board, given } = state.game;
  const size = mode.size;
  const symbols = mode.type === 'pictures' ? SYMBOL_SETS[mode.symbolSet] : null;

  // Info
  document.getElementById('game-info').textContent = mode.label;

  // Board
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
      // Highlight same row/col/box
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

      // Add thicker borders for box separation
      if ((c + 1) % boxCols === 0 && c < size - 1) {
        cell.style.borderRight = '2px solid var(--text)';
      }
      if ((r + 1) % boxRows === 0 && r < size - 1) {
        cell.style.borderBottom = '2px solid var(--text)';
      }

      if (val !== 0) {
        cell.textContent = symbols ? symbols[val - 1] : val;
      }

      if (!given[r][c]) {
        cell.onclick = () => {
          selectedCell = [r, c];
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

    // Count how many of this value are placed
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

  const prev = state.game.board[r][c];
  state.game.history.push({ r, c, prev });
  state.game.board[r][c] = val;

  renderGame();
  saveGame();

  // Check win
  if (Sudoku.isComplete(state.game.board, state.game.mode.size)) {
    setTimeout(() => showWin(), 300);
  }
}

function eraseCell() {
  if (!selectedCell || !state.game) return;
  const [r, c] = selectedCell;
  if (state.game.given[r][c]) return;

  const prev = state.game.board[r][c];
  if (prev === 0) return;
  state.game.history.push({ r, c, prev });
  state.game.board[r][c] = 0;
  renderGame();
  saveGame();
}

function undo() {
  if (!state.game || state.game.history.length === 0) return;
  const last = state.game.history.pop();
  state.game.board[last.r][last.c] = last.prev;
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

  if (conflicts.size === 0) {
    // Check for empty cells
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
  state.game.given[hint.row][hint.col] = true; // Mark as given so it can't be erased
  selectedCell = [hint.row, hint.col];
  renderGame();
  saveGame();

  // Glow the hint cell
  const size = state.game.mode.size;
  const idx = hint.row * size + hint.col;
  const cells = document.querySelectorAll('.cell');
  if (cells[idx]) cells[idx].classList.add('hint-glow');

  if (Sudoku.isComplete(state.game.board, state.game.mode.size)) {
    setTimeout(() => showWin(), 400);
  }
}

// --- Win ---
function showWin() {
  const profile = getProfile();
  if (!profile || !state.game) return;

  const hints = state.game.hints;
  const stars = hints === 0 ? 3 : hints <= 2 ? 2 : 1;

  profile.stars = (profile.stars || 0) + stars;
  profile.puzzlesSolved = (profile.puzzlesSolved || 0) + 1;
  profile.solvedByMode = profile.solvedByMode || {};
  profile.solvedByMode[state.game.mode.id] =
    (profile.solvedByMode[state.game.mode.id] || 0) + 1;
  profile.currentGame = null;
  save();

  document.getElementById('win-stars').textContent =
    '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('win-animation').textContent = '🎉';

  const messages = [
    'Wow, du bist ein Sudoku-Star!',
    'Großartig gemacht!',
    'Du wirst immer besser!',
    'Fantastisch!',
    'Klasse, weiter so!'
  ];
  document.getElementById('win-message').textContent =
    messages[Math.floor(Math.random() * messages.length)];

  showScreen('win');
}

function nextPuzzle() {
  if (!state.game) { showModes(); return; }
  startGame(state.game.mode);
}

// --- Init ---
function init() {
  load();
  renderProfiles();

  // If we have a current profile, go to modes
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
    saveGame();
    showModes();
  };
  document.getElementById('btn-undo').onclick = undo;
  document.getElementById('btn-erase').onclick = eraseCell;
  document.getElementById('btn-check').onclick = checkBoard;
  document.getElementById('btn-hint').onclick = giveHint;
  document.getElementById('btn-next-puzzle').onclick = nextPuzzle;
  document.getElementById('btn-back-menu').onclick = showModes;

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
