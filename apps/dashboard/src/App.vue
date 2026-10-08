<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  Activity, AlertTriangle, ArrowDownToLine, Bell, Check, ChevronDown, CircleHelp,
  CircleAlert, CircleCheck, CircleMinus, Clock3, Cpu, Flame, LayoutDashboard,
  LoaderCircle, LogOut, MapPin, Moon, RefreshCw, Search, Settings, ShieldCheck,
  Signal, Sun, Thermometer, Waves, X
} from 'lucide-vue-next';

type User = { id: string; email: string; displayName: string; avatarDataUrl: string | null };
type Reading = { id: string; type: string; value: number; unit: string; recordedAt: string };
type Device = {
  id: string;
  externalId: string;
  name: string;
  location: string | null;
  status: 'online' | 'offline' | 'warning';
  lastSeenAt: string;
  readings: Reading[];
};

const user = ref<User | null>(null);
const devices = ref<Device[]>([]);
const csrfToken = ref('');
const email = ref('');
const password = ref('');
const search = ref('');
const loginError = ref('');
const pageError = ref('');
const loading = ref(true);
const submitting = ref(false);
const loginMode = ref<'login' | 'forgot' | 'reset'>('login');
const forgotEmail = ref('');
const forgotMessage = ref('');
const forgotError = ref('');
const resetPasswordValue = ref('');
const resetPasswordConfirm = ref('');
const resetMessage = ref('');
const resetError = ref('');
const resetToken = ref('');
const settingsOpen = ref(false);
const darkMode = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const newPasswordConfirm = ref('');
const accountMessage = ref('');
const accountError = ref('');
const accountSaving = ref(false);
const profileName = ref('');
const profileEmail = ref('');
const profileAvatar = ref<string | null>(null);
const avatarError = ref('');
const refreshedAt = ref(new Date());
const activeMobileTab = ref('home');
const expandedDeviceIds = ref<string[]>([]);
const reportDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
let refreshTimer: ReturnType<typeof setInterval> | undefined;

const filteredDevices = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('pt-BR');
  if (!query) return devices.value;
  return devices.value.filter((device) =>
    `${device.name} ${device.externalId} ${device.location ?? ''}`.toLocaleLowerCase('pt-BR').includes(query)
  );
});
const onlineCount = computed(() => devices.value.filter((device) => device.status === 'online').length);
const warningCount = computed(() => devices.value.filter((device) => device.status === 'warning').length);
const offlineCount = computed(() => devices.value.filter((device) => device.status === 'offline').length);
const latestReadings = computed(() => devices.value.reduce((total, device) => total + device.readings.length, 0));

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? 'Nao foi possivel concluir a solicitacao.');
  }
  return response.json() as Promise<T>;
}

async function loadDevices() {
  if (!user.value) return;
  try {
    const result = await api<{ devices: Device[] }>('/api/devices');
    devices.value = result.devices;
    refreshedAt.value = new Date();
    pageError.value = '';
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Falha ao atualizar aparelhos.';
  }
}

async function checkSession() {
  try {
    const result = await api<{ user: User; csrfToken: string }>('/api/auth/me');
    user.value = result.user;
    csrfToken.value = result.csrfToken;
    syncProfileForm();
    await loadDevices();
  } catch {
    user.value = null;
  } finally {
    loading.value = false;
  }
}

async function login() {
  submitting.value = true;
  loginError.value = '';
  try {
    const result = await api<{ user: User; csrfToken: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, password: password.value })
    });
    user.value = result.user;
    csrfToken.value = result.csrfToken;
    password.value = '';
    await loadDevices();
  } catch (error) {
    loginError.value = error instanceof Error ? error.message : 'Falha ao entrar.';
  } finally {
    submitting.value = false;
  }
}

async function requestPasswordReset() {
  submitting.value = true;
  forgotError.value = '';
  forgotMessage.value = '';
  try {
    const result = await api<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: forgotEmail.value })
    });
    forgotMessage.value = result.message;
  } catch (error) {
    forgotError.value = error instanceof Error ? error.message : 'Nao foi possivel solicitar a redefinicao.';
  } finally {
    submitting.value = false;
  }
}

async function submitPasswordReset() {
  resetError.value = '';
  resetMessage.value = '';
  if (resetPasswordValue.value !== resetPasswordConfirm.value) {
    resetError.value = 'As senhas nao coincidem.';
    return;
  }
  submitting.value = true;
  try {
    const result = await api<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: resetToken.value, password: resetPasswordValue.value })
    });
    resetMessage.value = result.message;
    resetPasswordValue.value = '';
    resetPasswordConfirm.value = '';
    window.history.replaceState({}, '', window.location.pathname);
  } catch (error) {
    resetError.value = error instanceof Error ? error.message : 'Link invalido ou expirado.';
  } finally {
    submitting.value = false;
  }
}

function syncProfileForm() {
  if (!user.value) return;
  profileName.value = user.value.displayName;
  profileEmail.value = user.value.email;
  profileAvatar.value = user.value.avatarDataUrl;
}

function openSettings() {
  syncProfileForm();
  accountMessage.value = '';
  accountError.value = '';
  currentPassword.value = '';
  settingsOpen.value = true;
}

async function updateProfile() {
  if (!user.value) return;
  accountSaving.value = true;
  accountMessage.value = '';
  accountError.value = '';
  try {
    const result = await api<{ user: User }>('/api/account/profile', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({
        displayName: profileName.value,
        email: profileEmail.value,
        avatarDataUrl: profileAvatar.value,
        currentPassword: currentPassword.value
      })
    });
    user.value = result.user;
    accountMessage.value = 'Perfil atualizado.';
    currentPassword.value = '';
  } catch (error) {
    accountError.value = error instanceof Error ? error.message : 'Nao foi possivel atualizar o perfil.';
  } finally {
    accountSaving.value = false;
  }
}

async function updatePassword() {
  accountSaving.value = true;
  accountMessage.value = '';
  accountError.value = '';
  if (newPassword.value !== newPasswordConfirm.value) {
    accountError.value = 'As senhas nao coincidem.';
    accountSaving.value = false;
    return;
  }
  try {
    const result = await api<{ message: string }>('/api/account/password', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ currentPassword: currentPassword.value, newPassword: newPassword.value })
    });
    accountMessage.value = result.message;
    currentPassword.value = '';
    newPassword.value = '';
    newPasswordConfirm.value = '';
  } catch (error) {
    accountError.value = error instanceof Error ? error.message : 'Nao foi possivel alterar a senha.';
  } finally {
    accountSaving.value = false;
  }
}

async function selectAvatar(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  avatarError.value = '';
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
    avatarError.value = 'Escolha uma imagem JPG, PNG ou WebP de ate 8 MB.';
    input.value = '';
    return;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas indisponivel.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    profileAvatar.value = canvas.toDataURL('image/webp', 0.78);
  } catch {
    avatarError.value = 'Nao foi possivel processar essa imagem.';
  } finally {
    input.value = '';
  }
}

function toggleDarkMode() {
  darkMode.value = !darkMode.value;
  localStorage.setItem('lab-monitor-dark-mode', String(darkMode.value));
  document.documentElement.classList.toggle('dark-mode', darkMode.value);
}

async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken.value } });
  } finally {
    user.value = null;
    devices.value = [];
    csrfToken.value = '';
  }
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
function formatRefreshTime() {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(refreshedAt.value);
}
function exportList() {
  const columns = ['Aparelho', 'Identificador', 'Localizacao', 'Status', 'Ultima leitura'];
  const rows = filteredDevices.value.map((device) => [
    device.name,
    device.externalId,
    device.location ?? '',
    device.status,
    formatTime(device.lastSeenAt)
  ]);
  const csv = [columns, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'aparelhos-monitoramento.csv';
  link.click();
  URL.revokeObjectURL(url);
}
function readingIcon(type: string) {
  const normalizedType = type.toLocaleLowerCase('pt-BR');
  if (normalizedType.includes('temper')) return Thermometer;
  if (normalizedType.includes('umid')) return Waves;
  if (normalizedType.includes('gas') || normalizedType.includes('gás')) return Flame;
  return Activity;
}
function latestSensorReadings(readings: Reading[]) {
  const sensors = [
    { key: 'temperatura', name: 'Temperatura', shortName: 'Temp.', matches: (type: string) => type.includes('temper') },
    { key: 'umidade', name: 'Umidade', shortName: 'Umidade', matches: (type: string) => type.includes('umid') },
    { key: 'gas', name: 'Gás', shortName: 'Gás', matches: (type: string) => type.includes('gas') || type.includes('gás') }
  ];
  const normalizedReadings = readings.map((reading) => ({
    reading,
    type: reading.type.toLocaleLowerCase('pt-BR')
  }));

  return sensors.map((sensor) => {
    const latest = normalizedReadings
      .filter((item) => sensor.matches(item.type))
      .sort((a, b) => Date.parse(b.reading.recordedAt) - Date.parse(a.reading.recordedAt))[0]?.reading;
    return { ...sensor, reading: latest };
  });
}

function isDeviceExpanded(deviceId: string) {
  return expandedDeviceIds.value.includes(deviceId);
}

function toggleDevice(deviceId: string) {
  expandedDeviceIds.value = isDeviceExpanded(deviceId)
    ? expandedDeviceIds.value.filter((id) => id !== deviceId)
    : [...expandedDeviceIds.value, deviceId];
}

function deviceStatusIcon(status: Device['status']) {
  if (status === 'online') return CircleCheck;
  if (status === 'warning') return CircleAlert;
  return CircleMinus;
}

function deviceStatusLabel(status: Device['status']) {
  if (status === 'online') return 'Online';
  if (status === 'warning') return 'Atencao';
  return 'Offline';
}

function syncMobileTab() {
  const devicesSection = document.getElementById('aparelhos');
  if (devicesSection) activeMobileTab.value = devicesSection.getBoundingClientRect().top <= window.innerHeight * 0.45 ? 'devices' : 'home';
}

onMounted(() => {
  darkMode.value = localStorage.getItem('lab-monitor-dark-mode') === 'true';
  document.documentElement.classList.toggle('dark-mode', darkMode.value);
  resetToken.value = new URLSearchParams(window.location.search).get('resetToken') ?? '';
  if (resetToken.value) {
    loginMode.value = 'reset';
    loading.value = false;
  } else {
    void checkSession();
  }
  refreshTimer = setInterval(() => void loadDevices(), 30_000);
  window.addEventListener('scroll', syncMobileTab, { passive: true });
  window.addEventListener('hashchange', syncMobileTab);
});
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  window.removeEventListener('scroll', syncMobileTab);
  window.removeEventListener('hashchange', syncMobileTab);
});
</script>

<template>
  <main v-if="loading" class="loading-screen" aria-label="Carregando">
    <LoaderCircle class="spin" :size="28" />
    <span>Conectando ao monitoramento</span>
  </main>

  <main v-else-if="!user" class="login-layout">
    <section class="login-story">
      <div class="story-top"><img class="uerj-logo login-logo" src="/logo.jpg" alt="Universidade do Estado do Rio de Janeiro" /><span>LAB / MONITOR</span></div>
      <div class="story-copy">
        <p class="eyebrow">SISTEMA DE MONITORAMENTO</p>
        <h1>O seu laboratório, em tempo real.</h1>
        <p>Dados confiáveis para um ambiente sob controle.</p>
      </div>
      <div class="story-foot"><span><span class="live-dot"></span> SISTEMAS OPERACIONAIS</span><span>PLATAFORMA SEGURA</span></div>
      <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
    </section>
    <section class="login-side">
      <form class="login-form" @submit.prevent="login">
        <div class="mobile-brand"><img class="uerj-logo" src="/logo.jpg" alt="UERJ" /><span>LAB / MONITOR</span></div>
        <template v-if="loginMode === 'login'">
          <p class="eyebrow">ACESSO RESTRITO</p>
          <h2>Bem-vindo de volta</h2>
          <p class="form-subtitle">Entre para acompanhar os aparelhos do laboratório.</p>
          <label for="email">E-mail</label>
          <input id="email" v-model="email" type="email" autocomplete="username" placeholder="voce@laboratorio.com" required />
          <label for="password">Senha</label>
          <input id="password" v-model="password" type="password" autocomplete="current-password" placeholder="Sua senha" required />
          <button class="text-button forgot-link" type="button" @click="loginMode = 'forgot'; forgotEmail = email">Esqueci a senha</button>
          <p v-if="loginError" class="error-message" role="alert">{{ loginError }}</p>
          <button class="primary-button login-button" type="submit" :disabled="submitting">
            <LoaderCircle v-if="submitting" class="spin" :size="17" />
            <span>{{ submitting ? 'Entrando...' : 'Entrar' }}</span>
          </button>
          <div class="secure-note"><ShieldCheck :size="16" /><span>Sessao protegida com criptografia</span></div>
        </template>
        <template v-else-if="loginMode === 'forgot'">
          <button class="back-link" type="button" @click="loginMode = 'login'; forgotError = ''; forgotMessage = ''"><ChevronDown :size="16" /> Voltar ao login</button>
          <p class="eyebrow">RECUPERACAO DE CONTA</p>
          <h2>Redefinir senha</h2>
          <p class="form-subtitle">Informe o e-mail da sua conta. Se estiver cadastrado, enviaremos um link de redefinicao.</p>
          <label for="forgotEmail">E-mail</label>
          <input id="forgotEmail" v-model="forgotEmail" type="email" autocomplete="email" placeholder="voce@laboratorio.com" required />
          <p v-if="forgotError" class="error-message" role="alert">{{ forgotError }}</p>
          <p v-if="forgotMessage" class="success-message" role="status">{{ forgotMessage }}</p>
          <button class="primary-button login-button" type="button" :disabled="submitting" @click="requestPasswordReset">
            <LoaderCircle v-if="submitting" class="spin" :size="17" /><span>Enviar link</span>
          </button>
        </template>
        <template v-else>
          <p class="eyebrow">RECUPERACAO DE CONTA</p>
          <h2>Escolha uma nova senha</h2>
          <p class="form-subtitle">O link de redefinicao e valido por 30 minutos e pode ser usado uma vez.</p>
          <label for="resetPassword">Nova senha</label>
          <input id="resetPassword" v-model="resetPasswordValue" type="password" autocomplete="new-password" minlength="12" placeholder="Pelo menos 12 caracteres" required />
          <label for="resetPasswordConfirm">Confirme a nova senha</label>
          <input id="resetPasswordConfirm" v-model="resetPasswordConfirm" type="password" autocomplete="new-password" minlength="12" placeholder="Repita a senha" required />
          <p v-if="resetError" class="error-message" role="alert">{{ resetError }}</p>
          <p v-if="resetMessage" class="success-message" role="status">{{ resetMessage }}</p>
          <button class="primary-button login-button" type="button" :disabled="submitting || !!resetMessage" @click="submitPasswordReset">
            <LoaderCircle v-if="submitting" class="spin" :size="17" /><span>Salvar nova senha</span>
          </button>
          <button v-if="resetMessage" class="text-button" type="button" @click="loginMode = 'login'">Ir para o login</button>
        </template>
      </form>
      <footer class="login-footer">MONITORAMENTO DE LABORATORIO <span>v1.0</span></footer>
    </section>
  </main>

  <div v-else class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark"><Activity :size="18" /></span><span>LAB<span class="brand-light">/MONITOR</span></span></div>
      <div class="workspace-label">AMBIENTE</div>
      <div class="workspace-switch"><span class="workspace-avatar">L</span><span class="workspace-name">Laboratorio Central<small>Plano operacional</small></span><ChevronDown :size="15" /></div>
      <div class="nav-label">GERENCIAMENTO</div>
      <nav><a class="nav-link active" href="#inicio"><LayoutDashboard :size="17" /><span>Visao geral</span><span class="nav-count">{{ devices.length }}</span></a></nav>
      <div class="sidebar-bottom">
        <div class="sidebar-status"><span class="live-dot"></span><div>API conectada<small>Atualizacao automatica</small></div><span class="status-ping"></span></div>
        <div class="account-row"><div class="account-avatar">{{ user.email.slice(0, 1).toUpperCase() }}</div><div class="account-info">{{ user.displayName }}<small>{{ user.email }}</small></div><button class="icon-button sidebar-logout" title="Sair" aria-label="Sair" @click="logout"><LogOut :size="17" /></button></div>
      </div>
    </aside>

    <section class="main-area">
      <header class="topbar">
        <div class="breadcrumb"><img class="dashboard-logo" src="/logo.jpg" alt="UERJ" /><span>Monitoramento</span><span>/</span><strong>Visao geral</strong></div>
        <div class="top-actions"><span class="last-update"><span class="live-dot"></span> Atualizado {{ formatRefreshTime() }}</span><button class="icon-button" title="Ajuda" aria-label="Ajuda"><CircleHelp :size="18" /></button><button class="icon-button notification-button" title="Notificacoes" aria-label="Notificacoes"><Bell :size="18" /><i></i></button><button class="account-menu-button" type="button" title="Configuracoes da conta" aria-label="Abrir configuracoes da conta" @click="openSettings"><img v-if="user.avatarDataUrl" class="top-avatar-image" :src="user.avatarDataUrl" alt="" /><span v-else class="top-avatar">{{ user.displayName.slice(0, 1).toUpperCase() }}</span></button></div>
      </header>

      <main id="inicio" class="dashboard-content">
        <div class="page-heading">
          <div><p class="eyebrow">{{ reportDate.toLocaleUpperCase('pt-BR') }}</p><h1>Visao geral</h1><p class="heading-sub">Acompanhe a saude dos aparelhos e as ultimas medicoes.</p></div>
          <button class="secondary-button" :disabled="loading" @click="loadDevices"><RefreshCw :size="16" /> Atualizar</button>
        </div>

        <div v-if="pageError" class="notice-error" role="alert"><AlertTriangle :size="17" />{{ pageError }}</div>

        <section class="metrics-grid" aria-label="Resumo dos aparelhos">
          <article class="metric metric-total"><div class="metric-top"><span>Total de aparelhos</span><span class="metric-icon"><Cpu :size="17" /></span></div><div class="metric-value">{{ devices.length }}<span> cadastrados</span></div><div class="metric-foot"><span class="metric-mark"></span>Inventario monitorado</div></article>
          <article class="metric"><div class="metric-top"><span>Online</span><span class="metric-icon green"><Signal :size="17" /></span></div><div class="metric-value">{{ onlineCount }}<span> aparelhos</span></div><div class="metric-foot positive"><Check :size="13" />Operando normalmente</div></article>
          <article class="metric"><div class="metric-top"><span>Em atencao</span><span class="metric-icon amber"><AlertTriangle :size="17" /></span></div><div class="metric-value">{{ warningCount }}<span> aparelhos</span></div><div class="metric-foot" :class="warningCount ? 'warning-text' : ''">{{ warningCount ? 'Requer verificacao' : 'Nenhum alerta ativo' }}</div></article>
          <article class="metric"><div class="metric-top"><span>Offline</span><span class="metric-icon rose"><Activity :size="17" /></span></div><div class="metric-value">{{ offlineCount }}<span> aparelhos</span></div><div class="metric-foot">{{ latestReadings }} medicoes recentes</div></article>
        </section>

        <section id="aparelhos" class="device-section">
          <div class="section-heading"><div><h2>Aparelhos</h2><p>Inventario e leituras mais recentes</p></div><button class="export-button" title="Exportar lista" @click="exportList"><ArrowDownToLine :size="16" /><span>Exportar</span></button></div>
          <div class="table-toolbar"><div class="table-count"><span class="count-dot"></span>{{ devices.length }} aparelhos registrados</div><label class="search-field"><Search :size="16" /><input v-model="search" type="search" placeholder="Buscar aparelho..." aria-label="Buscar aparelho" /></label></div>
          <div v-if="filteredDevices.length" class="device-list">
            <article v-for="device in filteredDevices" :key="device.id" class="device-card" :class="`device-card-${device.status}`">
              <button
                class="device-summary"
                type="button"
                :aria-expanded="isDeviceExpanded(device.id)"
                :aria-controls="`device-details-${device.id}`"
                @click="toggleDevice(device.id)"
              >
                <span class="device-identity">
                  <span class="device-icon"><Cpu :size="17" /></span>
                  <span class="device-identity-copy">{{ device.name }}</span>
                </span>
                <span class="status-badge" :class="device.status"><i></i>{{ deviceStatusLabel(device.status) }}</span>
                <span class="device-health-overview" aria-label="Estado dos sensores">
                  <span
                    v-for="sensor in latestSensorReadings(device.readings)"
                    :key="sensor.key"
                    class="device-health-item"
                    :class="sensor.reading ? `health-${device.status}` : 'health-missing'"
                    :title="`${sensor.name}: ${sensor.reading ? deviceStatusLabel(device.status) : 'sem leitura recebida'}`"
                  >
                    <component :is="readingIcon(sensor.key)" :size="15" />
                    <span>{{ sensor.shortName }}</span>
                    <component :is="sensor.reading ? deviceStatusIcon(device.status) : CircleMinus" :size="15" />
                  </span>
                </span>
                <ChevronDown class="device-expand-icon" :class="{ expanded: isDeviceExpanded(device.id) }" :size="18" />
              </button>

              <div v-if="isDeviceExpanded(device.id)" :id="`device-details-${device.id}`" class="device-details">
                <div class="device-meta">
                  <span><MapPin :size="14" /><strong>Localizacao</strong>{{ device.location || 'Nao informado' }}</span>
                  <span><Cpu :size="14" /><strong>Identificador</strong>{{ device.externalId }}</span>
                  <span><Clock3 :size="14" /><strong>Ultimo contato</strong>{{ formatTime(device.lastSeenAt) }}</span>
                </div>
                <div class="device-readings-detail">
                  <article v-for="sensor in latestSensorReadings(device.readings)" :key="sensor.key" class="sensor-detail-card">
                    <div class="sensor-detail-label"><component :is="readingIcon(sensor.key)" :size="15" />{{ sensor.name }}</div>
                    <strong>{{ sensor.reading ? `${sensor.reading.value} ${sensor.reading.unit}` : 'Sem leitura' }}</strong>
                    <span v-if="sensor.reading" class="sensor-reading-time">{{ formatTime(sensor.reading.recordedAt) }}</span>
                  </article>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="empty-state">
            <span class="empty-icon"><Cpu :size="22" /></span>
            <strong>{{ search ? 'Nenhum aparelho encontrado' : 'Nenhum aparelho conectado' }}</strong>
            <span>{{ search ? 'Tente outro termo de busca.' : 'Os aparelhos aparecerao aqui quando enviarem dados.' }}</span>
          </div>
          <div class="table-footer"><span>Exibindo {{ filteredDevices.length }} de {{ devices.length }} aparelhos</span><span><span class="live-dot"></span> Sincronizacao a cada 30 segundos</span></div>
        </section>
        <footer class="dashboard-footer"><span>LAB / MONITOR <b>·</b> Monitoramento de laboratorio</span><span>Dados atualizados em tempo real</span></footer>
      </main>
    </section>

    <nav class="mobile-nav" aria-label="Navegacao principal">
      <a class="mobile-nav-item" :class="{ active: activeMobileTab === 'home' }" href="#inicio" :aria-current="activeMobileTab === 'home' ? 'page' : undefined">
        <LayoutDashboard :size="20" /><span>Inicio</span>
      </a>
      <a class="mobile-nav-item" :class="{ active: activeMobileTab === 'devices' }" href="#aparelhos" :aria-current="activeMobileTab === 'devices' ? 'page' : undefined">
        <Cpu :size="20" /><span>Aparelhos</span>
      </a>
      <button class="mobile-nav-item" type="button" :disabled="loading" @click="loadDevices">
        <RefreshCw :size="19" /><span>Atualizar</span>
      </button>
      <button class="mobile-nav-item" type="button" @click="logout">
        <LogOut :size="19" /><span>Sair</span>
      </button>
    </nav>

    <div v-if="settingsOpen" class="settings-overlay" @click.self="settingsOpen = false">
      <section class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
        <header class="settings-header">
          <div><p class="eyebrow">SUA CONTA</p><h2 id="settingsTitle">Configuracoes</h2></div>
          <button class="icon-button" type="button" aria-label="Fechar configuracoes" @click="settingsOpen = false"><X :size="19" /></button>
        </header>

        <label class="theme-setting">
          <span class="theme-setting-icon"><Moon v-if="!darkMode" :size="18" /><Sun v-else :size="18" /></span>
          <span class="theme-setting-copy"><strong>Modo escuro</strong><small>Aparencia salva neste navegador</small></span>
          <input class="theme-switch" type="checkbox" :checked="darkMode" @change="toggleDarkMode" />
        </label>

        <div class="account-settings-form">
          <div class="settings-section-heading"><h3>Perfil</h3><span>Confirme sua senha para salvar</span></div>
          <div class="avatar-editor">
            <img v-if="profileAvatar" class="settings-avatar" :src="profileAvatar" alt="Foto do perfil" />
            <span v-else class="settings-avatar settings-avatar-fallback">{{ profileName.slice(0, 1).toUpperCase() || '?' }}</span>
            <label class="secondary-button avatar-upload-button" for="avatarFile">Alterar foto</label>
            <input id="avatarFile" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" @change="selectAvatar" />
            <button v-if="profileAvatar" class="text-button remove-avatar-button" type="button" @click="profileAvatar = null">Remover foto</button>
          </div>
          <p v-if="avatarError" class="error-message" role="alert">{{ avatarError }}</p>
          <label for="profileName">Nome</label>
          <input id="profileName" v-model="profileName" class="settings-input" type="text" maxlength="80" autocomplete="name" />
          <label for="profileEmail">E-mail</label>
          <input id="profileEmail" v-model="profileEmail" class="settings-input" type="email" maxlength="254" autocomplete="email" />
          <label for="currentPassword">Senha atual</label>
          <input id="currentPassword" v-model="currentPassword" class="settings-input" type="password" autocomplete="current-password" />
          <div v-if="accountError" class="error-message" role="alert">{{ accountError }}</div>
          <div v-if="accountMessage" class="success-message" role="status">{{ accountMessage }}</div>
          <button class="primary-button settings-save-button" type="button" :disabled="accountSaving" @click="updateProfile">{{ accountSaving ? 'Salvando...' : 'Salvar perfil' }}</button>
        </div>

        <form class="account-settings-form password-settings-form" @submit.prevent="updatePassword">
          <div class="settings-section-heading"><h3>Senha</h3><span>Use pelo menos 12 caracteres</span></div>
          <label for="newPassword">Nova senha</label>
          <input id="newPassword" v-model="newPassword" class="settings-input" type="password" minlength="12" autocomplete="new-password" required />
          <label for="newPasswordConfirm">Confirme a nova senha</label>
          <input id="newPasswordConfirm" v-model="newPasswordConfirm" class="settings-input" type="password" minlength="12" autocomplete="new-password" required />
          <button class="secondary-button settings-save-button" type="submit" :disabled="accountSaving">Alterar senha</button>
        </form>
      </section>
    </div>
  </div>
</template>
