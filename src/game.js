const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ensure canvas size matches CSS
canvas.width = 1200;
canvas.height = 800;

// Speeds and animation lengths are in 60fps frames; movement is scaled by real frame time
const FRAME_MS = 1000 / 60;
const MAX_FRAME_MS = 50;
const MAX_TIMER_GAP_MS = 1000;
const OBJECT_RADIUS = 30;
const WIN_ANIMATION_FRAMES = 30;
const SPAWN_MARGIN = 50;

// Game Mode System
let currentGameMode = null;

let gameRunning = false;
let animationId;
let lastFrameTime = null;

let rpsObjects = [];

let gameSpeed = 1;
let startingCount = 3;

let gameStats =
{
    totalBattles: 0,
    elapsedMs: 0
};

const RPS_TYPES =
{
    Rock: {color: '#ff6b8a', letter: 'R', image: './assets/rock.png'},
    Paper: {color: '#6c9bff', letter: 'P', image: './assets/paper.png'},
    Scissors: {color: '#f0b429', letter: 'S', image: './assets/scissors.png'}
};

// Objects fall back to a coloured circle if their image fails to load
const rpsImages = {};
Object.entries(RPS_TYPES).forEach(([type, { image }]) => {
    const img = new Image();
    img.src = image;
    img.onerror = () => console.warn(`Failed to load ${image} - drawing ${type} as a circle instead`);
    rpsImages[type] = img;
});

const totalBattlesElement = document.querySelector('.total-battles');
const gameTimeElement = document.querySelector('.game-time');

const rockCountElement = document.querySelector('.rock-count');
const paperCountElement = document.querySelector('.paper-count');
const scissorsCountElement = document.querySelector('.scissors-count');
const gameMessageElement = document.querySelector('.game-message');

const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const slowBtn = document.getElementById('slowBtn');
const normalBtn = document.getElementById('normalBtn');
const fastBtn = document.getElementById('fastBtn');
const ultraFastBtn = document.getElementById('ultraFastBtn');
const ludicrousBtn = document.getElementById('ludicrousBtn');
const spawnRockBtn = document.getElementById('spawnRockBtn');
const spawnPaperBtn = document.getElementById('spawnPaperBtn');
const spawnScissorsBtn = document.getElementById('spawnScissorsBtn');
const startCountInput = document.getElementById('startCount');
const applyCountBtn = document.getElementById('applyCountBtn');

const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');

const collisionSound = new Audio('sounds/collision.mp3');
collisionSound.volume = 0.5;

startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGame);

slowBtn.addEventListener('click', () => setGameSpeed(0.5, slowBtn));
normalBtn.addEventListener('click', () => setGameSpeed(1, normalBtn));
fastBtn.addEventListener('click', () => setGameSpeed(2, fastBtn));
ultraFastBtn.addEventListener('click', () => setGameSpeed(5, ultraFastBtn));
ludicrousBtn.addEventListener('click', () => setGameSpeed(10, ludicrousBtn));

spawnRockBtn.addEventListener('click', () => spawnObject('Rock'));
spawnPaperBtn.addEventListener('click', () => spawnObject('Paper'));
spawnScissorsBtn.addEventListener('click', () => spawnObject('Scissors'));

applyCountBtn.addEventListener('click', applyStartingCount);

settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('collapsed');
    
    // Update button text
    if (settingsPanel.classList.contains('collapsed')) {
        settingsToggle.textContent = '⚙️ Settings';
    } else {
        settingsToggle.textContent = '⚙️ Hide Settings';
    }
});


function setGameSpeed(speed, activeBtn) {
    const oldSpeed = gameSpeed;
    gameSpeed = speed;
    
    document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
    
    const speedRatio = speed / oldSpeed;
    rpsObjects.forEach(obj => {
        obj.speedX *= speedRatio;
        obj.speedY *= speedRatio;
    });
}

function applyStartingCount() {
    const newCount = parseInt(startCountInput.value, 10);
    if (newCount >= 1 && newCount <= 10) {
        startingCount = newCount;
        resetGame(); // Restart with new count
    } else {
        startCountInput.value = startingCount;
    }
}


function spawnObject(type) {
    if (!currentGameMode || !currentGameMode.canSpawn() || currentGameMode.checkGameEnd()) {
        return;
    }
    const { x, y } = findFreePosition();
    const newObject = createRPSObject(type, x, y);
    rpsObjects.push(newObject);
    currentGameMode.onSpawn(newObject);

    if (!gameRunning) {
        updateGameStatus();
        render();
    }
}

function findFreePosition() {
    let x, y, attempts = 0;
    do {
        x = Math.random() * (canvas.width - SPAWN_MARGIN * 2) + SPAWN_MARGIN;
        y = Math.random() * (canvas.height - SPAWN_MARGIN * 2) + SPAWN_MARGIN;
        attempts++;
    } while (attempts < 50 && isPositionOccupied(x, y));
    return { x, y };
}

function isPositionOccupied(x, y) {
    return rpsObjects.some(obj => {
        const dx = obj.x - x;
        const dy = obj.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj.radius + OBJECT_RADIUS + 10);
    });
}

function createRPSObject(type, x, y)
{
    const angle = Math.random() * Math.PI * 2;
    const speed = (1.5 + Math.random() * 1.5) * gameSpeed;
    return {
        x: x,
        y: y,
        radius: OBJECT_RADIUS,
        baseRadius: OBJECT_RADIUS,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        type: type,
        color: RPS_TYPES[type].color,
        letter: RPS_TYPES[type].letter,
        winAnimation: 0,
        pulseIntensity: 0 
    };
}

function countTypes() {
    const counts = { Rock: 0, Paper: 0, Scissors: 0 };
    rpsObjects.forEach(obj => {
        counts[obj.type]++;
    });
    return counts;
}

function resetGameStats() {
    gameStats.totalBattles = 0;
    gameStats.elapsedMs = 0;
}

function startGame() 
{
    if (!currentGameMode || startBtn.disabled) {
        return;
    }
    if (gameRunning) {
        pauseGame();
        return;
    }
    if (!currentGameMode.canStart()) {
        return;
    }
    gameRunning = true;
    startBtn.textContent = 'Pause';
    lastFrameTime = null;
    animationId = requestAnimationFrame(gameLoop);
}

function pauseGame() 
{
    gameRunning = false;
    startBtn.textContent = 'Start';
    cancelAnimationFrame(animationId);
}

function resetGame() 
{
    pauseGame();
    startBtn.disabled = false;
    resetGameStats();

    if (currentGameMode) {
        currentGameMode.removeUI();
        currentGameMode.reset();
        currentGameMode.createUI();
        currentGameMode.init();
    }
    updateGameStatus();
    render();
}

function updateGameStatus()
{
    const counts = countTypes();

    rockCountElement.textContent = `Rock: ${counts.Rock}`;
    paperCountElement.textContent = `Paper: ${counts.Paper}`;
    scissorsCountElement.textContent = `Scissors: ${counts.Scissors}`;

    updateStatsDisplay();

    if (!currentGameMode) {
        return;
    }

    // Allow mode to update its own UI
    currentGameMode.updateUI();

    // Check game end condition using current game mode
    if (currentGameMode.checkGameEnd()) {
        gameMessageElement.textContent = currentGameMode.getGameEndMessage();
        pauseGame();

        startBtn.disabled = true;
        startBtn.textContent = 'Game Over';
    } else {
        gameMessageElement.textContent = '...';
    }
}

function gameLoop(timestamp) 
{
    if (!gameRunning) return;

    // Physics steps are capped so a slow frame can't teleport objects through each other;
    // the timer is only capped to ignore long gaps like a backgrounded tab
    const frameMs = lastFrameTime === null ? 0 : timestamp - lastFrameTime;
    const stepMs = Math.min(frameMs, MAX_FRAME_MS);
    lastFrameTime = timestamp;

    updateAllObjects(stepMs / FRAME_MS);
    checkCollisions();
    currentGameMode.update(stepMs);
    currentGameMode.updatePowerups(stepMs);
    currentGameMode.updateTimer(Math.min(frameMs, MAX_TIMER_GAP_MS));
    updateGameStatus();
    render();

    if (gameRunning) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function updateStatsDisplay() {
    if (currentGameMode) {
        totalBattlesElement.textContent = `Battles: ${currentGameMode.getScore()}`;
        gameTimeElement.textContent = `Time: ${currentGameMode.getTime()}s`;
    } else {
        totalBattlesElement.textContent = `Battles: 0`;
        gameTimeElement.textContent = `Time: 0s`;
    }
}

function updateAllObjects(step) 
{
    rpsObjects.forEach(obj => {
        const customMove = currentGameMode && currentGameMode.moveObject(obj, step);
        if (!customMove) {
            obj.x += obj.speedX * step;
            obj.y += obj.speedY * step;
        }

        if (obj.winAnimation > 0) {
            obj.winAnimation = Math.max(0, obj.winAnimation - step);
            
            const progress = 1 - (obj.winAnimation / WIN_ANIMATION_FRAMES);
            obj.radius = obj.baseRadius + Math.sin(progress * Math.PI) * 8;
     
            obj.pulseIntensity = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
        } else {
            obj.radius = obj.baseRadius;
            obj.pulseIntensity = 0;
        }

        // Player-controlled objects stay inside the arena without bouncing.
        // Everyone else clamps to the wall so an overshoot can't flip direction every frame.
        if (customMove) {
            obj.x = Math.max(obj.radius, Math.min(canvas.width - obj.radius, obj.x));
            obj.y = Math.max(obj.radius, Math.min(canvas.height - obj.radius, obj.y));
        } else {
            if (obj.x - obj.radius < 0) {
                obj.x = obj.radius;
                obj.speedX = Math.abs(obj.speedX);
            } else if (obj.x + obj.radius > canvas.width) {
                obj.x = canvas.width - obj.radius;
                obj.speedX = -Math.abs(obj.speedX);
            }

            if (obj.y - obj.radius < 0) {
                obj.y = obj.radius;
                obj.speedY = Math.abs(obj.speedY);
            } else if (obj.y + obj.radius > canvas.height) {
                obj.y = canvas.height - obj.radius;
                obj.speedY = -Math.abs(obj.speedY);
            }
        }
    });
}

function checkCollisions() {
    const removed = new Set();

    for (let i = 0; i < rpsObjects.length; i++) {
        const obj1 = rpsObjects[i];
        if (removed.has(obj1)) continue;

        for (let j = i + 1; j < rpsObjects.length; j++) {
            const obj2 = rpsObjects[j];
            if (removed.has(obj2)) continue;

            const dx = obj1.x - obj2.x;
            const dy = obj1.y - obj2.y;
            const minDistance = obj1.radius + obj2.radius;
            if (dx * dx + dy * dy >= minDistance * minDistance) continue;

            const winner = currentGameMode.onCollision(obj1, obj2);
            if (winner === obj1) {
                removed.add(obj2);
            } else if (winner === obj2) {
                removed.add(obj1);
                break;
            }
        }
    }

    if (removed.size > 0) {
        rpsObjects = rpsObjects.filter(obj => !removed.has(obj));
    }
}

function drawAllObjects() {
    rpsObjects.forEach(obj => {
        ctx.save();
        
        // Apply glow effect for winning animation
        if (obj.pulseIntensity > 0) {
            ctx.shadowColor = obj.color;
            ctx.shadowBlur = 20 * obj.pulseIntensity;
        }
        
        const image = rpsImages[obj.type];
        if (image.complete && image.naturalWidth > 0) {
            // Images are drawn bigger than the collision circle
            const size = obj.radius * 3;
            const offset = size / 2;
            ctx.drawImage(image, obj.x - offset, obj.y - offset, size, size);
        } else {
            ctx.fillStyle = obj.color;
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add letter
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(obj.letter, obj.x, obj.y);
        }
        
        ctx.restore();
    });
    // Draw powerups/effects (if any)
    if (currentGameMode) {
        currentGameMode.drawPowerups(ctx);
    }
}

function clearCanvas()
{
    ctx.fillStyle = '#fff7fb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function render() {
    clearCanvas();
    if (currentGameMode) {
        currentGameMode.drawBackground(ctx);
    }
    drawAllObjects();
}

document.addEventListener('keydown', (event) => {
    // Shortcuts only apply on the game screen, and must not swallow typing or browser shortcuts
    if (!currentGameMode || event.target instanceof HTMLInputElement) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (typeof currentGameMode.onKeyDown === 'function' && currentGameMode.onKeyDown(event)) return;

    switch(event.code) {
        case 'Space':
            event.preventDefault();
            startGame(); 
            break;
            
        case 'KeyR':
            event.preventDefault();
            resetGame(); 
            break;
            
        case 'Digit1':
            event.preventDefault();
            spawnObject('Rock'); 
            break;
            
        case 'Digit2':
            event.preventDefault();
            spawnObject('Paper'); 
            break;
            
        case 'Digit3':
            event.preventDefault();
            spawnObject('Scissors'); 
            break;
            
        case 'KeyS':
            event.preventDefault();
            setGameSpeed(0.5, slowBtn); 
            break;
            
        case 'KeyN':
            event.preventDefault();
            setGameSpeed(1, normalBtn); 
            break;
            
        case 'KeyF':
            event.preventDefault();
            setGameSpeed(2, fastBtn); 
            break;
            
        case 'KeyU':
            event.preventDefault();
            setGameSpeed(5, ultraFastBtn); 
            break;
            
        case 'KeyL':
            event.preventDefault();
            setGameSpeed(10, ludicrousBtn); // L for Ludicrous
            break;
    }
});

document.addEventListener('keyup', (event) => {
    if (currentGameMode && typeof currentGameMode.onKeyUp === 'function') {
        currentGameMode.onKeyUp(event);
    }
});
