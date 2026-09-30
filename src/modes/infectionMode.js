// Infection Mode - losers are converted to the winner's type until one type has infected everyone
class InfectionMode extends GameMode {
    constructor() {
        super('infection_mode');
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
        const winner = this.getRPSWinner(obj1, obj2);
        if (winner) {
            const loser = winner === obj1 ? obj2 : obj1;
            this.infect(loser, winner.type);

            collisionSound.currentTime = 0;
            collisionSound.play().catch(() => {});
            gameStats.totalBattles++;
            loser.winAnimation = WIN_ANIMATION_FRAMES;
        }
        // Nobody is removed - the loser lives on as the winner's type
        return null;
    }

    infect(target, type) {
        target.type = type;
        target.color = RPS_TYPES[type].color;
        target.letter = RPS_TYPES[type].letter;
    }

    getGameEndMessage() {
        const winner = this.getWinningType();
        return winner ? `Outbreak complete! ${winner} infected everyone!` : 'Game Over! No survivors!';
    }
}
