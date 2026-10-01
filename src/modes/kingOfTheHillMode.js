// King of the Hill - classic fights, but the crown goes to the type that holds the center
const HILL_GOAL_MS = 20000;

class KingOfTheHillMode extends ClassicMode {
    constructor() {
        super();
        this.name = 'king_of_the_hill';
        this.controlMs = { Rock: 0, Paper: 0, Scissors: 0 };
        this.panel = null;
    }

    reset() {
        this.controlMs = { Rock: 0, Paper: 0, Scissors: 0 };
    }

    hillRadius() {
        return Math.min(canvas.width, canvas.height) * 0.18;
    }

    update(deltaMs) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = this.hillRadius();
        rpsObjects.forEach(obj => {
            const dx = obj.x - cx;
            const dy = obj.y - cy;
            if (dx * dx + dy * dy <= radius * radius) {
                this.controlMs[obj.type] += deltaMs;
            }
        });
    }

    leaderRows() {
        return Object.keys(this.controlMs)
            .map(type => ({ type, ms: this.controlMs[type] }))
            .sort((a, b) => b.ms - a.ms);
    }

    reachedGoal() {
        return Object.values(this.controlMs).some(ms => ms >= HILL_GOAL_MS);
    }

    checkGameEnd() {
        if (this.reachedGoal()) return true;
        return rpsObjects.length === 0;
    }

    getGameEndMessage() {
        const leaders = this.leaderRows();
        const top = leaders[0];
        if (!top || top.ms <= 0) {
            return 'The hill is empty. Nobody takes the crown.';
        }
        const tied = leaders.filter(row => row.ms === top.ms);
        const seconds = (top.ms / 1000).toFixed(1);
        if (tied.length > 1) {
            return `Time shared! ${tied.map(row => row.type).join(' & ')} each held the hill for ${seconds}s`;
        }
        return `${top.type} takes the crown with ${seconds}s of control!`;
    }

    drawBackground(ctx) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = this.hillRadius();
        const leader = this.leaderRows()[0];
        const fills = {
            Rock: 'rgba(255, 107, 138, 0.22)',
            Paper: 'rgba(108, 155, 255, 0.22)',
            Scissors: 'rgba(240, 180, 41, 0.24)'
        };

        ctx.save();
        ctx.fillStyle = leader && leader.ms > 0 ? fills[leader.type] : 'rgba(255, 213, 106, 0.2)';
        ctx.strokeStyle = 'rgba(180, 120, 40, 0.85)';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(122, 84, 16, 0.55)';
        ctx.font = '700 18px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HILL', cx, cy);
        ctx.restore();
    }

    createUI() {
        this.panel = document.createElement('div');
        this.panel.className = 'mode-panel';
        this.panel.innerHTML = `
            <div class="mode-status">Hold the center. First type to bank ${(HILL_GOAL_MS / 1000)}s of control takes the crown.</div>
            <div class="hill-rows">
                ${Object.keys(RPS_TYPES).map(type => `
                    <div class="hill-row">
                        <span class="hill-label hill-${type.toLowerCase()}">${type}</span>
                        <div class="hill-track"><div class="hill-fill hill-${type.toLowerCase()}" data-type="${type}"></div></div>
                        <span class="hill-time" data-type="${type}">0.0s</span>
                    </div>
                `).join('')}
            </div>
        `;
        canvas.before(this.panel);
    }

    updateUI() {
        if (!this.panel) return;
        Object.keys(this.controlMs).forEach(type => {
            const ms = this.controlMs[type];
            const fill = this.panel.querySelector(`.hill-fill[data-type="${type}"]`);
            const label = this.panel.querySelector(`.hill-time[data-type="${type}"]`);
            if (fill) fill.style.width = `${Math.min(100, (ms / HILL_GOAL_MS) * 100)}%`;
            if (label) label.textContent = `${(ms / 1000).toFixed(1)}s`;
        });
    }

    removeUI() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
    }
}
