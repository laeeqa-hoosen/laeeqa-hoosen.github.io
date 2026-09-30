// Classic Mode - equal numbers of each type fight until one type remains
class ClassicMode extends GameMode {
    constructor() {
        super('classic');
    }

    init() {
        rpsObjects = [];

        Object.keys(RPS_TYPES).forEach(type => {
            for (let i = 0; i < startingCount; i++) {
                const { x, y } = findFreePosition();
                rpsObjects.push(createRPSObject(type, x, y));
            }
        });
    }

    onCollision(obj1, obj2) {
        // Classic RPS: winner stays, loser is removed
        const winner = this.getRPSWinner(obj1, obj2);
        if (winner) {
            // Play sound and add win animation
            collisionSound.currentTime = 0;
            collisionSound.play().catch(() => {});
            gameStats.totalBattles++;
            winner.winAnimation = WIN_ANIMATION_FRAMES;
        }
        return winner;
    }
}
