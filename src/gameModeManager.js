// Game Mode Manager - handles switching between different game modes
class GameModeManager {
    constructor() {
        this.availableModes = {
            classic: {
                name: 'Classic Mode',
                class: ClassicMode,
                available: true,
                description: 'The original RPS battle royale'
            },
            timed_battle: {
                name: 'Timed Battle',
                class: null, // Not implemented yet
                available: false,
                description: 'Continuous spawning for a set time'
            },
            prediction_mode: {
                name: 'Prediction Mode',
                class: null,
                available: false,
                description: 'Predict the winner and score points'
            },
            survival_mode: {
                name: 'Survival Mode',
                class: null,
                available: false,
                description: 'Control your character and survive'
            },
            powerup_chaos: {
                name: 'Powerup Chaos',
                class: null,
                available: false,
                description: 'Classic gameplay with power-ups'
            },
            king_of_the_hill: {
                name: 'King of the Hill',
                class: null,
                available: false,
                description: 'Control the center territory'
            },
            elimination_tournament: {
                name: 'Tournament',
                class: null,
                available: false,
                description: 'Single elimination bracket style'
            },
            infection_mode: {
                name: 'Infection Mode',
                class: null,
                available: false,
                description: 'One type spreads like a virus'
            },
            resource_management: {
                name: 'Resource Management',
                class: null,
                available: false,
                description: 'Limited spawns require strategy'
            }
        };
        
        this.currentMode = null;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Main menu mode selection
        document.addEventListener('DOMContentLoaded', () => {
            const modeCards = document.querySelectorAll('.mode-card.available');
            modeCards.forEach(card => {
                card.addEventListener('click', (e) => {
                    const modeId = card.dataset.mode;
                    this.selectMode(modeId);
                });
                
                // Also handle the play button click specifically
                const playBtn = card.querySelector('.play-btn');
                if (playBtn) {
                    playBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent double triggering
                        const modeId = card.dataset.mode;
                        this.selectMode(modeId);
                    });
                }
            });
            
            // Back to menu button
            const backBtn = document.getElementById('backToMenuBtn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    this.showMainMenu();
                });
            }
        });
    }
    
    selectMode(modeId) {
        const modeInfo = this.availableModes[modeId];
        
        if (!modeInfo) {
            console.error(`Unknown mode: ${modeId}`);
            return;
        }
        
        if (!modeInfo.available) {
            alert(`${modeInfo.name} is coming soon!`);
            return;
        }
        
        // Create the mode instance
        if (modeInfo.class) {
            this.currentMode = new modeInfo.class();
            
            // Update the game title
            const gameTitle = document.getElementById('gameTitle');
            if (gameTitle) {
                gameTitle.textContent = modeInfo.name;
            }
            
            // Switch to game screen
            this.showGameScreen();
            
            // Initialize the game with the new mode
            this.initializeGameWithMode();
        }
    }
    
    showMainMenu() {
        // Clean up current game
        if (gameRunning) {
            pauseGame();
        }
        
        // Clean up current mode
        if (this.currentMode && this.currentMode.destroy) {
            this.currentMode.destroy();
        }
        if (this.currentMode && this.currentMode.removeUI) {
            this.currentMode.removeUI();
        }
        
        this.currentMode = null;
        currentGameMode = null;
        
        // Show menu, hide game
        document.getElementById('mainMenu').classList.remove('hidden');
        document.getElementById('gameScreen').classList.add('hidden');
        
        // Reset game state
        rpsObjects = [];
        flashEffects = [];
        powerups = [];
        gameStats = {
            totalBattles: 0,
            gameStartTime: 0,
            gameTime: 0
        };
    }
    
    showGameScreen() {
        // Hide menu, show game
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
    }
    
    initializeGameWithMode() {
        // Set the global current game mode
        currentGameMode = this.currentMode;
        
        // Create mode-specific UI
        if (currentGameMode.createUI) {
            currentGameMode.createUI();
        }
        
        // Initialize the game
        initializeGame();
        
        // Clear and draw the initial state
        clearCanvas();
        drawAllObjects();
        updateGameStatus();
    }
    
    getCurrentMode() {
        return this.currentMode;
    }
    
    getAvailableModes() {
        return Object.keys(this.availableModes).filter(modeId => 
            this.availableModes[modeId].available
        );
    }
    
    getModeInfo(modeId) {
        return this.availableModes[modeId];
    }
}

// Global game mode manager instance
let gameModeManager = null;

// Initialize the game mode manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    gameModeManager = new GameModeManager();
});
