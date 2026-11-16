// engine.js - Gestión Multi-Atleta, Calibración, Descargas DPDA-4 y Editor de Ruedas

const UserStore = {
  data: (() => {
    const fallback = { activeProfileId: null, profiles: {} };
    const loaded = safeLocalStorageGet(CONFIG.STORAGE_KEY, fallback);
    if (!loaded || typeof loaded !== 'object' || typeof loaded.profiles !== 'object') {
      return fallback;
    }
    return loaded;
  })(),

  save() {
    return safeLocalStorageSet(CONFIG.STORAGE_KEY, this.data);
  },

  getActiveProfile() {
    if (!this.data.activeProfileId) return null;
    return this.data.profiles[this.data.activeProfileId] || null;
  },

  createProfile({ name, weightKg, heightCm, age, level, equipment, calibration }) {
    const id = 'ath_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const baseLevel = [1, 2, 3].includes(parseInt(level)) ? parseInt(level) : 2;
    const defaultEquip = ['Suelo', 'Barra', 'Anillas', 'Paralelas', 'Rueda Ab', 'Banco/Cajón'];
    const selectedEquip = (equipment && equipment.length) ? equipment : defaultEquip;
    const wheel = this.buildPersonalizedWheel(baseLevel, selectedEquip, []);

    const cleanName = (name || '').trim().slice(0, 60) || 'Atleta';
    const safeNumber = (value, min, max, fallback) => {
      const n = Number(value);
      return Number.isFinite(n) ? clamp(n, min, max) : fallback;
    };

    // Asegurar que la calibración inicial tenga valores mínimos lógicos
    const safeCalibration = {
      push: Math.max(1, parseInt(calibration.push) || 10),
      pull: Math.max(1, parseInt(calibration.pull) || 5),
      legs: Math.max(1, parseInt(calibration.legs) || 15),
      core: Math.max(1, parseInt(calibration.core) || 15)
    };

    this.data.profiles[id] = {
      id,
      name: cleanName,
      weightKg: safeNumber(weightKg, CONFIG.WEIGHT_MIN, CONFIG.WEIGHT_MAX, 75),
      heightCm: Math.round(safeNumber(heightCm, CONFIG.HEIGHT_MIN, CONFIG.HEIGHT_MAX, 175)),
      age: Math.round(safeNumber(age, CONFIG.AGE_MIN, CONFIG.AGE_MAX, 28)),
      level: baseLevel,
      equipment: selectedEquip,
      calibration: safeCalibration,
      createdAt: new Date().toISOString(),
      wheelIndex: 0,
      wheel,
      favorites: [],
      blacklist: [],
      progressionState: {},
      history: []
    };
    this.data.activeProfileId = id;
    this.save();
    return this.data.profiles[id];
  },

  switchProfile(id) {
    if (this.data.profiles[id]) {
      this.data.activeProfileId = id;
      this.save();
    }
  },

  deleteProfile(id) {
    if (!this.data.profiles[id]) return;
    delete this.data.profiles[id];
    if (this.data.activeProfileId === id) {
      const remaining = Object.keys(this.data.profiles);
      this.data.activeProfileId = remaining.length ? remaining[0] : null;
    }
    this.save();
  },

  buildPersonalizedWheel(level, equipment, blacklist) {
    const pick = (group, preferredKeywords, fallbackIdx = 0) => {
      const candidates = EXERCISE_CATALOG.filter(e =>
        e.group === group && e.level === level && !blacklist.includes(e.id) &&
        (e.equipment === 'Suelo' || equipment.includes(e.equipment))
      );
      const pool = candidates.length ? candidates : EXERCISE_CATALOG.filter(e => e.group === group && !blacklist.includes(e.id));
      for (const kw of preferredKeywords) {
        const found = pool.find(e => e.name.toLowerCase().includes(kw.toLowerCase()));
        if (found) return found.id;
      }
      return (pool[fallbackIdx] || pool[0]).id;
    };

    return [
      {
        id: 'wheel_push', shortName: 'PUSH', name: 'Push · Densidad', focus: 'Empuje', muscles: ['Pectoral', 'Hombros', 'Brazos'],
        blocks: [
          { title: 'Superserie A · Empuje (4 Rondas)', type: 'superset', sets: 4, exIds: [ pick('Pectoral', ['fondos en anillas', 'flexiones clásicas'], 0), pick('Pectoral', ['flexiones en anillas', 'declinadas'], 1) ] },
          { title: 'Superserie B · Hombro/Tríceps (3 Rondas)', type: 'superset', sets: 3, exIds: [ pick('Hombros', ['pica', 'pino'], 0), pick('Brazos', ['tríceps', 'diamante'], 0) ] },
          { id: 'push_finisher', title: 'Finisher · Tabata (4 min)', type: 'interval', label: 'Tabata', workSec: 20, restSec: 10, rounds: 8, cue: 'Flexiones estrictas · 20s/10s' }
        ]
      },
      {
        id: 'wheel_pull', shortName: 'PULL', name: 'Pull · Resistencia Dorsal', focus: 'Tirón', muscles: ['Espalda', 'Brazos', 'Hombros'],
        blocks: [
          { title: 'Superserie A · Tracción (4 Rondas)', type: 'superset', sets: 4, exIds: [ pick('Espalda', ['dominadas pronas', 'negativas'], 0), pick('Espalda', ['remo invertido en anillas', 'remo'], 1) ] },
          { title: 'Superserie B · Bíceps/Hombro Posterior (3 Rondas)', type: 'superset', sets: 3, exIds: [ pick('Brazos', ['dominadas supinas', 'curl'], 0), pick('Hombros', ['face pulls'], 0) ] },
          { id: 'pull_finisher', title: 'Finisher · EMOM (4 min)', type: 'interval', label: 'EMOM', workSec: 40, restSec: 20, rounds: 4, cue: '10 Remos + Aguante Hollow' }
        ]
      },
      {
        id: 'wheel_legs', shortName: 'LEGS', name: 'Legs & Core', focus: 'Pierna / Core', muscles: ['Tren Inferior', 'Core'],
        blocks: [
          { title: 'Superserie A · Pierna Dominante (4 Rondas)', type: 'superset', sets: 4, exIds: [ pick('Tren Inferior', ['búlgara', 'zancadas'], 0), pick('Tren Inferior', ['zancadas alternas', 'sentadilla'], 1) ] },
          { title: 'Superserie B · Isquios/Core (3 Rondas)', type: 'superset', sets: 3, exIds: [ pick('Tren Inferior', ['curl femoral', 'puente'], 2), pick('Core', ['elevaciones de piernas'], 0) ] },
          { id: 'legs_finisher', title: 'Finisher · Tabata (4 min)', type: 'interval', label: 'Tabata', workSec: 20, restSec: 10, rounds: 8, cue: 'Plancha Hollow / Escaladores' }
        ]
      }
    ];
  }
};

// =====================================================================
// MOTOR CIENTÍFICO DE SOBRECARGA PROGRESIVA (DPDA-4) CON CALIBRACIÓN Y DELOADS
// =====================================================================
const ProgressionEngine = {
  // Inicializa el ejercicio usando el Test de Calibración en vez de valores fijos
  getPrescription(profile, exId, defaultSets = 4) {
    if (!profile.progressionState[exId]) {
      const ex = EXERCISE_BY_ID[exId];
      const isHold = ex && ex.metric === 'seconds';
      
      let baseReps = CONFIG.MIN_REPS_DEFAULT;
      if (!isHold && profile.calibration) {
        if (ex.group === 'Pectoral' || ex.group === 'Hombros' || ex.group === 'Brazos') baseReps = profile.calibration.push;
        else if (ex.group === 'Espalda') baseReps = profile.calibration.pull;
        else if (ex.group === 'Tren Inferior') baseReps = profile.calibration.legs;
        else if (ex.group === 'Core') baseReps = profile.calibration.core;
      }
      
      // La meta base es el 70% de las máximas repeticiones del test
      const minR = isHold ? CONFIG.MIN_HOLD_SEC : Math.max(3, Math.floor(baseReps * 0.7));
      const maxR = isHold ? CONFIG.MAX_HOLD_SEC : Math.max(minR + 4, Math.floor(baseReps * 1.2));

      profile.progressionState[exId] = {
        sets: defaultSets,
        minReps: minR,
        maxReps: maxR,
        targetReps: Array(defaultSets).fill(minR),
        restSec: CONFIG.REST_DEFAULT_SEC,
        phase: 1, // 1: Volumen | 2: Densidad | 3: Salto | 'DESCARGA': Recuperación
        lastRPE: 8,
        bestSet: 0,
        sessionsCount: 0,
        consecutiveHighRPE: 0,
        notes: '' // <-- Para la Mejora 4.2
      };
    }
    return profile.progressionState[exId];
  },

  _distributeRepBonus(values, bonusPerSet, maxReps) {
    const next = [...values];
    let remaining = bonusPerSet * Math.ceil(values.length / 2);
    while (remaining > 0) {
      const lowest = Math.min(...next);
      if (lowest >= maxReps) break;
      const idx = next.indexOf(lowest);
      next[idx] = Math.min(maxReps, next[idx] + 1);
      remaining--;
    }
    return next;
  },

  evaluateSession(profile, exId, completedSetsData) {
    const p = this.getPrescription(profile, exId, completedSetsData.length);
    const values = completedSetsData.map(s => s.value);
    const avgRPE = completedSetsData.reduce((a, b) => a + b.rpe, 0) / completedSetsData.length;
    const hitAllTargets = values.every((v, i) => v >= (p.targetReps[i] || p.minReps));

    p.bestSet = Math.max(p.bestSet, ...values);
    p.lastRPE = +avgRPE.toFixed(1);
    p.sessionsCount++;

    // Si salimos de una descarga, restauramos los valores previos
    if (p.phase === 'DESCARGA') {
      p.phase = 1;
      if (p.preDeloadTarget) p.targetReps = [...p.preDeloadTarget];
      p.restSec = Math.max(CONFIG.REST_MIN_SEC, p.restSec - 15); 
      return { status: 'RECUPERADO ⚡', msg: 'Descarga finalizada. El sistema restaura tu volumen de trabajo.' };
    }

    // Tracker de Fatiga (Mejora 1.2: Deloads)
    if (avgRPE >= CONFIG.RPE_HIGH_THRESHOLD) p.consecutiveHighRPE = (p.consecutiveHighRPE || 0) + 1;
    else p.consecutiveHighRPE = 0;

    // Disparador de Descarga Automática (Deload) tras 2 sesiones al límite
    if (p.consecutiveHighRPE >= 2) {
      p.phase = 'DESCARGA';
      p.preDeloadTarget = [...p.targetReps];
      p.targetReps = p.targetReps.map(r => Math.max(1, Math.floor(r * 0.6))); // -40% volumen
      p.restSec = CONFIG.REST_DEFAULT_SEC; // Reinicia descanso
      p.consecutiveHighRPE = 0;
      return { status: 'DESCARGA 📉', msg: 'Fatiga alta sostenida. Reducimos el volumen un 40% esta sesión para supercompensar.' };
    }

    if (avgRPE >= CONFIG.RPE_HIGH_THRESHOLD && hitAllTargets) {
      p.targetReps = [...values];
      return { status: 'CONSOLIDAR', msg: 'RPE al límite. Mantenemos repeticiones para consolidar técnica sin riesgo.' };
    }

    if (!hitAllTargets) {
      p.targetReps = values.map(v => Math.max(p.minReps, v));
      return { status: 'AJUSTE', msg: 'Reajustamos el algoritmo a la realidad de tu rendimiento de hoy.' };
    }

    const allAtCeiling = values.every(v => v >= p.maxReps);

    if (!allAtCeiling) {
      p.phase = 1;
      const bonus = avgRPE <= CONFIG.RPE_EASY_THRESHOLD ? 2 : 1;
      p.targetReps = this._distributeRepBonus(values, bonus, p.maxReps);
      return { status: 'VOLUMEN +', msg: `Fase 1: Subimos volumen de manera escalonada (${p.targetReps.join('-')}).` };
    }

    if (p.restSec > CONFIG.REST_MIN_SEC) {
      p.phase = 2;
      p.restSec = Math.max(CONFIG.REST_MIN_SEC, p.restSec - CONFIG.REST_STEP_SEC);
      p.targetReps = Array(values.length).fill(p.maxReps);
      return { status: 'DENSIDAD +', msg: `Fase 2: Mantenemos techo y reducimos descanso a ${p.restSec}s.` };
    }

    p.phase = 3;
    return { status: 'DOMINADO ★', msg: 'Fase 3: Has dominado el ejercicio. ¡Desbloqueas el siguiente nivel biomecánico!' };
  },

  findNextLevelExercise(profile, oldExId) {
    const oldEx = EXERCISE_BY_ID[oldExId];
    if (!oldEx) return null;
    const inWheelIds = new Set();
    profile.wheel.forEach(r => r.blocks.forEach(b => { if (b.exIds) b.exIds.forEach(id => inWheelIds.add(id)); }));

    const filterPool = (lvl, minNum = 0) => EXERCISE_CATALOG.filter(e =>
      e.group === oldEx.group && e.level === lvl && e.num > minNum &&
      !profile.blacklist.includes(e.id) && !inWheelIds.has(e.id) &&
      (e.equipment === 'Suelo' || profile.equipment.includes(e.equipment))
    );

    let pool = oldEx.level < 3 ? filterPool(oldEx.level + 1, 0) : filterPool(3, oldEx.num);
    if (pool.length === 0 && oldEx.level < 3) pool = filterPool(oldEx.level, oldEx.num);
    if (pool.length === 0) return null;

    const patterns = ['fondo', 'flexion', 'dominada', 'remo', 'pica', 'pino', 'curl', 'extensi', 'sentadilla', 'búlgara', 'zancada', 'elevacion', 'rueda'];
    const matchedPattern = patterns.find(pat => oldEx.name.toLowerCase().includes(pat));
    if (matchedPattern) {
      const samePattern = pool.find(e => e.name.toLowerCase().includes(matchedPattern));
      if (samePattern) return samePattern.id;
    }
    return pool[0].id;
  },

  promoteExercise(profile, oldExId) {
    const newExId = this.findNextLevelExercise(profile, oldExId);
    if (!newExId || newExId === oldExId) return null;

    let replaced = false, setsCount = 4;
    profile.wheel.forEach(routine => {
      routine.blocks.forEach(block => {
        if (block.exIds) {
          block.exIds = block.exIds.map(id => {
            if (id === oldExId) { replaced = true; setsCount = block.sets || 4; return newExId; }
            return id;
          });
        }
      });
    });

    if (!replaced) return null;
    this.getPrescription(profile, newExId, setsCount);
    return { oldEx: EXERCISE_BY_ID[oldExId], newEx: EXERCISE_BY_ID[newExId] };
  },

  findReplacement(profile, oldExId) {
    const oldEx = EXERCISE_BY_ID[oldExId];
    if (!oldEx) return oldExId;
    const candidates = EXERCISE_CATALOG.filter(e =>
      e.id !== oldExId && e.group === oldEx.group && e.level === oldEx.level &&
      !profile.blacklist.includes(e.id) && (e.equipment === 'Suelo' || profile.equipment.includes(e.equipment))
    );
    return candidates.length ? candidates[0].id : oldExId;
  }
};

function computeMuscleRecovery(profile) {
  const groups = ["Pectoral", "Espalda", "Hombros", "Brazos", "Tren Inferior", "Core"];
  const fatigue = {};
  groups.forEach(g => fatigue[g] = 0);
  const now = Date.now(), windowMs = CONFIG.RECOVERY_WINDOW_HOURS * 3600 * 1000;
  profile.history.forEach(session => {
    const ageMs = now - new Date(session.date).getTime();
    if (ageMs >= 0 && ageMs < windowMs && session.muscleLoads) {
      const decay = 1 - (ageMs / windowMs);
      Object.keys(session.muscleLoads).forEach(g => { if (fatigue[g] !== undefined) fatigue[g] += session.muscleLoads[g] * decay; });
    }
  });
  const recovery = {};
  groups.forEach(g => { recovery[g] = Math.max(15, Math.min(100, Math.round(100 - fatigue[g]))); });
  return recovery;
}