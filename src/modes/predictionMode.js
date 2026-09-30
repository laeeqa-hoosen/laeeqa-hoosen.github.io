// Prediction Mode - pick the winning type before a Classic round starts and score points for correct calls
const PREDICTION_POINTS = 10;

class PredictionMode extends ClassicMode {
    constructor() {
        super();
        this.name = 'prediction_mode';
        this.prediction = null;
        this.locked = false;
        this.roundResult = null;
        this.pointsAwarded = 0;
        this.panel = null;
        // Stats last for the whole session in this mode, across resets
        this.stats = { rounds: 0, correct: 0, points: 0, streak: 0, bestStreak: 0 };
    }

    reset() {
        this.prediction = null;
        this.locked = false;
        this.roundResult = null;
        this.pointsAwarded = 0;
    }

    update(deltaMs) {
        // Only called while the game loop is running, so the prediction can't change mid-round
        this.locked = true;
        if (!this.roundResult && this.checkGameEnd()) {
            this.scoreRound();
        }
    }

    canStart() {
        return this.prediction !== null;
    }

    canSpawn() {
        // Spawning your own pick would make the prediction meaningless
        return false;
    }

    scoreRound() {
        const winner = this.getWinningType();
        this.stats.rounds++;

        if (winner && winner === this.prediction) {
            this.stats.correct++;
            this.stats.streak++;
            this.stats.bestStreak = Math.max(this.stats.bestStreak, this.stats.streak);
            this.pointsAwarded = PREDICTION_POINTS * this.stats.streak;
            this.stats.points += this.pointsAwarded;
            this.roundResult = 'correct';
        } else {
            this.stats.streak = 0;
            this.pointsAwarded = 0;
            this.roundResult = 'wrong';
        }
    }

    getGameEndMessage() {
        const winner = this.getWinningType() || 'Nobody';
        if (this.roundResult === 'correct') {
            return `${winner} wins! You called it: +${this.pointsAwarded} points`;
        }
        return `${winner} wins! You picked ${this.prediction}.`;
    }

    createUI() {
        this.panel = document.createElement('div');
        this.panel.className = 'prediction-panel';
        this.panel.innerHTML = `
            <div class="prediction-picker">
                <label>Your prediction:</label>
                ${Object.keys(RPS_TYPES).map(type =>
                    `<button class="prediction-btn" data-type="${type}">${type}</button>`
                ).join('')}
            </div>
            <div class="prediction-status"></div>
            <div class="prediction-stats"></div>
        `;

        this.panel.querySelectorAll('.prediction-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.locked) return;
                this.prediction = btn.dataset.type;
                this.updateUI();
            });
        });

        canvas.before(this.panel);
        document.querySelector('.spawn-controls').classList.add('hidden');
    }

    updateUI() {
        if (!this.panel) return;

        this.panel.querySelectorAll('.prediction-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.type === this.prediction);
            btn.disabled = this.locked;
        });

        let status;
        if (this.roundResult) {
            status = 'Press Reset for the next round';
        } else if (this.locked) {
            status = `Prediction locked in: ${this.prediction}`;
        } else if (this.prediction) {
            status = `You picked ${this.prediction}. Press Start when ready`;
        } else {
            status = 'Pick who you think will win, then press Start';
        }
        this.panel.querySelector('.prediction-status').textContent = status;

        const { rounds, correct, points, streak, bestStreak } = this.stats;
        const accuracy = rounds > 0 ? Math.round((correct / rounds) * 100) : 0;
        this.panel.querySelector('.prediction-stats').textContent =
            `Points: ${points} | Correct: ${correct}/${rounds} (${accuracy}%) | Streak: ${streak} (best ${bestStreak})`;
    }

    removeUI() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        document.querySelector('.spawn-controls').classList.remove('hidden');
    }
}
