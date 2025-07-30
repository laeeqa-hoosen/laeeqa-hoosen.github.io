// Base GameMode class that defines the interface for all game modes
class GameMode {
    constructor(name) {
        this.name = name;
        this.isActive = false;
    }

    // Lifecycle methods - override these in specific modes
    init() {
        // Called when the mode is activated
    }

    update(deltaTime) {
        // Called every frame during game loop
    }

    reset() {
        // Called when game is reset
    }

    destroy() {
        // Called when switching away from this mode
    }

    // Game event handlers - override these in specific modes
    onCollision(obj1, obj2) {
        // Return the winner object, or null for tie
        // Default RPS logic
        return this.getRPSWinner(obj1, obj2);
    }

    onSpawn(object) {
        // Called when a new object is spawned
    }

    checkGameEnd() {
        // Return true if game should end, false otherwise
        // Default: end when only one type remains
        const counts = this.getTypeCounts();
        const typesRemaining = Object.values(counts).filter(count => count > 0).length;
        return typesRemaining <= 1;
    }

    getGameEndMessage() {
        // Return message to display when game ends
        const counts = this.getTypeCounts();
        const winner = Object.keys(counts).find(type => counts[type] > 0);
        return winner ? `Game Over! ${winner} wins!` : 'Game Over! No winners!';
    }

    // Input event handlers - override these in specific modes
    onMouseMove(x, y) {
        // Handle mouse movement
    }

    onMouseClick(x, y) {
        // Handle mouse clicks
    }

    onKeyPress(key) {
        // Handle key presses
    }

    // UI management - override these in specific modes
    createUI() {
        // Add mode-specific UI elements
    }

    updateUI() {
        // Update mode-specific UI displays
    }

    removeUI() {
        // Remove mode-specific UI elements
    }

    // Helper methods available to all modes
    getRPSWinner(obj1, obj2) {
        if (obj1.type === obj2.type) {
            return null; // tie
        }
        
        if (obj1.type === 'Rock' && obj2.type === 'Scissors') return obj1;
        if (obj1.type === 'Paper' && obj2.type === 'Rock') return obj1;
        if (obj1.type === 'Scissors' && obj2.type === 'Paper') return obj1;
        
        return obj2; // obj2 wins
    }

    getTypeCounts() {
        const counts = { Rock: 0, Paper: 0, Scissors: 0 };
        rpsObjects.forEach(obj => {
            counts[obj.type]++;
        });
        return counts;
    }
}
