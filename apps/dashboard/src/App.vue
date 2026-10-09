<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  Activity, AlertTriangle, ArrowDownToLine, Bell, Check, ChevronDown,
  CircleAlert, CircleCheck, CircleMinus, Clock3, Cpu, Flame, LayoutDashboard,
  LoaderCircle, LogOut, Mail, MapPin, MessageCircle, Moon, RefreshCw, Search,
  Settings, ShieldCheck, Signal, Sun, Thermometer, Waves, X
} from 'lucide-vue-next';

type User = {
  id: string;
  email: string;
  displayName: string;
  avatarDataUrl: string | null;
  whatsappNumber: string | null;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
};
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
type DeviceNotification = {
  id: number;
  deviceId: string;
  deviceName: string;
  status: Device['status'];
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};
type Language = 'pt-BR' | 'en';

const user = ref<User | null>(null);
const devices = ref<Device[]>([]);
const notifications = ref<DeviceNotification[]>([]);
const notificationOpen = ref(false);
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
const settingsTab = ref<'preferences' | 'account' | 'notifications'>('preferences');
const language = ref<Language>('pt-BR');
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
const profileWhatsappNumber = ref('');
const profileEmailNotifications = ref(true);
const profileWhatsappNotifications = ref(false);
const notificationCurrentPassword = ref('');
const notificationMessage = ref('');
const notificationError = ref('');
const avatarError = ref('');
const refreshedAt = ref(new Date());
const activeMobileTab = ref('home');
const expandedDeviceIds = ref<string[]>([]);
let refreshTimer: ReturnType<typeof setInterval> | undefined;
let knownDeviceStatuses: Map<string, Device['status']> | undefined;
let notificationSequence = 0;
let deviceRefreshInProgress = false;

const englishText: Record<string, string> = {
  'Carregando': 'Loading',
  'Conectando ao monitoramento': 'Connecting to monitoring',
  'Universidade do Estado do Rio de Janeiro': 'Rio de Janeiro State University',
  'SISTEMA DE MONITORAMENTO': 'MONITORING SYSTEM',
  'O seu laboratório, em tempo real.': 'Your laboratory, in real time.',
  'Dados confiáveis para um ambiente sob controle.': 'Reliable data for a controlled environment.',
  'SISTEMAS OPERACIONAIS': 'OPERATIONAL SYSTEMS',
  'PLATAFORMA SEGURA': 'SECURE PLATFORM',
  'ACESSO RESTRITO': 'RESTRICTED ACCESS',
  'Bem-vindo de volta': 'Welcome back',
  'Entre para acompanhar os aparelhos do laboratório.': 'Sign in to monitor laboratory devices.',
  'E-mail': 'Email',
  'Senha': 'Password',
  'Sua senha': 'Your password',
  'Esqueci a senha': 'Forgot password',
  'Entrando...': 'Signing in...',
  'Entrar': 'Sign in',
  'Sessao protegida com criptografia': 'Session protected with encryption',
  'Voltar ao login': 'Back to sign in',
  'RECUPERACAO DE CONTA': 'ACCOUNT RECOVERY',
  'Redefinir senha': 'Reset password',
  'Informe o e-mail da sua conta. Se estiver cadastrado, enviaremos um link de redefinicao.': 'Enter your account email. If it is registered, we will send a reset link.',
  'Enviar link': 'Send link',
  'Escolha uma nova senha': 'Choose a new password',
  'O link de redefinicao e valido por 30 minutos e pode ser usado uma vez.': 'The reset link is valid for 30 minutes and can only be used once.',
  'Nova senha': 'New password',
  'Confirme a nova senha': 'Confirm new password',
  'Pelo menos 12 caracteres': 'At least 12 characters',
  'Repita a senha': 'Repeat password',
  'Salvar nova senha': 'Save new password',
  'Ir para o login': 'Return to sign in',
  'MONITORAMENTO DE LABORATORIO': 'LABORATORY MONITORING',
  'AMBIENTE': 'WORKSPACE',
  'Laboratorio Central': 'Central Laboratory',
  'Plano operacional': 'Operations plan',
  'GERENCIAMENTO': 'MANAGEMENT',
  'Visao geral': 'Overview',
  'API conectada': 'API connected',
  'Atualizacao automatica': 'Automatic updates',
  'Sair': 'Sign out',
  'Monitoramento': 'Monitoring',
  'Atualizado': 'Updated',
  'Notificações': 'Notifications',
  'não lidas': 'unread',
  'Todas as notificações foram lidas': 'All notifications have been read',
  'Marcar todas como lidas': 'Mark all as read',
  'Nenhuma notificação': 'No notifications',
  'Alterações nos estados dos aparelhos aparecerão aqui.': 'Device status changes will appear here.',
  'Configurações da conta': 'Account settings',
  'Abrir configurações da conta': 'Open account settings',
  'Acompanhe a saude dos aparelhos e as ultimas medicoes.': 'Monitor device health and the latest readings.',
  'Atualizar': 'Refresh',
  'Resumo dos aparelhos': 'Device summary',
  'Total de aparelhos': 'Total devices',
  'cadastrados': 'registered',
  'aparelhos': 'devices',
  'Inventario monitorado': 'Monitored inventory',
  'Operando normalmente': 'Operating normally',
  'Em atencao': 'Needs attention',
  'Requer verificacao': 'Requires inspection',
  'Nenhum alerta ativo': 'No active alerts',
  'Offline': 'Offline',
  'medicoes recentes': 'recent readings',
  'Aparelhos': 'Devices',
  'Inventario e leituras mais recentes': 'Inventory and latest readings',
  'Exportar lista': 'Export list',
  'Exportar': 'Export',
  'aparelhos registrados': 'devices registered',
  'Buscar aparelho...': 'Search devices...',
  'Estado dos sensores': 'Sensor status',
  'sem leitura recebida': 'no reading received',
  'Localizacao': 'Location',
  'Nao informado': 'Not provided',
  'Identificador': 'Identifier',
  'Ultimo contato': 'Last seen',
  'Sem leitura': 'No reading',
  'Nenhum aparelho encontrado': 'No devices found',
  'Nenhum aparelho conectado': 'No connected devices',
  'Tente outro termo de busca.': 'Try another search term.',
  'Os aparelhos aparecerao aqui quando enviarem dados.': 'Devices will appear here when they send data.',
  'Exibindo': 'Showing',
  'de': 'of',
  'Sincronizacao a cada 30 segundos': 'Sync every 30 seconds',
  'Monitoramento de laboratorio': 'Laboratory monitoring',
  'Dados atualizados em tempo real': 'Data updated in real time',
  'Navegacao principal': 'Main navigation',
  'Inicio': 'Home',
  'Fechar configuracoes': 'Close settings',
  'Configuracoes': 'Settings',
  'SUA CONTA': 'YOUR ACCOUNT',
  'Preferências': 'Preferences',
  'Conta': 'Account',
  'Configurações': 'Settings',
  'Idioma da dashboard': 'Dashboard language',
  'Escolha o idioma da interface': 'Choose the interface language',
  'Português': 'Portuguese',
  'English': 'English',
  'Português (Brasil)': 'Portuguese (Brazil)',
  'Inglês (Reino Unido)': 'English (United Kingdom)',
  'Salvar notificações': 'Save notification settings',
  'Modo escuro': 'Dark mode',
  'Aparencia salva neste navegador': 'Appearance saved in this browser',
  'Idioma': 'Language',
  'Perfil': 'Profile',
  'Confirme sua senha para salvar': 'Confirm your password to save',
  'Alterar foto': 'Change photo',
  'Foto do perfil': 'Profile photo',
  'Remover foto': 'Remove photo',
  'Nome': 'Name',
  'Alertas de alarmes': 'Alarm notifications',
  'Preferências de envio': 'Delivery preferences',
  'Notificações por e-mail': 'Email notifications',
  'Enviadas para ': 'Sent to ',
  'o e-mail da conta': 'the account email',
  'Notificações por WhatsApp': 'WhatsApp notifications',
  'É necessário cadastrar o número e ativar o canal': 'Add a number and enable the channel',
  'WhatsApp (formato internacional)': 'WhatsApp (international format)',
  'Use o formato E.164, incluindo o código do país (por exemplo, +55...). O WhatsApp requer uma conta Meta Cloud API configurada pelo administrador.': 'Use E.164 format, including the country code. WhatsApp requires a Meta Cloud API account configured by an administrator.',
  'Senha atual': 'Current password',
  'Salvar perfil': 'Save profile',
  'Salvando...': 'Saving...',
  'Use pelo menos 12 caracteres': 'Use at least 12 characters',
  'Alterar senha': 'Change password',
  'As senhas nao coincidem.': 'Passwords do not match.',
  'Temperatura': 'Temperature',
  'Temp.': 'Temp.',
  'Umidade': 'Humidity',
  'Gás': 'Gas',
  'Online': 'Online',
  'Atencao': 'Attention',
  'O aparelho': 'Device',
  'voltou a ficar online.': 'is back online.',
  'está': 'is',
  'em atenção': 'in an alert state',
  'Alarme normalizado': 'Alarm cleared',
  'Aparelho em atenção': 'Device requires attention',
  'Aparelho offline': 'Device offline',
  'Nao foi possivel concluir a solicitacao.': 'Could not complete the request.',
  'Falha ao atualizar aparelhos.': 'Failed to refresh devices.',
  'Falha ao entrar.': 'Sign-in failed.',
  'Nao foi possivel solicitar a redefinicao.': 'Could not request a password reset.',
  'Link invalido ou expirado.': 'Invalid or expired link.',
  'Nao foi possivel atualizar o perfil.': 'Could not update the profile.',
  'Nao foi possivel alterar a senha.': 'Could not change the password.',
  'Escolha uma imagem JPG, PNG ou WebP de ate 8 MB.': 'Choose a JPG, PNG, or WebP image up to 8 MB.',
  'Canvas indisponivel.': 'Canvas is unavailable.',
  'Nao foi possivel processar essa imagem.': 'Could not process this image.',
  'Nao foi possivel encerrar a sessao. Tente novamente.': 'Could not end the session. Try again.',
  'Perfil atualizado.': 'Profile updated.',
  'Preferências de notificações salvas.': 'Notification preferences saved.',
  'Informe sua senha atual para salvar.': 'Enter your current password to save.'
};

function t(text: string) {
  return language.value === 'en' ? englishText[text] ?? text : text;
}

const dateLocale = computed(() => language.value === 'en' ? 'en-GB' : 'pt-BR');
const reportDate = computed(() => new Intl.DateTimeFormat(dateLocale.value, {
  weekday: 'long', day: 'numeric', month: 'long'
}).format(new Date()));

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
const unreadNotificationCount = computed(() => notifications.value.filter((notification) => !notification.read).length);

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? 'Nao foi possivel concluir a solicitacao.');
  }
  return response.json() as Promise<T>;
}

async function loadDevices() {
  if (!user.value || deviceRefreshInProgress) return;
  deviceRefreshInProgress = true;
  try {
    const result = await api<{ devices: Device[] }>('/api/devices');
    const newNotifications: DeviceNotification[] = [];
    if (knownDeviceStatuses) {
      for (const device of result.devices) {
        const previousStatus = knownDeviceStatuses.get(device.id);
        if (previousStatus === device.status || (previousStatus === undefined && device.status === 'online')) continue;
        const title = device.status === 'online'
          ? 'Alarme normalizado'
          : device.status === 'warning'
            ? 'Aparelho em atenção'
            : 'Aparelho offline';
        const message = device.status === 'online'
          ? `O aparelho ${device.name} voltou a ficar online.`
          : `O aparelho ${device.name} está ${deviceStatusLabel(device.status).toLocaleLowerCase('pt-BR')}.`;
        newNotifications.push({
          id: ++notificationSequence,
          deviceId: device.id,
          deviceName: device.name,
          status: device.status,
          title,
          message,
          createdAt: new Date().toISOString(),
          read: false
        });
      }
    }
    if (newNotifications.length) {
      notifications.value = [...newNotifications.reverse(), ...notifications.value].slice(0, 50);
    }
    knownDeviceStatuses = new Map(result.devices.map((device) => [device.id, device.status]));
    devices.value = result.devices;
    refreshedAt.value = new Date();
    pageError.value = '';
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Falha ao atualizar aparelhos.';
  } finally {
    deviceRefreshInProgress = false;
  }
}

function markAllNotificationsRead() {
  notifications.value = notifications.value.map((notification) => ({ ...notification, read: true }));
}

function openDeviceNotification(notification: DeviceNotification) {
  notification.read = true;
  notificationOpen.value = false;
  if (!devices.value.some((device) => device.id === notification.deviceId)) return;
  search.value = '';
  if (!expandedDeviceIds.value.includes(notification.deviceId)) {
    expandedDeviceIds.value = [...expandedDeviceIds.value, notification.deviceId];
  }
  window.setTimeout(() => {
    document.getElementById(`device-${notification.deviceId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 0);
}

function notificationMessageInEnglish(notification: DeviceNotification) {
  if (notification.status === 'online') return `Device ${notification.deviceName} is back online.`;
  if (notification.status === 'warning') return `Device ${notification.deviceName} requires attention.`;
  return `Device ${notification.deviceName} is offline.`;
}

function handleNotificationOutsideClick(event: MouseEvent) {
  if (!(event.target instanceof Element) || !event.target.closest('.notification-wrap')) {
    notificationOpen.value = false;
  }
}

function handleNotificationKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') notificationOpen.value = false;
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
  profileWhatsappNumber.value = user.value.whatsappNumber ?? '';
  profileEmailNotifications.value = user.value.emailNotifications;
  profileWhatsappNotifications.value = user.value.whatsappNotifications;
}

function openSettings() {
  syncProfileForm();
  settingsTab.value = 'preferences';
  accountMessage.value = '';
  accountError.value = '';
  notificationMessage.value = '';
  notificationError.value = '';
  currentPassword.value = '';
  notificationCurrentPassword.value = '';
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
        whatsappNumber: user.value.whatsappNumber,
        emailNotifications: user.value.emailNotifications,
        whatsappNotifications: user.value.whatsappNotifications,
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

async function updateNotificationPreferences() {
  if (!user.value) return;
  notificationMessage.value = '';
  notificationError.value = '';
  if (!notificationCurrentPassword.value) {
    notificationError.value = 'Informe sua senha atual para salvar.';
    return;
  }
  accountSaving.value = true;
  try {
    const result = await api<{ user: User }>('/api/account/profile', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({
        displayName: user.value.displayName,
        email: user.value.email,
        avatarDataUrl: user.value.avatarDataUrl,
        whatsappNumber: profileWhatsappNumber.value,
        emailNotifications: profileEmailNotifications.value,
        whatsappNotifications: profileWhatsappNotifications.value,
        currentPassword: notificationCurrentPassword.value
      })
    });
    user.value = result.user;
    notificationCurrentPassword.value = '';
    notificationMessage.value = 'Preferências de notificações salvas.';
  } catch (error) {
    notificationError.value = error instanceof Error ? t(error.message) : t('Nao foi possivel atualizar o perfil.');
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

function setLanguage(nextLanguage: Language) {
  language.value = nextLanguage;
  localStorage.setItem('lab-monitor-language', nextLanguage);
}

async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken.value } });
    user.value = null;
    devices.value = [];
    notifications.value = [];
    notificationOpen.value = false;
    knownDeviceStatuses = undefined;
    csrfToken.value = '';
    pageError.value = '';
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Nao foi possivel encerrar a sessao. Tente novamente.';
  }
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(dateLocale.value, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
function formatRefreshTime() {
  return new Intl.DateTimeFormat(dateLocale.value, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(refreshedAt.value);
}
function exportList() {
  const columns = language.value === 'en'
    ? ['Device', 'Identifier', 'Location', 'Status', 'Last reading']
    : ['Aparelho', 'Identificador', 'Localizacao', 'Status', 'Ultima leitura'];
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
  link.download = language.value === 'en' ? 'laboratory-devices.csv' : 'aparelhos-monitoramento.csv';
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
    { key: 'temperatura', name: t('Temperatura'), shortName: t('Temp.'), matches: (type: string) => type.includes('temper') },
    { key: 'umidade', name: t('Umidade'), shortName: t('Umidade'), matches: (type: string) => type.includes('umid') },
    { key: 'gas', name: t('Gás'), shortName: t('Gás'), matches: (type: string) => type.includes('gas') || type.includes('gás') }
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
  if (status === 'online') return t('Online');
  if (status === 'warning') return t('Atencao');
  return t('Offline');
}

function syncMobileTab() {
  const devicesSection = document.getElementById('aparelhos');
  if (devicesSection) activeMobileTab.value = devicesSection.getBoundingClientRect().top <= window.innerHeight * 0.45 ? 'devices' : 'home';
}

onMounted(() => {
  darkMode.value = localStorage.getItem('lab-monitor-dark-mode') === 'true';
  document.documentElement.classList.toggle('dark-mode', darkMode.value);
  language.value = localStorage.getItem('lab-monitor-language') === 'en' ? 'en' : 'pt-BR';
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
  document.addEventListener('click', handleNotificationOutsideClick);
  window.addEventListener('keydown', handleNotificationKeydown);
});
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  window.removeEventListener('scroll', syncMobileTab);
  window.removeEventListener('hashchange', syncMobileTab);
  document.removeEventListener('click', handleNotificationOutsideClick);
  window.removeEventListener('keydown', handleNotificationKeydown);
});
</script>

<template>
  <main v-if="loading" class="loading-screen" :aria-label="t('Carregando')">
    <LoaderCircle class="spin" :size="28" />
    <span>{{ t('Conectando ao monitoramento') }}</span>
  </main>

  <main v-else-if="!user" class="login-layout">
    <section class="login-story">
      <div class="story-top"><img class="uerj-logo login-logo" src="/logo.jpg" :alt="t('Universidade do Estado do Rio de Janeiro')" /><span>LAB / MONITOR</span></div>
      <div class="story-copy">
        <p class="eyebrow">{{ t('SISTEMA DE MONITORAMENTO') }}</p>
        <h1>{{ t('O seu laboratório, em tempo real.') }}</h1>
        <p>{{ t('Dados confiáveis para um ambiente sob controle.') }}</p>
      </div>
      <div class="story-foot"><span><span class="live-dot"></span> {{ t('SISTEMAS OPERACIONAIS') }}</span><span>{{ t('PLATAFORMA SEGURA') }}</span></div>
      <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
    </section>
    <section class="login-side">
      <form class="login-form" @submit.prevent="login">
        <div class="mobile-brand"><img class="uerj-logo" src="/logo.jpg" alt="UERJ" /><span>LAB / MONITOR</span></div>
        <template v-if="loginMode === 'login'">
          <p class="eyebrow">{{ t('ACESSO RESTRITO') }}</p>
          <h2>{{ t('Bem-vindo de volta') }}</h2>
          <p class="form-subtitle">{{ t('Entre para acompanhar os aparelhos do laboratório.') }}</p>
          <label for="email">{{ t('E-mail') }}</label>
          <input id="email" v-model="email" type="email" autocomplete="username" :placeholder="language === 'en' ? 'you@laboratory.com' : 'voce@laboratorio.com'" required />
          <label for="password">{{ t('Senha') }}</label>
          <input id="password" v-model="password" type="password" autocomplete="current-password" :placeholder="t('Sua senha')" required />
          <button class="text-button forgot-link" type="button" @click="loginMode = 'forgot'; forgotEmail = email">{{ t('Esqueci a senha') }}</button>
          <p v-if="loginError" class="error-message" role="alert">{{ loginError }}</p>
          <button class="primary-button login-button" type="submit" :disabled="submitting">
            <LoaderCircle v-if="submitting" class="spin" :size="17" />
            <span>{{ submitting ? t('Entrando...') : t('Entrar') }}</span>
          </button>
          <div class="secure-note"><ShieldCheck :size="16" /><span>{{ t('Sessao protegida com criptografia') }}</span></div>
        </template>
        <template v-else-if="loginMode === 'forgot'">
          <button class="back-link" type="button" @click="loginMode = 'login'; forgotError = ''; forgotMessage = ''"><ChevronDown :size="16" /> {{ t('Voltar ao login') }}</button>
          <p class="eyebrow">{{ t('RECUPERACAO DE CONTA') }}</p>
          <h2>{{ t('Redefinir senha') }}</h2>
          <p class="form-subtitle">{{ t('Informe o e-mail da sua conta. Se estiver cadastrado, enviaremos um link de redefinicao.') }}</p>
          <label for="forgotEmail">{{ t('E-mail') }}</label>
          <input id="forgotEmail" v-model="forgotEmail" type="email" autocomplete="email" :placeholder="language === 'en' ? 'you@laboratory.com' : 'voce@laboratorio.com'" required />
          <p v-if="forgotError" class="error-message" role="alert">{{ forgotError }}</p>
          <p v-if="forgotMessage" class="success-message" role="status">{{ forgotMessage }}</p>
          <button class="primary-button login-button" type="button" :disabled="submitting" @click="requestPasswordReset">
            <LoaderCircle v-if="submitting" class="spin" :size="17" /><span>{{ t('Enviar link') }}</span>
          </button>
        </template>
        <template v-else>
          <p class="eyebrow">{{ t('RECUPERACAO DE CONTA') }}</p>
          <h2>{{ t('Escolha uma nova senha') }}</h2>
          <p class="form-subtitle">{{ t('O link de redefinicao e valido por 30 minutos e pode ser usado uma vez.') }}</p>
          <label for="resetPassword">{{ t('Nova senha') }}</label>
          <input id="resetPassword" v-model="resetPasswordValue" type="password" autocomplete="new-password" minlength="12" :placeholder="t('Pelo menos 12 caracteres')" required />
          <label for="resetPasswordConfirm">{{ t('Confirme a nova senha') }}</label>
          <input id="resetPasswordConfirm" v-model="resetPasswordConfirm" type="password" autocomplete="new-password" minlength="12" :placeholder="t('Repita a senha')" required />
          <p v-if="resetError" class="error-message" role="alert">{{ resetError }}</p>
          <p v-if="resetMessage" class="success-message" role="status">{{ resetMessage }}</p>
          <button class="primary-button login-button" type="button" :disabled="submitting || !!resetMessage" @click="submitPasswordReset">
            <LoaderCircle v-if="submitting" class="spin" :size="17" /><span>{{ t('Salvar nova senha') }}</span>
          </button>
          <button v-if="resetMessage" class="text-button" type="button" @click="loginMode = 'login'">{{ t('Ir para o login') }}</button>
        </template>
      </form>
      <footer class="login-footer">{{ t('MONITORAMENTO DE LABORATORIO') }} <span>v1.0</span></footer>
    </section>
  </main>

  <div v-else class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark"><Activity :size="18" /></span><span>LAB<span class="brand-light">/MONITOR</span></span></div>
      <div class="workspace-label">{{ t('AMBIENTE') }}</div>
      <div class="workspace-switch"><span class="workspace-avatar">L</span><span class="workspace-name">{{ t('Laboratorio Central') }}<small>{{ t('Plano operacional') }}</small></span><ChevronDown :size="15" /></div>
      <div class="nav-label">{{ t('GERENCIAMENTO') }}</div>
      <nav><a class="nav-link active" href="#inicio"><LayoutDashboard :size="17" /><span>{{ t('Visao geral') }}</span><span class="nav-count">{{ devices.length }}</span></a></nav>
      <div class="sidebar-bottom">
        <div class="sidebar-status"><span class="live-dot"></span><div>{{ t('API conectada') }}<small>{{ t('Atualizacao automatica') }}</small></div><span class="status-ping"></span></div>
        <div class="account-row"><div class="account-avatar"><img v-if="user.avatarDataUrl" :src="user.avatarDataUrl" alt="" /><span v-else>{{ user.displayName.slice(0, 1).toUpperCase() }}</span></div><div class="account-info">{{ user.displayName }}<small>{{ user.email }}</small></div><button class="icon-button sidebar-logout" :title="t('Sair')" :aria-label="t('Sair')" @click="logout"><LogOut :size="17" /></button></div>
      </div>
    </aside>

    <section class="main-area">
      <header class="topbar">
        <div class="breadcrumb"><img class="dashboard-logo" src="/logo.jpg" alt="UERJ" /><span>{{ t('Monitoramento') }}</span><span>/</span><strong>{{ t('Visao geral') }}</strong></div>
        <div class="top-actions">
          <span class="last-update"><span class="live-dot"></span> {{ t('Atualizado') }} {{ formatRefreshTime() }}</span>
          <div class="language-flags" role="group" :aria-label="t('Idioma')">
            <button class="language-flag" :class="{ active: language === 'pt-BR' }" type="button" :aria-label="t('Português (Brasil)')" :aria-pressed="language === 'pt-BR'" :title="t('Português (Brasil)')" @click="setLanguage('pt-BR')"><img class="language-flag-image" src="/flags/br.svg" alt="" /></button>
            <button class="language-flag" :class="{ active: language === 'en' }" type="button" :aria-label="t('Inglês (Reino Unido)')" :aria-pressed="language === 'en'" :title="t('Inglês (Reino Unido)')" @click="setLanguage('en')"><img class="language-flag-image" src="/flags/gb.svg" alt="" /></button>
          </div>
          <div class="notification-wrap">
            <button
              class="icon-button notification-button"
              type="button"
              :title="`${t('Notificações')}${unreadNotificationCount ? `: ${unreadNotificationCount} ${t('não lidas')}` : ''}`"
              :aria-label="`${t('Notificações')}${unreadNotificationCount ? `, ${unreadNotificationCount} ${t('não lidas')}` : ''}`"
              :aria-expanded="notificationOpen"
              aria-haspopup="dialog"
              @click="notificationOpen = !notificationOpen"
            >
              <Bell :size="18" />
              <span v-if="unreadNotificationCount" class="notification-count">{{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}</span>
            </button>
            <section v-if="notificationOpen" class="notification-panel" role="dialog" :aria-label="t('Notificações')">
              <header class="notification-panel-header">
                <div><h2>{{ t('Notificações') }}</h2><p>{{ unreadNotificationCount ? `${unreadNotificationCount} ${t('não lidas')}` : t('Todas as notificações foram lidas') }}</p></div>
                <button v-if="unreadNotificationCount" class="notification-read-all" type="button" @click="markAllNotificationsRead">{{ t('Marcar todas como lidas') }}</button>
              </header>
              <div v-if="notifications.length" class="notification-list" role="list">
                <div v-for="notification in notifications" :key="notification.id" role="listitem">
                  <button
                    class="notification-item"
                    :class="[{ 'notification-unread': !notification.read }, `notification-${notification.status}`]"
                    type="button"
                    @click="openDeviceNotification(notification)"
                  >
                    <span class="notification-icon"><CircleCheck v-if="notification.status === 'online'" :size="17" /><AlertTriangle v-else :size="17" /></span>
                    <span class="notification-copy">
                      <strong>{{ t(notification.title) }}</strong>
                      <span>{{ language === 'en' ? notificationMessageInEnglish(notification) : notification.message }}</span>
                      <time :datetime="notification.createdAt">{{ formatTime(notification.createdAt) }}</time>
                    </span>
                    <i v-if="!notification.read" class="notification-unread-dot" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
              <div v-else class="notification-empty">
                <Bell :size="22" />
                <strong>{{ t('Nenhuma notificação') }}</strong>
                <span>{{ t('Alterações nos estados dos aparelhos aparecerão aqui.') }}</span>
              </div>
            </section>
          </div>
          <button class="account-menu-button" type="button" :title="t('Configurações da conta')" :aria-label="t('Abrir configurações da conta')" @click="openSettings"><img v-if="user.avatarDataUrl" class="top-avatar-image" :src="user.avatarDataUrl" alt="" /><span v-else class="top-avatar">{{ user.displayName.slice(0, 1).toUpperCase() }}</span></button>
        </div>
      </header>

      <main id="inicio" class="dashboard-content">
        <div class="page-heading">
          <div><p class="eyebrow">{{ reportDate.toLocaleUpperCase(dateLocale) }}</p><h1>{{ t('Visao geral') }}</h1><p class="heading-sub">{{ t('Acompanhe a saude dos aparelhos e as ultimas medicoes.') }}</p></div>
          <button class="secondary-button" :disabled="loading" @click="loadDevices"><RefreshCw :size="16" /> {{ t('Atualizar') }}</button>
        </div>

        <div v-if="pageError" class="notice-error" role="alert"><AlertTriangle :size="17" />{{ pageError }}</div>

        <section class="metrics-grid" :aria-label="t('Resumo dos aparelhos')">
          <article class="metric metric-total"><div class="metric-top"><span>{{ t('Total de aparelhos') }}</span><span class="metric-icon"><Cpu :size="17" /></span></div><div class="metric-value">{{ devices.length }} <span>{{ t('cadastrados') }}</span></div><div class="metric-foot"><span class="metric-mark"></span>{{ t('Inventario monitorado') }}</div></article>
          <article class="metric"><div class="metric-top"><span>{{ t('Online') }}</span><span class="metric-icon green"><Signal :size="17" /></span></div><div class="metric-value">{{ onlineCount }} <span>{{ t('aparelhos') }}</span></div><div class="metric-foot positive"><Check :size="13" />{{ t('Operando normalmente') }}</div></article>
          <article class="metric"><div class="metric-top"><span>{{ t('Em atencao') }}</span><span class="metric-icon amber"><AlertTriangle :size="17" /></span></div><div class="metric-value">{{ warningCount }} <span>{{ t('aparelhos') }}</span></div><div class="metric-foot" :class="warningCount ? 'warning-text' : ''">{{ t(warningCount ? 'Requer verificacao' : 'Nenhum alerta ativo') }}</div></article>
          <article class="metric"><div class="metric-top"><span>{{ t('Offline') }}</span><span class="metric-icon rose"><Activity :size="17" /></span></div><div class="metric-value">{{ offlineCount }} <span>{{ t('aparelhos') }}</span></div><div class="metric-foot">{{ latestReadings }} {{ t('medicoes recentes') }}</div></article>
        </section>

        <section id="aparelhos" class="device-section">
          <div class="section-heading"><div><h2>{{ t('Aparelhos') }}</h2><p>{{ t('Inventario e leituras mais recentes') }}</p></div><button class="export-button" :title="t('Exportar lista')" @click="exportList"><ArrowDownToLine :size="16" /><span>{{ t('Exportar') }}</span></button></div>
          <div class="table-toolbar"><div class="table-count"><span class="count-dot"></span>{{ devices.length }} {{ t('aparelhos registrados') }}</div><label class="search-field"><Search :size="16" /><input v-model="search" type="search" :placeholder="t('Buscar aparelho...')" :aria-label="t('Buscar aparelho...')" /></label></div>
          <div v-if="filteredDevices.length" class="device-list">
            <article v-for="device in filteredDevices" :id="`device-${device.id}`" :key="device.id" class="device-card" :class="`device-card-${device.status}`">
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
                <span class="device-health-overview" :aria-label="t('Estado dos sensores')">
                  <span
                    v-for="sensor in latestSensorReadings(device.readings)"
                    :key="sensor.key"
                    class="device-health-item"
                    :class="sensor.reading ? `health-${device.status}` : 'health-missing'"
                    :title="`${sensor.name}: ${sensor.reading ? deviceStatusLabel(device.status) : t('sem leitura recebida')}`"
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
                  <span><MapPin :size="14" /><strong>{{ t('Localizacao') }}</strong>{{ device.location || t('Nao informado') }}</span>
                  <span><Cpu :size="14" /><strong>{{ t('Identificador') }}</strong>{{ device.externalId }}</span>
                  <span><Clock3 :size="14" /><strong>{{ t('Ultimo contato') }}</strong>{{ formatTime(device.lastSeenAt) }}</span>
                </div>
                <div class="device-readings-detail">
                  <article v-for="sensor in latestSensorReadings(device.readings)" :key="sensor.key" class="sensor-detail-card">
                    <div class="sensor-detail-label"><component :is="readingIcon(sensor.key)" :size="15" />{{ sensor.name }}</div>
                    <strong>{{ sensor.reading ? `${sensor.reading.value} ${sensor.reading.unit}` : t('Sem leitura') }}</strong>
                    <span v-if="sensor.reading" class="sensor-reading-time">{{ formatTime(sensor.reading.recordedAt) }}</span>
                  </article>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="empty-state">
            <span class="empty-icon"><Cpu :size="22" /></span>
            <strong>{{ t(search ? 'Nenhum aparelho encontrado' : 'Nenhum aparelho conectado') }}</strong>
            <span>{{ t(search ? 'Tente outro termo de busca.' : 'Os aparelhos aparecerao aqui quando enviarem dados.') }}</span>
          </div>
          <div class="table-footer"><span>{{ t('Exibindo') }} {{ filteredDevices.length }} {{ t('de') }} {{ devices.length }} {{ t('aparelhos') }}</span><span><span class="live-dot"></span> {{ t('Sincronizacao a cada 30 segundos') }}</span></div>
        </section>
        <footer class="dashboard-footer"><span>LAB / MONITOR <b>·</b> {{ t('Monitoramento de laboratorio') }}</span><span>{{ t('Dados atualizados em tempo real') }}</span></footer>
      </main>
    </section>

    <nav class="mobile-nav" :aria-label="t('Navegacao principal')">
      <a class="mobile-nav-item" :class="{ active: activeMobileTab === 'home' }" href="#inicio" :aria-current="activeMobileTab === 'home' ? 'page' : undefined">
        <LayoutDashboard :size="20" /><span>{{ t('Inicio') }}</span>
      </a>
      <a class="mobile-nav-item" :class="{ active: activeMobileTab === 'devices' }" href="#aparelhos" :aria-current="activeMobileTab === 'devices' ? 'page' : undefined">
        <Cpu :size="20" /><span>{{ t('Aparelhos') }}</span>
      </a>
      <button class="mobile-nav-item" type="button" :disabled="loading" @click="loadDevices">
        <RefreshCw :size="19" /><span>{{ t('Atualizar') }}</span>
      </button>
      <button class="mobile-nav-item" type="button" @click="logout">
        <LogOut :size="19" /><span>{{ t('Sair') }}</span>
      </button>
    </nav>

    <div v-if="settingsOpen" class="settings-overlay" @click.self="settingsOpen = false">
      <section class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
        <header class="settings-header">
          <div><p class="eyebrow">{{ t('SUA CONTA') }}</p><h2 id="settingsTitle">{{ t('Configuracoes') }}</h2></div>
          <button class="icon-button" type="button" :aria-label="t('Fechar configuracoes')" @click="settingsOpen = false"><X :size="19" /></button>
        </header>

        <nav class="settings-tabs" role="tablist" :aria-label="t('Configurações')">
          <button class="settings-tab" :class="{ active: settingsTab === 'preferences' }" type="button" role="tab" :aria-selected="settingsTab === 'preferences'" @click="settingsTab = 'preferences'">{{ t('Preferências') }}</button>
          <button class="settings-tab" :class="{ active: settingsTab === 'account' }" type="button" role="tab" :aria-selected="settingsTab === 'account'" @click="settingsTab = 'account'">{{ t('Conta') }}</button>
          <button class="settings-tab" :class="{ active: settingsTab === 'notifications' }" type="button" role="tab" :aria-selected="settingsTab === 'notifications'" @click="settingsTab = 'notifications'">{{ t('Notificações') }}</button>
        </nav>

        <div v-if="settingsTab === 'preferences'" class="settings-pane">
          <label class="theme-setting">
            <span class="theme-setting-icon"><Moon v-if="!darkMode" :size="18" /><Sun v-else :size="18" /></span>
            <span class="theme-setting-copy"><strong>{{ t('Modo escuro') }}</strong><small>{{ t('Aparencia salva neste navegador') }}</small></span>
            <input class="theme-switch" type="checkbox" :checked="darkMode" @change="toggleDarkMode" />
          </label>
          <div class="language-setting">
            <div class="theme-setting-copy"><strong>{{ t('Idioma da dashboard') }}</strong><small>{{ t('Escolha o idioma da interface') }}</small></div>
            <div class="language-options" role="group" :aria-label="t('Idioma da dashboard')">
              <button class="language-option" :class="{ active: language === 'pt-BR' }" type="button" :aria-pressed="language === 'pt-BR'" @click="setLanguage('pt-BR')"><img class="language-option-flag" src="/flags/br.svg" alt="" />{{ t('Português') }}</button>
              <button class="language-option" :class="{ active: language === 'en' }" type="button" :aria-pressed="language === 'en'" @click="setLanguage('en')"><img class="language-option-flag" src="/flags/gb.svg" alt="" />{{ t('English') }}</button>
            </div>
          </div>
        </div>

        <div v-else-if="settingsTab === 'account'" class="settings-pane">
          <div class="account-settings-form">
            <div class="settings-section-heading"><h3>{{ t('Perfil') }}</h3><span>{{ t('Confirme sua senha para salvar') }}</span></div>
            <div class="avatar-editor">
              <img v-if="profileAvatar" class="settings-avatar" :src="profileAvatar" :alt="t('Foto do perfil')" />
              <span v-else class="settings-avatar settings-avatar-fallback">{{ profileName.slice(0, 1).toUpperCase() || '?' }}</span>
              <label class="secondary-button avatar-upload-button" for="avatarFile">{{ t('Alterar foto') }}</label>
              <input id="avatarFile" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" @change="selectAvatar" />
              <button v-if="profileAvatar" class="text-button remove-avatar-button" type="button" @click="profileAvatar = null">{{ t('Remover foto') }}</button>
            </div>
            <p v-if="avatarError" class="error-message" role="alert">{{ t(avatarError) }}</p>
            <label for="profileName">{{ t('Nome') }}</label>
            <input id="profileName" v-model="profileName" class="settings-input" type="text" maxlength="80" autocomplete="name" />
            <label for="profileEmail">{{ t('E-mail') }}</label>
            <input id="profileEmail" v-model="profileEmail" class="settings-input" type="email" maxlength="254" autocomplete="email" />
            <label for="currentPassword">{{ t('Senha atual') }}</label>
            <input id="currentPassword" v-model="currentPassword" class="settings-input" type="password" autocomplete="current-password" />
            <div v-if="accountError" class="error-message" role="alert">{{ t(accountError) }}</div>
            <div v-if="accountMessage" class="success-message" role="status">{{ t(accountMessage) }}</div>
            <button class="primary-button settings-save-button" type="button" :disabled="accountSaving" @click="updateProfile">{{ accountSaving ? t('Salvando...') : t('Salvar perfil') }}</button>
          </div>
          <form class="account-settings-form password-settings-form" @submit.prevent="updatePassword">
            <div class="settings-section-heading"><h3>{{ t('Senha') }}</h3><span>{{ t('Use pelo menos 12 caracteres') }}</span></div>
            <label for="newPassword">{{ t('Nova senha') }}</label>
            <input id="newPassword" v-model="newPassword" class="settings-input" type="password" minlength="12" autocomplete="new-password" required />
            <label for="newPasswordConfirm">{{ t('Confirme a nova senha') }}</label>
            <input id="newPasswordConfirm" v-model="newPasswordConfirm" class="settings-input" type="password" minlength="12" autocomplete="new-password" required />
            <button class="secondary-button settings-save-button" type="submit" :disabled="accountSaving">{{ t('Alterar senha') }}</button>
          </form>
        </div>

        <form v-else class="settings-pane account-settings-form" @submit.prevent="updateNotificationPreferences">
          <div class="settings-section-heading"><h3>{{ t('Alertas de alarmes') }}</h3><span>{{ t('Preferências de envio') }}</span></div>
          <label class="theme-setting">
            <span class="theme-setting-icon"><Mail :size="18" /></span>
            <span class="theme-setting-copy"><strong>{{ t('Notificações por e-mail') }}</strong><small>{{ t('Enviadas para ') }}{{ profileEmail || t('o e-mail da conta') }}</small></span>
            <input v-model="profileEmailNotifications" class="theme-switch" type="checkbox" />
          </label>
          <label class="theme-setting">
            <span class="theme-setting-icon"><MessageCircle :size="18" /></span>
            <span class="theme-setting-copy"><strong>{{ t('Notificações por WhatsApp') }}</strong><small>{{ t('É necessário cadastrar o número e ativar o canal') }}</small></span>
            <input v-model="profileWhatsappNotifications" class="theme-switch" type="checkbox" />
          </label>
          <label for="profileWhatsappNumber">{{ t('WhatsApp (formato internacional)') }}</label>
          <input id="profileWhatsappNumber" v-model="profileWhatsappNumber" class="settings-input" type="tel" maxlength="24" autocomplete="tel" placeholder="+5521999999999" />
          <p class="settings-help">{{ t('Use o formato E.164, incluindo o código do país (por exemplo, +55...). O WhatsApp requer uma conta Meta Cloud API configurada pelo administrador.') }}</p>
          <label for="notificationCurrentPassword">{{ t('Senha atual') }}</label>
          <input id="notificationCurrentPassword" v-model="notificationCurrentPassword" class="settings-input" type="password" autocomplete="current-password" required />
          <div v-if="notificationError" class="error-message" role="alert">{{ t(notificationError) }}</div>
          <div v-if="notificationMessage" class="success-message" role="status">{{ t(notificationMessage) }}</div>
          <button class="primary-button settings-save-button" type="submit" :disabled="accountSaving">{{ accountSaving ? t('Salvando...') : t('Salvar notificações') }}</button>
        </form>
      </section>
    </div>
  </div>
</template>
