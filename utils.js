// utils.js - Utilidades compartidas
// Centraliza aquí lo que antes estaba disperso y era inseguro: escape de HTML,
// acceso a localStorage con manejo de errores, validación de datos importados
// y un único punto de delegación de eventos (para no mezclar nombres de usuario
// dentro de atributos onclick="...").

// -----------------------------------------------------------------------
// CONSTANTES (antes "números mágicos" repartidos por engine.js / app.js)
// -----------------------------------------------------------------------
const CONFIG = {
  STORAGE_KEY: 'kinetic_saas_db',
  REST_DEFAULT_SEC: 90,
  REST_MIN_SEC: 45,
  REST_STEP_SEC: 15,
  REST_BETWEEN_SETS_SEC: 15,
  RPE_HIGH_THRESHOLD: 9.2,   // a partir de aquí: consolidar, no subir reps
  RPE_EASY_THRESHOLD: 7.2,   // por debajo: fue "fácil", bonus de +2 reps
  MIN_REPS_DEFAULT: 8,
  MAX_REPS_DEFAULT: 16,
  MIN_HOLD_SEC: 15,
  MAX_HOLD_SEC: 35,
  LIBRARY_PAGE_SIZE: 80,
  RECOVERY_WINDOW_HOURS: 72,
  WEIGHT_MIN: 30, WEIGHT_MAX: 250,
  HEIGHT_MIN: 120, HEIGHT_MAX: 230,
  AGE_MIN: 12, AGE_MAX: 99
};

// -----------------------------------------------------------------------
// SEGURIDAD: escape de HTML
// -----------------------------------------------------------------------
// Todo texto que proviene del usuario (nombre de atleta, búsqueda de la
// biblioteca...) o del propio catálogo debe pasar por aquí antes de
// insertarse como texto dentro de innerHTML. Nunca se escapa al guardar,
// solo al pintar en pantalla (así los datos guardados siguen siendo "limpios").
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

// -----------------------------------------------------------------------
// localStorage seguro: nunca debe tirar la app abajo si el JSON está
// corrupto o si el navegador bloquea el storage (modo privado, cuota, etc.)
// -----------------------------------------------------------------------
function safeLocalStorageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`[KineticPro] No se pudo leer "${key}" de localStorage, se usa un valor por defecto.`, e);
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

// -----------------------------------------------------------------------
// Validación de perfiles importados (antes se aceptaba CUALQUIER JSON con
// un "id" y un "wheel", sin comprobar nada más, y se mezclaba directo en
// el estado de la app).
// -----------------------------------------------------------------------
function isValidProfileShape(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.id !== 'string' || !obj.id.startsWith('ath_')) return false;
  if (typeof obj.name !== 'string' || obj.name.length === 0 || obj.name.length > 60) return false;
  if (typeof obj.weightKg !== 'number' || obj.weightKg <= 0) return false;
  if (typeof obj.heightCm !== 'number' || obj.heightCm <= 0) return false;
  if (typeof obj.age !== 'number' || obj.age <= 0) return false;
  if (![1, 2, 3].includes(obj.level)) return false;
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

// -----------------------------------------------------------------------
// Delegación de eventos: UN solo listener por tipo de evento en document,
// en vez de un atributo onclick="..." en cada botón. Esto evita tener que
// incrustar datos de usuario (nombres de ejercicios, de atletas...) dentro
// de código JavaScript generado como texto, que era el vector de inyección
// más peligroso de la versión anterior. Los elementos solo llevan
// data-action="..." y data-* con los parámetros necesarios.
// -----------------------------------------------------------------------
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

    // Cierre accesible de modales con tecla Escape
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape') return;
      const openModal = document.querySelector('.modal-overlay[data-closable="true"]');
      if (openModal) openModal.remove();
    });
  }
};
