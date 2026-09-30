// Game Mode Manager - handles switching between different game modes
class GameModeManager {
    constructor() {
        // Modes with a null class show as "coming soon"
        this.availableModes = {
            classic: {
                name: 'Classic Mode',
                class: ClassicMode,
                description: 'The original RPS battle royale'
            },
            timed_battle: {
                name: 'Timed Battle',
                class: null,
                description: 'Continuous spawning for a set time'
            },
            prediction_mode: {
                name: 'Prediction Mode',
                class: PredictionMode,
                description: 'Predict the winner and score points'
            },
            survival_mode: {
                name: 'Survival Mode',
                class: null,
                description: 'Control your character and survive'
            },
            powerup_chaos: {
                name: 'Powerup Chaos',
                class: null,
                description: 'Classic gameplay with power-ups'
            },
            king_of_the_hill: {
                name: 'King of the Hill',
                class: null,
                description: 'Control the center territory'
            },
            elimination_tournament: {
                name: 'Tournament',
                class: null,
                description: 'Single elimination bracket style'
            },
            infection_mode: {
                name: 'Infection Mode',
                class: InfectionMode,
                description: 'One type spreads like a virus'
            },
            resource_management: {
                name: 'Resource Management',
                class: null,
                description: 'Limited spawns require strategy'
            }
        };
        
        this.currentMode = null;
        this.setupEventListeners();
        document.getElementById('mainMenu').classList.remove('hidden');
    }
    
    setupEventListeners() {
        // Clicks on a card's play button bubble up to the card
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => this.selectMode(card.dataset.mode));
        });

        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.showMainMenu();
        });
    }
    
    selectMode(modeId) {
        const modeInfo = this.availableModes[modeId];

        if (!modeInfo) {
            console.error(`Unknown mode: ${modeId}`);
            return;
        }

        if (!modeInfo.class) {
            alert(`${modeInfo.name} is coming soon!`);
            return;
        }

        this.currentMode = new modeInfo.class();
        document.getElementById('gameTitle').textContent = modeInfo.name;
        this.showGameScreen();

        currentGameMode = this.currentMode;
        resetGame();
    }
    
    showMainMenu() {
        pauseGame();
        
        if (this.currentMode) {
            this.currentMode.removeUI();
            this.currentMode.destroy();
        }
        
        this.currentMode = null;
        currentGameMode = null;
        
        // Show menu, hide game
        document.getElementById('mainMenu').classList.remove('hidden');
        document.getElementById('gameScreen').classList.add('hidden');
        
        // Reset game state
        rpsObjects = [];
        resetGameStats();
    }
    
    showGameScreen() {
        // Hide menu, show game
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
    }
}

// Global game mode manager instance
let gameModeManager = null;

// Initialize the game mode manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    gameModeManager = new GameModeManager();
});
