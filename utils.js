// utils.js - Utilidades compartidas, Validación y Delegación de Eventos

const CONFIG = {
  STORAGE_KEY: 'kinetic_saas_db',
  REST_DEFAULT_SEC: 90,
  REST_MIN_SEC: 45,
  REST_STEP_SEC: 15,
  REST_BETWEEN_SETS_SEC: 15,
  RPE_HIGH_THRESHOLD: 9.2,
  RPE_EASY_THRESHOLD: 7.2,
  MIN_REPS_DEFAULT: 8,
  MAX_REPS_DEFAULT: 20,
  MIN_HOLD_SEC: 15,
  MAX_HOLD_SEC: 40,
  LIBRARY_PAGE_SIZE: 80,
  RECOVERY_WINDOW_HOURS: 72,
  WEIGHT_MIN: 30, WEIGHT_MAX: 250,
  HEIGHT_MIN: 120, HEIGHT_MAX: 230,
  AGE_MIN: 12, AGE_MAX: 99
};

function escapeHTML(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clamp(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function safeLocalStorageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`[KineticPro] No se pudo leer "${key}" de localStorage.`, e);
    return fallback;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`[KineticPro] No se pudo guardar "${key}" en localStorage.`, e);
    return false;
  }
}

function isValidProfileShape(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.id !== 'string' || !obj.id.startsWith('ath_')) return false;
  if (typeof obj.name !== 'string' || obj.name.length === 0 || obj.name.length > 60) return false;
  if (typeof obj.weightKg !== 'number' || obj.weightKg <= 0) return false;
  if (typeof obj.heightCm !== 'number' || obj.heightCm <= 0) return false;
  if (typeof obj.age !== 'number' || obj.age <= 0) return false;
  if (typeof obj.level !== 'number' || obj.level < 1 || obj.level > 10) return false;
  if (!Array.isArray(obj.equipment)) return false;
  if (!Array.isArray(obj.favorites)) return false;
  if (!Array.isArray(obj.blacklist)) return false;
  if (!Array.isArray(obj.history)) return false;
  if (typeof obj.progressionState !== 'object' || obj.progressionState === null) return false;
  if (!Array.isArray(obj.wheel) || obj.wheel.length === 0) return false;

  return obj.wheel.every(routine =>
    routine && typeof routine.id === 'string' && Array.isArray(routine.blocks) &&
    routine.blocks.every(block =>
      block && (block.type === 'interval'
        ? typeof block.workSec === 'number' && typeof block.restSec === 'number'
        : Array.isArray(block.exIds) && block.exIds.every(id => typeof id === 'string'))
    )
  );
}

const ActionDispatcher = {
  _handlers: Object.create(null),

  on(action, fn) {
    this._handlers[action] = fn;
  },

  init() {
    document.addEventListener('click', (ev) => {
      const el = ev.target.closest('[data-action]');
      if (!el) return;
      const fn = this._handlers[el.dataset.action];
      if (fn) fn(el, ev);
    });

    document.addEventListener('input', (ev) => {
      const el = ev.target.closest('[data-on-input]');
      if (!el) return;
      const fn = this._handlers[el.dataset.onInput];
      if (fn) fn(el, ev);
    });

    document.addEventListener('change', (ev) => {
      const el = ev.target.closest('[data-on-change]');
      if (!el) return;
      const fn = this._handlers[el.dataset.onChange];
      if (fn) fn(el, ev);
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape') return;
      const openModal = document.querySelector('.modal-overlay[data-closable="true"]');
      if (openModal) openModal.remove();
    });
  }
};