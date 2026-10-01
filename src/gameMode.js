// Base GameMode class that defines the interface for all game modes
class GameMode {
    constructor(name) {
        this.name = name;
    }

    // Lifecycle methods - override these in specific modes
    init() {
        // Called when the game starts or is reset; populate rpsObjects here
    }

    update(deltaMs) {
        // Called every frame during game loop
    }

    reset() {
        // Called when game is reset, before init()
    }

    destroy() {
        // Called when switching away from this mode
    }

    // Powerup/Effect system hooks - override in specific modes
    updatePowerups(deltaMs) {
        // Called every frame to update powerup/effect state
    }

    drawPowerups(ctx) {
        // Called to render powerups/effects (if needed)
    }

    // Game event handlers - override these in specific modes
    onCollision(obj1, obj2) {
        // Return the winner object (the loser is removed), or null for tie
        return this.getRPSWinner(obj1, obj2);
    }

    onSpawn(object) {
        // Called when a new object is spawned
    }

    canStart() {
        // Return false to block the Start button (e.g. until the player has made a choice)
        return true;
    }

    canSpawn() {
        // Return false to block manual spawning
        return true;
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
        const winner = this.getWinningType();
        return winner ? `Game Over! ${winner} wins!` : 'Game Over! No winners!';
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

    // Timer and scoring hooks - override in specific modes for custom logic
    getTime() {
        // Return the current game time (in seconds)
        return Math.floor(gameStats.elapsedMs / 1000);
    }

    getScore() {
        // Return the current score (e.g., total battles)
        return gameStats.totalBattles;
    }

    updateTimer(deltaMs) {
        // Called every frame while the game is running
        gameStats.elapsedMs += deltaMs;
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
        return countTypes();
    }

    getWinningType() {
        // The first type still on screen - only meaningful once checkGameEnd() is true
        const counts = this.getTypeCounts();
        return Object.keys(counts).find(type => counts[type] > 0);
    }

    // Return true when this mode moves the object itself (survival player)
    moveObject() {
        return false;
    }

    drawBackground() {
        // Drawn under the icons. Override for zones and arenas.
    }

    defeats(type) {
        const beats = { Rock: 'Scissors', Paper: 'Rock', Scissors: 'Paper' };
        return beats[type];
    }

    counterTo(type) {
        const losesTo = { Rock: 'Paper', Paper: 'Scissors', Scissors: 'Rock' };
        return losesTo[type];
    }

    separatePair(obj1, obj2) {
        const dx = obj2.x - obj1.x;
        const dy = obj2.y - obj1.y;
        let dist = Math.hypot(dx, dy);
        if (dist === 0) {
            dist = 0.01;
        }
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = obj1.radius + obj2.radius - dist;
        if (overlap > 0) {
            obj1.x -= nx * overlap / 2;
            obj1.y -= ny * overlap / 2;
            obj2.x += nx * overlap / 2;
            obj2.y += ny * overlap / 2;
        }

        // Only cancel velocity that is still closing, so allies don't stick or speed up
        const closing = (obj2.speedX - obj1.speedX) * nx + (obj2.speedY - obj1.speedY) * ny;
        if (closing < 0) {
            const impulse = closing / 2;
            obj1.speedX += impulse * nx;
            obj1.speedY += impulse * ny;
            obj2.speedX -= impulse * nx;
            obj2.speedY -= impulse * ny;
        }

        this.clampObject(obj1);
        this.clampObject(obj2);
    }

    clampObject(obj) {
        obj.x = Math.max(obj.radius, Math.min(canvas.width - obj.radius, obj.x));
        obj.y = Math.max(obj.radius, Math.min(canvas.height - obj.radius, obj.y));
    }
}
