// Timed Battle - icons keep spawning until the clock hits zero; the type with the most kills wins
const TIMED_BATTLE_MS = 45000;
const TIMED_SPAWN_MS = 2000;

class TimedBattleMode extends ClassicMode {
    constructor() {
        super();
        this.name = 'timed_battle';
        this.spawnTimer = 0;
        this.finished = false;
        this.kills = { Rock: 0, Paper: 0, Scissors: 0 };
        this.panel = null;
    }

    reset() {
        this.spawnTimer = 0;
        this.finished = false;
        this.kills = { Rock: 0, Paper: 0, Scissors: 0 };
    }

    onCollision(obj1, obj2) {
        const winner = super.onCollision(obj1, obj2);
        if (winner) {
            this.kills[winner.type]++;
        }
        return winner;
    }

    update(deltaMs) {
        if (this.finished) return;

        this.spawnTimer += deltaMs;
        while (this.spawnTimer >= TIMED_SPAWN_MS) {
            this.spawnTimer -= TIMED_SPAWN_MS;
            this.spawnRandom();
        }
    }

    updateTimer(deltaMs) {
        if (this.finished) return;
        gameStats.elapsedMs += deltaMs;
        if (gameStats.elapsedMs >= TIMED_BATTLE_MS) {
            gameStats.elapsedMs = TIMED_BATTLE_MS;
            this.finished = true;
        }
    }

    spawnRandom() {
        const types = Object.keys(RPS_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        const { x, y } = findFreePosition();
        rpsObjects.push(createRPSObject(type, x, y));
    }

    getTime() {
        return Math.max(0, Math.ceil((TIMED_BATTLE_MS - gameStats.elapsedMs) / 1000));
    }

    checkGameEnd() {
        return this.finished;
    }

    leaders() {
        const counts = this.getTypeCounts();
        const rows = Object.keys(this.kills).map(type => ({
            type,
            kills: this.kills[type],
            alive: counts[type]
        }));
        rows.sort((a, b) => b.kills - a.kills || b.alive - a.alive);
        const top = rows[0];
        return rows.filter(row => row.kills === top.kills && row.alive === top.alive);
    }

    getGameEndMessage() {
        const leaders = this.leaders();
        if (leaders.length > 1) {
            return `Time! Tie between ${leaders.map(row => row.type).join(' & ')} with ${leaders[0].kills} kills`;
        }
        return `Time! ${leaders[0].type} wins with ${leaders[0].kills} kills`;
    }

    createUI() {
        this.panel = document.createElement('div');
        this.panel.className = 'mode-panel';
        this.panel.innerHTML = `
            <div class="mode-status"></div>
            <div class="mode-stats"></div>
        `;
        canvas.before(this.panel);
    }

    updateUI() {
        if (!this.panel) return;
        const seconds = this.getTime();
        this.panel.querySelector('.mode-status').textContent =
            this.finished
                ? 'Round over'
                : `${seconds}s left · a new icon spawns every ${TIMED_SPAWN_MS / 1000}s · most kills wins`;
        this.panel.querySelector('.mode-stats').textContent =
            `Kills — Rock ${this.kills.Rock} · Paper ${this.kills.Paper} · Scissors ${this.kills.Scissors}`;
    }

    removeUI() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
    }
}
