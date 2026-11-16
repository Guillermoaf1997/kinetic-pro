// engine.js - Gestión Multi-Atleta, Escala de 10 Niveles y Motor DPDA-4 con Hitos Fisiológicos

const UserStore = {
  data: (() => {
    const fallback = { activeProfileId: null, profiles: {} };
    const loaded = safeLocalStorageGet(CONFIG.STORAGE_KEY, fallback);
    if (!loaded || typeof loaded !== 'object' || typeof loaded.profiles !== 'object') {
      return fallback;
    }
    // Migración suave si existían perfiles antiguos del sistema de 3 niveles
    Object.values(loaded.profiles).forEach(p => {
      if (p && !p.levelSystem10) {
        const mapOldTo10 = { 1: 2, 2: 4, 3: 8 };
        p.level = mapOldTo10[p.level] || clamp(p.level, 1, 10);
        p.levelSystem10 = true;
      }
    });
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
    const baseLevel = clamp(parseInt(level) || 4, 1, 10);
    const defaultEquip = ['Suelo', 'Barra', 'Anillas', 'Paralelas', 'Rueda Ab', 'Banco/Cajón'];
    const selectedEquip = (equipment && equipment.length) ? equipment : defaultEquip;
    const wheel = this.buildPersonalizedWheel(baseLevel, selectedEquip, []);

    const cleanName = (name || '').trim().slice(0, 60) || 'Atleta';
    const safeNumber = (value, min, max, fallback) => {
      const n = Number(value);
      return Number.isFinite(n) ? clamp(n, min, max) : fallback;
    };

    const cal = calibration || {};
    const safeCalibration = {
      push: Math.max(1, parseInt(cal.push) || 15),
      pull: Math.max(1, parseInt(cal.pull) || 6),
      legs: Math.max(1, parseInt(cal.legs) || 25),
      core: Math.max(1, parseInt(cal.core) || 15)
    };

    this.data.profiles[id] = {
      id,
      name: cleanName,
      weightKg: safeNumber(weightKg, CONFIG.WEIGHT_MIN, CONFIG.WEIGHT_MAX, 75),
      heightCm: Math.round(safeNumber(heightCm, CONFIG.HEIGHT_MIN, CONFIG.HEIGHT_MAX, 175)),
      age: Math.round(safeNumber(age, CONFIG.AGE_MIN, CONFIG.AGE_MAX, 28)),
      level: baseLevel,
      levelSystem10: true,
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

  // Selecciona los ejercicios más cercanos al nivel (1..10) elegido por el atleta
  buildPersonalizedWheel(targetLevel, equipment, blacklist) {
    const pick = (group, preferredKeywords, fallbackIdx = 0) => {
      const validPool = EXERCISE_CATALOG.filter(e =>
        e.group === group &&
        !blacklist.includes(e.id) &&
        (e.equipment === 'Suelo' || equipment.includes(e.equipment))
      );
      const pool = validPool.length ? validPool : EXERCISE_CATALOG.filter(e => e.group === group && !blacklist.includes(e.id));

      // Buscar primero en el nivel exacto, luego a ±1 nivel, luego ±2 niveles
      for (const delta of [0, -1, 1, -2, 2, -3, 3]) {
        const lvlPool = pool.filter(e => e.level === targetLevel + delta);
        if (!lvlPool.length) continue;
        for (const kw of preferredKeywords) {
          const found = lvlPool.find(e => e.name.toLowerCase().includes(kw.toLowerCase()));
          if (found) return found.id;
        }
        if (delta === 0) return (lvlPool[fallbackIdx] || lvlPool[0]).id;
      }

      // Ordenar por cercanía al nivel objetivo
      pool.sort((a, b) => Math.abs(a.level - targetLevel) - Math.abs(b.level - targetLevel));
      return (pool[fallbackIdx] || pool[0]).id;
    };

    return [
      {
        id: 'wheel_push', shortName: 'PUSH', name: 'Push · Densidad Empuje', focus: 'Empuje', muscles: ['Pectoral', 'Hombros', 'Brazos'],
        blocks: [
          { title: 'Superserie A · Empuje Principal (4 Rondas)', type: 'superset', sets: 4, exIds: [ pick('Pectoral', ['fondos', 'flexiones clásicas', 'flexiones inclinadas'], 0), pick('Pectoral', ['flexiones', 'aperturas'], 1) ] },
          { title: 'Superserie B · Hombro & Tríceps (3 Rondas)', type: 'superset', sets: 3, exIds: [ pick('Hombros', ['pica', 'pino', 'caminatas'], 0), pick('Brazos', ['extensiones de tríceps', 'diamante', 'fondos'], 0) ] },
          { id: 'push_finisher', title: 'Finisher · Tabata (4 min)', type: 'interval', label: 'Tabata', workSec: 20, restSec: 10, rounds: 8, cue: 'Flexiones estrictas a ritmo constante · 20s trabajo / 10s descanso' }
        ]
      },
      {
        id: 'wheel_pull', shortName: 'PULL', name: 'Pull · Tracción & Dorsal', focus: 'Tirón', muscles: ['Espalda', 'Brazos', 'Hombros'],
        blocks: [
          { title: 'Superserie A · Tracción Vertical & Horizontal (4 Rondas)', type: 'superset', sets: 4, exIds: [ pick('Espalda', ['dominadas', 'muscle-up', 'remo'], 0), pick('Espalda', ['remo', 'australianas'], 1) ] },
          { title: 'Superserie B · Bíceps & Deltoide Posterior (3 Rondas)', type: 'superset', sets: 3, exIds: [ pick('Brazos', ['dominadas supinas', 'curl', 'pelican'], 0), pick('Hombros', ['face pulls', 'aperturas posteriores'], 0) ] },
          { id: 'pull_finisher', title: 'Finisher · EMOM (4 min)', type: 'interval', label: 'EMOM', workSec: 40, restSec: 20, rounds: 4, cue: '10 Remos en anillas + Aguante hueco (Hollow) el resto del minuto' }
        ]
      },
      {
        id: 'wheel_legs', shortName: 'LEGS', name: 'Legs & Core · Pierna & Abdomen', focus: 'Pierna / Core', muscles: ['Tren Inferior', 'Core'],
        blocks: [
          { title: 'Superserie A · Pierna Dominante (4 Rondas)', type: 'superset', sets: 4, exIds: [ pick('Tren Inferior', ['pistol', 'búlgara', 'sentadilla'], 0), pick('Tren Inferior', ['cosaca', 'zancadas', 'sentadilla'], 1) ] },
          { title: 'Superserie B · Cadena Posterior & Core (3 Rondas)', type: 'superset', sets: 3, exIds: [ pick('Tren Inferior', ['nórdico', 'curl femoral', 'puente', 'buenos días'], 2), pick('Core', ['toes-to-bar', 'elevaciones', 'rueda'], 0) ] },
          { id: 'legs_finisher', title: 'Finisher · Tabata (4 min)', type: 'interval', label: 'Tabata', workSec: 20, restSec: 10, rounds: 8, cue: 'Plancha Hollow / Escaladores estrictos · Máxima tensión abdominal' }
        ]
      }
    ];
  }
};

// =====================================================================
// MOTOR DPDA-4 CON HITOS FISIOLÓGICOS REALISTAS POR EJERCICIO
// =====================================================================
const ProgressionEngine = {
  getPrescription(profile, exId, defaultSets = 4) {
    const ex = EXERCISE_BY_ID[exId];
    const isHold = ex && ex.metric === 'seconds';
    const ceilingReps = ex ? ex.masteryReps : CONFIG.MAX_REPS_DEFAULT;

    if (!profile.progressionState[exId]) {
      let baseStart = ex ? ex.startReps : CONFIG.MIN_REPS_DEFAULT;

      // Calibrar con el test inicial solo en movimientos básicos no lentos (Niveles 1-4)
      if (!isHold && ex && !ex.isSlow && ex.level <= 4 && profile.calibration) {
        let testMax = 0;
        if (ex.group === 'Pectoral' || ex.group === 'Hombros' || ex.group === 'Brazos') testMax = profile.calibration.push;
        else if (ex.group === 'Espalda') testMax = profile.calibration.pull;
        else if (ex.group === 'Tren Inferior') testMax = profile.calibration.legs;
        else if (ex.group === 'Core') testMax = profile.calibration.core;

        if (testMax > 0) {
          const calibrated70 = Math.max(3, Math.floor(testMax * 0.7));
          // Nunca empezar por encima del hito de dominio menos 2 reps
          baseStart = Math.min(ceilingReps - 2, Math.max(baseStart, calibrated70));
        }
      }

      profile.progressionState[exId] = {
        sets: defaultSets,
        minReps: baseStart,
        maxReps: ceilingReps,
        targetReps: Array(defaultSets).fill(baseStart),
        restSec: CONFIG.REST_DEFAULT_SEC,
        phase: 1, // 1: Escalada Volumen | 2: Compresión Densidad | 3: Dominado | 'DESCARGA'
        lastRPE: 8,
        bestSet: 0,
        sessionsCount: 0,
        consecutiveHighRPE: 0,
        notes: ''
      };
    } else if (ex && profile.progressionState[exId].maxReps !== ceilingReps) {
      // Actualizar el techo fisiológico si el perfil venía de la versión antigua
      profile.progressionState[exId].maxReps = ceilingReps;
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

    // Retorno de Descarga: restaura el volumen y exactamente el descanso previo
    if (p.phase === 'DESCARGA') {
      p.phase = p.preDeloadPhase || 1;
      if (p.preDeloadTarget) p.targetReps = [...p.preDeloadTarget];
      p.restSec = p.preDeloadRestSec || CONFIG.REST_DEFAULT_SEC;
      return { status: 'RECUPERADO ⚡', msg: 'Descarga completada. Restauramos tu volumen y descanso previo.' };
    }

    if (avgRPE >= CONFIG.RPE_HIGH_THRESHOLD) p.consecutiveHighRPE = (p.consecutiveHighRPE || 0) + 1;
    else p.consecutiveHighRPE = 0;

    // Descarga automática tras 2 sesiones seguidas al fallo (RPE >= 9.2)
    if (p.consecutiveHighRPE >= 2) {
      p.preDeloadPhase = p.phase;
      p.preDeloadTarget = [...p.targetReps];
      p.preDeloadRestSec = p.restSec;
      p.phase = 'DESCARGA';
      p.targetReps = p.targetReps.map(r => Math.max(1, Math.floor(r * 0.6)));
      p.restSec = CONFIG.REST_DEFAULT_SEC;
      p.consecutiveHighRPE = 0;
      return { status: 'DESCARGA 📉', msg: 'Fatiga acumulada detectada: semana de descarga al 60% para supercompensar.' };
    }

    if (avgRPE >= CONFIG.RPE_HIGH_THRESHOLD && hitAllTargets) {
      p.targetReps = [...values];
      return { status: 'CONSOLIDAR', msg: 'RPE al límite: mantenemos repeticiones para consolidar técnica.' };
    }

    if (!hitAllTargets) {
      p.targetReps = values.map(v => Math.max(p.minReps, v));
      return { status: 'AJUSTE', msg: 'Reajustamos la base al rendimiento real de hoy.' };
    }

    const allAtCeiling = values.every(v => v >= p.maxReps);

    if (!allAtCeiling) {
      p.phase = 1;
      const bonus = avgRPE <= CONFIG.RPE_EASY_THRESHOLD ? 2 : 1;
      p.targetReps = this._distributeRepBonus(values, bonus, p.maxReps);
      return { status: 'VOLUMEN +', msg: `Fase 1: Escalada hacia el hito de ${p.maxReps} reps (${p.targetReps.join('-')}).` };
    }

    if (p.restSec > CONFIG.REST_MIN_SEC) {
      p.phase = 2;
      p.restSec = Math.max(CONFIG.REST_MIN_SEC, p.restSec - CONFIG.REST_STEP_SEC);
      p.targetReps = Array(values.length).fill(p.maxReps);
      return { status: 'DENSIDAD +', msg: `Fase 2: Hito de ${p.maxReps} reps logrado. Descanso reducido a ${p.restSec}s.` };
    }

    p.phase = 3;
    return { status: 'DOMINADO ★', msg: `Fase 3: ¡Has dominado las ${p.maxReps} reps con 45s de descanso! Subes de nivel.` };
  },

  // Avance gradual de 1 en 1 nivel (Nivel N -> Nivel N+1) buscando el mismo patrón biomecánico
  findNextLevelExercise(profile, oldExId) {
    const oldEx = EXERCISE_BY_ID[oldExId];
    if (!oldEx) return null;

    const inWheelIds = new Set();
    profile.wheel.forEach(r => r.blocks.forEach(b => {
      if (b.exIds) b.exIds.forEach(id => inWheelIds.add(id));
    }));

    const filterPool = (lvl, minNum = 0) => EXERCISE_CATALOG.filter(e =>
      e.group === oldEx.group &&
      e.level === lvl &&
      e.num > minNum &&
      !profile.blacklist.includes(e.id) &&
      !inWheelIds.has(e.id) &&
      (e.equipment === 'Suelo' || profile.equipment.includes(e.equipment))
    );

    let pool = [];
    for (let nextLvl = oldEx.level + 1; nextLvl <= 10; nextLvl++) {
      pool = filterPool(nextLvl, 0);
      if (pool.length > 0) break;
    }
    if (pool.length === 0) {
      pool = filterPool(oldEx.level, oldEx.num);
    }
    if (pool.length === 0) return null;

    const patterns = ['fondo', 'flexion', 'dominada', 'remo', 'pica', 'pino', 'curl', 'extensi', 'sentadilla', 'búlgara', 'zancada', 'elevacion', 'rueda'];
    const oldLower = oldEx.name.toLowerCase();
    const matchedPattern = patterns.find(pat => oldLower.includes(pat));
    if (matchedPattern) {
      const samePattern = pool.find(e => e.name.toLowerCase().includes(matchedPattern));
      if (samePattern) return samePattern.id;
    }

    return pool[0].id;
  },

  promoteExercise(profile, oldExId) {
    const newExId = this.findNextLevelExercise(profile, oldExId);
    if (!newExId || newExId === oldExId) return null;

    let replaced = false;
    let setsCount = 4;
    profile.wheel.forEach(routine => {
      routine.blocks.forEach(block => {
        if (block.exIds) {
          block.exIds = block.exIds.map(id => {
            if (id === oldExId) {
              replaced = true;
              setsCount = block.sets || 4;
              return newExId;
            }
            return id;
          });
        }
      });
    });

    if (!replaced) return null;
    this.getPrescription(profile, newExId, setsCount);
    return {
      oldEx: EXERCISE_BY_ID[oldExId],
      newEx: EXERCISE_BY_ID[newExId]
    };
  },

  findReplacement(profile, oldExId) {
    const oldEx = EXERCISE_BY_ID[oldExId];
    if (!oldEx) return oldExId;
    for (const delta of [0, -1, 1, -2, 2]) {
      const candidates = EXERCISE_CATALOG.filter(e =>
        e.id !== oldExId &&
        e.group === oldEx.group &&
        e.level === oldEx.level + delta &&
        !profile.blacklist.includes(e.id) &&
        (e.equipment === 'Suelo' || profile.equipment.includes(e.equipment))
      );
      if (candidates.length) return candidates[0].id;
    }
    return oldExId;
  }
};

function computeMuscleRecovery(profile) {
  const groups = ["Pectoral", "Espalda", "Hombros", "Brazos", "Tren Inferior", "Core"];
  const fatigue = {};
  groups.forEach(g => fatigue[g] = 0);
  const now = Date.now();
  const windowMs = CONFIG.RECOVERY_WINDOW_HOURS * 3600 * 1000;

  profile.history.forEach(session => {
    const ageMs = now - new Date(session.date).getTime();
    if (ageMs >= 0 && ageMs < windowMs && session.muscleLoads) {
      const decay = 1 - (ageMs / windowMs);
      Object.keys(session.muscleLoads).forEach(g => {
        if (fatigue[g] !== undefined) fatigue[g] += session.muscleLoads[g] * decay;
      });
    }
  });

  const recovery = {};
  groups.forEach(g => {
    recovery[g] = Math.max(15, Math.min(100, Math.round(100 - fatigue[g])));
  });
  return recovery;
}