// ===================================
// SOLO LEVELING - SNAKE & LADDER GAME
// ===================================

// Game State
const gameState = {
    numPlayers: 0,
    players: [],
    currentPlayerIndex: 0,
    round: 1,
    gameStarted: false,
    boardSize: 100,
    snakes: {
        98: 28, 95: 24, 92: 51, 83: 19, 73: 1,
        69: 33, 64: 36, 59: 17, 55: 7, 52: 11,
        48: 9, 46: 5, 44: 22
    },
    ladders: {
        4: 56, 12: 50, 14: 55, 22: 58, 41: 79,
        54: 88, 63: 81, 66: 87, 76: 91
    }
};

// IndexedDB Setup
let db;
const DB_NAME = 'SoloLevelingGame';
const DB_VERSION = 1;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains('questions')) {
                const objectStore = db.createObjectStore('questions', { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('class', 'class', { unique: false });
            }
        };
    });
}

// Load questions from JSON and store in IndexedDB
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const questions = await response.json();
        
        const transaction = db.transaction(['questions'], 'readwrite');
        const objectStore = transaction.objectStore('questions');
        
        // Clear existing questions
        objectStore.clear();
        
        // Add new questions
        questions.forEach(q => objectStore.add(q));
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve(questions.length);
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error('Error loading questions:', error);
        return 0;
    }
}

// Get random question by class
function getRandomQuestion(classLevel) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['questions'], 'readonly');
        const objectStore = transaction.objectStore('questions');
        const index = objectStore.index('class');
        const request = index.getAll(classLevel.toString());
        
        request.onsuccess = () => {
            const questions = request.result;
            if (questions.length > 0) {
                const randomQ = questions[Math.floor(Math.random() * questions.length)];
                resolve(randomQ);
            } else {
                reject('No questions found');
            }
        };
        
        request.onerror = () => reject(request.error);
    });
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    // Show portal loader
    const portalLoader = document.getElementById('portal-loader');
    
    try {
        await initDB();
        const count = await loadQuestions();
        console.log(`Loaded ${count} questions into IndexedDB`);
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
    
    // Hide portal loader after 2 seconds
    setTimeout(() => {
        portalLoader.classList.add('hidden');
        setTimeout(() => portalLoader.style.display = 'none', 500);
    }, 2000);
    
    // Create floating particles
    createParticles();
    
    // Setup event listeners
    setupEventListeners();
});

// Create floating particles
function createParticles() {
    const container = document.getElementById('particles-container');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 3 + 's';
        particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(particle);
    }
}

// ===================================
// EVENT LISTENERS
// ===================================

function setupEventListeners() {
    // Player count selection
    document.querySelectorAll('.player-count-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const count = parseInt(e.target.dataset.count);
            selectPlayerCount(count);
        });
    });
    
    // Start game button
    document.getElementById('start-game-btn')?.addEventListener('click', startGame);
    
    // Roll dice button
    document.getElementById('roll-dice-btn')?.addEventListener('click', rollDice);
    
    // Play again button
    document.getElementById('play-again-btn')?.addEventListener('click', resetGame);
}

// ===================================
// SCREEN 1: PLAYER SELECTION
// ===================================

function selectPlayerCount(count) {
    gameState.numPlayers = count;
    gameState.players = [];
    
    // Animate transition
    const screen1 = document.getElementById('screen-player-select');
    const screen2 = document.getElementById('screen-class-select');
    
    anime({
        targets: screen1,
        opacity: [1, 0],
        duration: 500,
        easing: 'easeOutQuad',
        complete: () => {
            screen1.classList.remove('active');
            screen2.classList.add('active');
            showClassSelection();
            anime({
                targets: screen2,
                opacity: [0, 1],
                duration: 500,
                easing: 'easeInQuad'
            });
        }
    });
}

// ===================================
// SCREEN 2: CLASS SELECTION
// ===================================

function showClassSelection() {
    const container = document.getElementById('class-selection-container');
    container.innerHTML = '';
    
    const playerColors = ['#ff3366', '#00d4ff', '#00ff88', '#ffaa00'];
    
    for (let i = 0; i < gameState.numPlayers; i++) {
        const card = document.createElement('div');
        card.className = 'player-class-card slide-in-bottom';
        card.style.animationDelay = (i * 0.1) + 's';
        card.style.borderColor = playerColors[i];
        
        card.innerHTML = `
            <h3 style="color: ${playerColors[i]}">PLAYER ${i + 1}</h3>
            <div class="class-buttons">
                <button class="neon-btn class-btn" data-player="${i}" data-class="6">CLASS 6</button>
                <button class="neon-btn class-btn" data-player="${i}" data-class="7">CLASS 7</button>
                <button class="neon-btn class-btn" data-player="${i}" data-class="8">CLASS 8</button>
                <button class="neon-btn class-btn" data-player="${i}" data-class="9">CLASS 9</button>
                <button class="neon-btn class-btn" data-player="${i}" data-class="10">CLASS 10</button>
            </div>
        `;
        
        container.appendChild(card);
        
        gameState.players.push({
            id: i + 1,
            name: `Player ${i + 1}`,
            class: null,
            position: 0,
            color: playerColors[i]
        });
    }
    
    // Add event listeners to class buttons
    document.querySelectorAll('.class-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const playerIndex = parseInt(e.target.dataset.player);
            const classLevel = e.target.dataset.class;
            selectClass(playerIndex, classLevel, e.target);
        });
    });
}

function selectClass(playerIndex, classLevel, button) {
    gameState.players[playerIndex].class = classLevel;
    
    // Update button states
    const playerButtons = document.querySelectorAll(`[data-player="${playerIndex}"]`);
    playerButtons.forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    
    // Check if all players have selected classes
    const allSelected = gameState.players.every(p => p.class !== null);
    const startBtn = document.getElementById('start-game-btn');
    
    if (allSelected) {
        startBtn.style.display = 'block';
        anime({
            targets: startBtn,
            scale: [0, 1],
            duration: 500,
            easing: 'easeOutElastic(1, .5)'
        });
    }
}

// ===================================
// SCREEN 3: GAME BOARD
// ===================================

function startGame() {
    const screen2 = document.getElementById('screen-class-select');
    const screen3 = document.getElementById('screen-game');
    
    // Portal animation
    anime({
        targets: screen2,
        scale: [1, 0],
        rotate: [0, 360],
        opacity: [1, 0],
        duration: 1000,
        easing: 'easeInOutQuad',
        complete: () => {
            screen2.classList.remove('active');
            screen3.classList.add('active');
            initializeGame();
        }
    });
}

function initializeGame() {
    gameState.gameStarted = true;
    gameState.currentPlayerIndex = 0;
    gameState.round = 1;
    
    // Draw board
    drawBoard();
    
    // Create player tokens
    createPlayerTokens();
    
    // Create player info panel
    createPlayerPanel();
    
    // Update turn display
    updateTurnDisplay();
    
    // Enable roll dice button
    document.getElementById('roll-dice-btn').disabled = false;
    
    // Play background music (if available)
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic) {
        bgMusic.volume = 0.3;
        bgMusic.play().catch(e => console.log('Audio autoplay prevented'));
    }
}

// Draw game board
function drawBoard() {
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const tileSize = 80;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let tileNum = 100;
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            const x = (row % 2 === 0) ? col * tileSize : (9 - col) * tileSize;
            const y = (9 - row) * tileSize;
            
            // Tile background
            const gradient = ctx.createLinearGradient(x, y, x + tileSize, y + tileSize);
            if ((row + col) % 2 === 0) {
                gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
                gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
            } else {
                gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
                gradient.addColorStop(1, 'rgba(0, 212, 255, 0.1)');
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, tileSize, tileSize);
            
            // Tile border
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, tileSize, tileSize);
            
            // Tile number
            ctx.fillStyle = '#e0e7ff';
            ctx.font = 'bold 16px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tileNum, x + tileSize / 2, y + tileSize / 2);
            
            // Draw snakes and ladders
            if (gameState.snakes[tileNum]) {
                ctx.fillStyle = '#ff3366';
                ctx.font = '30px Arial';
                ctx.fillText('🐍', x + tileSize / 2, y + tileSize / 2 + 20);
            }
            if (gameState.ladders[tileNum]) {
                ctx.fillStyle = '#00ff88';
                ctx.font = '30px Arial';
                ctx.fillText('🪜', x + tileSize / 2, y + tileSize / 2 + 20);
            }
            
            tileNum--;
        }
    }
}

// Create player tokens
function createPlayerTokens() {
    const container = document.getElementById('tokens-container');
    container.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
        const token = document.createElement('div');
        token.className = `token player-${index + 1}`;
        token.id = `token-${index}`;
        token.style.background = player.color;
        token.style.borderColor = player.color;
        token.style.boxShadow = `0 0 20px ${player.color}`;
        
        const pos = getTokenPosition(0, index);
        token.style.left = pos.x + 'px';
        token.style.top = pos.y + 'px';
        
        container.appendChild(token);
    });
}

// Get token position on board
function getTokenPosition(tileNumber, playerIndex) {
    const tileSize = 80;
    const row = Math.floor((100 - tileNumber) / 10);
    const col = (row % 2 === 0) ? (tileNumber % 10) : (9 - (tileNumber % 10));
    
    const baseX = col * tileSize + tileSize / 2 - 15;
    const baseY = row * tileSize + tileSize / 2 - 15;
    
    // Offset for multiple players on same tile
    const offset = 10;
    const offsetX = (playerIndex % 2) * offset - offset / 2;
    const offsetY = Math.floor(playerIndex / 2) * offset - offset / 2;
    
    return { x: baseX + offsetX, y: baseY + offsetY };
}

// Create player info panel
function createPlayerPanel() {
    const panel = document.getElementById('players-panel');
    panel.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'player-card slide-in-right';
        card.id = `player-card-${index}`;
        card.style.animationDelay = (index * 0.1) + 's';
        card.style.borderColor = player.color;
        
        card.innerHTML = `
            <div class="player-card-header">
                <span class="player-name" style="color: ${player.color}">${player.name}</span>
                <span class="player-class">CLASS ${player.class}</span>
            </div>
            <div class="player-position">Position: <span id="pos-${index}">0</span></div>
        `;
        
        panel.appendChild(card);
    });
}

// Update turn display
function updateTurnDisplay() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const turnDisplay = document.getElementById('current-turn');
    turnDisplay.textContent = `${currentPlayer.name.toUpperCase()}'S TURN`;
    turnDisplay.style.color = currentPlayer.color;
    
    // Update active player card
    document.querySelectorAll('.player-card').forEach((card, index) => {
        if (index === gameState.currentPlayerIndex) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

// ===================================
// DICE ROLL
// ===================================

function rollDice() {
    const diceBtn = document.getElementById('roll-dice-btn');
    const dice = document.getElementById('dice');
    const diceFace = dice.querySelector('.dice-face');
    
    diceBtn.disabled = true;
    
    // Play dice sound
    playSound('dice-sound');
    
    // Screen shake effect
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 500);
    
    // Dice roll animation
    dice.classList.add('rolling');
    
    let rollCount = 0;
    const rollInterval = setInterval(() => {
        diceFace.textContent = Math.floor(Math.random() * 6) + 1;
        rollCount++;
        
        if (rollCount >= 10) {
            clearInterval(rollInterval);
            const finalRoll = Math.floor(Math.random() * 6) + 1;
            diceFace.textContent = finalRoll;
            dice.classList.remove('rolling');
            
            setTimeout(() => {
                movePlayer(finalRoll);
            }, 500);
        }
    }, 100);
}

// Move player
function movePlayer(steps) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const token = document.getElementById(`token-${gameState.currentPlayerIndex}`);
    
    let currentPos = player.position;
    let step = 0;
    
    const moveInterval = setInterval(() => {
        if (step < steps && currentPos < 100) {
            currentPos++;
            step++;
            
            const pos = getTokenPosition(currentPos, gameState.currentPlayerIndex);
            
            anime({
                targets: token,
                left: pos.x,
                top: pos.y,
                duration: 300,
                easing: 'easeInOutQuad'
            });
            
            // Update position display
            document.getElementById(`pos-${gameState.currentPlayerIndex}`).textContent = currentPos;
        } else {
            clearInterval(moveInterval);
            player.position = currentPos;
            
            // Check for win
            if (currentPos >= 100) {
                setTimeout(() => showWinner(), 500);
                return;
            }
            
            // Check for snake or ladder
            if (gameState.snakes[currentPos]) {
                setTimeout(() => handleSnake(currentPos), 500);
            } else if (gameState.ladders[currentPos]) {
                setTimeout(() => handleLadder(currentPos), 500);
            } else {
                // Show question
                setTimeout(() => showQuestion(), 500);
            }
        }
    }, 300);
}

// Handle snake
function handleSnake(fromPos) {
    const toPos = gameState.snakes[fromPos];
    const player = gameState.players[gameState.currentPlayerIndex];
    const token = document.getElementById(`token-${gameState.currentPlayerIndex}`);
    
    // Show snake animation
    showSnakeLadderEffect('🐍', fromPos);
    
    setTimeout(() => {
        player.position = toPos;
        const pos = getTokenPosition(toPos, gameState.currentPlayerIndex);
        
        anime({
            targets: token,
            left: pos.x,
            top: pos.y,
            duration: 1000,
            easing: 'easeInOutQuad'
        });
        
        document.getElementById(`pos-${gameState.currentPlayerIndex}`).textContent = toPos;
        
        setTimeout(() => showQuestion(), 1000);
    }, 500);
}

// Handle ladder
function handleLadder(fromPos) {
    const toPos = gameState.ladders[fromPos];
    const player = gameState.players[gameState.currentPlayerIndex];
    const token = document.getElementById(`token-${gameState.currentPlayerIndex}`);
    
    // Show ladder animation
    showSnakeLadderEffect('🪜', fromPos);
    
    setTimeout(() => {
        player.position = toPos;
        const pos = getTokenPosition(toPos, gameState.currentPlayerIndex);
        
        anime({
            targets: token,
            left: pos.x,
            top: pos.y,
            duration: 1000,
            easing: 'easeInOutQuad'
        });
        
        document.getElementById(`pos-${gameState.currentPlayerIndex}`).textContent = toPos;
        
        setTimeout(() => showQuestion(), 1000);
    }, 500);
}

// Show snake/ladder effect
function showSnakeLadderEffect(emoji, position) {
    const effect = document.createElement('div');
    effect.className = 'snake-ladder-effect';
    effect.textContent = emoji;
    
    const pos = getTokenPosition(position, 0);
    effect.style.left = pos.x + 'px';
    effect.style.top = pos.y + 'px';
    
    document.getElementById('particles-container').appendChild(effect);
    
    setTimeout(() => effect.remove(), 1000);
}

// ===================================
// QUESTION SYSTEM
// ===================================

let questionTimer;
let timeLeft = 30;

async function showQuestion() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const modal = document.getElementById('question-modal');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const classDisplay = document.getElementById('q-class');
    const timerDisplay = document.getElementById('timer');
    
    try {
        const question = await getRandomQuestion(player.class);
        
        classDisplay.textContent = player.class;
        questionText.textContent = question.question;
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'neon-btn option-btn';
            btn.textContent = option;
            btn.onclick = () => checkAnswer(option, question.answer, btn);
            optionsContainer.appendChild(btn);
        });
        
        modal.classList.add('active');
        
        // Start timer
        timeLeft = 30;
        timerDisplay.textContent = timeLeft;
        questionTimer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(questionTimer);
                checkAnswer(null, question.answer, null);
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error loading question:', error);
        nextTurn();
    }
}

function checkAnswer(selectedAnswer, correctAnswer, button) {
    clearInterval(questionTimer);
    
    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correctAnswer) {
            btn.classList.add('correct');
        }
        if (btn === button && selectedAnswer !== correctAnswer) {
            btn.classList.add('wrong');
        }
    });
    
    setTimeout(() => {
        document.getElementById('question-modal').classList.remove('active');
        
        if (selectedAnswer === correctAnswer) {
            showCorrectResult();
        } else {
            showWrongResult();
        }
    }, 1500);
}

function showCorrectResult() {
    playSound('correct-sound');
    
    const modal = document.getElementById('result-modal');
    const content = document.getElementById('result-content');
    
    content.innerHTML = `
        <div class="result-correct">✓ CORRECT!</div>
        <div class="xp-popup" style="position: relative;">+5 XP LEVEL UP</div>
    `;
    
    modal.classList.add('active');
    
    // Shadow army burst effect
    createShadowBurst();
    
    setTimeout(() => {
        modal.classList.remove('active');
        nextTurn();
    }, 2000);
}

function showWrongResult() {
    playSound('wrong-sound');
    
    const modal = document.getElementById('result-modal');
    const content = document.getElementById('result-content');
    
    content.innerHTML = `
        <div class="result-wrong">✗ WRONG!</div>
        <div class="flame-text" style="position: relative;">BERU DRAGS YOU BACK!</div>
    `;
    
    modal.classList.add('active');
    
    // Beru drag animation
    createBeruDrag();
    
    // Move player to position 0
    setTimeout(() => {
        const player = gameState.players[gameState.currentPlayerIndex];
        const token = document.getElementById(`token-${gameState.currentPlayerIndex}`);
        
        player.position = 0;
        const pos = getTokenPosition(0, gameState.currentPlayerIndex);
        
        anime({
            targets: token,
            left: pos.x,
            top: pos.y,
            duration: 1000,
            easing: 'easeInOutQuad'
        });
        
        document.getElementById(`pos-${gameState.currentPlayerIndex}`).textContent = 0;
        
        setTimeout(() => {
            modal.classList.remove('active');
            nextTurn();
        }, 1000);
    }, 2000);
}

// Create shadow burst effect
function createShadowBurst() {
    const burst = document.createElement('div');
    burst.className = 'shadow-burst';
    burst.style.left = '50%';
    burst.style.top = '50%';
    burst.style.transform = 'translate(-50%, -50%)';
    
    document.getElementById('particles-container').appendChild(burst);
    
    setTimeout(() => burst.remove(), 800);
}

// Create Beru drag effect
function createBeruDrag() {
    const beru = document.createElement('div');
    beru.className = 'beru-drag';
    beru.style.left = '50%';
    beru.style.top = '20%';
    beru.style.transform = 'translateX(-50%)';
    
    document.getElementById('particles-container').appendChild(beru);
    
    setTimeout(() => beru.remove(), 2000);
}

// Next turn
function nextTurn() {
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.numPlayers;
    
    if (gameState.currentPlayerIndex === 0) {
        gameState.round++;
        document.getElementById('round-counter').textContent = `ROUND: ${gameState.round}`;
    }
    
    updateTurnDisplay();
    
    // Sync state for multiplayer
    if (window.multiplayerState && window.multiplayerState.isOnlineMode) {
        window.syncGameState();
        window.updateDiceButton();
    } else {
        document.getElementById('roll-dice-btn').disabled = false;
    }
}

// ===================================
// WINNER
// ===================================

function showWinner() {
    playSound('win-sound');
    
    const player = gameState.players[gameState.currentPlayerIndex];
    const modal = document.getElementById('winner-modal');
    const content = document.getElementById('winner-content');
    
    content.innerHTML = `
        <h2 style="color: ${player.color}; font-size: 3rem; margin-bottom: 1rem;">${player.name}</h2>
        <p style="font-size: 1.5rem;">Class ${player.class} Champion</p>
        <p style="font-size: 1.2rem; margin-top: 1rem;">Completed in Round ${gameState.round}</p>
    `;
    
    modal.classList.add('active');
}

// Reset game
function resetGame() {
    location.reload();
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Sound play prevented'));
    }
}
