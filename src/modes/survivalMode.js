// Survival Mode - steer your icon and last as long as you can against spawning waves
const SURVIVAL_WAVE_MS = 10000;
const SURVIVAL_MAX_OBJECTS = 36;
const MOVE_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'];

class SurvivalMode extends GameMode {
    constructor() {
        super('survival_mode');
        this.playerType = null;
        this.player = null;
        this.locked = false;
        this.alive = true;
        this.runStarted = false;
        this.kills = 0;
        this.wave = 1;
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.runMs = 0;
        this.bestTimeMs = 0;
        this.bestKills = 0;
        this.keys = new Set();
        this.panel = null;
        this.clearKeys = () => this.keys.clear();
    }

    reset() {
        if (this.runStarted) {
            this.bestTimeMs = Math.max(this.bestTimeMs, this.runMs);
            this.bestKills = Math.max(this.bestKills, this.kills);
        }
        this.playerType = null;
        this.player = null;
        this.locked = false;
        this.alive = true;
        this.runStarted = false;
        this.kills = 0;
        this.wave = 1;
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.runMs = 0;
        this.keys.clear();
    }

    init() {
        rpsObjects = [];
        this.player = null;
    }

    canStart() {
        return this.playerType !== null && this.alive;
    }

    canSpawn() {
        return false;
    }

    chooseType(type) {
        if (this.locked) return;
        this.playerType = type;
        rpsObjects = [];
        this.player = createRPSObject(type, canvas.width / 2, canvas.height / 2);
        this.player.isPlayer = true;
        this.player.speedX = 0;
        this.player.speedY = 0;
        rpsObjects.push(this.player);
        if (!gameRunning) {
            updateGameStatus();
            render();
        }
    }

    updateTimer(deltaMs) {
        if (!this.alive) return;
        gameStats.elapsedMs += deltaMs;
        this.runMs += deltaMs;
    }

    update(deltaMs) {
        this.locked = true;
        if (!this.runStarted) {
            this.runStarted = true;
            const opening = Math.max(2, startingCount);
            for (let i = 0; i < opening; i++) {
                this.spawnEnemy();
            }
        }
        if (!this.alive) return;

        this.waveTimer += deltaMs;
        if (this.waveTimer >= SURVIVAL_WAVE_MS) {
            this.waveTimer -= SURVIVAL_WAVE_MS;
            this.wave++;
        }

        const interval = Math.max(420, 1700 - (this.wave - 1) * 140);
        this.spawnTimer += deltaMs;
        while (this.spawnTimer >= interval) {
            this.spawnTimer -= interval;
            this.spawnEnemy();
            if (this.wave >= 4) {
                this.spawnEnemy();
            }
        }
    }

    spawnEnemy() {
        if (!this.player || rpsObjects.length >= SURVIVAL_MAX_OBJECTS) return;

        const threat = this.counterTo(this.playerType);
        const prey = this.defeats(this.playerType);
        const type = Math.random() < 0.58 ? threat : prey;
        const pos = this.edgePosition();
        const enemy = createRPSObject(type, pos.x, pos.y);
        const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
        const speed = Math.min(6, 1.3 + Math.random() * 1.1 + (this.wave - 1) * 0.22) * gameSpeed;
        enemy.speedX = Math.cos(angle) * speed;
        enemy.speedY = Math.sin(angle) * speed;
        rpsObjects.push(enemy);
    }

    edgePosition() {
        let pos = this.randomEdge();
        for (let attempt = 0; attempt < 8 && this.player; attempt++) {
            const dx = pos.x - this.player.x;
            const dy = pos.y - this.player.y;
            if (dx * dx + dy * dy > (OBJECT_RADIUS * 6) ** 2) return pos;
            pos = this.randomEdge();
        }
        return pos;
    }

    randomEdge() {
        const inset = OBJECT_RADIUS + 4;
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) return { x: inset + Math.random() * (canvas.width - inset * 2), y: inset };
        if (edge === 1) return { x: canvas.width - inset, y: inset + Math.random() * (canvas.height - inset * 2) };
        if (edge === 2) return { x: inset + Math.random() * (canvas.width - inset * 2), y: canvas.height - inset };
        return { x: inset, y: inset + Math.random() * (canvas.height - inset * 2) };
    }

    moveObject(obj, step) {
        if (!obj.isPlayer) return false;

        let dx = 0;
        let dy = 0;
        if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) dx -= 1;
        if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) dx += 1;
        if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) dy -= 1;
        if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) dy += 1;
        if (dx !== 0 && dy !== 0) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }

        const speed = 5.2 * gameSpeed;
        obj.x += dx * speed * step;
        obj.y += dy * speed * step;
        obj.speedX = 0;
        obj.speedY = 0;
        return true;
    }

    onKeyDown(event) {
        if (!MOVE_KEYS.includes(event.code)) return false;
        event.preventDefault();
        this.keys.add(event.code);
        return true;
    }

    onKeyUp(event) {
        this.keys.delete(event.code);
    }

    onCollision(obj1, obj2) {
        const player = obj1.isPlayer ? obj1 : obj2.isPlayer ? obj2 : null;
        if (!player) {
            const winner = this.getRPSWinner(obj1, obj2);
            if (winner) {
                this.playHit(winner);
            }
            return winner;
        }

        const enemy = player === obj1 ? obj2 : obj1;
        const winner = this.getRPSWinner(player, enemy);
        if (!winner) {
            this.separatePair(player, enemy);
            return null;
        }
        if (winner === player) {
            this.kills++;
            this.playHit(player);
            return player;
        }

        this.alive = false;
        this.bestTimeMs = Math.max(this.bestTimeMs, this.runMs);
        this.bestKills = Math.max(this.bestKills, this.kills);
        this.playHit(enemy);
        return enemy;
    }

    playHit(winner) {
        collisionSound.currentTime = 0;
        collisionSound.play().catch(() => {});
        gameStats.totalBattles++;
        winner.winAnimation = WIN_ANIMATION_FRAMES;
    }

    checkGameEnd() {
        return this.runStarted && !this.alive;
    }

    getGameEndMessage() {
        const seconds = Math.floor(this.runMs / 1000);
        return `You fell on wave ${this.wave} after ${seconds}s and ${this.kills} defeats. Press Reset to try again.`;
    }

    createUI() {
        this.panel = document.createElement('div');
        this.panel.className = 'mode-panel';
        this.panel.innerHTML = `
            <div class="prediction-picker">
                <label>Play as:</label>
                ${Object.keys(RPS_TYPES).map(type =>
                    `<button type="button" class="mode-choice" data-type="${type}">${type}</button>`
                ).join('')}
            </div>
            <div class="dpad" aria-label="Move">
                <button type="button" class="mode-choice dpad-btn" data-key="ArrowLeft">←</button>
                <button type="button" class="mode-choice dpad-btn" data-key="ArrowUp">↑</button>
                <button type="button" class="mode-choice dpad-btn" data-key="ArrowDown">↓</button>
                <button type="button" class="mode-choice dpad-btn" data-key="ArrowRight">→</button>
            </div>
            <div class="mode-status"></div>
            <div class="mode-stats"></div>
        `;

        this.panel.querySelectorAll('.mode-choice[data-type]').forEach(btn => {
            btn.addEventListener('click', () => this.chooseType(btn.dataset.type));
        });

        this.panel.querySelectorAll('.dpad-btn').forEach(btn => {
            const press = (event) => {
                event.preventDefault();
                this.keys.add(btn.dataset.key);
                if (event.pointerId !== undefined && btn.setPointerCapture) {
                    btn.setPointerCapture(event.pointerId);
                }
            };
            const release = () => this.keys.delete(btn.dataset.key);
            btn.addEventListener('pointerdown', press);
            btn.addEventListener('pointerup', release);
            btn.addEventListener('pointercancel', release);
        });

        canvas.before(this.panel);
        document.querySelector('.spawn-controls').classList.add('hidden');
        window.addEventListener('blur', this.clearKeys);
    }

    updateUI() {
        if (!this.panel) return;

        this.panel.querySelectorAll('.mode-choice[data-type]').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.type === this.playerType);
            btn.disabled = this.locked;
        });

        let status;
        if (!this.alive && this.runStarted) {
            status = 'Press Reset for another run';
        } else if (this.locked) {
            status = `Wave ${this.wave} · dodge what beats ${this.playerType}, hunt what it beats`;
        } else if (this.playerType) {
            status = `You are ${this.playerType}. WASD or arrows to move, then press Start`;
        } else {
            status = 'Pick a type, then survive the waves';
        }
        this.panel.querySelector('.mode-status').textContent = status;

        const bestSeconds = Math.floor(this.bestTimeMs / 1000);
        this.panel.querySelector('.mode-stats').textContent =
            `Defeats: ${this.kills} · Wave: ${this.wave} · Best: ${bestSeconds}s / ${this.bestKills} defeats`;
    }

    drawPowerups(ctx) {
        if (!this.player || !rpsObjects.includes(this.player)) return;
        ctx.save();
        ctx.strokeStyle = '#3eae82';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.radius * 1.65, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    removeUI() {
        window.removeEventListener('blur', this.clearKeys);
        this.keys.clear();
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        document.querySelector('.spawn-controls').classList.remove('hidden');
    }
}
