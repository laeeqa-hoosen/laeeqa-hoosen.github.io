// Powerup Chaos - classic elimination, plus pickups that change speed, size, or grant a shield
const POWERUP_SPAWN_MS = 3200;
const POWERUP_CAP = 3;
const POWERUP_RADIUS = 16;
const SPEED_FACTOR = 1.75;
const SPEED_MS = 4000;
const GROW_MS = 5000;
const SHRINK_MS = 5000;
const GUARD_MS = 450;

const POWERUP_KINDS = [
    { id: 'speed', label: 'Speed', color: '#e6b43a', mark: '»' },
    { id: 'shield', label: 'Shield', color: '#3eae82', mark: '●' },
    { id: 'grow', label: 'Grow', color: '#8f74d6', mark: '+' },
    { id: 'shrink', label: 'Shrink', color: '#3d68c9', mark: '–' }
];

class PowerupChaosMode extends ClassicMode {
    constructor() {
        super();
        this.name = 'powerup_chaos';
        this.powerups = [];
        this.spawnTimer = 0;
        this.elapsedMs = 0;
        this.panel = null;
    }

    reset() {
        this.powerups = [];
        this.spawnTimer = 0;
        this.elapsedMs = 0;
    }

    init() {
        super.init();
        this.powerups = [];
        this.spawnPowerup();
    }

    updatePowerups(deltaMs) {
        this.elapsedMs += deltaMs;
        if (this.powerups.length < POWERUP_CAP) {
            this.spawnTimer += deltaMs;
            while (this.powerups.length < POWERUP_CAP && this.spawnTimer >= POWERUP_SPAWN_MS) {
                this.spawnTimer -= POWERUP_SPAWN_MS;
                this.spawnPowerup();
            }
        }

        rpsObjects.forEach(obj => {
            if (obj.speedBoosted && this.elapsedMs >= obj.speedBoostUntil) {
                obj.speedX /= SPEED_FACTOR;
                obj.speedY /= SPEED_FACTOR;
                obj.speedBoosted = false;
            }
            if (obj.sizeUntil && this.elapsedMs >= obj.sizeUntil) {
                obj.baseRadius = OBJECT_RADIUS;
                obj.radius = OBJECT_RADIUS;
                obj.sizeUntil = 0;
            }
        });

        this.collectPowerups();
    }

    spawnPowerup() {
        const kind = POWERUP_KINDS[Math.floor(Math.random() * POWERUP_KINDS.length)];
        let x;
        let y;
        let attempts = 0;
        do {
            x = POWERUP_RADIUS + Math.random() * (canvas.width - POWERUP_RADIUS * 2);
            y = POWERUP_RADIUS + Math.random() * (canvas.height - POWERUP_RADIUS * 2);
            attempts++;
        } while (attempts < 30 && this.powerupBlocked(x, y));

        this.powerups.push({
            x,
            y,
            radius: POWERUP_RADIUS,
            kind: kind.id,
            color: kind.color,
            mark: kind.mark
        });
    }

    powerupBlocked(x, y) {
        const nearObject = rpsObjects.some(obj => {
            const dx = obj.x - x;
            const dy = obj.y - y;
            return dx * dx + dy * dy < (obj.radius + POWERUP_RADIUS + 8) ** 2;
        });
        if (nearObject) return true;
        return this.powerups.some(powerup => {
            const dx = powerup.x - x;
            const dy = powerup.y - y;
            return dx * dx + dy * dy < (POWERUP_RADIUS * 3) ** 2;
        });
    }

    collectPowerups() {
        this.powerups = this.powerups.filter(powerup => {
            const collector = rpsObjects.find(obj => {
                const dx = obj.x - powerup.x;
                const dy = obj.y - powerup.y;
                const reach = obj.radius + powerup.radius;
                return dx * dx + dy * dy <= reach * reach;
            });
            if (!collector) return true;
            this.applyPowerup(collector, powerup.kind);
            return false;
        });
    }

    applyPowerup(obj, kind) {
        obj.winAnimation = WIN_ANIMATION_FRAMES;
        if (kind === 'speed') {
            if (!obj.speedBoosted) {
                obj.speedX *= SPEED_FACTOR;
                obj.speedY *= SPEED_FACTOR;
                obj.speedBoosted = true;
            }
            obj.speedBoostUntil = this.elapsedMs + SPEED_MS;
            return;
        }
        if (kind === 'shield') {
            obj.shield = true;
            return;
        }
        const scale = kind === 'grow' ? 1.55 : 0.62;
        const duration = kind === 'grow' ? GROW_MS : SHRINK_MS;
        obj.baseRadius = OBJECT_RADIUS * scale;
        obj.radius = obj.baseRadius;
        obj.sizeUntil = this.elapsedMs + duration;
    }

    onCollision(obj1, obj2) {
        if ((obj1.guardUntil || 0) > this.elapsedMs || (obj2.guardUntil || 0) > this.elapsedMs) {
            this.separatePair(obj1, obj2);
            return null;
        }

        const winner = this.getRPSWinner(obj1, obj2);
        if (!winner) return null;

        const loser = winner === obj1 ? obj2 : obj1;
        if (loser.shield) {
            loser.shield = false;
            const until = this.elapsedMs + GUARD_MS;
            obj1.guardUntil = until;
            obj2.guardUntil = until;
            this.separatePair(obj1, obj2);
            collisionSound.currentTime = 0;
            collisionSound.play().catch(() => {});
            gameStats.totalBattles++;
            loser.winAnimation = WIN_ANIMATION_FRAMES;
            return null;
        }

        return super.onCollision(obj1, obj2);
    }

    drawPowerups(ctx) {
        this.powerups.forEach(powerup => {
            ctx.save();
            ctx.fillStyle = powerup.color;
            ctx.beginPath();
            ctx.arc(powerup.x, powerup.y, powerup.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '700 16px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(powerup.mark, powerup.x, powerup.y + 1);
            ctx.restore();
        });

        rpsObjects.forEach(obj => {
            if (!obj.shield && !obj.speedBoosted) return;
            ctx.save();
            ctx.strokeStyle = obj.shield ? '#3eae82' : '#e6b43a';
            ctx.lineWidth = obj.shield ? 4 : 3;
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, obj.radius * 1.7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });
    }

    createUI() {
        this.panel = document.createElement('div');
        this.panel.className = 'mode-panel';
        this.panel.innerHTML = `
            <div class="mode-status">Grab a pickup: » speed, ● shield (blocks one loss), + grow, – shrink</div>
            <div class="mode-stats">Last type standing still wins. A shield flash means the hit was blocked.</div>
        `;
        canvas.before(this.panel);
    }

    removeUI() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
    }
}
