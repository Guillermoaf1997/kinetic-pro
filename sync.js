// sync.js - Cloud Sync (Supabase Auth + PostgreSQL) y Screen Wake Lock API

const WakeLockManager = {
  sentinel: null,
  async enable() {
    if (!('wakeLock' in navigator)) return;
    try {
      this.sentinel = await navigator.wakeLock.request('screen');
    } catch (e) {}
  },
  async release() {
    if (this.sentinel) {
      try { await this.sentinel.release(); } catch (e) {}
      this.sentinel = null;
    }
  }
};

// Re-activar bloqueo de pantalla si el atleta vuelve a abrir la pestaña durante una sesión
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && typeof uiState !== 'undefined' && uiState.inWorkout) {
    WakeLockManager.enable();
  }
});

const CloudSync = {
  client: null,
  user: null,
  syncTimer: null,
  config: safeLocalStorageGet('kinetic_cloud_cfg', { url: '', anonKey: '' }),

  init() {
    if (this.config.url && this.config.anonKey && window.supabase) {
      try {
        this.client = window.supabase.createClient(this.config.url, this.config.anonKey);
        this.client.auth.getSession().then(({ data }) => {
          if (data && data.session) {
            this.user = data.session.user;
            this.pullProfiles();
          }
        });
      } catch (e) {
        console.error('[KineticPro] Error inicializando Supabase:', e);
      }
    }
  },

  saveCredentials(url, anonKey) {
    this.config = { url: url.trim(), anonKey: anonKey.trim() };
    safeLocalStorageSet('kinetic_cloud_cfg', this.config);
    this.init();
  },

  async signUpOrIn(email, password, isSignUp = false) {
    if (!this.client) return alert('Configura primero la URL y Anon Key de Supabase.');
    const res = isSignUp
      ? await this.client.auth.signUp({ email, password })
      : await this.client.auth.signInWithPassword({ email, password });

    if (res.error) {
      alert('Error de autenticación: ' + res.error.message);
      return false;
    }
    this.user = res.data.user;
    await this.pushAllProfiles();
    await this.pullProfiles();
    return true;
  },

  async signOut() {
    if (this.client) await this.client.auth.signOut();
    this.user = null;
  },

  schedulePush() {
    if (!this.client || !this.user) return;
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => this.pushAllProfiles(), 1200);
  },

  async pushAllProfiles() {
    if (!this.client || !this.user) return;
    const profiles = Object.values(UserStore.data.profiles);
    for (const p of profiles) {
      await this.client.from('kinetic_profiles').upsert({
        profile_id: p.id,
        user_id: this.user.id,
        profile_data: p,
        updated_at: new Date().toISOString()
      });
    }
  },

  async pullProfiles() {
    if (!this.client || !this.user) return;
    const { data, error } = await this.client.from('kinetic_profiles').select('*');
    if (error || !data) return;

    let updated = false;
    data.forEach((row) => {
      const remote = row.profile_data;
      if (isValidProfileShape(remote)) {
        const local = UserStore.data.profiles[remote.id];
        if (!local || (remote.history && remote.history.length >= (local.history ? local.history.length : 0))) {
          UserStore.data.profiles[remote.id] = remote;
          updated = true;
        }
      }
    });

    if (updated) {
      if (!UserStore.data.activeProfileId) {
        const ids = Object.keys(UserStore.data.profiles);
        if (ids.length) UserStore.data.activeProfileId = ids[0];
      }
      safeLocalStorageSet(CONFIG.STORAGE_KEY, UserStore.data);
      if (typeof render === 'function') render();
    }
  },

  openModal() {
    let modal = document.getElementById('cloud-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cloud-modal';
      modal.className = 'modal-overlay';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.dataset.closable = 'true';
      document.body.appendChild(modal);
    }

    const connected = Boolean(this.client && this.user);

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 480px;" tabindex="-1">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <span class="badge" style="color:${connected ? 'var(--accent-green)' : 'var(--accent-amber)'};">
            ${connected ? '☁️ Sincronizado' : '☁️ Nube Desconectada'}
          </span>
          <button class="btn btn-ghost" style="padding:4px 9px;" data-action="close-modal" data-id="cloud-modal">✕</button>
        </div>

        <h2 style="font-size:1.3rem; font-weight:800; margin-bottom:6px;">Sincronización Multi-Dispositivo</h2>
        <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:16px;">
          Conecta tu proyecto gratuito de Supabase para sincronizar tus rutinas y récords entre el ordenador y el móvil en tiempo real.
        </p>

        <div class="form-group">
          <label class="form-label" for="sb-url">Supabase Project URL</label>
          <input id="sb-url" class="form-input" placeholder="https://xxxx.supabase.co" value="${escapeHTML(this.config.url)}">
        </div>
        <div class="form-group">
          <label class="form-label" for="sb-key">Supabase Anon Public Key</label>
          <input id="sb-key" class="form-input" placeholder="eyJhbGciOi..." value="${escapeHTML(this.config.anonKey)}">
        </div>
        <button class="btn btn-ghost" style="width:100%; margin-bottom:16px;" data-action="save-sb-config">
          Guardar Credenciales del Servidor
        </button>

        ${connected ? `
          <div style="background:var(--surface-2); padding:12px; border-radius:10px; margin-bottom:14px; font-size:0.84rem;">
            Conectado como: <strong>${escapeHTML(this.user.email)}</strong>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <button class="btn btn-emerald" data-action="force-cloud-sync">Sincronizar Ahora ↻</button>
            <button class="btn btn-ghost" style="color:var(--accent-red);" data-action="sb-logout">Cerrar Sesión</button>
          </div>
        ` : `
          <div style="border-top:1px solid var(--border-subtle); padding-top:14px;">
            <div class="form-group">
              <label class="form-label" for="sb-email">Email del Atleta</label>
              <input id="sb-email" type="email" class="form-input" placeholder="atleta@email.com">
            </div>
            <div class="form-group">
              <label class="form-label" for="sb-pass">Contraseña (mín. 6 caracteres)</label>
              <input id="sb-pass" type="password" class="form-input" placeholder="••••••">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <button class="btn btn-emerald" data-action="sb-login">Entrar</button>
              <button class="btn btn-ghost" data-action="sb-signup">Crear Cuenta</button>
            </div>
          </div>
        `}
      </div>
    `;
  }
};

// Interceptar guardado local para disparar sincronización en segundo plano
const _originalUserStoreSave = UserStore.save.bind(UserStore);
UserStore.save = function () {
  const ok = _originalUserStoreSave();
  CloudSync.schedulePush();
  return ok;
};

// Registrar acciones de nube y activar Service Worker en hosting HTTPS
(function bootstrapCloudAndPWA() {
  ActionDispatcher.on('open-cloud-modal', () => CloudSync.openModal());
  ActionDispatcher.on('save-sb-config', () => {
    CloudSync.saveCredentials(document.getElementById('sb-url').value, document.getElementById('sb-key').value);
    CloudSync.openModal();
  });
  ActionDispatcher.on('sb-login', async () => {
    const ok = await CloudSync.signUpOrIn(document.getElementById('sb-email').value, document.getElementById('sb-pass').value, false);
    if (ok) CloudSync.openModal();
  });
  ActionDispatcher.on('sb-signup', async () => {
    const ok = await CloudSync.signUpOrIn(document.getElementById('sb-email').value, document.getElementById('sb-pass').value, true);
    if (ok) {
      alert('Cuenta creada y perfil sincronizado.');
      CloudSync.openModal();
    }
  });
  ActionDispatcher.on('force-cloud-sync', async () => {
    await CloudSync.pushAllProfiles();
    await CloudSync.pullProfiles();
    alert('Datos sincronizados con la nube.');
  });
  ActionDispatcher.on('sb-logout', async () => {
    await CloudSync.signOut();
    CloudSync.openModal();
  });

  CloudSync.init();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();