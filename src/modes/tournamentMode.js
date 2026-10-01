// Tournament - one type gets a bye, the other two play a best-of-3, then the winner faces the bye
const SERIES_WINS = 2;

class TournamentMode extends ClassicMode {
    constructor() {
        super();
        this.name = 'elimination_tournament';
        this.panel = null;
        this.setupTournament();
    }

    setupTournament() {
        const types = Object.keys(RPS_TYPES);
        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }
        this.semifinal = [types[0], types[1]];
        this.bye = types[2];
        this.finalist = null;
        this.semifinalScore = null;
        this.stage = 'semifinal';
        this.competitors = [...this.semifinal];
        this.wins = { [types[0]]: 0, [types[1]]: 0 };
        this.seriesRound = 1;
        this.roundWinner = null;
        this.champion = null;
    }

    reset() {
        if (this.champion) {
            this.setupTournament();
            return;
        }
        if (this.roundWinner) {
            this.applyRoundWinner(this.roundWinner);
            this.roundWinner = null;
        }
    }

    init() {
        rpsObjects = [];
        if (this.champion) return;
        this.competitors.forEach(type => {
            for (let i = 0; i < startingCount; i++) {
                const { x, y } = findFreePosition();
                rpsObjects.push(createRPSObject(type, x, y));
            }
        });
    }

    canSpawn() {
        return false;
    }

    applyRoundWinner(winner) {
        this.wins[winner] = (this.wins[winner] || 0) + 1;
        const loser = this.competitors.find(type => type !== winner);
        if (this.wins[winner] >= SERIES_WINS) {
            if (this.stage === 'semifinal') {
                this.semifinalScore = `${winner} def. ${loser} ${this.wins[winner]}-${this.wins[loser] || 0}`;
                this.finalist = winner;
                this.stage = 'final';
                this.competitors = [winner, this.bye];
                this.wins = { [winner]: 0, [this.bye]: 0 };
                this.seriesRound = 1;
            } else {
                this.champion = winner;
            }
            return;
        }
        this.seriesRound++;
    }

    update() {
        this.noteRoundWinner();
    }

    noteRoundWinner() {
        if (this.champion || this.roundWinner) return;
        const counts = this.getTypeCounts();
        const alive = this.competitors.filter(type => counts[type] > 0);
        if (rpsObjects.length === 0 || alive.length !== 1) return;

        this.roundWinner = alive[0];
        const winnerWins = (this.wins[this.roundWinner] || 0) + 1;
        if (winnerWins >= SERIES_WINS && this.stage === 'final') {
            this.champion = this.roundWinner;
        }
    }

    checkGameEnd() {
        if (this.champion) return true;
        this.noteRoundWinner();
        if (this.roundWinner || this.champion) return true;
        return rpsObjects.length === 0;
    }

    projectedWins(type) {
        return (this.wins[type] || 0) + (this.roundWinner === type ? 1 : 0);
    }

    getGameEndMessage() {
        if (this.champion) {
            return `${this.champion} wins the tournament! Press Reset for a new bracket.`;
        }
        const winner = this.roundWinner;
        if (!winner) return 'The match collapsed. Press Reset to replay the round.';

        const loser = this.competitors.find(type => type !== winner);
        const winnerWins = this.projectedWins(winner);
        const loserWins = this.wins[loser] || 0;
        if (winnerWins >= SERIES_WINS) {
            if (this.stage === 'semifinal') {
                return `${winner} wins the semifinal ${winnerWins}-${loserWins}! Press Reset for the final vs ${this.bye}.`;
            }
            return `${winner} wins the final ${winnerWins}-${loserWins} and the tournament! Press Reset to play again.`;
        }
        return `${winner} takes round ${this.seriesRound}. Series ${winnerWins}-${loserWins}. Press Reset for the next round.`;
    }

    stageLabel() {
        return this.stage === 'final' ? 'Final' : 'Semifinal';
    }

    createUI() {
        this.panel = document.createElement('div');
        this.panel.className = 'mode-panel';
        this.panel.innerHTML = `
            <div class="mode-status"></div>
            <div class="mode-stats"></div>
        `;
        canvas.before(this.panel);
        document.querySelector('.spawn-controls').classList.add('hidden');
    }

    updateUI() {
        if (!this.panel) return;
        const pair = this.competitors.join(' vs ');
        const score = this.competitors.map(type => `${type} ${this.projectedWins(type)}`).join(' · ');
        const byeNote = this.stage === 'semifinal'
            ? `${this.bye} has a bye to the final`
            : `Semifinal: ${this.semifinalScore}`;

        const waiting = !gameRunning && !this.roundWinner && !this.champion;
        this.panel.querySelector('.mode-status').textContent = this.champion
            ? `${this.champion} won the bracket`
            : `${this.stageLabel()}: ${pair} · first to ${SERIES_WINS}${waiting ? ' · Press Start' : ''}`;
        this.panel.querySelector('.mode-stats').textContent = this.champion
            ? 'Press Reset for a new bracket'
            : `Round ${this.seriesRound} · ${score} · ${byeNote}`;
    }

    removeUI() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        document.querySelector('.spawn-controls').classList.remove('hidden');
    }
}
