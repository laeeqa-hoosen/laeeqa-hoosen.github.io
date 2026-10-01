// Resource Management - spend a limited budget on your army, then fight an AI that counters your biggest stack
const RESOURCE_WIN_BONUS = 5;
const RESOURCE_LOSS_PENALTY = 4;
const RESOURCE_GOAL = 30;

class ResourceManagementMode extends GameMode {
    constructor() {
        super('resource_management');
        this.fresh = true;
        this.panel = null;
        this.clearRound();
    }

    openingBudget() {
        return Math.min(18, Math.max(6, startingCount * 4));
    }

    startCampaign() {
        this.resources = this.openingBudget();
        this.round = 1;
        this.campaignOver = null;
        this.clearRound();
    }

    clearRound() {
        this.draft = { Rock: 0, Paper: 0, Scissors: 0 };
        this.aiDraft = null;
        this.spawned = false;
        this.result = null;
    }

    reset() {
        if (this.fresh || this.campaignOver) {
            this.fresh = false;
            this.startCampaign();
            return;
        }
        if (this.spawned && !this.result) {
            this.result = 'loss';
        }
        if (this.result === 'win') {
            this.resources += RESOURCE_WIN_BONUS;
        } else if (this.result === 'loss') {
            this.resources = Math.max(0, this.resources - RESOURCE_LOSS_PENALTY);
        }
        if (this.result) {
            this.round++;
        }
        if (this.resources < 1) {
            this.campaignOver = 'defeat';
        }
        this.clearRound();
    }

    init() {
        rpsObjects = [];
    }

    spent() {
        return this.draft.Rock + this.draft.Paper + this.draft.Scissors;
    }

    canStart() {
        return !this.campaignOver && !this.spawned && this.spent() > 0 && this.spent() <= this.resources;
    }

    canSpawn() {
        return false;
    }

    update() {
        if (!this.spawned && !this.campaignOver) {
            this.beginBattle();
        }
        this.evaluateBattle();
    }

    evaluateBattle() {
        if (this.campaignOver || !this.spawned || this.result) return;

        const players = rpsObjects.filter(obj => obj.owner === 'player').length;
        const ai = rpsObjects.filter(obj => obj.owner === 'ai').length;
        if (players > 0 && ai > 0) return;

        if (players === 0 && ai === 0) {
            this.result = 'draw';
            return;
        }
        if (players === 0) {
            this.result = 'loss';
            if (Math.max(0, this.resources - RESOURCE_LOSS_PENALTY) < 1) {
                this.campaignOver = 'defeat';
            }
            return;
        }
        this.result = 'win';
        if (this.resources + RESOURCE_WIN_BONUS >= RESOURCE_GOAL) {
            this.campaignOver = 'victory';
        }
    }

    beginBattle() {
        const spent = this.spent();
        this.resources -= spent;
        this.aiDraft = this.buildAiDraft(spent);
        rpsObjects = [];
        this.spawnTeam(this.draft, 'player');
        this.spawnTeam(this.aiDraft, 'ai');
        this.spawned = true;
    }

    buildAiDraft(total) {
        const draft = { Rock: 0, Paper: 0, Scissors: 0 };
        if (total <= 0) return draft;

        const topCount = Math.max(...Object.values(this.draft));
        const leaders = Object.keys(this.draft).filter(type => this.draft[type] === topCount);
        const playerTop = leaders[Math.floor(Math.random() * leaders.length)];
        const counter = this.counterTo(playerTop);
        const counterCount = Math.min(total, Math.max(1, Math.round(total * (0.45 + Math.random() * 0.25))));
        draft[counter] = counterCount;

        let left = total - counterCount;
        const others = Object.keys(draft).filter(type => type !== counter);
        while (left > 0) {
            draft[others[Math.floor(Math.random() * others.length)]]++;
            left--;
        }
        return draft;
    }

    spawnTeam(draft, owner) {
        Object.entries(draft).forEach(([type, count]) => {
            for (let i = 0; i < count; i++) {
                const { x, y } = findFreePosition();
                const obj = createRPSObject(type, x, y);
                obj.owner = owner;
                rpsObjects.push(obj);
            }
        });
    }

    onCollision(obj1, obj2) {
        if (obj1.owner && obj1.owner === obj2.owner) {
            this.separatePair(obj1, obj2);
            return null;
        }
        const winner = this.getRPSWinner(obj1, obj2);
        if (!winner) {
            this.separatePair(obj1, obj2);
            return null;
        }
        collisionSound.currentTime = 0;
        collisionSound.play().catch(() => {});
        gameStats.totalBattles++;
        winner.winAnimation = WIN_ANIMATION_FRAMES;
        return winner;
    }

    teamCounts(owner) {
        const counts = { Rock: 0, Paper: 0, Scissors: 0 };
        rpsObjects.forEach(obj => {
            if (obj.owner === owner) counts[obj.type]++;
        });
        return counts;
    }

    checkGameEnd() {
        this.evaluateBattle();
        return !!this.campaignOver || !!this.result;
    }

    getGameEndMessage() {
        if (this.campaignOver === 'victory') {
            return `Campaign won! Your bank hits the goal of ${RESOURCE_GOAL}. Press Reset for a new campaign.`;
        }
        if (this.campaignOver === 'defeat') {
            return 'You are out of resources. Press Reset to start a new campaign.';
        }
        if (this.result === 'win') {
            return `Your army wins! +${RESOURCE_WIN_BONUS} resources on Reset (bank ${this.resources}).`;
        }
        if (this.result === 'loss') {
            const next = Math.max(0, this.resources - RESOURCE_LOSS_PENALTY);
            return `The AI wins. -${RESOURCE_LOSS_PENALTY} resources on Reset (down to ${next}).`;
        }
        if (this.result === 'draw') {
            return 'Both armies fell. Resources stay the same. Press Reset.';
        }
        return 'Game Over!';
    }

    formatDraft(draft) {
        if (!draft) return 'hidden';
        return Object.entries(draft).map(([type, count]) => `${type[0]}${count}`).join(' ');
    }

    adjustDraft(type, step) {
        if (this.spawned || this.campaignOver) return;
        const next = this.draft[type] + step;
        if (next < 0) return;
        if (step > 0 && this.spent() >= this.resources) return;
        this.draft[type] = next;
        this.updateUI();
    }

    createUI() {
        this.panel = document.createElement('div');
        this.panel.className = 'mode-panel';
        this.panel.innerHTML = `
            <div class="draft-row">
                ${Object.keys(RPS_TYPES).map(type => `
                    <div class="draft-group">
                        <button type="button" class="mode-choice" data-step="-1" data-type="${type}">−</button>
                        <span class="draft-count" data-type="${type}">${type} 0</span>
                        <button type="button" class="mode-choice" data-step="1" data-type="${type}">+</button>
                    </div>
                `).join('')}
            </div>
            <div class="mode-status"></div>
            <div class="mode-stats"></div>
        `;

        this.panel.querySelectorAll('.mode-choice').forEach(btn => {
            btn.addEventListener('click', () => {
                this.adjustDraft(btn.dataset.type, Number(btn.dataset.step));
            });
        });

        canvas.before(this.panel);
        document.querySelector('.spawn-controls').classList.add('hidden');
    }

    updateUI() {
        if (!this.panel) return;
        const locked = this.spawned || !!this.campaignOver;

        const shown = this.spawned ? this.teamCounts('player') : this.draft;
        this.panel.querySelectorAll('.draft-count').forEach(label => {
            const type = label.dataset.type;
            label.textContent = `${type} ${shown[type]}`;
        });
        this.panel.querySelectorAll('.mode-choice').forEach(btn => {
            const step = Number(btn.dataset.step);
            const type = btn.dataset.type;
            btn.disabled = locked || (step < 0 && this.draft[type] <= 0) || (step > 0 && this.spent() >= this.resources);
        });

        let status;
        if (this.campaignOver === 'victory') {
            status = `You reached ${RESOURCE_GOAL} resources`;
        } else if (this.campaignOver === 'defeat') {
            status = 'Campaign over';
        } else if (this.spawned && !this.result) {
            status = 'Your icons have a mint dot, the AI has a pink one. Allies do not fight each other.';
        } else if (this.result) {
            status = 'Press Reset for the next round';
        } else if (this.spent() === 0) {
            status = 'Spend your budget, then press Start. The AI counters your largest group.';
        } else {
            status = `Fielding ${this.spent()} of ${this.resources}. Press Start to reveal the AI.`;
        }
        this.panel.querySelector('.mode-status').textContent = status;

        const youText = this.spawned ? this.formatDraft(this.teamCounts('player')) : this.formatDraft(this.draft);
        const aiText = this.spawned ? this.formatDraft(this.teamCounts('ai')) : 'hidden until Start';
        this.panel.querySelector('.mode-stats').textContent =
            `Round ${this.round} · Bank ${this.resources} · Goal ${RESOURCE_GOAL} · You ${youText} · AI ${aiText}`;
    }

    drawPowerups(ctx) {
        rpsObjects.forEach(obj => {
            if (!obj.owner) return;
            ctx.save();
            ctx.fillStyle = obj.owner === 'player' ? '#3eae82' : '#e85d8c';
            ctx.beginPath();
            ctx.arc(obj.x, obj.y + obj.radius * 1.75, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    removeUI() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        document.querySelector('.spawn-controls').classList.remove('hidden');
    }
}
