const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ensure canvas size matches CSS
canvas.width = 1200;
canvas.height = 800;

// Game Mode System
let currentGameMode = null;

let gameRunning = false;
let animationId;

let rpsObjects = [];
let flashEffects = [];
let powerups = []; // Array for powerup/effect objects

let gameSpeed = 1;
let startingCount = 3;
let imagesLoaded = 0;
let totalImages = 3; // rock, scissors, and paper

let gameStats =
{
    totalBattles: 0,
    gameStartTime: 0,
    gameTime: 0
};

const RPS_TYPES =
{
    Rock: {color: 'green', letter: 'R'},
    Paper: {color: 'blue', letter: 'P'},
    Scissors: {color: 'red', letter: 'S'}
};

// Load rock and scissors images
const rockImage = new Image();
rockImage.src = './assets/rock.png';
rockImage.onload = function() {
    console.log('Rock image loaded successfully!');
    imagesLoaded++;
    checkAllImagesLoaded();
};
rockImage.onerror = function() {
    console.log('Failed to load rock image - will use red circle instead');
    imagesLoaded++;
    checkAllImagesLoaded();
};

const scissorsImage = new Image();
scissorsImage.src = './assets/scissors.png';
scissorsImage.onload = function() {
    console.log('Scissors image loaded successfully!');
    imagesLoaded++;
    checkAllImagesLoaded();
};
scissorsImage.onerror = function() {
    console.log('Failed to load scissors image - will use yellow circle instead');
    imagesLoaded++;
    checkAllImagesLoaded();
};

const paperImage = new Image();
paperImage.src = './assets/paper.png';
paperImage.onload = function() {
    console.log('Paper image loaded successfully!');
    imagesLoaded++;
    checkAllImagesLoaded();
};
paperImage.onerror = function() {
    console.log('Failed to load paper image - will use blue circle instead');
    imagesLoaded++;
    checkAllImagesLoaded();
};

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
    settingsPanel.classList.toggle('hidden');
    
    // Update button text
    if (settingsPanel.classList.contains('hidden')) {
        settingsToggle.textContent = '⚙️ Settings';
    } else {
        settingsToggle.textContent = '⚙️ Hide Settings';
    }
});

function checkAllImagesLoaded() {
    if (imagesLoaded >= totalImages) {
        // All images loaded, initialize game mode and draw the game
        currentGameMode = new ClassicMode();
        if (currentGameMode.createUI) currentGameMode.createUI();
        initializeGame();
        clearCanvas();
        drawAllObjects();
        updateGameStatus();
    }
}

function showLoadingScreen() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Loading Game Assets...', canvas.width / 2, canvas.height / 2);
    
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`${imagesLoaded}/${totalImages} images loaded`, canvas.width / 2, canvas.height / 2 + 50);
}


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
    const newCount = parseInt(startCountInput.value);
    if (newCount >= 1 && newCount <= 10) {
        startingCount = newCount;
        resetGame(); // Restart with new count
    }
}


function spawnObject(type) {
    const counts = { Rock: 0, Paper: 0, Scissors: 0 };
    rpsObjects.forEach(obj => counts[obj.type]++);
    const typesRemaining = Object.values(counts).filter(count => count > 0).length;
    if (typesRemaining <= 1) {
        return;
    }
    let x, y, attempts = 0;
    do {
        x = Math.random() * (canvas.width - 100) + 50;
        y = Math.random() * (canvas.height - 100) + 50;
        attempts++;
    } while (attempts < 50 && isPositionOccupied(x, y));
    const newObject = createRPSObject(type, x, y);
    newObject.speedX *= gameSpeed;
    newObject.speedY *= gameSpeed;
    rpsObjects.push(newObject);
    // Allow mode to react to spawns
    if (currentGameMode && currentGameMode.onSpawn) currentGameMode.onSpawn(type, newObject);
}

// Batch spawn for modes that want to spawn multiple at once
function spawnObjects(types) {
    types.forEach(type => spawnObject(type));
}

function isPositionOccupied(x, y) {
    return rpsObjects.some(obj => {
        const dx = obj.x - x;
        const dy = obj.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj.radius + 25 + 10);
    });
}

function createRPSObject(type, x, y)
{
    return {
        x:x,
        y:y,
        radius: 30,
        baseRadius: 30, 
        speedX: (Math.random() - 0.5) * 6 * gameSpeed,
        speedY: (Math.random() - 0.5) * 6 * gameSpeed,
        type: type,
        color: RPS_TYPES[type].color,
        baseColor: RPS_TYPES[type].color,
        letter: RPS_TYPES[type].letter,
        winAnimation: 0,
        pulseIntensity: 0 
    };
}

function createFlashEffect(x, y) {
    return {
        x: x,
        y: y,
        radius: 10,
        maxRadius: 50,
        opacity: 1,
        duration: 20
    };
}

function initializeGame()
{
    if (currentGameMode) {
        currentGameMode.init();
    }
}

function startGame() 
{
    if (!gameRunning) {
        gameRunning = true;
        startBtn.textContent = 'Pause';
        if (gameStats.gameStartTime === 0) {
            gameStats.gameStartTime = Date.now();
        }
        gameLoop();
    } else {
        pauseGame();    
    }
}

function pauseGame() 
{
    gameRunning = false;
    startBtn.textContent = 'Start Game';
    cancelAnimationFrame(animationId);
}

function resetGame() 
{
    pauseGame();

    // Remove any mode-specific UI
    if (currentGameMode && currentGameMode.removeUI) currentGameMode.removeUI();

    startBtn.disabled = false;
    startBtn.textContent = 'Start';
    startBtn.style.backgroundColor = '#3498db';
    startBtn.style.cursor = 'pointer';

    if (currentGameMode) {
        currentGameMode.reset();
        if (currentGameMode.createUI) currentGameMode.createUI();
    }
    initializeGame();
    updateGameStatus();
    clearCanvas();
    drawAllObjects();
}

function updateGameStatus()
{
    if (gameRunning && currentGameMode && currentGameMode.updateTimer) {
        currentGameMode.updateTimer();
    }

    const counts = {Rock: 0, Paper: 0, Scissors: 0};
    rpsObjects.forEach(obj => {
        counts[obj.type]++;
    });

    rockCountElement.textContent = `Rock: ${counts.Rock}`;
    paperCountElement.textContent = `Paper: ${counts.Paper}`;
    scissorsCountElement.textContent = `Scissors: ${counts.Scissors}`;

    updateStatsDisplay();

    // Allow mode to update its own UI
    if (currentGameMode && currentGameMode.updateUI) currentGameMode.updateUI();

    // Check game end condition using current game mode
    if (currentGameMode && currentGameMode.checkGameEnd()) {
        gameMessageElement.textContent = currentGameMode.getGameEndMessage();
        pauseGame();

        startBtn.disabled = true;
        startBtn.textContent = 'Game Over';
        startBtn.style.backgroundColor = '#7f8c8d';
        startBtn.style.cursor = 'not-allowed';
    } else {
        gameMessageElement.textContent = '...';
    }
}

function gameLoop() 
{
    if (!gameRunning) return;


    clearCanvas();
    updateAllObjects();
    checkCollisions();
    // Update powerups/effects (if any)
    if (currentGameMode && currentGameMode.updatePowerups) {
        currentGameMode.updatePowerups();
    }
    updateGameStatus();
    drawAllObjects();

    animationId = requestAnimationFrame(gameLoop);
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

function updateAllObjects() 
{
    rpsObjects.forEach(obj => {
        obj.x += obj.speedX;
        obj.y += obj.speedY;

        if (obj.winAnimation > 0) {
            obj.winAnimation--;
            
            const progress = 1 - (obj.winAnimation / 30);
            obj.radius = obj.baseRadius + Math.sin(progress * Math.PI) * 8;
     
            obj.pulseIntensity = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
        } else {
            obj.radius = obj.baseRadius;
            obj.pulseIntensity = 0;
        }

        if  (obj.x + obj.radius >= canvas.width || obj.x - obj.radius <= 0) {
            obj.speedX = -obj.speedX;
        }
    
        if (obj.y + obj.radius >= canvas.height || obj.y - obj.radius <= 0) {
            obj.speedY = -obj.speedY;
        }
    });
}

function updateFlashEffects() {
    flashEffects = flashEffects.filter(flash => {
        flash.radius += (flash.maxRadius - flash.radius) * 0.3;
        flash.opacity -= 1 / flash.duration;
        return flash.opacity > 0;
    });
}

function checkCollisions() {
    const objectsToRemove = [];
    const gridSize = 100;
    const grid = new Map();
    
    rpsObjects.forEach((obj, index) => {
        const gridX = Math.floor(obj.x / gridSize);
        const gridY = Math.floor(obj.y / gridSize);
        const key = `${gridX},${gridY}`;
        
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push({ obj, index });
    });

    grid.forEach(objects => {
        for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
                const { obj: obj1, index: idx1 } = objects[i];
                const { obj: obj2, index: idx2 } = objects[j];
                
                const dx = obj1.x - obj2.x;
                const dy = obj1.y - obj2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < obj1.radius + obj2.radius) {
                    if (currentGameMode) {
                        const winner = currentGameMode.onCollision(obj1, obj2);
                        
                        if (winner === obj1) {
                            if (!objectsToRemove.includes(idx2)) {
                                objectsToRemove.push(idx2);
                            }
                        } else if (winner === obj2) {
                            if (!objectsToRemove.includes(idx1)) {
                                objectsToRemove.push(idx1);
                            }
                        }
                    }
                }
            }
        }
    });
    
    objectsToRemove.sort((a, b) => b - a);
    objectsToRemove.forEach(index => {
        rpsObjects.splice(index, 1);
    });
}

function getRPSWinner(type1, type2) {
    if (type1 === type2) {
        return null; 
    }
    
    if (type1 === 'Rock' && type2 === 'Scissors') return 'Rock';
    if (type1 === 'Paper' && type2 === 'Rock') return 'Paper';
    if (type1 === 'Scissors' && type2 === 'Paper') return 'Scissors';
    
    if (type2 === 'Rock' && type1 === 'Scissors') return 'Rock';
    if (type2 === 'Paper' && type1 === 'Rock') return 'Paper';
    if (type2 === 'Scissors' && type1 === 'Paper') return 'Scissors';
    
    return null; 
}

function drawFlashEffects() {
    flashEffects.forEach(flash => {
        ctx.save();
        ctx.globalAlpha = flash.opacity;
        ctx.fillStyle = '#FFD700'; // Gold flash
        ctx.beginPath();
        ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawAllObjects() {
    rpsObjects.forEach(obj => {
        ctx.save();
        
        // Apply glow effect for winning animation
        if (obj.pulseIntensity > 0) {
            ctx.shadowColor = obj.color;
            ctx.shadowBlur = 20 * obj.pulseIntensity;
        }
        
        // Draw images for Rock, Scissors, and Paper if loaded, otherwise draw circles
        if (obj.type === 'Rock' && rockImage.complete && rockImage.naturalWidth > 0) {
            // Draw rock image - make it bigger than the circles
            const size = obj.radius * 3;
            const offset = size / 2;
            ctx.drawImage(rockImage, obj.x - offset, obj.y - offset, size, size);
        } else if (obj.type === 'Scissors' && scissorsImage.complete && scissorsImage.naturalWidth > 0) {
            // Draw scissors image - make it bigger than the circles
            const size = obj.radius * 3;
            const offset = size / 2;
            ctx.drawImage(scissorsImage, obj.x - offset, obj.y - offset, size, size);
        } else if (obj.type === 'Paper' && paperImage.complete && paperImage.naturalWidth > 0) {
            // Draw paper image - make it bigger than the circles
            const size = obj.radius * 3;
            const offset = size / 2;
            ctx.drawImage(paperImage, obj.x - offset, obj.y - offset, size, size);
        } else {
            // Draw colored circles with letters (for Paper, Scissors, or Rock if image failed)
            let drawColor = obj.color;
            if (obj.pulseIntensity > 0) {
                if (obj.color === 'red') drawColor = `rgba(255, ${100 * (1 - obj.pulseIntensity)}, ${100 * (1 - obj.pulseIntensity)}, 1)`;
                else if (obj.color === 'blue') drawColor = `rgba(${100 * (1 - obj.pulseIntensity)}, ${100 * (1 - obj.pulseIntensity)}, 255, 1)`;
                else if (obj.color === 'yellow') drawColor = `rgba(255, 255, ${100 * (1 - obj.pulseIntensity)}, 1)`;
            }
       
            ctx.fillStyle = drawColor;
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
    if (currentGameMode && currentGameMode.drawPowerups) {
        currentGameMode.drawPowerups(ctx);
    }
}

function clearCanvas()
{
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

document.addEventListener('keydown', (event) => {
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

// Show loading screen initially
showLoadingScreen();