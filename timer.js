// timer.js - Audio Sintetizado, Cronómetro de Sesión, Anillo de Descanso e Isométricos

const SoundEngine = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  beep(freq = 880, duration = 0.12, type = 'sine') {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },
  vibrate(pattern = [40]) {
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} }
  },
  playCountdown() { this.beep(660, 0.09, 'triangle'); },
  playGo() { this.beep(1046.5, 0.3, 'sine'); this.vibrate([80]); },
  playFinish() {
    this.beep(880, 0.14);
    setTimeout(() => this.beep(1174.6, 0.24), 150);
    this.vibrate([100, 60, 120]);
  }
};

const SessionClock = {
  interval: null,
  seconds: 0,
  start() {
    this.stop();
    this.seconds = 0;
    this.interval = setInterval(() => {
      this.seconds++;
      const el = document.getElementById('session-elapsed');
      if (el) el.textContent = this.format(this.seconds);
    }, 1000);
  },
  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  },
  format(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
};

const RestTimer = {
  interval: null,
  remaining: 0,
  total: 0,

  start(seconds) {
    if (!seconds || seconds <= 0) return;
    SoundEngine.init();
    this.stop(false);
    this.remaining = seconds;
    this.total = seconds;
    this.render();

    this.interval = setInterval(() => {
      this.remaining--;
      if (this.remaining <= 3 && this.remaining > 0) SoundEngine.playCountdown();
      if (this.remaining <= 0) {
        SoundEngine.playFinish();
        this.stop(true);
      } else {
        this.render();
      }
    }, 1000);
  },

  adjust(delta) {
    this.remaining = Math.max(1, this.remaining + delta);
    this.total = Math.max(this.total, this.remaining);
    this.render();
  },

  stop(hide = true) {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    if (hide) {
      const bar = document.getElementById('rest-timer-bar');
      if (bar) bar.classList.add('hidden');
    }
  },

  render() {
    const bar = document.getElementById('rest-timer-bar');
    const display = document.getElementById('rest-time-display');
    const progress = document.getElementById('rest-progress-fill');
    if (!bar || !display) return;

    bar.classList.remove('hidden');
    const mins = Math.floor(this.remaining / 60);
    const secs = this.remaining % 60;
    display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    display.style.color = this.remaining <= 3 ? 'var(--accent-red)' : 'var(--accent-amber)';
    if (progress) {
      progress.style.width = `${Math.min(100, (this.remaining / this.total) * 100)}%`;
    }
  }
};

const IsoModal = {
  interval: null,
  phase: 'idle',
  seconds: 0,
  onSaveCallback: null,

  open(exerciseName, onSave) {
    SoundEngine.init();
    this.onSaveCallback = onSave;
    this.phase = 'prep';
    this.seconds = 4;
    this.render(exerciseName);

    this.interval = setInterval(() => {
      this.seconds--;
      if (this.phase === 'prep') {
        if (this.seconds > 0) SoundEngine.playCountdown();
        else { this.phase = 'hold'; this.seconds = 0; SoundEngine.playGo(); }
      } else if (this.seconds > 0 && this.seconds % 10 === 0) {
        SoundEngine.beep(523.25, 0.08);
      }
      this.render(exerciseName);
    }, 1000);
  },

  finish() {
    clearInterval(this.interval);
    SoundEngine.playFinish();
    const recorded = this.phase === 'hold' ? this.seconds : 0;
    const modal = document.getElementById('iso-modal');
    if (modal) modal.remove();
    if (this.onSaveCallback && recorded > 0) this.onSaveCallback(recorded);
  },

  cancel() {
    clearInterval(this.interval);
    const modal = document.getElementById('iso-modal');
    if (modal) modal.remove();
  },

  render(exerciseName) {
    let modal = document.getElementById('iso-modal');
    let justCreated = false;
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'iso-modal';
      modal.className = 'modal-overlay';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Cronómetro isométrico');
      modal.dataset.closable = 'true';
      document.body.appendChild(modal);
      justCreated = true;
    }
    const isPrep = this.phase === 'prep';
    const label = isPrep ? 'PREPÁRATE (Colócate)' : 'AGUANTANDO';
    const color = isPrep ? 'var(--accent-amber)' : 'var(--accent-green)';

    modal.innerHTML = `
      <div class="modal-card" tabindex="-1">
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 10px;">${escapeHTML(exerciseName)}</p>
        <span class="badge" style="color: ${color}; border-color: ${color};">${label}</span>
        <div class="big-clock" style="color: ${color};" aria-live="polite">${this.seconds}s</div>
        <div style="display: flex; gap: 12px; margin-top: 20px;">
          <button class="btn btn-ghost" style="flex:1;" data-action="iso-cancel">Cancelar</button>
          <button class="btn btn-emerald" style="flex:2;" data-action="iso-finish">${isPrep ? 'Iniciar Ya' : 'Parar y Guardar'}</button>
        </div>
      </div>
    `;
    if (justCreated) modal.querySelector('.modal-card').focus();
  }
};

const IntervalClock = {
  interval: null,
  running: false,
  activeKey: null,
  currentRound: 1,
  totalRounds: 8,
  workSec: 20,
  restSec: 10,
  label: 'Tabata',
  isWork: true,
  remaining: 20,

  toggle(key, workSec, restSec, rounds, label = 'Tabata') {
    SoundEngine.init();

    if (this.activeKey !== key) {
      this.reset(key, workSec, restSec, rounds, label);
    }

    if (this.running) {
      clearInterval(this.interval);
      this.running = false;
      this.updateUI();
      return;
    }

    this.running = true;
    SoundEngine.playGo();
    this.updateUI();

    this.interval = setInterval(() => {
      this.remaining--;
      if (this.remaining <= 3 && this.remaining > 0) SoundEngine.playCountdown();
      if (this.remaining <= 0) {
        if (this.isWork) {
          if (this.currentRound >= this.totalRounds) {
            SoundEngine.playFinish();
            this.reset(key, this.workSec, this.restSec, this.totalRounds, this.label);
            return;
          }
          this.isWork = false;
          this.remaining = this.restSec;
          SoundEngine.beep(440, 0.25);
        } else {
          this.currentRound++;
          this.isWork = true;
          this.remaining = this.workSec;
          SoundEngine.playGo();
        }
      }
      this.updateUI();
    }, 1000);
  },

  reset(key, workSec, restSec, rounds, label = 'Tabata') {
    clearInterval(this.interval);
    this.activeKey = key;
    this.running = false;
    this.currentRound = 1;
    this.isWork = true;
    this.workSec = workSec;
    this.restSec = restSec;
    this.totalRounds = rounds;
    this.remaining = workSec;
    this.label = label;
    this.updateUI();
  },

  updateUI() {
    const clockEl = document.getElementById('tabata-clock');
    const phaseEl = document.getElementById('tabata-phase');
    const btnEl = document.getElementById('tabata-btn');
    if (!clockEl) return;
    clockEl.textContent = `${this.remaining}s`;
    clockEl.style.color = this.isWork ? 'var(--accent-green)' : 'var(--accent-amber)';
    phaseEl.textContent = `RONDA ${this.currentRound}/${this.totalRounds} · ${this.isWork ? 'TRABAJO' : 'DESCANSO'}`;
    btnEl.textContent = this.running ? 'Pausar' : `Iniciar ${this.label}`;
  }
};