// Default settings
let gridSize = 10;
let mineCount = 10;
let grid = [];
let minesLeft = mineCount;
let revealedCount = 0;
let gameOver = false;
let gameWon = false;
let timerInterval;
let seconds = 0;
let flagMode = false;
let firstClick = true;
let darkMode = false;

// DOM elements
const difficultySettingsElement = document.getElementById('difficulty-settings');
const gameContainerElement = document.getElementById('game-container');
const gridElement = document.getElementById('grid');
const minesCountElement = document.getElementById('mines-count');
const timerElement = document.getElementById('timer');
const gameOverElement = document.getElementById('game-over');
const winMessageElement = document.getElementById('win-message');
const restartButton = document.getElementById('restart');
const flagModeCheckbox = document.getElementById('flag-mode');
const gridSizeInput = document.getElementById('grid-size');
const mineCountInput = document.getElementById('mine-count');
const startGameButton = document.getElementById('start-game');
const difficultyPresets = document.querySelectorAll('.difficulty-preset');
const themeToggle = document.getElementById('theme-toggle');

// Tema ayarlarını yükle
loadThemePreference();

// Initialize the game
function initGame() {
  // Reset game state
  grid = [];
  minesLeft = mineCount;
  revealedCount = 0;
  gameOver = false;
  gameWon = false;
  seconds = 0;
  firstClick = true;
  clearInterval(timerInterval);
  timerElement.textContent = '0';
  minesCountElement.textContent = minesLeft;
  gameOverElement.style.display = 'none';
  winMessageElement.style.display = 'none';
  
  // Hide difficulty settings and show game
  difficultySettingsElement.style.display = 'none';
  gameContainerElement.style.display = 'block';
  
  // Create the grid
  gridElement.innerHTML = '';
  const cellSize = Math.min(40, Math.max(20, Math.floor(600 / gridSize)));
  gridElement.style.width = `${cellSize * gridSize + gridSize * 2}px`;
  
  // Initialize grid with empty cells
  for (let i = 0; i < gridSize; i++) {
    grid[i] = [];
    
    // Create a row for Bootstrap grid
    const rowElement = document.createElement('div');
    rowElement.className = 'grid-row';
    gridElement.appendChild(rowElement);
    
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = {
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      };
      
      // Create cell
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.style.width = `${cellSize}px`;
      cell.style.height = `${cellSize}px`;
      
      cell.addEventListener('click', handleCellClick);
      cell.addEventListener('contextmenu', handleRightClick);
      
      rowElement.appendChild(cell);
    }
  }
}

// Place mines after first click
function placeMines(firstRow, firstCol) {
  // Place mines randomly, avoiding the first clicked cell and its neighbors
  let minesPlaced = 0;
  while (minesPlaced < mineCount) {
    const row = Math.floor(Math.random() * gridSize);
    const col = Math.floor(Math.random() * gridSize);
    
    // Skip the first clicked cell and its neighbors
    if (Math.abs(row - firstRow) <= 1 && Math.abs(col - firstCol) <= 1) {
      continue;
    }
    
    if (!grid[row][col].isMine) {
      grid[row][col].isMine = true;
      minesPlaced++;
    }
  }
  
  // Calculate neighbor mines
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (!grid[i][j].isMine) {
        grid[i][j].neighborMines = countNeighborMines(i, j);
      }
    }
  }
}

// Count mines around a cell
function countNeighborMines(row, col) {
  let count = 0;
  
  for (let i = Math.max(0, row - 1); i <= Math.min(gridSize - 1, row + 1); i++) {
    for (let j = Math.max(0, col - 1); j <= Math.min(gridSize - 1, col + 1); j++) {
      if (i === row && j === col) continue;
      if (grid[i][j].isMine) count++;
    }
  }
  
  return count;
}

// Dalga efekti oluşturma
function createRippleEffect(element, x, y) {
  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  
  // Başlangıç konumu
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  
  element.appendChild(ripple);
  
  // Animasyon tamamlandıktan sonra elementi kaldır
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

// Update the cell appearance
function updateCell(row, col, delay = 0) {
  // Find the cell element
  const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  
  // Add delay for wave effect
  if (delay > 0) {
    setTimeout(() => {
      updateCellAppearance(cellElement, row, col);
      
      // Dalga efekti için ripple oluştur
      createRippleEffect(cellElement, cellElement.offsetWidth / 2, cellElement.offsetHeight / 2);
      
      // Gecikmeli görünüm efekti
      cellElement.classList.add('delayed-reveal');
    }, delay);
  } else {
    updateCellAppearance(cellElement, row, col);
  }
}

// Update cell appearance logic
function updateCellAppearance(cellElement, row, col) {
  // Update class and content based on cell state
  if (grid[row][col].isRevealed) {
    cellElement.classList.add('revealed');
    
    if (grid[row][col].isMine) {
      cellElement.classList.add('mine');
      cellElement.textContent = '💣';
    } else if (grid[row][col].neighborMines > 0) {
      cellElement.textContent = grid[row][col].neighborMines;
      cellElement.classList.add(`num-${grid[row][col].neighborMines}`);
    } else {
      cellElement.textContent = '';
    }
  } else if (grid[row][col].isFlagged) {
    cellElement.classList.add('flagged');
    cellElement.classList.remove('revealed');
    cellElement.textContent = '🚩';
  } else {
    cellElement.classList.remove('revealed', 'flagged', 'mine');
    for (let i = 1; i <= 8; i++) {
      cellElement.classList.remove(`num-${i}`);
    }
    cellElement.textContent = '';
  }
}

// Handle cell click
function handleCellClick(event) {
  if (gameOver || gameWon) return;
  
  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);
  
  // Dalga efekti oluştur
  const rect = event.target.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  createRippleEffect(event.target, x, y);
  
  // If it's the first click, place mines
  if (firstClick) {
    placeMines(row, col);
    firstClick = false;
    
    // Start timer
    timerInterval = setInterval(() => {
      seconds++;
      timerElement.textContent = seconds;
    }, 1000);
  }
  
  // If flag mode is on, toggle flag
  if (flagMode) {
    toggleFlag(row, col);
    return;
  }
  
  // If cell is flagged, do nothing
  if (grid[row][col].isFlagged) return;
  
  // If clicked on a mine, game over
  if (grid[row][col].isMine) {
    revealAllMines();
    endGame(false);
    return;
  }
  
  // Reveal the cell with cascade effect
  revealCellWithEffect(row, col);
  
  // Check if player won
  checkWinCondition();
}

// Handle right click (flag)
function handleRightClick(event) {
  event.preventDefault();
  
  if (gameOver || gameWon || firstClick) return;
  
  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);
  
  toggleFlag(row, col);
}

// Toggle flag on a cell
function toggleFlag(row, col) {
  if (grid[row][col].isRevealed) return;
  
  grid[row][col].isFlagged = !grid[row][col].isFlagged;
  
  // Update mines count
  minesLeft += grid[row][col].isFlagged ? -1 : 1;
  minesCountElement.textContent = minesLeft;
  
  // Update cell appearance
  updateCell(row, col);
}

// Reveal a cell with wave effect
function revealCellWithEffect(row, col, depth = 0) {
  if (grid[row][col].isRevealed || grid[row][col].isFlagged) return;
  
  grid[row][col].isRevealed = true;
  revealedCount++;
  
  // Calculate delay based on distance from initial click
  const delay = depth * 50; // 50ms per step away from clicked cell
  
  // Update cell appearance with delay
  updateCell(row, col, delay);
  
  // If cell has no neighbor mines, reveal neighbors
  if (grid[row][col].neighborMines === 0) {
    for (let i = Math.max(0, row - 1); i <= Math.min(gridSize - 1, row + 1); i++) {
      for (let j = Math.max(0, col - 1); j <= Math.min(gridSize - 1, col + 1); j++) {
        if (i === row && j === col) continue;
        if (!grid[i][j].isRevealed) {
          // Calculate Manhattan distance for wave effect
          const newDepth = depth + 1;
          revealCellWithEffect(i, j, newDepth);
        }
      }
    }
  }
}

// Reveal all mines
function revealAllMines() {
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (grid[i][j].isMine) {
        grid[i][j].isRevealed = true;
        updateCell(i, j, i * 50 + j * 10); // Kademeli patlama efekti
      }
    }
  }
}

// Check if player won
function checkWinCondition() {
  const totalCells = gridSize * gridSize;
  if (revealedCount === totalCells - mineCount) {
    endGame(true);
  }
}

// End the game
function endGame(isWin) {
  gameOver = true;
  clearInterval(timerInterval);
  
  if (isWin) {
    gameWon = true;
    winMessageElement.style.display = 'block';
    playNotificationSound('sounds/mgs-snake-eater-ending-ringtone.mp3');
  } else {
    gameOverElement.style.display = 'block';
    playNotificationSound('sounds/snakedie.mp3');
  }
}

// Restart the game (show settings screen)
function restartGame() {
  clearInterval(timerInterval);
  gameContainerElement.style.display = 'none';
  difficultySettingsElement.style.display = 'block';
}

// Validate settings
function validateSettings() {
  let size = parseInt(gridSizeInput.value);
  let mines = parseInt(mineCountInput.value);
  
  // Validate grid size
  size = Math.max(5, Math.min(20, size));
  gridSizeInput.value = size;
  
  // Validate mine count
  const maxMines = Math.floor((size * size) * 0.35); // Max 35% of grid can be mines
  mines = Math.max(5, Math.min(maxMines, mines));
  mineCountInput.value = mines;
  
  gridSize = size;
  mineCount = mines;
}

// Karanlık mod fonksiyonları
function toggleDarkMode() {
  darkMode = !darkMode;
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  localStorage.setItem('darkMode', darkMode ? 'enabled' : 'disabled');
}

function loadThemePreference() {
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme === 'enabled') {
    darkMode = true;
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.checked = true;
  }
}

// Event listeners
startGameButton.addEventListener('click', () => {
  validateSettings();
  initGame();
});

restartButton.addEventListener('click', restartGame);

flagModeCheckbox.addEventListener('change', (e) => {
  flagMode = e.target.checked;
});

// Prevent context menu on grid
gridElement.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Difficulty presets
difficultyPresets.forEach(preset => {
  preset.addEventListener('click', () => {
    gridSizeInput.value = preset.dataset.size;
    mineCountInput.value = preset.dataset.mines;
  });
});

// Input validation
gridSizeInput.addEventListener('change', () => {
  let size = parseInt(gridSizeInput.value);
  size = Math.max(5, Math.min(20, size));
  gridSizeInput.value = size;
  
  // Update max mines based on grid size
  const maxMines = Math.floor((size * size) * 0.35);
  mineCountInput.max = maxMines;
  
  if (parseInt(mineCountInput.value) > maxMines) {
    mineCountInput.value = maxMines;
  }
});

// Tema değiştirici event listener
themeToggle.addEventListener('change', toggleDarkMode);

function playNotificationSound(soundSrc) {
  const audio = new Audio(soundSrc);
  audio.play();
}