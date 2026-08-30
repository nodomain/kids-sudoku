/*
 * sudoku.js - Puzzle generator & solver for 4x4, 6x6, 9x9 grids
 * All client-side, no dependencies.
 */

const Sudoku = (() => {
  // Board configs: size -> { boxRows, boxCols }
  const CONFIGS = {
    4: { boxRows: 2, boxCols: 2 },
    6: { boxRows: 2, boxCols: 3 },
    9: { boxRows: 3, boxCols: 3 }
  };

  function getConfig(size) {
    return CONFIGS[size] || CONFIGS[9];
  }

  // Check if placing val at (row, col) is valid
  function isValid(board, size, row, col, val) {
    const { boxRows, boxCols } = getConfig(size);
    // Row check
    for (let c = 0; c < size; c++) {
      if (board[row][c] === val) return false;
    }
    // Column check
    for (let r = 0; r < size; r++) {
      if (board[r][col] === val) return false;
    }
    // Box check
    const br = Math.floor(row / boxRows) * boxRows;
    const bc = Math.floor(col / boxCols) * boxCols;
    for (let r = br; r < br + boxRows; r++) {
      for (let c = bc; c < bc + boxCols; c++) {
        if (board[r][c] === val) return false;
      }
    }
    return true;
  }

  // Shuffle array in-place (Fisher-Yates)
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Generate a complete valid board
  function generateFull(size) {
    const board = Array.from({ length: size }, () => Array(size).fill(0));
    const values = Array.from({ length: size }, (_, i) => i + 1);

    function fill(pos) {
      if (pos === size * size) return true;
      const row = Math.floor(pos / size);
      const col = pos % size;
      const shuffled = shuffle([...values]);
      for (const val of shuffled) {
        if (isValid(board, size, row, col, val)) {
          board[row][col] = val;
          if (fill(pos + 1)) return true;
          board[row][col] = 0;
        }
      }
      return false;
    }

    fill(0);
    return board;
  }

  // Count solutions (stop at 2 to check uniqueness)
  function countSolutions(board, size, limit = 2) {
    let count = 0;

    function solve(pos) {
      if (count >= limit) return;
      if (pos === size * size) { count++; return; }
      const row = Math.floor(pos / size);
      const col = pos % size;
      if (board[row][col] !== 0) { solve(pos + 1); return; }
      for (let val = 1; val <= size; val++) {
        if (isValid(board, size, row, col, val)) {
          board[row][col] = val;
          solve(pos + 1);
          board[row][col] = 0;
        }
      }
    }

    solve(0);
    return count;
  }

  // Create puzzle by removing cells from a complete board
  // difficulty: number of cells to remove
  function createPuzzle(size, removals) {
    const solution = generateFull(size);
    const puzzle = solution.map(r => [...r]);
    const positions = shuffle(
      Array.from({ length: size * size }, (_, i) => i)
    );

    let removed = 0;
    for (const pos of positions) {
      if (removed >= removals) break;
      const row = Math.floor(pos / size);
      const col = pos % size;
      const saved = puzzle[row][col];
      puzzle[row][col] = 0;
      // Verify unique solution
      const test = puzzle.map(r => [...r]);
      if (countSolutions(test, size) === 1) {
        removed++;
      } else {
        puzzle[row][col] = saved;
      }
    }

    return { puzzle, solution };
  }

  // Difficulty presets: { size -> { easy, medium, hard } }
  const DIFFICULTY = {
    4: { easy: 4, medium: 6, hard: 8 },
    6: { easy: 10, medium: 14, hard: 18 },
    9: { easy: 30, medium: 40, hard: 50 }
  };

  function generate(size, difficulty = 'easy') {
    const removals = DIFFICULTY[size]?.[difficulty] ?? DIFFICULTY[size]?.easy ?? 4;
    return createPuzzle(size, removals);
  }

  // Find conflicts in current board state
  function findConflicts(board, size) {
    const conflicts = new Set();
    const { boxRows, boxCols } = getConfig(size);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = board[r][c];
        if (val === 0) continue;

        // Check row
        for (let c2 = 0; c2 < size; c2++) {
          if (c2 !== c && board[r][c2] === val) {
            conflicts.add(`${r},${c}`);
            conflicts.add(`${r},${c2}`);
          }
        }
        // Check col
        for (let r2 = 0; r2 < size; r2++) {
          if (r2 !== r && board[r2][c] === val) {
            conflicts.add(`${r},${c}`);
            conflicts.add(`${r2},${c}`);
          }
        }
        // Check box
        const br = Math.floor(r / boxRows) * boxRows;
        const bc = Math.floor(c / boxCols) * boxCols;
        for (let r2 = br; r2 < br + boxRows; r2++) {
          for (let c2 = bc; c2 < bc + boxCols; c2++) {
            if ((r2 !== r || c2 !== c) && board[r2][c2] === val) {
              conflicts.add(`${r},${c}`);
              conflicts.add(`${r2},${c2}`);
            }
          }
        }
      }
    }
    return conflicts;
  }

  // Get a hint: find one empty cell and its correct value
  function getHint(board, solution, size) {
    const empty = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return null;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    return { row: r, col: c, value: solution[r][c] };
  }

  // Check if board is complete and correct
  function isComplete(board, size) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === 0) return false;
      }
    }
    return findConflicts(board, size).size === 0;
  }

  return { generate, isValid, findConflicts, getHint, isComplete, getConfig };
})();
