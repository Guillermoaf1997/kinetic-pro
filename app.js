// app.js - Interfaz Comercial Multi-Atleta, Constructor de Ruedas, Notas, Exportador PNG y Nube

const uiState = {
  tab: 'train',
  inWorkout: false,
  activeSession: null,
  lastCompletedSession: null,
  libSearch: '',
  libGroup: 'Todos',
  libLevel: 'Todos',
  libFilter: 'all', // 'all' | 'fav' | 'excluded'
  progressExerciseId: null
};

function switchTab(tabName) {
  uiState.tab = tabName;
  document.querySelectorAll('.nav-btn, .side-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  render();
  window.scrollTo(0, 0);
}

function closeModalById(id) {
  const modal = document.getElementById(id);
  if (modal) modal.remove();
}

function recoveryLabel(pct) {
  if (pct >= 80) return 'Alta';
  if (pct >= 50) return 'Media';
  return 'Baja';
}

// =====================================================================
// SILUETA ANATÓMICA SVG + RECUPERACIÓN MUSCULAR
// =====================================================================
function buildAnatomySVG(recoveryMap, highlightMuscles = []) {
  const getColor = (group) => {
    if (highlightMuscles.length > 0) {
      return highlightMuscles.includes(group) ? '#10B981' : '#1E2735';
    }
    const pct = recoveryMap[group] || 100;
    if (pct >= 80) return '#10B981';
    if (pct >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return `
    <div style="display:flex; align-items:center; gap:18px;">
      <svg viewBox="0 0 120 220" width="96" height="176" style="flex-shrink:0;" role="img" aria-label="Silueta anatómica con el estado de recuperación muscular">
        <circle cx="60" cy="22" r="14" fill="#1E2735" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
        <circle cx="32" cy="52" r="10" fill="${getColor('Hombros')}" />
        <circle cx="88" cy="52" r="10" fill="${getColor('Hombros')}" />
        <rect x="40" y="45" width="40" height="24" rx="6" fill="${getColor('Pectoral')}" />
        <path d="M36 56 L40 85 L34 80 Z" fill="${getColor('Espalda')}" />
        <path d="M84 56 L80 85 L86 80 Z" fill="${getColor('Espalda')}" />
        <rect x="20" y="64" width="11" height="46" rx="5" fill="${getColor('Brazos')}" />
        <rect x="89" y="64" width="11" height="46" rx="5" fill="${getColor('Brazos')}" />
        <rect x="43" y="72" width="34" height="38" rx="6" fill="${getColor('Core')}" />
        <rect x="40" y="114" width="17" height="84" rx="7" fill="${getColor('Tren Inferior')}" />
        <rect x="63" y="114" width="17" height="84" rx="7" fill="${getColor('Tren Inferior')}" />
      </svg>

      <div style="flex:1; display:flex; flex-direction:column; gap:7px;">
        ${Object.keys(recoveryMap).map(grp => {
          const pct = recoveryMap[grp];
          const barColor = pct >= 80 ? 'var(--accent-green)' : pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';
          return `
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:2px;">
                <span style="font-weight:600;">${escapeHTML(grp)}</span>
                <span style="font-family:var(--font-mono); color:${barColor}; font-weight:700;">${pct}% · ${recoveryLabel(pct)}</span>
              </div>
              <div style="height:5px; background:var(--surface-2); border-radius:99px; overflow:hidden;">
                <div style="height:100%; width:${pct}%; background:${barColor}; border-radius:99px;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// =====================================================================
// CONSTRUCTOR LIBRE DE RUEDAS
// =====================================================================
function openWheelEditorModal() {
  const profile = UserStore.getActiveProfile();
  let modal = document.getElementById('wheel-editor-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'wheel-editor-modal';
    modal.className = 'modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.dataset.closable = 'true';
    document.body.appendChild(modal);
  }

  const availableExercises = EXERCISE_CATALOG.filter(e => !profile.blacklist.includes(e.id));

  let html = `
    <div class="modal-card" style="max-width: 640px; max-height: 90vh; overflow-y: auto;" tabindex="-1">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <span class="badge" style="color:var(--accent-blue); border-color:var(--accent-blue);">Constructor de Ciclos</span>
        <button class="btn btn-ghost" style="padding:4px 9px;" data-action="close-modal" data-id="wheel-editor-modal">✕</button>
      </div>
      <h2 style="font-size:1.35rem; font-weight:800; margin-bottom:6px;">Editar Rueda de Entrenamiento</h2>
      <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:16px;">
        Configura cuántos días tiene tu ciclo rotativo, edita sus bloques y elige cualquier ejercicio del catálogo.
      </p>
  `;

  profile.wheel.forEach((routine, rIdx) => {
    html += `
      <div style="background:var(--surface-2); border:1px solid var(--border-strong); border-radius:12px; padding:14px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:10px;">
          <input type="text" class="form-input" style="font-weight:800; font-size:0.98rem; padding:7px 10px;" value="${escapeHTML(routine.name)}" data-on-input="edit-routine-name" data-ridx="${rIdx}">
          ${profile.wheel.length > 1 ? `<button class="btn btn-ghost" style="color:var(--accent-red); padding:6px 10px; flex-shrink:0;" data-action="delete-routine" data-ridx="${rIdx}">Eliminar</button>` : ''}
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          ${routine.blocks.map((block, bIdx) => `
            <div style="background:var(--bg-canvas); padding:10px; border-radius:8px; border:1px solid var(--border-subtle); font-size:0.82rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; color:var(--text-secondary); margin-bottom:8px; font-weight:700;">
                <span>${escapeHTML(block.title)}</span>
                <div style="display:flex; align-items:center; gap:6px;">
                  ${block.type !== 'interval' ? `
                    <button class="btn btn-ghost" style="padding:2px 7px; font-size:0.72rem;" data-action="change-block-sets" data-ridx="${rIdx}" data-bidx="${bIdx}" data-delta="-1">-</button>
                    <span style="font-family:var(--font-mono); color:var(--accent-green);">${block.sets} series</span>
                    <button class="btn btn-ghost" style="padding:2px 7px; font-size:0.72rem;" data-action="change-block-sets" data-ridx="${rIdx}" data-bidx="${bIdx}" data-delta="1">+</button>
                  ` : ''}
                  <button class="btn btn-ghost" style="padding:2px 7px; font-size:0.72rem; color:var(--accent-red);" data-action="delete-block" data-ridx="${rIdx}" data-bidx="${bIdx}">✕</button>
                </div>
              </div>

              ${block.type === 'interval' ? `<div style="color:var(--accent-amber);">🔥 ${escapeHTML(block.cue)}</div>` : block.exIds.map((id, exIdx) => `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin:5px 0;">
                  <select class="form-select" style="padding:6px 8px; font-size:0.8rem;" data-on-change="change-ex-wheel" data-ridx="${rIdx}" data-bidx="${bIdx}" data-expos="${exIdx}">
                    ${availableExercises.map(ex => `<option value="${ex.id}" ${ex.id === id ? 'selected' : ''}>#${ex.num} [${ex.group} · N${ex.level}] ${escapeHTML(ex.name)}</option>`).join('')}
                  </select>
                  <button class="btn btn-ghost" style="padding:5px 8px; font-size:0.72rem; flex-shrink:0;" data-action="remove-ex-wheel" data-ridx="${rIdx}" data-bidx="${bIdx}" data-expos="${exIdx}">✕</button>
                </div>
              `).join('')}

              ${block.type !== 'interval' ? `<button class="btn btn-ghost" style="width:100%; margin-top:8px; padding:5px; font-size:0.75rem; color:var(--accent-green);" data-action="add-ex-wheel" data-ridx="${rIdx}" data-bidx="${bIdx}">+ Añadir Ejercicio al Bloque</button>` : ''}
            </div>
          `).join('')}
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;">
          <button class="btn btn-ghost" style="padding:8px; font-size:0.78rem;" data-action="add-block" data-ridx="${rIdx}">+ Bloque Fuerza</button>
          <button class="btn btn-ghost" style="padding:8px; font-size:0.78rem; color:var(--accent-amber);" data-action="add-interval-block" data-ridx="${rIdx}">+ Finisher Tabata</button>
        </div>
      </div>
    `;
  });

  html += `
      <button class="btn btn-ghost" style="width:100%; padding:12px; border:1px dashed var(--border-strong); color:var(--text-primary); margin-bottom:14px;" data-action="add-routine">
        + Añadir Nuevo Día a la Rueda
      </button>
      <button class="btn btn-emerald" style="width:100%;" data-action="close-modal" data-id="wheel-editor-modal">Listo y Guardar</button>
    </div>
  `;
  modal.innerHTML = html;
}

// =====================================================================
// GENERADOR DE IMAGEN PNG COMPARTIBLE
// =====================================================================
function generateShareableImage(sessionData, profile) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  const grd = ctx.createLinearGradient(0, 0, 0, 1080);
  grd.addColorStop(0, '#07090C');
  grd.addColorStop(1, '#053120');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 1080, 1080);

  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 1080; i += 120) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1080); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke();
  }

  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('KINETIC PRO · ATHLETE OS', 80, 100);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 84px sans-serif';
  const rName = sessionData.routineName.split('·')[0].trim().toUpperCase();
  ctx.fillText(rName, 80, 230);

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(`ATLETA: ${profile.name.toUpperCase()} · ${profile.weightKg} KG`, 80, 300);

  const drawBox = (x, y, w, h) => {
    ctx.fillStyle = '#10141B';
    ctx.strokeStyle = 'rgba(16,185,129,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 20);
    else ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();
  };

  drawBox(80, 390, 440, 210);
  drawBox(550, 390, 450, 210);

  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 72px monospace';
  ctx.fillText(`${(sessionData.tonnageKg || 0).toLocaleString()} kg`, 115, 495);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 26px sans-serif';
  ctx.fillText('TONELAJE CORPORAL', 115, 550);

  const mins = Math.max(1, Math.round((sessionData.durationSec || 60) / 60));
  ctx.fillStyle = '#F59E0B';
  ctx.font = 'bold 72px monospace';
  ctx.fillText(`${mins} min`, 585, 495);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 26px sans-serif';
  ctx.fillText('DURACIÓN SESIÓN', 585, 550);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('EJERCICIOS COMPLETADOS', 80, 700);

  let yPos = 765;
  ctx.font = '500 30px sans-serif';
  Object.values(sessionData.exercises || {}).slice(0, 5).forEach(ex => {
    ctx.fillStyle = '#10B981';
    ctx.fillText('✓', 80, yPos);
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(`${ex.name.substring(0, 38)} (Max: ${ex.bestValue}${ex.metric === 'seconds' ? 's' : ''})`, 130, yPos);
    yPos += 54;
  });

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(new Date(sessionData.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }), 80, 1020);

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `Kinetic-Pro-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// =====================================================================
// MODALES POST-SESIÓN Y PROMOCIÓN DE NIVEL
// =====================================================================
function openSessionSummaryModal(sessionData, promotions) {
  uiState.lastCompletedSession = sessionData;
  let modal = document.getElementById('summary-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'summary-modal';
    modal.className = 'modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.dataset.closable = 'true';
    document.body.appendChild(modal);
  }

  const mins = Math.max(1, Math.round((sessionData.durationSec || 60) / 60));

  modal.innerHTML = `
    <div class="modal-card" style="max-width: 480px;" tabindex="-1">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span class="badge">✓ Sesión Registrada</span>
        <button class="btn btn-ghost" style="padding:4px 9px;" data-action="close-modal" data-id="summary-modal">✕</button>
      </div>
      <h2 style="font-size:1.4rem; font-weight:800; margin-bottom:6px;">¡Entrenamiento Completado!</h2>
      <p style="font-size:0.84rem; color:var(--text-secondary); margin-bottom:16px;">
        La rueda ha girado al siguiente turno y el motor DPDA-4 ha recalculado tus próximas metas.
      </p>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
        <div style="background:var(--surface-2); padding:12px; border-radius:10px;">
          <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Tonelaje Movido</div>
          <div style="font-family:var(--font-mono); font-size:1.3rem; font-weight:800; color:var(--accent-green);">${sessionData.tonnageKg.toLocaleString()} kg</div>
        </div>
        <div style="background:var(--surface-2); padding:12px; border-radius:10px;">
          <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Duración</div>
          <div style="font-family:var(--font-mono); font-size:1.3rem; font-weight:800; color:var(--accent-amber);">${mins} min</div>
        </div>
      </div>

      ${promotions.length > 0 ? `
        <div style="margin-bottom:16px;">
          <div style="font-size:0.78rem; font-weight:800; color:var(--accent-amber); margin-bottom:8px;">★ ASCENSO DE NIVEL DESBLOQUEADO</div>
          ${promotions.map(p => `
            <div style="background:var(--surface-2); border:1px solid rgba(16,185,129,0.35); border-radius:10px; padding:10px; margin-bottom:6px;">
              <div style="font-size:0.74rem; color:var(--text-muted); text-decoration:line-through;">${escapeHTML(p.oldEx.name)}</div>
              <div style="font-size:0.9rem; font-weight:800; color:var(--accent-green); margin-top:3px;">→ ${escapeHTML(p.newEx.name)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="display:flex; flex-direction:column; gap:10px;">
        <button class="btn btn-ghost" style="width:100%; border-color:var(--accent-green); color:var(--accent-green);" data-action="download-share-png">
          📸 Descargar Tarjeta Resumen (PNG)
        </button>
        <button class="btn btn-emerald" style="width:100%;" data-action="close-modal" data-id="summary-modal">
          Volver al Panel →
        </button>
      </div>
    </div>
  `;
}

function openPromotionModal(promotions) {
  let modal = document.getElementById('promotion-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'promotion-modal';
    modal.className = 'modal-overlay';
    modal.dataset.closable = 'true';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card" style="max-width: 480px;" tabindex="-1">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <span class="badge" style="color:var(--accent-amber); border-color:var(--accent-amber);">★ Salto Biomecánico</span>
        <button class="btn btn-ghost" style="padding:4px 9px;" data-action="close-modal" data-id="promotion-modal">✕</button>
      </div>
      <h2 style="font-size:1.35rem; font-weight:800; margin-bottom:6px;">¡Has dominado el ejercicio!</h2>
      <p style="font-size:0.84rem; color:var(--text-secondary); margin-bottom:16px;">
        El motor DPDA-4 ha actualizado tu rueda al siguiente escalón de dificultad automáticamente.
      </p>
      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:18px;">
        ${promotions.map(p => `
          <div style="background:var(--surface-2); border:1px solid rgba(16,185,129,0.3); border-radius:10px; padding:12px;">
            <div style="font-size:0.75rem; color:var(--text-muted); text-decoration:line-through;">Dominado: ${escapeHTML(p.oldEx.name)}</div>
            <div style="font-size:0.95rem; font-weight:800; color:var(--accent-green); margin-top:4px;">→ Nuevo reto: ${escapeHTML(p.newEx.name)}</div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-emerald" style="width:100%;" data-action="close-modal" data-id="promotion-modal">Continuar Progreso →</button>
    </div>
  `;
}

// =====================================================================
// MODAL ONBOARDING BIOMÉTRICO CON CALIBRACIÓN
// =====================================================================
function openOnboardingModal(allowClose = true) {
  let modal = document.getElementById('onboarding-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'onboarding-modal';
    modal.className = 'modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    document.body.appendChild(modal);
  }
  modal.dataset.closable = allowClose ? 'true' : 'false';

  modal.innerHTML = `
    <div class="modal-card" style="max-width: 520px; max-height: 90vh; overflow-y: auto;" tabindex="-1">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <span class="badge">Perfil & Calibración</span>
        ${allowClose ? `<button class="btn btn-ghost" style="padding:4px 9px;" data-action="close-modal" data-id="onboarding-modal">✕</button>` : ''}
      </div>
      <h2 style="font-size:1.35rem; font-weight:800; margin-bottom:16px;">Calibración del Atleta</h2>

      <div class="form-group"><label class="form-label" for="ob-name">Nombre o Alias</label><input id="ob-name" class="form-input" placeholder="Ej. Alex Calistenia" maxlength="60"></div>
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px;">
        <div class="form-group"><label class="form-label" for="ob-weight">Peso (kg)</label><input id="ob-weight" type="number" class="form-input" value="75"></div>
        <div class="form-group"><label class="form-label" for="ob-height">Altura (cm)</label><input id="ob-height" type="number" class="form-input" value="176"></div>
        <div class="form-group"><label class="form-label" for="ob-age">Edad</label><input id="ob-age" type="number" class="form-input" value="28"></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="ob-level">Nivel Actual</label>
        <select id="ob-level" class="form-select">
          <option value="1">Nivel 1 · Principiante</option>
          <option value="2" selected>Nivel 2 · Intermedio</option>
          <option value="3">Nivel 3 · Avanzado / Élite</option>
        </select>
      </div>

      <div style="background:var(--surface-2); border-left:3px solid var(--accent-blue); padding:12px; margin:16px 0; border-radius:8px;">
        <label class="form-label" style="color:var(--text-primary);">Test de Fuerza Inicial (Reps Máximas Seguidas)</label>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:10px;">El algoritmo DPDA-4 calculará el 70% como punto de partida óptimo para tus series.</p>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <div><label for="ob-test-push" style="font-size:0.72rem; color:var(--text-secondary);">Flexiones (Empuje)</label><input id="ob-test-push" type="number" class="form-input" value="15"></div>
          <div><label for="ob-test-pull" style="font-size:0.72rem; color:var(--text-secondary);">Dominadas (Tirón)</label><input id="ob-test-pull" type="number" class="form-input" value="6"></div>
          <div><label for="ob-test-legs" style="font-size:0.72rem; color:var(--text-secondary);">Sentadillas (Pierna)</label><input id="ob-test-legs" type="number" class="form-input" value="25"></div>
          <div><label for="ob-test-core" style="font-size:0.72rem; color:var(--text-secondary);">Elev. Piernas (Core)</label><input id="ob-test-core" type="number" class="form-input" value="15"></div>
        </div>
      </div>

      <div class="form-group">
        <span class="form-label">Material Disponible</span>
        <div class="chip-grid" id="ob-equip-grid">
          ${['Suelo', 'Barra', 'Anillas', 'Paralelas', 'Rueda Ab', 'Banco/Cajón'].map(eq => `<button type="button" class="chip-toggle selected" data-action="toggle-equip-chip" data-eq="${escapeHTML(eq)}">✓ ${escapeHTML(eq)}</button>`).join('')}
        </div>
      </div>
      <button class="btn btn-emerald" style="width:100%; margin-top:10px;" data-action="submit-onboarding">Generar Plan y Entrar →</button>
    </div>
  `;
}

function submitOnboarding() {
  const name = document.getElementById('ob-name').value;
  const equipment = Array.from(document.querySelectorAll('#ob-equip-grid .chip-toggle.selected')).map(b => b.dataset.eq);
  const calibration = {
    push: document.getElementById('ob-test-push').value,
    pull: document.getElementById('ob-test-pull').value,
    legs: document.getElementById('ob-test-legs').value,
    core: document.getElementById('ob-test-core').value
  };
  UserStore.createProfile({
    name,
    weightKg: document.getElementById('ob-weight').value,
    heightCm: document.getElementById('ob-height').value,
    age: document.getElementById('ob-age').value,
    level: document.getElementById('ob-level').value,
    equipment,
    calibration
  });
  closeModalById('onboarding-modal');
  render();
}

function toggleEquipChip(el) {
  el.classList.toggle('selected');
}

// =====================================================================
// VISTA 1: PANEL PRINCIPAL & RUEDA ASÍNCRONA
// =====================================================================
function skipWheelTurn() {
  const profile = UserStore.getActiveProfile();
  profile.wheelIndex = (profile.wheelIndex + 1) % profile.wheel.length;
  UserStore.save();
  render();
}

function renderTrainTab() {
  const profile = UserStore.getActiveProfile();
  if (profile.wheelIndex >= profile.wheel.length) profile.wheelIndex = 0;
  const routine = profile.wheel[profile.wheelIndex];
  const recoveryMap = computeMuscleRecovery(profile);
  const bmi = (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1);

  document.getElementById('app-header').innerHTML = `
    <div>
      <div class="topbar-title">Hola, ${escapeHTML(profile.name)}</div>
      <div class="topbar-sub">${profile.weightKg} kg · ${profile.heightCm} cm · IMC ${bmi} · Nivel ${profile.level}</div>
    </div>
    <button class="btn btn-ghost" data-action="open-onboarding">+ Atleta</button>
  `;

  let estTonnage = 0;
  const previewRows = routine.blocks.map(b => {
    if (b.type === 'interval') {
      return `<div style="display:flex; justify-content:space-between; padding:8px 0; border-top:1px solid var(--border-subtle); font-size:0.83rem;">
        <span>🔥 ${escapeHTML(b.cue)}</span>
        <span class="badge" style="color:var(--accent-amber);">${escapeHTML(b.label)}</span>
      </div>`;
    }
    return b.exIds.map(exId => {
      const ex = EXERCISE_BY_ID[exId];
      const presc = ProgressionEngine.getPrescription(profile, exId, b.sets);
      const totalReps = presc.targetReps.reduce((a, c) => a + c, 0);
      estTonnage += Math.round(totalReps * profile.weightKg * (ex ? ex.leverage : 0.7));
      const statusBadge = presc.phase === 'DESCARGA'
        ? '<span class="badge" style="color:var(--accent-blue); border-color:var(--accent-blue);">DESCARGA 📉</span>'
        : `<span class="badge" style="font-size:0.64rem;">Fase ${presc.phase}</span>`;
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 0; border-top:1px solid var(--border-subtle); font-size:0.83rem;">
          <div>
            <div style="font-weight:600;">${escapeHTML(ex ? ex.name : exId)}</div>
            <div style="font-size:0.72rem; color:var(--text-muted); font-family:var(--font-mono);">
              Meta: [${presc.targetReps.join('-')}] · Desc. ${presc.restSec}s
            </div>
          </div>
          ${statusBadge}
        </div>
      `;
    }).join('');
  }).join('');

  document.getElementById('app-container').innerHTML = `
    <div class="bento-grid">
      <div class="panel">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:12px;">
          <span class="badge">Turno ${profile.wheelIndex + 1}/${profile.wheel.length} · Sin Días Fijos</span>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-ghost" style="padding:5px 10px; font-size:0.75rem;" data-action="open-wheel-editor">⚙️ Configurar</button>
            <button class="btn btn-ghost" style="padding:5px 10px; font-size:0.75rem;" data-action="skip-wheel">Girar ↻</button>
          </div>
        </div>

        <h2 style="font-size:1.45rem; font-weight:800; margin-bottom:6px;">${escapeHTML(routine.name)}</h2>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px;">
          <span style="font-size:0.75rem; padding:4px 9px; border-radius:6px; background:var(--surface-2); color:var(--accent-green); font-family:var(--font-mono); font-weight:700;">
            Carga Corporal Est.: ${estTonnage.toLocaleString()} kg
          </span>
          <span style="font-size:0.75rem; padding:4px 9px; border-radius:6px; background:var(--surface-2); color:var(--text-secondary);">
            Sesiones completadas: ${profile.history.length}
          </span>
        </div>

        <div style="background:var(--surface-2); border-radius:12px; padding:12px 14px; margin-bottom:18px;">
          <div style="font-size:0.7rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; margin-bottom:4px;">
            Prescripción Algorítmica de Hoy
          </div>
          ${previewRows || '<div style="font-size:0.82rem; color:var(--text-secondary); padding:8px 0;">Esta sesión no tiene bloques todavía. Pulsa ⚙️ Configurar para añadir ejercicios.</div>'}
        </div>

        <button class="btn btn-emerald" style="width:100%;" data-action="start-workout">
          Iniciar Entrenamiento Guiado →
        </button>
      </div>

      <div style="display:flex; flex-direction:column; gap:18px;">
        <div class="panel">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <h3 style="font-size:0.98rem; font-weight:800;">Estado Muscular (${CONFIG.RECOVERY_WINDOW_HOURS}h)</h3>
            <span style="font-size:0.74rem; color:var(--text-secondary);">Recuperación</span>
          </div>
          ${buildAnatomySVG(recoveryMap)}
        </div>

        <div class="panel">
          <h3 style="font-size:0.95rem; font-weight:800; margin-bottom:6px;">Personalización Activa</h3>
          <p style="font-size:0.82rem; color:var(--text-secondary); line-height:1.5;">
            Tienes <strong>${profile.blacklist.length}</strong> ejercicios excluidos y <strong>${profile.favorites.length}</strong> favoritos en tu catálogo de ${EXERCISE_CATALOG.length} movimientos.
          </p>
          <button class="btn btn-ghost" style="width:100%; margin-top:12px;" data-action="switch-tab" data-tab="library">
            Gestionar Catálogo de ${EXERCISE_CATALOG.length} Ejercicios
          </button>
        </div>
      </div>
    </div>
  `;
}

// =====================================================================
// VISTA 2: CATÁLOGO DE 500 EJERCICIOS (FAVORITOS & EXCLUIDOS)
// =====================================================================
function toggleFavoriteEx(exId) {
  const profile = UserStore.getActiveProfile();
  const idx = profile.favorites.indexOf(exId);
  if (idx >= 0) profile.favorites.splice(idx, 1);
  else profile.favorites.push(exId);
  UserStore.save();
  renderLibraryTab();
}

function toggleBlacklistEx(exId) {
  const profile = UserStore.getActiveProfile();
  const idx = profile.blacklist.indexOf(exId);
  if (idx >= 0) {
    profile.blacklist.splice(idx, 1);
  } else {
    profile.blacklist.push(exId);
    profile.wheel.forEach(r => r.blocks.forEach(b => {
      if (b.exIds) {
        b.exIds = b.exIds.map(id => id === exId ? ProgressionEngine.findReplacement(profile, exId) : id);
      }
    }));
  }
  UserStore.save();
  renderLibraryTab();
}

function renderLibraryTab(preserveSearchFocus = false) {
  const activeId = document.activeElement ? document.activeElement.id : null;
  const caret = (activeId === 'lib-search-input' && document.activeElement.selectionStart !== undefined)
    ? document.activeElement.selectionStart
    : null;

  renderLibraryTabInner();

  if (preserveSearchFocus || activeId === 'lib-search-input') {
    const input = document.getElementById('lib-search-input');
    if (input) {
      input.focus();
      const pos = caret !== null ? caret : input.value.length;
      input.setSelectionRange(pos, pos);
    }
  }
}

function renderLibraryTabInner() {
  const profile = UserStore.getActiveProfile();
  document.getElementById('app-header').innerHTML = `
    <div>
      <div class="topbar-title">Catálogo Maestro (${EXERCISE_CATALOG.length} Ejercicios)</div>
      <div class="topbar-sub">Marca favoritos (★) o excluye (✕) los que no quieras entrenar</div>
    </div>
  `;

  const groups = ['Todos', 'Pectoral', 'Espalda', 'Hombros', 'Brazos', 'Tren Inferior', 'Core'];
  const filtered = EXERCISE_CATALOG.filter(ex => {
    if (uiState.libGroup !== 'Todos' && ex.group !== uiState.libGroup) return false;
    if (uiState.libLevel !== 'Todos' && ex.level !== parseInt(uiState.libLevel)) return false;
    if (uiState.libFilter === 'fav' && !profile.favorites.includes(ex.id)) return false;
    if (uiState.libFilter === 'excluded' && !profile.blacklist.includes(ex.id)) return false;
    if (uiState.libSearch && !ex.name.toLowerCase().includes(uiState.libSearch.toLowerCase())) return false;
    return true;
  });

  document.getElementById('app-container').innerHTML = `
    <div class="panel" style="margin-bottom:16px;">
      <div style="display:grid; grid-template-columns: 1fr auto auto; gap:10px; margin-bottom:12px;">
        <label class="sr-only" for="lib-search-input">Buscar ejercicio</label>
        <input id="lib-search-input" class="form-input" placeholder="Buscar entre los ${EXERCISE_CATALOG.length} ejercicios (ej. anillas, pistol, RTO)..." value="${escapeHTML(uiState.libSearch)}" data-on-input="lib-search">

        <label class="sr-only" for="lib-level-select">Filtrar por nivel</label>
        <select id="lib-level-select" class="form-select" style="width:auto;" data-on-change="lib-level">
          <option value="Todos" ${uiState.libLevel === 'Todos' ? 'selected' : ''}>Todos Niveles</option>
          <option value="1" ${uiState.libLevel === '1' ? 'selected' : ''}>Nivel 1 · Base</option>
          <option value="2" ${uiState.libLevel === '2' ? 'selected' : ''}>Nivel 2 · Intermedio</option>
          <option value="3" ${uiState.libLevel === '3' ? 'selected' : ''}>Nivel 3 · Élite</option>
        </select>

        <label class="sr-only" for="lib-filter-select">Filtrar favoritos o excluidos</label>
        <select id="lib-filter-select" class="form-select" style="width:auto;" data-on-change="lib-filter">
          <option value="all" ${uiState.libFilter === 'all' ? 'selected' : ''}>Todos (${EXERCISE_CATALOG.length})</option>
          <option value="fav" ${uiState.libFilter === 'fav' ? 'selected' : ''}>★ Favoritos (${profile.favorites.length})</option>
          <option value="excluded" ${uiState.libFilter === 'excluded' ? 'selected' : ''}>✕ Excluidos (${profile.blacklist.length})</option>
        </select>
      </div>

      <div class="chip-grid" role="group" aria-label="Filtrar por grupo muscular">
        ${groups.map(g => `
          <button class="chip-toggle ${uiState.libGroup === g ? 'selected' : ''}" data-action="set-lib-group" data-group="${escapeHTML(g)}" aria-pressed="${uiState.libGroup === g}">${escapeHTML(g)}</button>
        `).join('')}
      </div>
    </div>

    <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:10px;" aria-live="polite">
      Mostrando <strong>${filtered.length}</strong> ejercicios
    </div>

    <div>
      ${filtered.slice(0, CONFIG.LIBRARY_PAGE_SIZE).map(ex => {
        const isFav = profile.favorites.includes(ex.id);
        const isExcl = profile.blacklist.includes(ex.id);
        return `
          <div class="lib-row ${isExcl ? 'excluded' : ''} ${isFav ? 'favorite' : ''}">
            <div>
              <div style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">
                #${ex.num} · ${escapeHTML(ex.group)} · Nivel ${ex.level} (${escapeHTML(ex.levelName)}) · ${escapeHTML(ex.equipment)}
              </div>
              <div style="font-weight:700; font-size:0.92rem; margin-top:2px;">${escapeHTML(ex.name)}</div>
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
              <button class="btn btn-ghost" style="padding:6px 10px; ${isFav ? 'color:var(--accent-amber); border-color:var(--accent-amber);' : ''}" data-action="toggle-favorite" data-id="${ex.id}">★</button>
              <button class="btn btn-ghost" style="padding:6px 10px; ${isExcl ? 'color:var(--accent-red); border-color:var(--accent-red);' : ''}" data-action="toggle-blacklist" data-id="${ex.id}">${isExcl ? 'Excluido' : '✕'}</button>
            </div>
          </div>
        `;
      }).join('')}
      ${filtered.length > CONFIG.LIBRARY_PAGE_SIZE ? `<p style="text-align:center; color:var(--text-muted); font-size:0.82rem; padding:14px;">Usa el buscador o los filtros superiores para acotar los ${filtered.length} resultados.</p>` : ''}
    </div>
  `;
}

// =====================================================================
// VISTA 3: CIENCIA DE SOBRECARGA PROGRESIVA (DPDA-4)
// =====================================================================
function buildExerciseProgressChartHTML(profile) {
  const exIdsWithHistory = Object.keys(profile.progressionState).filter(exId =>
    profile.history.some(h => h.exercises && h.exercises[exId])
  );

  if (exIdsWithHistory.length === 0) {
    return `
      <div style="margin-bottom:18px; padding:12px; background:var(--surface-2); border-radius:10px; font-size:0.82rem; color:var(--text-secondary);">
        Aún no hay histórico detallado por ejercicio. Se empezará a registrar automáticamente a partir de tu próxima sesión completada.
      </div>
    `;
  }

  const selectedId = exIdsWithHistory.includes(uiState.progressExerciseId)
    ? uiState.progressExerciseId
    : exIdsWithHistory[exIdsWithHistory.length - 1];
  uiState.progressExerciseId = selectedId;

  const ex = EXERCISE_BY_ID[selectedId];
  const unit = ex && ex.metric === 'seconds' ? 's' : ' reps';
  const sessionsWithThisEx = profile.history.filter(h => h.exercises && h.exercises[selectedId]);

  const points = sessionsWithThisEx.map(h => {
    const data = h.exercises[selectedId];
    const color = data.avgRPE >= CONFIG.RPE_HIGH_THRESHOLD ? 'var(--accent-red)'
      : data.avgRPE <= CONFIG.RPE_EASY_THRESHOLD ? 'var(--accent-green)'
      : 'var(--accent-amber)';
    return {
      y: data.avgValue,
      color,
      xLabel: new Date(h.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      label: `${new Date(h.date).toLocaleDateString('es-ES')} · ${data.avgValue}${unit} promedio · RPE ${data.avgRPE}`
    };
  });

  const p = profile.progressionState[selectedId];

  return `
    <div style="margin-bottom:18px;">
      <label class="form-label" for="progress-ex-select">Progreso histórico por ejercicio</label>
      <select id="progress-ex-select" class="form-select" style="margin-bottom:10px;" data-on-change="progress-exercise">
        ${exIdsWithHistory.map(id => `<option value="${id}" ${id === selectedId ? 'selected' : ''}>${escapeHTML(EXERCISE_BY_ID[id] ? EXERCISE_BY_ID[id].name : id)}</option>`).join('')}
      </select>

      ${points.length < 2
        ? `<p style="font-size:0.82rem; color:var(--text-secondary);">Completa al menos 2 sesiones de este ejercicio para ver su evolución.</p>`
        : `
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
            <span style="font-size:0.74rem; color:var(--text-secondary);">${buildTrendStat(points, unit)}</span>
            <span class="badge">Fase ${p.phase} · Mejor marca: ${p.bestSet}${unit}</span>
          </div>
          ${buildLineChartSVG(points, { ariaLabel: `Progreso de ${ex ? ex.name : selectedId}` })}
        `
      }
    </div>
  `;
}

function manualPromoteExercise(exId) {
  const profile = UserStore.getActiveProfile();
  const promo = ProgressionEngine.promoteExercise(profile, exId);
  if (!promo) {
    alert('Ya estás en el nivel máximo disponible para este patrón de movimiento.');
    return;
  }
  UserStore.save();
  SoundEngine.playFinish();
  openPromotionModal([promo]);
  renderScienceTab();
}

function renderScienceTab() {
  const profile = UserStore.getActiveProfile();
  document.getElementById('app-header').innerHTML = `
    <div>
      <div class="topbar-title">Motor de Sobrecarga DPDA-4</div>
      <div class="topbar-sub">Calibración Inicial, Progresión por RPE, Descargas y Saltos de Nivel</div>
    </div>
  `;

  const inWheelIds = new Set();
  profile.wheel.forEach(r => r.blocks.forEach(b => {
    if (b.exIds) b.exIds.forEach(id => inWheelIds.add(id));
  }));

  const trackedIds = Object.keys(profile.progressionState);

  document.getElementById('app-container').innerHTML = `
    <div class="bento-grid">
      <div class="panel">
        <span class="badge" style="margin-bottom:10px;">Metodología Sin Lastre</span>
        <h2 style="font-size:1.3rem; font-weight:800; margin-bottom:12px;">Cómo progresas en cada sesión</h2>

        <div style="display:flex; flex-direction:column; gap:12px; font-size:0.86rem; color:var(--text-secondary); line-height:1.5;">
          <div style="padding:12px; background:var(--surface-2); border-radius:10px; border-left:3px solid var(--accent-green);">
            <strong style="color:var(--text-primary);">Fase 1 · Escalada de Volumen Calibrada</strong><br>
            Parte del 70% de tu test inicial y suma <strong>+1 rep</strong> en las series más bajas si tu RPE fue 8, o <strong>+2 reps</strong> si fue RPE ≤ ${CONFIG.RPE_EASY_THRESHOLD}.
          </div>

          <div style="padding:12px; background:var(--surface-2); border-radius:10px; border-left:3px solid var(--accent-amber);">
            <strong style="color:var(--text-primary);">Fase 2 · Compresión de Densidad (${CONFIG.REST_DEFAULT_SEC}s → ${CONFIG.REST_MIN_SEC}s)</strong><br>
            Al alcanzar el techo de repeticiones, mantiene las repeticiones y recorta el descanso <strong>-${CONFIG.REST_STEP_SEC}s por ciclo</strong> hasta llegar a ${CONFIG.REST_MIN_SEC}s.
          </div>

          <div style="padding:12px; background:var(--surface-2); border-radius:10px; border-left:3px solid var(--accent-blue);">
            <strong style="color:var(--text-primary);">Fase 3 & Descargas Automáticas (Deloads)</strong><br>
            Si encadenas 2 sesiones al límite (RPE ≥ ${CONFIG.RPE_HIGH_THRESHOLD}), se activa una <strong>Descarga al 60%</strong> para supercompensar. Al superar el techo con 45s de descanso, asciendes al siguiente ejercicio del catálogo.
          </div>
        </div>
      </div>

      <div class="panel">
        ${buildExerciseProgressChartHTML(profile)}
        <h3 style="font-size:1.05rem; font-weight:800; margin-bottom:12px;">Estado Actual de tus Ejercicios</h3>
        ${trackedIds.length === 0 ? `<p style="font-size:0.85rem; color:var(--text-secondary);">Completa tu primera sesión para activar el seguimiento algorítmico.</p>` : trackedIds.map(id => {
          const ex = EXERCISE_BY_ID[id];
          const p = profile.progressionState[id];
          if (!ex) return '';
          const canManualPromote = p.phase === 3 && inWheelIds.has(id);
          return `
            <div style="padding:12px 0; border-top:1px solid var(--border-subtle);">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <strong style="font-size:0.9rem;">${escapeHTML(ex.name)}</strong>
                <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                  <span class="badge">${p.phase === 'DESCARGA' ? 'Descarga 📉' : `Fase ${p.phase}`}</span>
                  ${canManualPromote ? `<button class="btn btn-emerald" style="padding:4px 9px; font-size:0.72rem;" data-action="manual-promote" data-id="${id}">Subir Nivel ↑</button>` : ''}
                </div>
              </div>
              <div style="font-size:0.78rem; color:var(--text-secondary); font-family:var(--font-mono); margin-top:4px;">
                Próxima meta: [${p.targetReps.join('-')}] · Descanso: ${p.restSec}s · Último RPE: ${p.lastRPE}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// =====================================================================
// VISTA 4: MÉTRICAS, PERFILES MULTI-ATLETA, NUBE Y EXPORTACIÓN
// =====================================================================
function exportProfileJSON() {
  const profile = UserStore.getActiveProfile();
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kinetic-${profile.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function handleImportProfileJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!isValidProfileShape(imported)) {
        alert('El archivo no tiene el formato de un perfil válido de Kinetic Pro.');
        return;
      }
      UserStore.data.profiles[imported.id] = imported;
      UserStore.data.activeProfileId = imported.id;
      UserStore.save();
      render();
    } catch (err) {
      alert('Archivo JSON no válido.');
    }
  };
  reader.onerror = () => alert('No se pudo leer el archivo.');
  reader.readAsText(file);
  event.target.value = '';
}

function buildTonnageChartHTML(profile) {
  if (profile.history.length < 2) {
    return `<p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:16px;">Completa al menos 2 sesiones para ver tu gráfica de progreso de tonelaje.</p>`;
  }
  const points = profile.history.map(h => ({
    y: h.tonnageKg || 0,
    xLabel: new Date(h.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
    label: `${new Date(h.date).toLocaleDateString('es-ES')} · ${(h.tonnageKg || 0).toLocaleString()} kg`
  }));
  return `
    <div style="margin-bottom:18px;">
      <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;">
        <h4 style="font-size:0.88rem; font-weight:700;">Progreso de Tonelaje por Sesión</h4>
        <span style="font-size:0.74rem; color:var(--text-secondary);">${buildTrendStat(points, ' kg')}</span>
      </div>
      ${buildLineChartSVG(points, { lineColor: 'var(--accent-green)', ariaLabel: 'Tonelaje corporal movido por sesión' })}
    </div>
  `;
}

function renderStatsTab() {
  const profile = UserStore.getActiveProfile();
  const allProfiles = Object.values(UserStore.data.profiles);
  const totalTonnage = profile.history.reduce((acc, h) => acc + (h.tonnageKg || 0), 0);

  document.getElementById('app-header').innerHTML = `
    <div>
      <div class="topbar-title">Perfil de Atleta & Métricas</div>
      <div class="topbar-sub">Gestión multi-usuario, nube y exportación de datos</div>
    </div>
    <div style="display:flex; gap:8px;">
      <button class="btn btn-ghost" style="border-color:var(--accent-green); color:var(--accent-green);" data-action="open-cloud-modal">☁️ Nube</button>
      <button class="btn btn-ghost" data-action="import-profile">Importar</button>
      <button class="btn btn-ghost" data-action="export-profile">Exportar</button>
    </div>
  `;

  document.getElementById('app-container').innerHTML = `
    <div class="bento-grid">
      <div class="panel">
        <h3 style="font-size:1rem; font-weight:800; margin-bottom:12px;">Cambiar o Crear Atleta</h3>
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;" role="list">
          ${allProfiles.map(p => `
            <button type="button" role="listitem" style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-radius:10px; background:var(--surface-2); border:1px solid ${p.id === profile.id ? 'var(--accent-green)' : 'var(--border-subtle)'}; cursor:pointer; width:100%; text-align:left; color:inherit; font:inherit;" data-action="switch-profile" data-id="${p.id}">
              <div>
                <div style="font-weight:700;">${escapeHTML(p.name)} ${p.id === profile.id ? '●' : ''}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary);">${p.weightKg} kg · ${p.heightCm} cm · Nivel ${p.level} · ${p.history.length} sesiones</div>
              </div>
              <span class="badge">${p.id === profile.id ? 'Activo' : 'Cambiar'}</span>
            </button>
          `).join('')}
        </div>
        <button class="btn btn-emerald" style="width:100%;" data-action="open-onboarding">
          + Añadir Nuevo Atleta
        </button>
      </div>

      <div class="panel">
        <h3 style="font-size:1rem; font-weight:800; margin-bottom:12px;">Rendimiento Acumulado (${escapeHTML(profile.name)})</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
          <div style="background:var(--surface-2); padding:14px; border-radius:10px;">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Tonelaje Corporal Movido</div>
            <div style="font-family:var(--font-mono); font-size:1.4rem; font-weight:800; color:var(--accent-green); margin-top:4px;">${totalTonnage.toLocaleString()} kg</div>
          </div>
          <div style="background:var(--surface-2); padding:14px; border-radius:10px;">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Sesiones Completadas</div>
            <div style="font-family:var(--font-mono); font-size:1.4rem; font-weight:800; margin-top:4px;">${profile.history.length}</div>
          </div>
        </div>

        ${buildTonnageChartHTML(profile)}

        <h4 style="font-size:0.88rem; font-weight:700; margin-bottom:8px;">Historial Reciente</h4>
        ${profile.history.length === 0 ? `<p style="font-size:0.84rem; color:var(--text-secondary);">Aún no has completado sesiones con este perfil.</p>` : [...profile.history].reverse().map(h => `
          <div style="display:flex; justify-content:space-between; padding:9px 0; border-top:1px solid var(--border-subtle); font-size:0.84rem;">
            <div>
              <div style="font-weight:700;">${escapeHTML(h.routineName)}</div>
              <div style="font-size:0.74rem; color:var(--text-secondary);">${new Date(h.date).toLocaleDateString('es-ES')} · ${(h.tonnageKg || 0).toLocaleString()} kg movidos</div>
            </div>
            <span style="color:var(--accent-green); font-weight:700;">✓</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// =====================================================================
// SALA DE ENTRENAMIENTO EN VIVO (CON WAKE LOCK, NOTAS Y TABATA/EMOM)
// =====================================================================
function startWorkoutSession() {
  SoundEngine.init();
  if (typeof WakeLockManager !== 'undefined') WakeLockManager.enable();

  const profile = UserStore.getActiveProfile();
  const routine = profile.wheel[profile.wheelIndex];

  uiState.activeSession = {
    routineId: routine.id,
    routineName: routine.name,
    blocks: JSON.parse(JSON.stringify(routine.blocks)),
    setsData: {}
  };

  uiState.activeSession.blocks.forEach(block => {
    if (block.type === 'interval') return;
    block.exIds.forEach(exId => {
      const presc = ProgressionEngine.getPrescription(profile, exId, block.sets);
      uiState.activeSession.setsData[exId] = presc.targetReps.map((tVal, idx) => ({
        target: tVal,
        value: tVal,
        rpe: 8,
        completed: false,
        restAfter: idx === block.sets - 1 ? presc.restSec : CONFIG.REST_BETWEEN_SETS_SEC
      }));
    });
  });

  uiState.inWorkout = true;
  SessionClock.start();
  document.getElementById('bottom-nav').classList.add('hidden');
  render();
  window.scrollTo(0, 0);
}

function finishWorkoutSession() {
  const profile = UserStore.getActiveProfile();
  let completedCount = 0;
  let tonnageKg = 0;
  const muscleLoads = {};
  const exercisesSummary = {};
  const promotions = [];

  Object.keys(uiState.activeSession.setsData).forEach(exId => {
    const sets = uiState.activeSession.setsData[exId].filter(s => s.completed);
    if (sets.length > 0) {
      completedCount += sets.length;
      const ex = EXERCISE_BY_ID[exId];
      const evalResult = ProgressionEngine.evaluateSession(profile, exId, sets);
      if (evalResult.status === 'DOMINADO ★') {
        const promo = ProgressionEngine.promoteExercise(profile, exId);
        if (promo) promotions.push(promo);
      }
      const repsSum = sets.reduce((a, b) => a + b.value, 0);
      const avgRpe = sets.reduce((a, b) => a + b.rpe, 0) / sets.length;
      if (ex) {
        tonnageKg += Math.round(repsSum * profile.weightKg * ex.leverage);
        muscleLoads[ex.group] = (muscleLoads[ex.group] || 0) + (sets.length * (avgRpe / 8) * 14);
      }
      exercisesSummary[exId] = {
        name: ex ? ex.name : exId,
        metric: ex ? ex.metric : 'reps',
        avgValue: +(repsSum / sets.length).toFixed(1),
        bestValue: Math.max(...sets.map(s => s.value)),
        avgRPE: +avgRpe.toFixed(1)
      };
    }
  });

  let savedSession = null;
  if (completedCount === 0) {
    if (!confirm('No has marcado ninguna serie. ¿Salir sin guardar?')) return;
  } else {
    savedSession = {
      routineId: uiState.activeSession.routineId,
      routineName: uiState.activeSession.routineName,
      tonnageKg,
      muscleLoads,
      exercises: exercisesSummary,
      durationSec: SessionClock.seconds,
      date: new Date().toISOString()
    };
    profile.history.push(savedSession);
    profile.wheelIndex = (profile.wheelIndex + 1) % profile.wheel.length;
    UserStore.save();
  }

  SessionClock.stop();
  RestTimer.stop(true);
  if (typeof WakeLockManager !== 'undefined') WakeLockManager.release();

  uiState.inWorkout = false;
  document.getElementById('bottom-nav').classList.remove('hidden');
  switchTab('train');

  if (savedSession) {
    SoundEngine.playFinish();
    openSessionSummaryModal(savedSession, promotions);
  }
}

function renderWorkout() {
  const sess = uiState.activeSession;
  const profile = UserStore.getActiveProfile();

  document.getElementById('app-header').innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <button class="btn btn-ghost" style="padding:7px 11px;" data-action="cancel-workout" aria-label="Cancelar sesión">✕</button>
      <div>
        <div class="topbar-title">${escapeHTML(sess.routineName)}</div>
        <div class="topbar-sub">Crono: <span id="session-elapsed" style="font-family:var(--font-mono); color:var(--accent-green); font-weight:700;">${SessionClock.format(SessionClock.seconds)}</span></div>
      </div>
    </div>
    <button class="btn btn-emerald" style="padding:9px 16px; font-size:0.86rem;" data-action="finish-workout">Guardar y Terminar ✓</button>
  `;

  let html = '';
  sess.blocks.forEach((block, bIdx) => {
    html += `<div style="font-size:0.84rem; font-weight:800; color:var(--accent-amber); text-transform:uppercase; margin:20px 0 10px;">${escapeHTML(block.title)}</div>`;

    if (block.type === 'interval') {
      const key = `${sess.routineId}_block${bIdx}`;
      html += `
        <div class="panel" style="border-left:3px solid var(--accent-amber); margin-bottom:14px;">
          <div style="font-weight:800; margin-bottom:8px;">${escapeHTML(block.cue)}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface-2); padding:12px; border-radius:10px;">
            <div>
              <div id="tabata-phase" style="font-size:0.72rem; font-weight:700; color:var(--text-secondary);">RONDA 1/${block.rounds} · TRABAJO</div>
              <div id="tabata-clock" style="font-family:var(--font-mono); font-size:2rem; font-weight:800; color:var(--accent-green);" aria-live="polite">${block.workSec}s</div>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-ghost" data-action="tabata-reset" data-key="${key}" data-work="${block.workSec}" data-rest="${block.restSec}" data-rounds="${block.rounds}" data-label="${escapeHTML(block.label)}">Reset</button>
              <button id="tabata-btn" class="btn btn-emerald" style="padding:10px 14px;" data-action="tabata-toggle" data-key="${key}" data-work="${block.workSec}" data-rest="${block.restSec}" data-rounds="${block.rounds}" data-label="${escapeHTML(block.label)}">Iniciar ${escapeHTML(block.label)}</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    block.exIds.forEach((exId, exPos) => {
      const ex = EXERCISE_BY_ID[exId];
      const presc = ProgressionEngine.getPrescription(profile, exId, block.sets);
      const sets = sess.setsData[exId];

      html += `
        <div class="panel" style="margin-bottom:14px; padding:16px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
            <div>
              <span class="badge" style="margin-bottom:6px;">#${ex.num} · ${escapeHTML(ex.group)} · ${escapeHTML(ex.equipment)}</span>
              <div style="font-size:1.05rem; font-weight:800;">${escapeHTML(ex.name)}</div>
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
              <button class="btn btn-ghost" style="padding:6px 9px; font-size:0.74rem;" data-action="swap-exercise" data-block-idx="${bIdx}" data-ex-pos="${exPos}" data-ex-id="${exId}" data-exclude="false" title="Cambiar solo hoy">↻ Cambiar</button>
              <button class="btn btn-ghost" style="padding:6px 9px; font-size:0.74rem; color:var(--accent-red);" data-action="swap-exercise" data-block-idx="${bIdx}" data-ex-pos="${exPos}" data-ex-id="${exId}" data-exclude="true" title="Excluir para siempre">✕ No hacer</button>
            </div>
          </div>

          <input type="text" class="form-input" style="height:34px; font-size:0.78rem; margin:10px 0; background:var(--bg-canvas);" placeholder="Nota técnica o de montaje (ej. Anillas en marca 4, pies en cajón...)" value="${escapeHTML(presc.notes || '')}" data-on-input="save-notes" data-exid="${exId}">

          <div class="dpda-banner" style="${presc.phase === 'DESCARGA' ? 'border-color:var(--accent-blue); background:rgba(56,189,248,0.1);' : ''}">
            <span>🧬 <strong>DPDA-4 ${presc.phase === 'DESCARGA' ? 'Descarga 📉' : `Fase ${presc.phase}`}:</strong> [${presc.targetReps.join('-')}]</span>
            <span style="font-family:var(--font-mono); color:var(--accent-amber);">Descanso: ${presc.restSec}s</span>
          </div>

          <div class="set-grid-header">
            <div style="text-align:center;">Set</div>
            <div>Meta</div>
            <div style="text-align:center;">Marca</div>
            <div style="text-align:center;">RPE</div>
            <div style="text-align:center;">OK</div>
          </div>
      `;

      sets.forEach((s, idx) => {
        const unit = ex.metric === 'seconds' ? 's' : '';
        const rpeLabel = s.rpe === 10 ? 'FALLO' : `RPE ${s.rpe}`;
        html += `
          <div class="set-row ${s.completed ? 'completed' : ''}">
            <div style="text-align:center; font-family:var(--font-mono); font-weight:700; color:var(--text-secondary);">${idx + 1}</div>
            <div style="font-family:var(--font-mono); font-size:0.8rem; color:var(--accent-green); font-weight:700;">${s.target}${unit}</div>
            <div class="stepper">
              ${ex.metric === 'seconds' ? `<button class="btn-step" style="width:28px; color:var(--accent-amber); font-size:0.75rem;" data-action="open-iso" data-ex-id="${exId}" data-ex-name="${escapeHTML(ex.name)}" data-idx="${idx}">⏱</button>` : ''}
              <button class="btn-step" data-action="change-set-val" data-ex-id="${exId}" data-idx="${idx}" data-delta="-1">-</button>
              <div class="val-box">${s.value}${unit}</div>
              <button class="btn-step" data-action="change-set-val" data-ex-id="${exId}" data-idx="${idx}" data-delta="1">+</button>
            </div>
            <button class="rpe-pill" data-rpe="${s.rpe}" data-action="cycle-rpe" data-ex-id="${exId}" data-idx="${idx}">${rpeLabel}</button>
            <button class="btn-check" data-action="toggle-set-done" data-ex-id="${exId}" data-idx="${idx}">✓</button>
          </div>
        `;
      });

      html += `</div>`;
    });
  });

  document.getElementById('app-container').innerHTML = html;
}

// =====================================================================
// RENDERIZADOR PRINCIPAL
// =====================================================================
function render() {
  const profile = UserStore.getActiveProfile();
  if (!profile) {
    document.getElementById('app-header').innerHTML = `<div class="topbar-title">KINETIC PRO</div>`;
    document.getElementById('app-container').innerHTML = '';
    openOnboardingModal(false);
    return;
  }

  const sideBox = document.getElementById('sidebar-athlete-box');
  if (sideBox) {
    sideBox.innerHTML = `
      <div style="font-weight:800; color:var(--text-primary);">${escapeHTML(profile.name)}</div>
      <div style="color:var(--text-secondary); margin-top:2px;">${profile.weightKg} kg · ${profile.heightCm} cm · Nivel ${profile.level}</div>
      <button class="btn btn-ghost" style="width:100%; margin-top:8px; padding:6px; font-size:0.74rem;" data-action="switch-tab" data-tab="stats">Cambiar Atleta</button>
    `;
  }

  if (uiState.inWorkout) {
    renderWorkout();
    return;
  }
  if (uiState.tab === 'library') renderLibraryTab();
  else if (uiState.tab === 'science') renderScienceTab();
  else if (uiState.tab === 'stats') renderStatsTab();
  else renderTrainTab();
}

// =====================================================================
// REGISTRO DE ACCIONES Y ARRANQUE
// =====================================================================
function registerActions() {
  ActionDispatcher.on('switch-tab', (el) => switchTab(el.dataset.tab));
  ActionDispatcher.on('open-onboarding', () => openOnboardingModal(true));
  ActionDispatcher.on('close-modal', (el) => { closeModalById(el.dataset.id); render(); });
  ActionDispatcher.on('submit-onboarding', () => submitOnboarding());
  ActionDispatcher.on('toggle-equip-chip', (el) => toggleEquipChip(el));
  ActionDispatcher.on('download-share-png', () => {
    if (uiState.lastCompletedSession) {
      generateShareableImage(uiState.lastCompletedSession, UserStore.getActiveProfile());
    }
  });

  // Constructor de Ruedas
  ActionDispatcher.on('open-wheel-editor', () => openWheelEditorModal());
  ActionDispatcher.on('add-routine', () => {
    const p = UserStore.getActiveProfile();
    p.wheel.push({
      id: 'r_' + Date.now(),
      shortName: `DÍA ${p.wheel.length + 1}`,
      name: `Día ${p.wheel.length + 1} · Personalizado`,
      focus: 'Mixto',
      muscles: ['Pectoral', 'Espalda'],
      blocks: [{ title: 'Bloque A · Fuerza', type: 'superset', sets: 3, exIds: [EXERCISE_CATALOG[0].id] }]
    });
    UserStore.save();
    openWheelEditorModal();
  });
  ActionDispatcher.on('delete-routine', (el) => {
    const p = UserStore.getActiveProfile();
    if (p.wheel.length <= 1) return;
    p.wheel.splice(parseInt(el.dataset.ridx), 1);
    if (p.wheelIndex >= p.wheel.length) p.wheelIndex = 0;
    UserStore.save();
    openWheelEditorModal();
  });
  ActionDispatcher.on('add-block', (el) => {
    const p = UserStore.getActiveProfile();
    const r = p.wheel[parseInt(el.dataset.ridx)];
    r.blocks.push({ title: `Bloque ${r.blocks.length + 1} · Fuerza`, type: 'superset', sets: 3, exIds: [EXERCISE_CATALOG[0].id] });
    UserStore.save();
    openWheelEditorModal();
  });
  ActionDispatcher.on('add-interval-block', (el) => {
    const p = UserStore.getActiveProfile();
    const r = p.wheel[parseInt(el.dataset.ridx)];
    r.blocks.push({
      id: 'fin_' + Date.now(),
      title: 'Finisher Metabólico · Tabata (4 min)',
      type: 'interval',
      label: 'Tabata',
      workSec: 20,
      restSec: 10,
      rounds: 8,
      cue: 'Trabajo explosivo · 20s trabajo / 10s descanso'
    });
    UserStore.save();
    openWheelEditorModal();
  });
  ActionDispatcher.on('delete-block', (el) => {
    UserStore.getActiveProfile().wheel[parseInt(el.dataset.ridx)].blocks.splice(parseInt(el.dataset.bidx), 1);
    UserStore.save();
    openWheelEditorModal();
  });
  ActionDispatcher.on('change-block-sets', (el) => {
    const block = UserStore.getActiveProfile().wheel[parseInt(el.dataset.ridx)].blocks[parseInt(el.dataset.bidx)];
    block.sets = clamp((block.sets || 3) + parseInt(el.dataset.delta), 1, 8);
    UserStore.save();
    openWheelEditorModal();
  });
  ActionDispatcher.on('add-ex-wheel', (el) => {
    const p = UserStore.getActiveProfile();
    p.wheel[parseInt(el.dataset.ridx)].blocks[parseInt(el.dataset.bidx)].exIds.push(EXERCISE_CATALOG[0].id);
    UserStore.save();
    openWheelEditorModal();
  });
  ActionDispatcher.on('change-ex-wheel', (el) => {
    const p = UserStore.getActiveProfile();
    p.wheel[parseInt(el.dataset.ridx)].blocks[parseInt(el.dataset.bidx)].exIds[parseInt(el.dataset.expos)] = el.value;
    UserStore.save();
  });
  ActionDispatcher.on('remove-ex-wheel', (el) => {
    UserStore.getActiveProfile().wheel[parseInt(el.dataset.ridx)].blocks[parseInt(el.dataset.bidx)].exIds.splice(parseInt(el.dataset.expos), 1);
    UserStore.save();
    openWheelEditorModal();
  });
  ActionDispatcher.on('edit-routine-name', (el) => {
    UserStore.getActiveProfile().wheel[parseInt(el.dataset.ridx)].name = el.value;
    UserStore.save();
  });

  // Catálogo 500
  ActionDispatcher.on('toggle-favorite', (el) => toggleFavoriteEx(el.dataset.id));
  ActionDispatcher.on('toggle-blacklist', (el) => toggleBlacklistEx(el.dataset.id));
  ActionDispatcher.on('set-lib-group', (el) => { uiState.libGroup = el.dataset.group; renderLibraryTab(); });
  ActionDispatcher.on('lib-search', (el) => { uiState.libSearch = el.value; renderLibraryTab(true); });
  ActionDispatcher.on('lib-level', (el) => { uiState.libLevel = el.value; renderLibraryTab(); });
  ActionDispatcher.on('lib-filter', (el) => { uiState.libFilter = el.value; renderLibraryTab(); });

  // Sobrecarga y Perfiles
  ActionDispatcher.on('manual-promote', (el) => manualPromoteExercise(el.dataset.id));
  ActionDispatcher.on('progress-exercise', (el) => { uiState.progressExerciseId = el.value; renderScienceTab(); });
  ActionDispatcher.on('import-profile', () => document.getElementById('import-file-input').click());
  ActionDispatcher.on('export-profile', () => exportProfileJSON());
  ActionDispatcher.on('switch-profile', (el) => { UserStore.switchProfile(el.dataset.id); render(); });

  // Entrenamiento en vivo
  ActionDispatcher.on('skip-wheel', () => skipWheelTurn());
  ActionDispatcher.on('start-workout', () => startWorkoutSession());
  ActionDispatcher.on('cancel-workout', () => {
    if (confirm('¿Cancelar sesión? Se perderá el progreso de hoy.')) {
      SessionClock.stop();
      RestTimer.stop(true);
      if (typeof WakeLockManager !== 'undefined') WakeLockManager.release();
      uiState.inWorkout = false;
      document.getElementById('bottom-nav').classList.remove('hidden');
      render();
    }
  });
  ActionDispatcher.on('finish-workout', () => finishWorkoutSession());
  ActionDispatcher.on('save-notes', (el) => {
    const p = UserStore.getActiveProfile();
    const presc = ProgressionEngine.getPrescription(p, el.dataset.exid);
    presc.notes = el.value;
    UserStore.save();
  });

  ActionDispatcher.on('change-set-val', (el) => {
    const s = uiState.activeSession.setsData[el.dataset.exId][parseInt(el.dataset.idx)];
    s.value = Math.max(0, s.value + parseInt(el.dataset.delta));
    render();
  });
  ActionDispatcher.on('cycle-rpe', (el) => {
    const o = [7, 8, 9, 10];
    const s = uiState.activeSession.setsData[el.dataset.exId][parseInt(el.dataset.idx)];
    s.rpe = o[(o.indexOf(s.rpe) + 1) % o.length];
    render();
  });
  ActionDispatcher.on('toggle-set-done', (el) => {
    const s = uiState.activeSession.setsData[el.dataset.exId][parseInt(el.dataset.idx)];
    s.completed = !s.completed;
    if (s.completed) {
      SoundEngine.beep(987.77, 0.08);
      SoundEngine.vibrate([30]);
      RestTimer.start(s.restAfter);
    }
    render();
  });
  ActionDispatcher.on('open-iso', (el) => {
    IsoModal.open(el.dataset.exName, (sec) => {
      const s = uiState.activeSession.setsData[el.dataset.exId][parseInt(el.dataset.idx)];
      s.value = sec;
      if (!s.completed) s.completed = true;
      render();
    });
  });

  ActionDispatcher.on('swap-exercise', (el) => {
    const p = UserStore.getActiveProfile();
    const bIdx = parseInt(el.dataset.blockIdx);
    const exPos = parseInt(el.dataset.exPos);
    const oldId = el.dataset.exId;
    if (el.dataset.exclude === 'true' && !p.blacklist.includes(oldId)) p.blacklist.push(oldId);
    const newId = ProgressionEngine.findReplacement(p, oldId);
    if (newId === oldId) return alert('No hay más ejercicios alternativos disponibles.');

    uiState.activeSession.blocks[bIdx].exIds[exPos] = newId;
    p.wheel[p.wheelIndex].blocks[bIdx].exIds[exPos] = newId;
    UserStore.save();

    const presc = ProgressionEngine.getPrescription(p, newId, uiState.activeSession.blocks[bIdx].sets);
    uiState.activeSession.setsData[newId] = presc.targetReps.map((v, i) => ({
      target: v,
      value: v,
      rpe: 8,
      completed: false,
      restAfter: i === uiState.activeSession.blocks[bIdx].sets - 1 ? presc.restSec : CONFIG.REST_BETWEEN_SETS_SEC
    }));
    delete uiState.activeSession.setsData[oldId];
    render();
  });

  // Temporizadores
  ActionDispatcher.on('tabata-toggle', (el) => IntervalClock.toggle(el.dataset.key, parseInt(el.dataset.work), parseInt(el.dataset.rest), parseInt(el.dataset.rounds), el.dataset.label));
  ActionDispatcher.on('tabata-reset', (el) => IntervalClock.reset(el.dataset.key, parseInt(el.dataset.work), parseInt(el.dataset.rest), parseInt(el.dataset.rounds), el.dataset.label));
  ActionDispatcher.on('iso-cancel', () => IsoModal.cancel());
  ActionDispatcher.on('iso-finish', () => IsoModal.finish());
  ActionDispatcher.on('rest-adjust', (el) => RestTimer.adjust(parseInt(el.dataset.delta)));
  ActionDispatcher.on('rest-skip', () => RestTimer.stop(true));
}

registerActions();
ActionDispatcher.init();
document.getElementById('import-file-input').addEventListener('change', handleImportProfileJSON);
render();