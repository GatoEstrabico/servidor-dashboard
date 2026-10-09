import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Activity, AlertTriangle, ArrowDownToLine, Bell, Check, ChevronDown, CircleAlert, CircleCheck, CircleMinus, Clock3, Cpu, Flame, LayoutDashboard, LoaderCircle, LogOut, Mail, MapPin, MessageCircle, Moon, RefreshCw, Search, ShieldCheck, Signal, Sun, Thermometer, Waves, X } from 'lucide-vue-next';
const user = ref(null);
const devices = ref([]);
const notifications = ref([]);
const notificationOpen = ref(false);
const csrfToken = ref('');
const email = ref('');
const password = ref('');
const search = ref('');
const loginError = ref('');
const pageError = ref('');
const loading = ref(true);
const submitting = ref(false);
const loginMode = ref('login');
const forgotEmail = ref('');
const forgotMessage = ref('');
const forgotError = ref('');
const resetPasswordValue = ref('');
const resetPasswordConfirm = ref('');
const resetMessage = ref('');
const resetError = ref('');
const resetToken = ref('');
const settingsOpen = ref(false);
const settingsTab = ref('preferences');
const language = ref('pt-BR');
const darkMode = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const newPasswordConfirm = ref('');
const accountMessage = ref('');
const accountError = ref('');
const accountSaving = ref(false);
const profileName = ref('');
const profileEmail = ref('');
const profileAvatar = ref(null);
const profileWhatsappNumber = ref('');
const profileEmailNotifications = ref(true);
const profileWhatsappNotifications = ref(false);
const notificationCurrentPassword = ref('');
const notificationMessage = ref('');
const notificationError = ref('');
const avatarError = ref('');
const refreshedAt = ref(new Date());
const activeMobileTab = ref('home');
const expandedDeviceIds = ref([]);
let refreshTimer;
let knownDeviceStatuses;
let notificationSequence = 0;
let deviceRefreshInProgress = false;
const englishText = {
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
function t(text) {
    return language.value === 'en' ? englishText[text] ?? text : text;
}
const dateLocale = computed(() => language.value === 'en' ? 'en-GB' : 'pt-BR');
const reportDate = computed(() => new Intl.DateTimeFormat(dateLocale.value, {
    weekday: 'long', day: 'numeric', month: 'long'
}).format(new Date()));
const filteredDevices = computed(() => {
    const query = search.value.trim().toLocaleLowerCase('pt-BR');
    if (!query)
        return devices.value;
    return devices.value.filter((device) => `${device.name} ${device.externalId} ${device.location ?? ''}`.toLocaleLowerCase('pt-BR').includes(query));
});
const onlineCount = computed(() => devices.value.filter((device) => device.status === 'online').length);
const warningCount = computed(() => devices.value.filter((device) => device.status === 'warning').length);
const offlineCount = computed(() => devices.value.filter((device) => device.status === 'offline').length);
const latestReadings = computed(() => devices.value.reduce((total, device) => total + device.readings.length, 0));
const unreadNotificationCount = computed(() => notifications.value.filter((notification) => !notification.read).length);
async function api(path, options = {}) {
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
    return response.json();
}
async function loadDevices() {
    if (!user.value || deviceRefreshInProgress)
        return;
    deviceRefreshInProgress = true;
    try {
        const result = await api('/api/devices');
        const newNotifications = [];
        if (knownDeviceStatuses) {
            for (const device of result.devices) {
                const previousStatus = knownDeviceStatuses.get(device.id);
                if (previousStatus === device.status || (previousStatus === undefined && device.status === 'online'))
                    continue;
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
    }
    catch (error) {
        pageError.value = error instanceof Error ? error.message : 'Falha ao atualizar aparelhos.';
    }
    finally {
        deviceRefreshInProgress = false;
    }
}
function markAllNotificationsRead() {
    notifications.value = notifications.value.map((notification) => ({ ...notification, read: true }));
}
function openDeviceNotification(notification) {
    notification.read = true;
    notificationOpen.value = false;
    if (!devices.value.some((device) => device.id === notification.deviceId))
        return;
    search.value = '';
    if (!expandedDeviceIds.value.includes(notification.deviceId)) {
        expandedDeviceIds.value = [...expandedDeviceIds.value, notification.deviceId];
    }
    window.setTimeout(() => {
        document.getElementById(`device-${notification.deviceId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
}
function notificationMessageInEnglish(notification) {
    if (notification.status === 'online')
        return `Device ${notification.deviceName} is back online.`;
    if (notification.status === 'warning')
        return `Device ${notification.deviceName} requires attention.`;
    return `Device ${notification.deviceName} is offline.`;
}
function handleNotificationOutsideClick(event) {
    if (!(event.target instanceof Element) || !event.target.closest('.notification-wrap')) {
        notificationOpen.value = false;
    }
}
function handleNotificationKeydown(event) {
    if (event.key === 'Escape')
        notificationOpen.value = false;
}
async function checkSession() {
    try {
        const result = await api('/api/auth/me');
        user.value = result.user;
        csrfToken.value = result.csrfToken;
        syncProfileForm();
        await loadDevices();
    }
    catch {
        user.value = null;
    }
    finally {
        loading.value = false;
    }
}
async function login() {
    submitting.value = true;
    loginError.value = '';
    try {
        const result = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: email.value, password: password.value })
        });
        user.value = result.user;
        csrfToken.value = result.csrfToken;
        password.value = '';
        await loadDevices();
    }
    catch (error) {
        loginError.value = error instanceof Error ? error.message : 'Falha ao entrar.';
    }
    finally {
        submitting.value = false;
    }
}
async function requestPasswordReset() {
    submitting.value = true;
    forgotError.value = '';
    forgotMessage.value = '';
    try {
        const result = await api('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email: forgotEmail.value })
        });
        forgotMessage.value = result.message;
    }
    catch (error) {
        forgotError.value = error instanceof Error ? error.message : 'Nao foi possivel solicitar a redefinicao.';
    }
    finally {
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
        const result = await api('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token: resetToken.value, password: resetPasswordValue.value })
        });
        resetMessage.value = result.message;
        resetPasswordValue.value = '';
        resetPasswordConfirm.value = '';
        window.history.replaceState({}, '', window.location.pathname);
    }
    catch (error) {
        resetError.value = error instanceof Error ? error.message : 'Link invalido ou expirado.';
    }
    finally {
        submitting.value = false;
    }
}
function syncProfileForm() {
    if (!user.value)
        return;
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
    if (!user.value)
        return;
    accountSaving.value = true;
    accountMessage.value = '';
    accountError.value = '';
    try {
        const result = await api('/api/account/profile', {
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
    }
    catch (error) {
        accountError.value = error instanceof Error ? error.message : 'Nao foi possivel atualizar o perfil.';
    }
    finally {
        accountSaving.value = false;
    }
}
async function updateNotificationPreferences() {
    if (!user.value)
        return;
    notificationMessage.value = '';
    notificationError.value = '';
    if (!notificationCurrentPassword.value) {
        notificationError.value = 'Informe sua senha atual para salvar.';
        return;
    }
    accountSaving.value = true;
    try {
        const result = await api('/api/account/profile', {
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
    }
    catch (error) {
        notificationError.value = error instanceof Error ? t(error.message) : t('Nao foi possivel atualizar o perfil.');
    }
    finally {
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
        const result = await api('/api/account/password', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ currentPassword: currentPassword.value, newPassword: newPassword.value })
        });
        accountMessage.value = result.message;
        currentPassword.value = '';
        newPassword.value = '';
        newPasswordConfirm.value = '';
    }
    catch (error) {
        accountError.value = error instanceof Error ? error.message : 'Nao foi possivel alterar a senha.';
    }
    finally {
        accountSaving.value = false;
    }
}
async function selectAvatar(event) {
    const input = event.target;
    const file = input.files?.[0];
    avatarError.value = '';
    if (!file)
        return;
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
        if (!context)
            throw new Error('Canvas indisponivel.');
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        profileAvatar.value = canvas.toDataURL('image/webp', 0.78);
    }
    catch {
        avatarError.value = 'Nao foi possivel processar essa imagem.';
    }
    finally {
        input.value = '';
    }
}
function toggleDarkMode() {
    darkMode.value = !darkMode.value;
    localStorage.setItem('lab-monitor-dark-mode', String(darkMode.value));
    document.documentElement.classList.toggle('dark-mode', darkMode.value);
}
function setLanguage(nextLanguage) {
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
    }
    catch (error) {
        pageError.value = error instanceof Error ? error.message : 'Nao foi possivel encerrar a sessao. Tente novamente.';
    }
}
function formatTime(value) {
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
function readingIcon(type) {
    const normalizedType = type.toLocaleLowerCase('pt-BR');
    if (normalizedType.includes('temper'))
        return Thermometer;
    if (normalizedType.includes('umid'))
        return Waves;
    if (normalizedType.includes('gas') || normalizedType.includes('gás'))
        return Flame;
    return Activity;
}
function latestSensorReadings(readings) {
    const sensors = [
        { key: 'temperatura', name: t('Temperatura'), shortName: t('Temp.'), matches: (type) => type.includes('temper') },
        { key: 'umidade', name: t('Umidade'), shortName: t('Umidade'), matches: (type) => type.includes('umid') },
        { key: 'gas', name: t('Gás'), shortName: t('Gás'), matches: (type) => type.includes('gas') || type.includes('gás') }
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
function isDeviceExpanded(deviceId) {
    return expandedDeviceIds.value.includes(deviceId);
}
function toggleDevice(deviceId) {
    expandedDeviceIds.value = isDeviceExpanded(deviceId)
        ? expandedDeviceIds.value.filter((id) => id !== deviceId)
        : [...expandedDeviceIds.value, deviceId];
}
function deviceStatusIcon(status) {
    if (status === 'online')
        return CircleCheck;
    if (status === 'warning')
        return CircleAlert;
    return CircleMinus;
}
function deviceStatusLabel(status) {
    if (status === 'online')
        return t('Online');
    if (status === 'warning')
        return t('Atencao');
    return t('Offline');
}
function syncMobileTab() {
    const devicesSection = document.getElementById('aparelhos');
    if (devicesSection)
        activeMobileTab.value = devicesSection.getBoundingClientRect().top <= window.innerHeight * 0.45 ? 'devices' : 'home';
}
onMounted(() => {
    darkMode.value = localStorage.getItem('lab-monitor-dark-mode') === 'true';
    document.documentElement.classList.toggle('dark-mode', darkMode.value);
    language.value = localStorage.getItem('lab-monitor-language') === 'en' ? 'en' : 'pt-BR';
    resetToken.value = new URLSearchParams(window.location.search).get('resetToken') ?? '';
    if (resetToken.value) {
        loginMode.value = 'reset';
        loading.value = false;
    }
    else {
        void checkSession();
    }
    refreshTimer = setInterval(() => void loadDevices(), 30000);
    window.addEventListener('scroll', syncMobileTab, { passive: true });
    window.addEventListener('hashchange', syncMobileTab);
    document.addEventListener('click', handleNotificationOutsideClick);
    window.addEventListener('keydown', handleNotificationKeydown);
});
onUnmounted(() => {
    if (refreshTimer)
        clearInterval(refreshTimer);
    window.removeEventListener('scroll', syncMobileTab);
    window.removeEventListener('hashchange', syncMobileTab);
    document.removeEventListener('click', handleNotificationOutsideClick);
    window.removeEventListener('keydown', handleNotificationKeydown);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: "loading-screen" },
        'aria-label': (__VLS_ctx.t('Carregando')),
    });
    const __VLS_0 = {}.LoaderCircle;
    /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ class: "spin" },
        size: (28),
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "spin" },
        size: (28),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Conectando ao monitoramento'));
}
else if (!__VLS_ctx.user) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: "login-layout" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "login-story" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "story-top" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        ...{ class: "uerj-logo login-logo" },
        src: "/logo.jpg",
        alt: (__VLS_ctx.t('Universidade do Estado do Rio de Janeiro')),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "story-copy" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "eyebrow" },
    });
    (__VLS_ctx.t('SISTEMA DE MONITORAMENTO'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    (__VLS_ctx.t('O seu laboratório, em tempo real.'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.t('Dados confiáveis para um ambiente sob controle.'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "story-foot" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "live-dot" },
    });
    (__VLS_ctx.t('SISTEMAS OPERACIONAIS'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('PLATAFORMA SEGURA'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "orbit orbit-one" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "orbit orbit-two" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "login-side" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.login) },
        ...{ class: "login-form" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mobile-brand" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        ...{ class: "uerj-logo" },
        src: "/logo.jpg",
        alt: "UERJ",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    if (__VLS_ctx.loginMode === 'login') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "eyebrow" },
        });
        (__VLS_ctx.t('ACESSO RESTRITO'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        (__VLS_ctx.t('Bem-vindo de volta'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "form-subtitle" },
        });
        (__VLS_ctx.t('Entre para acompanhar os aparelhos do laboratório.'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "email",
        });
        (__VLS_ctx.t('E-mail'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "email",
            type: "email",
            autocomplete: "username",
            placeholder: (__VLS_ctx.language === 'en' ? 'you@laboratory.com' : 'voce@laboratorio.com'),
            required: true,
        });
        (__VLS_ctx.email);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "password",
        });
        (__VLS_ctx.t('Senha'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "password",
            type: "password",
            autocomplete: "current-password",
            placeholder: (__VLS_ctx.t('Sua senha')),
            required: true,
        });
        (__VLS_ctx.password);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.loginMode === 'login'))
                        return;
                    __VLS_ctx.loginMode = 'forgot';
                    __VLS_ctx.forgotEmail = __VLS_ctx.email;
                } },
            ...{ class: "text-button forgot-link" },
            type: "button",
        });
        (__VLS_ctx.t('Esqueci a senha'));
        if (__VLS_ctx.loginError) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "error-message" },
                role: "alert",
            });
            (__VLS_ctx.loginError);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ class: "primary-button login-button" },
            type: "submit",
            disabled: (__VLS_ctx.submitting),
        });
        if (__VLS_ctx.submitting) {
            const __VLS_4 = {}.LoaderCircle;
            /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
            // @ts-ignore
            const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
                ...{ class: "spin" },
                size: (17),
            }));
            const __VLS_6 = __VLS_5({
                ...{ class: "spin" },
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_5));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.submitting ? __VLS_ctx.t('Entrando...') : __VLS_ctx.t('Entrar'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "secure-note" },
        });
        const __VLS_8 = {}.ShieldCheck;
        /** @type {[typeof __VLS_components.ShieldCheck, ]} */ ;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
            size: (16),
        }));
        const __VLS_10 = __VLS_9({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('Sessao protegida com criptografia'));
    }
    else if (__VLS_ctx.loginMode === 'forgot') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.loginMode === 'login'))
                        return;
                    if (!(__VLS_ctx.loginMode === 'forgot'))
                        return;
                    __VLS_ctx.loginMode = 'login';
                    __VLS_ctx.forgotError = '';
                    __VLS_ctx.forgotMessage = '';
                } },
            ...{ class: "back-link" },
            type: "button",
        });
        const __VLS_12 = {}.ChevronDown;
        /** @type {[typeof __VLS_components.ChevronDown, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
            size: (16),
        }));
        const __VLS_14 = __VLS_13({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        (__VLS_ctx.t('Voltar ao login'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "eyebrow" },
        });
        (__VLS_ctx.t('RECUPERACAO DE CONTA'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        (__VLS_ctx.t('Redefinir senha'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "form-subtitle" },
        });
        (__VLS_ctx.t('Informe o e-mail da sua conta. Se estiver cadastrado, enviaremos um link de redefinicao.'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "forgotEmail",
        });
        (__VLS_ctx.t('E-mail'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "forgotEmail",
            type: "email",
            autocomplete: "email",
            placeholder: (__VLS_ctx.language === 'en' ? 'you@laboratory.com' : 'voce@laboratorio.com'),
            required: true,
        });
        (__VLS_ctx.forgotEmail);
        if (__VLS_ctx.forgotError) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "error-message" },
                role: "alert",
            });
            (__VLS_ctx.forgotError);
        }
        if (__VLS_ctx.forgotMessage) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "success-message" },
                role: "status",
            });
            (__VLS_ctx.forgotMessage);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.requestPasswordReset) },
            ...{ class: "primary-button login-button" },
            type: "button",
            disabled: (__VLS_ctx.submitting),
        });
        if (__VLS_ctx.submitting) {
            const __VLS_16 = {}.LoaderCircle;
            /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
            // @ts-ignore
            const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
                ...{ class: "spin" },
                size: (17),
            }));
            const __VLS_18 = __VLS_17({
                ...{ class: "spin" },
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_17));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('Enviar link'));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "eyebrow" },
        });
        (__VLS_ctx.t('RECUPERACAO DE CONTA'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        (__VLS_ctx.t('Escolha uma nova senha'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "form-subtitle" },
        });
        (__VLS_ctx.t('O link de redefinicao e valido por 30 minutos e pode ser usado uma vez.'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "resetPassword",
        });
        (__VLS_ctx.t('Nova senha'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "resetPassword",
            type: "password",
            autocomplete: "new-password",
            minlength: "12",
            placeholder: (__VLS_ctx.t('Pelo menos 12 caracteres')),
            required: true,
        });
        (__VLS_ctx.resetPasswordValue);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "resetPasswordConfirm",
        });
        (__VLS_ctx.t('Confirme a nova senha'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "resetPasswordConfirm",
            type: "password",
            autocomplete: "new-password",
            minlength: "12",
            placeholder: (__VLS_ctx.t('Repita a senha')),
            required: true,
        });
        (__VLS_ctx.resetPasswordConfirm);
        if (__VLS_ctx.resetError) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "error-message" },
                role: "alert",
            });
            (__VLS_ctx.resetError);
        }
        if (__VLS_ctx.resetMessage) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "success-message" },
                role: "status",
            });
            (__VLS_ctx.resetMessage);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.submitPasswordReset) },
            ...{ class: "primary-button login-button" },
            type: "button",
            disabled: (__VLS_ctx.submitting || !!__VLS_ctx.resetMessage),
        });
        if (__VLS_ctx.submitting) {
            const __VLS_20 = {}.LoaderCircle;
            /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
                ...{ class: "spin" },
                size: (17),
            }));
            const __VLS_22 = __VLS_21({
                ...{ class: "spin" },
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('Salvar nova senha'));
        if (__VLS_ctx.resetMessage) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(!__VLS_ctx.user))
                            return;
                        if (!!(__VLS_ctx.loginMode === 'login'))
                            return;
                        if (!!(__VLS_ctx.loginMode === 'forgot'))
                            return;
                        if (!(__VLS_ctx.resetMessage))
                            return;
                        __VLS_ctx.loginMode = 'login';
                    } },
                ...{ class: "text-button" },
                type: "button",
            });
            (__VLS_ctx.t('Ir para o login'));
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({
        ...{ class: "login-footer" },
    });
    (__VLS_ctx.t('MONITORAMENTO DE LABORATORIO'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "app-shell" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
        ...{ class: "sidebar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "brand" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "brand-mark" },
    });
    const __VLS_24 = {}.Activity;
    /** @type {[typeof __VLS_components.Activity, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        size: (18),
    }));
    const __VLS_26 = __VLS_25({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "brand-light" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "workspace-label" },
    });
    (__VLS_ctx.t('AMBIENTE'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "workspace-switch" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "workspace-avatar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "workspace-name" },
    });
    (__VLS_ctx.t('Laboratorio Central'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    (__VLS_ctx.t('Plano operacional'));
    const __VLS_28 = {}.ChevronDown;
    /** @type {[typeof __VLS_components.ChevronDown, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        size: (15),
    }));
    const __VLS_30 = __VLS_29({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "nav-label" },
    });
    (__VLS_ctx.t('GERENCIAMENTO'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        ...{ class: "nav-link active" },
        href: "#inicio",
    });
    const __VLS_32 = {}.LayoutDashboard;
    /** @type {[typeof __VLS_components.LayoutDashboard, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        size: (17),
    }));
    const __VLS_34 = __VLS_33({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Visao geral'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "nav-count" },
    });
    (__VLS_ctx.devices.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "sidebar-bottom" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "sidebar-status" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "live-dot" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    (__VLS_ctx.t('API conectada'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    (__VLS_ctx.t('Atualizacao automatica'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "status-ping" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "account-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "account-avatar" },
    });
    if (__VLS_ctx.user.avatarDataUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (__VLS_ctx.user.avatarDataUrl),
            alt: "",
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.user.displayName.slice(0, 1).toUpperCase());
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "account-info" },
    });
    (__VLS_ctx.user.displayName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    (__VLS_ctx.user.email);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.logout) },
        ...{ class: "icon-button sidebar-logout" },
        title: (__VLS_ctx.t('Sair')),
        'aria-label': (__VLS_ctx.t('Sair')),
    });
    const __VLS_36 = {}.LogOut;
    /** @type {[typeof __VLS_components.LogOut, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        size: (17),
    }));
    const __VLS_38 = __VLS_37({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "main-area" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
        ...{ class: "topbar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "breadcrumb" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        ...{ class: "dashboard-logo" },
        src: "/logo.jpg",
        alt: "UERJ",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Monitoramento'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.t('Visao geral'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "top-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "last-update" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "live-dot" },
    });
    (__VLS_ctx.t('Atualizado'));
    (__VLS_ctx.formatRefreshTime());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "language-flags" },
        role: "group",
        'aria-label': (__VLS_ctx.t('Idioma')),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(!__VLS_ctx.user))
                    return;
                __VLS_ctx.setLanguage('pt-BR');
            } },
        ...{ class: "language-flag" },
        ...{ class: ({ active: __VLS_ctx.language === 'pt-BR' }) },
        type: "button",
        'aria-label': (__VLS_ctx.t('Português (Brasil)')),
        'aria-pressed': (__VLS_ctx.language === 'pt-BR'),
        title: (__VLS_ctx.t('Português (Brasil)')),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        ...{ class: "language-flag-image" },
        src: "/flags/br.svg",
        alt: "",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(!__VLS_ctx.user))
                    return;
                __VLS_ctx.setLanguage('en');
            } },
        ...{ class: "language-flag" },
        ...{ class: ({ active: __VLS_ctx.language === 'en' }) },
        type: "button",
        'aria-label': (__VLS_ctx.t('Inglês (Reino Unido)')),
        'aria-pressed': (__VLS_ctx.language === 'en'),
        title: (__VLS_ctx.t('Inglês (Reino Unido)')),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        ...{ class: "language-flag-image" },
        src: "/flags/gb.svg",
        alt: "",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "notification-wrap" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(!__VLS_ctx.user))
                    return;
                __VLS_ctx.notificationOpen = !__VLS_ctx.notificationOpen;
            } },
        ...{ class: "icon-button notification-button" },
        type: "button",
        title: (`${__VLS_ctx.t('Notificações')}${__VLS_ctx.unreadNotificationCount ? `: ${__VLS_ctx.unreadNotificationCount} ${__VLS_ctx.t('não lidas')}` : ''}`),
        'aria-label': (`${__VLS_ctx.t('Notificações')}${__VLS_ctx.unreadNotificationCount ? `, ${__VLS_ctx.unreadNotificationCount} ${__VLS_ctx.t('não lidas')}` : ''}`),
        'aria-expanded': (__VLS_ctx.notificationOpen),
        'aria-haspopup': "dialog",
    });
    const __VLS_40 = {}.Bell;
    /** @type {[typeof __VLS_components.Bell, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        size: (18),
    }));
    const __VLS_42 = __VLS_41({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    if (__VLS_ctx.unreadNotificationCount) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "notification-count" },
        });
        (__VLS_ctx.unreadNotificationCount > 99 ? '99+' : __VLS_ctx.unreadNotificationCount);
    }
    if (__VLS_ctx.notificationOpen) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "notification-panel" },
            role: "dialog",
            'aria-label': (__VLS_ctx.t('Notificações')),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
            ...{ class: "notification-panel-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        (__VLS_ctx.t('Notificações'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.unreadNotificationCount ? `${__VLS_ctx.unreadNotificationCount} ${__VLS_ctx.t('não lidas')}` : __VLS_ctx.t('Todas as notificações foram lidas'));
        if (__VLS_ctx.unreadNotificationCount) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.markAllNotificationsRead) },
                ...{ class: "notification-read-all" },
                type: "button",
            });
            (__VLS_ctx.t('Marcar todas como lidas'));
        }
        if (__VLS_ctx.notifications.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "notification-list" },
                role: "list",
            });
            for (const [notification] of __VLS_getVForSourceType((__VLS_ctx.notifications))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (notification.id),
                    role: "listitem",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(!__VLS_ctx.user))
                                return;
                            if (!(__VLS_ctx.notificationOpen))
                                return;
                            if (!(__VLS_ctx.notifications.length))
                                return;
                            __VLS_ctx.openDeviceNotification(notification);
                        } },
                    ...{ class: "notification-item" },
                    ...{ class: ([{ 'notification-unread': !notification.read }, `notification-${notification.status}`]) },
                    type: "button",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "notification-icon" },
                });
                if (notification.status === 'online') {
                    const __VLS_44 = {}.CircleCheck;
                    /** @type {[typeof __VLS_components.CircleCheck, ]} */ ;
                    // @ts-ignore
                    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
                        size: (17),
                    }));
                    const __VLS_46 = __VLS_45({
                        size: (17),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
                }
                else {
                    const __VLS_48 = {}.AlertTriangle;
                    /** @type {[typeof __VLS_components.AlertTriangle, ]} */ ;
                    // @ts-ignore
                    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
                        size: (17),
                    }));
                    const __VLS_50 = __VLS_49({
                        size: (17),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "notification-copy" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.t(notification.title));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.language === 'en' ? __VLS_ctx.notificationMessageInEnglish(notification) : notification.message);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.time, __VLS_intrinsicElements.time)({
                    datetime: (notification.createdAt),
                });
                (__VLS_ctx.formatTime(notification.createdAt));
                if (!notification.read) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
                        ...{ class: "notification-unread-dot" },
                        'aria-hidden': "true",
                    });
                }
            }
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "notification-empty" },
            });
            const __VLS_52 = {}.Bell;
            /** @type {[typeof __VLS_components.Bell, ]} */ ;
            // @ts-ignore
            const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
                size: (22),
            }));
            const __VLS_54 = __VLS_53({
                size: (22),
            }, ...__VLS_functionalComponentArgsRest(__VLS_53));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.t('Nenhuma notificação'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Alterações nos estados dos aparelhos aparecerão aqui.'));
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.openSettings) },
        ...{ class: "account-menu-button" },
        type: "button",
        title: (__VLS_ctx.t('Configurações da conta')),
        'aria-label': (__VLS_ctx.t('Abrir configurações da conta')),
    });
    if (__VLS_ctx.user.avatarDataUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            ...{ class: "top-avatar-image" },
            src: (__VLS_ctx.user.avatarDataUrl),
            alt: "",
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "top-avatar" },
        });
        (__VLS_ctx.user.displayName.slice(0, 1).toUpperCase());
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        id: "inicio",
        ...{ class: "dashboard-content" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "page-heading" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "eyebrow" },
    });
    (__VLS_ctx.reportDate.toLocaleUpperCase(__VLS_ctx.dateLocale));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    (__VLS_ctx.t('Visao geral'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "heading-sub" },
    });
    (__VLS_ctx.t('Acompanhe a saude dos aparelhos e as ultimas medicoes.'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.loadDevices) },
        ...{ class: "secondary-button" },
        disabled: (__VLS_ctx.loading),
    });
    const __VLS_56 = {}.RefreshCw;
    /** @type {[typeof __VLS_components.RefreshCw, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        size: (16),
    }));
    const __VLS_58 = __VLS_57({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    (__VLS_ctx.t('Atualizar'));
    if (__VLS_ctx.pageError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "notice-error" },
            role: "alert",
        });
        const __VLS_60 = {}.AlertTriangle;
        /** @type {[typeof __VLS_components.AlertTriangle, ]} */ ;
        // @ts-ignore
        const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
            size: (17),
        }));
        const __VLS_62 = __VLS_61({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_61));
        (__VLS_ctx.pageError);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "metrics-grid" },
        'aria-label': (__VLS_ctx.t('Resumo dos aparelhos')),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "metric metric-total" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-top" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Total de aparelhos'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "metric-icon" },
    });
    const __VLS_64 = {}.Cpu;
    /** @type {[typeof __VLS_components.Cpu, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        size: (17),
    }));
    const __VLS_66 = __VLS_65({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-value" },
    });
    (__VLS_ctx.devices.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('cadastrados'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-foot" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "metric-mark" },
    });
    (__VLS_ctx.t('Inventario monitorado'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "metric" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-top" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Online'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "metric-icon green" },
    });
    const __VLS_68 = {}.Signal;
    /** @type {[typeof __VLS_components.Signal, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        size: (17),
    }));
    const __VLS_70 = __VLS_69({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-value" },
    });
    (__VLS_ctx.onlineCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('aparelhos'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-foot positive" },
    });
    const __VLS_72 = {}.Check;
    /** @type {[typeof __VLS_components.Check, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        size: (13),
    }));
    const __VLS_74 = __VLS_73({
        size: (13),
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    (__VLS_ctx.t('Operando normalmente'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "metric" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-top" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Em atencao'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "metric-icon amber" },
    });
    const __VLS_76 = {}.AlertTriangle;
    /** @type {[typeof __VLS_components.AlertTriangle, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        size: (17),
    }));
    const __VLS_78 = __VLS_77({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-value" },
    });
    (__VLS_ctx.warningCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('aparelhos'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-foot" },
        ...{ class: (__VLS_ctx.warningCount ? 'warning-text' : '') },
    });
    (__VLS_ctx.t(__VLS_ctx.warningCount ? 'Requer verificacao' : 'Nenhum alerta ativo'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "metric" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-top" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Offline'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "metric-icon rose" },
    });
    const __VLS_80 = {}.Activity;
    /** @type {[typeof __VLS_components.Activity, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        size: (17),
    }));
    const __VLS_82 = __VLS_81({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-value" },
    });
    (__VLS_ctx.offlineCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('aparelhos'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-foot" },
    });
    (__VLS_ctx.latestReadings);
    (__VLS_ctx.t('medicoes recentes'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        id: "aparelhos",
        ...{ class: "device-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-heading" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    (__VLS_ctx.t('Aparelhos'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.t('Inventario e leituras mais recentes'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.exportList) },
        ...{ class: "export-button" },
        title: (__VLS_ctx.t('Exportar lista')),
    });
    const __VLS_84 = {}.ArrowDownToLine;
    /** @type {[typeof __VLS_components.ArrowDownToLine, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        size: (16),
    }));
    const __VLS_86 = __VLS_85({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Exportar'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "table-toolbar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "table-count" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "count-dot" },
    });
    (__VLS_ctx.devices.length);
    (__VLS_ctx.t('aparelhos registrados'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "search-field" },
    });
    const __VLS_88 = {}.Search;
    /** @type {[typeof __VLS_components.Search, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        size: (16),
    }));
    const __VLS_90 = __VLS_89({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "search",
        placeholder: (__VLS_ctx.t('Buscar aparelho...')),
        'aria-label': (__VLS_ctx.t('Buscar aparelho...')),
    });
    (__VLS_ctx.search);
    if (__VLS_ctx.filteredDevices.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "device-list" },
        });
        for (const [device] of __VLS_getVForSourceType((__VLS_ctx.filteredDevices))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                id: (`device-${device.id}`),
                key: (device.id),
                ...{ class: "device-card" },
                ...{ class: (`device-card-${device.status}`) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(!__VLS_ctx.user))
                            return;
                        if (!(__VLS_ctx.filteredDevices.length))
                            return;
                        __VLS_ctx.toggleDevice(device.id);
                    } },
                ...{ class: "device-summary" },
                type: "button",
                'aria-expanded': (__VLS_ctx.isDeviceExpanded(device.id)),
                'aria-controls': (`device-details-${device.id}`),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "device-identity" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "device-icon" },
            });
            const __VLS_92 = {}.Cpu;
            /** @type {[typeof __VLS_components.Cpu, ]} */ ;
            // @ts-ignore
            const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
                size: (17),
            }));
            const __VLS_94 = __VLS_93({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_93));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "device-identity-copy" },
            });
            (device.name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "status-badge" },
                ...{ class: (device.status) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
            (__VLS_ctx.deviceStatusLabel(device.status));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "device-health-overview" },
                'aria-label': (__VLS_ctx.t('Estado dos sensores')),
            });
            for (const [sensor] of __VLS_getVForSourceType((__VLS_ctx.latestSensorReadings(device.readings)))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    key: (sensor.key),
                    ...{ class: "device-health-item" },
                    ...{ class: (sensor.reading ? `health-${device.status}` : 'health-missing') },
                    title: (`${sensor.name}: ${sensor.reading ? __VLS_ctx.deviceStatusLabel(device.status) : __VLS_ctx.t('sem leitura recebida')}`),
                });
                const __VLS_96 = ((__VLS_ctx.readingIcon(sensor.key)));
                // @ts-ignore
                const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
                    size: (15),
                }));
                const __VLS_98 = __VLS_97({
                    size: (15),
                }, ...__VLS_functionalComponentArgsRest(__VLS_97));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (sensor.shortName);
                const __VLS_100 = ((sensor.reading ? __VLS_ctx.deviceStatusIcon(device.status) : __VLS_ctx.CircleMinus));
                // @ts-ignore
                const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
                    size: (15),
                }));
                const __VLS_102 = __VLS_101({
                    size: (15),
                }, ...__VLS_functionalComponentArgsRest(__VLS_101));
            }
            const __VLS_104 = {}.ChevronDown;
            /** @type {[typeof __VLS_components.ChevronDown, ]} */ ;
            // @ts-ignore
            const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
                ...{ class: "device-expand-icon" },
                ...{ class: ({ expanded: __VLS_ctx.isDeviceExpanded(device.id) }) },
                size: (18),
            }));
            const __VLS_106 = __VLS_105({
                ...{ class: "device-expand-icon" },
                ...{ class: ({ expanded: __VLS_ctx.isDeviceExpanded(device.id) }) },
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_105));
            if (__VLS_ctx.isDeviceExpanded(device.id)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    id: (`device-details-${device.id}`),
                    ...{ class: "device-details" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "device-meta" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                const __VLS_108 = {}.MapPin;
                /** @type {[typeof __VLS_components.MapPin, ]} */ ;
                // @ts-ignore
                const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
                    size: (14),
                }));
                const __VLS_110 = __VLS_109({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_109));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.t('Localizacao'));
                (device.location || __VLS_ctx.t('Nao informado'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                const __VLS_112 = {}.Cpu;
                /** @type {[typeof __VLS_components.Cpu, ]} */ ;
                // @ts-ignore
                const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
                    size: (14),
                }));
                const __VLS_114 = __VLS_113({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_113));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.t('Identificador'));
                (device.externalId);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                const __VLS_116 = {}.Clock3;
                /** @type {[typeof __VLS_components.Clock3, ]} */ ;
                // @ts-ignore
                const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
                    size: (14),
                }));
                const __VLS_118 = __VLS_117({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_117));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.t('Ultimo contato'));
                (__VLS_ctx.formatTime(device.lastSeenAt));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "device-readings-detail" },
                });
                for (const [sensor] of __VLS_getVForSourceType((__VLS_ctx.latestSensorReadings(device.readings)))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                        key: (sensor.key),
                        ...{ class: "sensor-detail-card" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "sensor-detail-label" },
                    });
                    const __VLS_120 = ((__VLS_ctx.readingIcon(sensor.key)));
                    // @ts-ignore
                    const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
                        size: (15),
                    }));
                    const __VLS_122 = __VLS_121({
                        size: (15),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_121));
                    (sensor.name);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (sensor.reading ? `${sensor.reading.value} ${sensor.reading.unit}` : __VLS_ctx.t('Sem leitura'));
                    if (sensor.reading) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: "sensor-reading-time" },
                        });
                        (__VLS_ctx.formatTime(sensor.reading.recordedAt));
                    }
                }
            }
        }
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-state" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "empty-icon" },
        });
        const __VLS_124 = {}.Cpu;
        /** @type {[typeof __VLS_components.Cpu, ]} */ ;
        // @ts-ignore
        const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
            size: (22),
        }));
        const __VLS_126 = __VLS_125({
            size: (22),
        }, ...__VLS_functionalComponentArgsRest(__VLS_125));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.t(__VLS_ctx.search ? 'Nenhum aparelho encontrado' : 'Nenhum aparelho conectado'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t(__VLS_ctx.search ? 'Tente outro termo de busca.' : 'Os aparelhos aparecerao aqui quando enviarem dados.'));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "table-footer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Exibindo'));
    (__VLS_ctx.filteredDevices.length);
    (__VLS_ctx.t('de'));
    (__VLS_ctx.devices.length);
    (__VLS_ctx.t('aparelhos'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "live-dot" },
    });
    (__VLS_ctx.t('Sincronizacao a cada 30 segundos'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({
        ...{ class: "dashboard-footer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.t('Monitoramento de laboratorio'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Dados atualizados em tempo real'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
        ...{ class: "mobile-nav" },
        'aria-label': (__VLS_ctx.t('Navegacao principal')),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        ...{ class: "mobile-nav-item" },
        ...{ class: ({ active: __VLS_ctx.activeMobileTab === 'home' }) },
        href: "#inicio",
        'aria-current': (__VLS_ctx.activeMobileTab === 'home' ? 'page' : undefined),
    });
    const __VLS_128 = {}.LayoutDashboard;
    /** @type {[typeof __VLS_components.LayoutDashboard, ]} */ ;
    // @ts-ignore
    const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
        size: (20),
    }));
    const __VLS_130 = __VLS_129({
        size: (20),
    }, ...__VLS_functionalComponentArgsRest(__VLS_129));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Inicio'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        ...{ class: "mobile-nav-item" },
        ...{ class: ({ active: __VLS_ctx.activeMobileTab === 'devices' }) },
        href: "#aparelhos",
        'aria-current': (__VLS_ctx.activeMobileTab === 'devices' ? 'page' : undefined),
    });
    const __VLS_132 = {}.Cpu;
    /** @type {[typeof __VLS_components.Cpu, ]} */ ;
    // @ts-ignore
    const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
        size: (20),
    }));
    const __VLS_134 = __VLS_133({
        size: (20),
    }, ...__VLS_functionalComponentArgsRest(__VLS_133));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Aparelhos'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.loadDevices) },
        ...{ class: "mobile-nav-item" },
        type: "button",
        disabled: (__VLS_ctx.loading),
    });
    const __VLS_136 = {}.RefreshCw;
    /** @type {[typeof __VLS_components.RefreshCw, ]} */ ;
    // @ts-ignore
    const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
        size: (19),
    }));
    const __VLS_138 = __VLS_137({
        size: (19),
    }, ...__VLS_functionalComponentArgsRest(__VLS_137));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Atualizar'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.logout) },
        ...{ class: "mobile-nav-item" },
        type: "button",
    });
    const __VLS_140 = {}.LogOut;
    /** @type {[typeof __VLS_components.LogOut, ]} */ ;
    // @ts-ignore
    const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
        size: (19),
    }));
    const __VLS_142 = __VLS_141({
        size: (19),
    }, ...__VLS_functionalComponentArgsRest(__VLS_141));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Sair'));
    if (__VLS_ctx.settingsOpen) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.settingsOpen))
                        return;
                    __VLS_ctx.settingsOpen = false;
                } },
            ...{ class: "settings-overlay" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "settings-dialog" },
            role: "dialog",
            'aria-modal': "true",
            'aria-labelledby': "settingsTitle",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
            ...{ class: "settings-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "eyebrow" },
        });
        (__VLS_ctx.t('SUA CONTA'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            id: "settingsTitle",
        });
        (__VLS_ctx.t('Configuracoes'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.settingsOpen))
                        return;
                    __VLS_ctx.settingsOpen = false;
                } },
            ...{ class: "icon-button" },
            type: "button",
            'aria-label': (__VLS_ctx.t('Fechar configuracoes')),
        });
        const __VLS_144 = {}.X;
        /** @type {[typeof __VLS_components.X, ]} */ ;
        // @ts-ignore
        const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
            size: (19),
        }));
        const __VLS_146 = __VLS_145({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_145));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
            ...{ class: "settings-tabs" },
            role: "tablist",
            'aria-label': (__VLS_ctx.t('Configurações')),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.settingsOpen))
                        return;
                    __VLS_ctx.settingsTab = 'preferences';
                } },
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.settingsTab === 'preferences' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.settingsTab === 'preferences'),
        });
        (__VLS_ctx.t('Preferências'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.settingsOpen))
                        return;
                    __VLS_ctx.settingsTab = 'account';
                } },
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.settingsTab === 'account' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.settingsTab === 'account'),
        });
        (__VLS_ctx.t('Conta'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.settingsOpen))
                        return;
                    __VLS_ctx.settingsTab = 'notifications';
                } },
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.settingsTab === 'notifications' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.settingsTab === 'notifications'),
        });
        (__VLS_ctx.t('Notificações'));
        if (__VLS_ctx.settingsTab === 'preferences') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-pane" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "theme-setting" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "theme-setting-icon" },
            });
            if (!__VLS_ctx.darkMode) {
                const __VLS_148 = {}.Moon;
                /** @type {[typeof __VLS_components.Moon, ]} */ ;
                // @ts-ignore
                const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
                    size: (18),
                }));
                const __VLS_150 = __VLS_149({
                    size: (18),
                }, ...__VLS_functionalComponentArgsRest(__VLS_149));
            }
            else {
                const __VLS_152 = {}.Sun;
                /** @type {[typeof __VLS_components.Sun, ]} */ ;
                // @ts-ignore
                const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
                    size: (18),
                }));
                const __VLS_154 = __VLS_153({
                    size: (18),
                }, ...__VLS_functionalComponentArgsRest(__VLS_153));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "theme-setting-copy" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.t('Modo escuro'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.t('Aparencia salva neste navegador'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (__VLS_ctx.toggleDarkMode) },
                ...{ class: "theme-switch" },
                type: "checkbox",
                checked: (__VLS_ctx.darkMode),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "language-setting" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "theme-setting-copy" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.t('Idioma da dashboard'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.t('Escolha o idioma da interface'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "language-options" },
                role: "group",
                'aria-label': (__VLS_ctx.t('Idioma da dashboard')),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(!__VLS_ctx.user))
                            return;
                        if (!(__VLS_ctx.settingsOpen))
                            return;
                        if (!(__VLS_ctx.settingsTab === 'preferences'))
                            return;
                        __VLS_ctx.setLanguage('pt-BR');
                    } },
                ...{ class: "language-option" },
                ...{ class: ({ active: __VLS_ctx.language === 'pt-BR' }) },
                type: "button",
                'aria-pressed': (__VLS_ctx.language === 'pt-BR'),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                ...{ class: "language-option-flag" },
                src: "/flags/br.svg",
                alt: "",
            });
            (__VLS_ctx.t('Português'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(!__VLS_ctx.user))
                            return;
                        if (!(__VLS_ctx.settingsOpen))
                            return;
                        if (!(__VLS_ctx.settingsTab === 'preferences'))
                            return;
                        __VLS_ctx.setLanguage('en');
                    } },
                ...{ class: "language-option" },
                ...{ class: ({ active: __VLS_ctx.language === 'en' }) },
                type: "button",
                'aria-pressed': (__VLS_ctx.language === 'en'),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                ...{ class: "language-option-flag" },
                src: "/flags/gb.svg",
                alt: "",
            });
            (__VLS_ctx.t('English'));
        }
        else if (__VLS_ctx.settingsTab === 'account') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-pane" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "account-settings-form" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-section-heading" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            (__VLS_ctx.t('Perfil'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Confirme sua senha para salvar'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "avatar-editor" },
            });
            if (__VLS_ctx.profileAvatar) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                    ...{ class: "settings-avatar" },
                    src: (__VLS_ctx.profileAvatar),
                    alt: (__VLS_ctx.t('Foto do perfil')),
                });
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "settings-avatar settings-avatar-fallback" },
                });
                (__VLS_ctx.profileName.slice(0, 1).toUpperCase() || '?');
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "secondary-button avatar-upload-button" },
                for: "avatarFile",
            });
            (__VLS_ctx.t('Alterar foto'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (__VLS_ctx.selectAvatar) },
                id: "avatarFile",
                ...{ class: "visually-hidden" },
                type: "file",
                accept: "image/jpeg,image/png,image/webp",
            });
            if (__VLS_ctx.profileAvatar) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(!__VLS_ctx.user))
                                return;
                            if (!(__VLS_ctx.settingsOpen))
                                return;
                            if (!!(__VLS_ctx.settingsTab === 'preferences'))
                                return;
                            if (!(__VLS_ctx.settingsTab === 'account'))
                                return;
                            if (!(__VLS_ctx.profileAvatar))
                                return;
                            __VLS_ctx.profileAvatar = null;
                        } },
                    ...{ class: "text-button remove-avatar-button" },
                    type: "button",
                });
                (__VLS_ctx.t('Remover foto'));
            }
            if (__VLS_ctx.avatarError) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "error-message" },
                    role: "alert",
                });
                (__VLS_ctx.t(__VLS_ctx.avatarError));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                for: "profileName",
            });
            (__VLS_ctx.t('Nome'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "profileName",
                value: (__VLS_ctx.profileName),
                ...{ class: "settings-input" },
                type: "text",
                maxlength: "80",
                autocomplete: "name",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                for: "profileEmail",
            });
            (__VLS_ctx.t('E-mail'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "profileEmail",
                ...{ class: "settings-input" },
                type: "email",
                maxlength: "254",
                autocomplete: "email",
            });
            (__VLS_ctx.profileEmail);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                for: "currentPassword",
            });
            (__VLS_ctx.t('Senha atual'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "currentPassword",
                ...{ class: "settings-input" },
                type: "password",
                autocomplete: "current-password",
            });
            (__VLS_ctx.currentPassword);
            if (__VLS_ctx.accountError) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "error-message" },
                    role: "alert",
                });
                (__VLS_ctx.t(__VLS_ctx.accountError));
            }
            if (__VLS_ctx.accountMessage) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "success-message" },
                    role: "status",
                });
                (__VLS_ctx.t(__VLS_ctx.accountMessage));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.updateProfile) },
                ...{ class: "primary-button settings-save-button" },
                type: "button",
                disabled: (__VLS_ctx.accountSaving),
            });
            (__VLS_ctx.accountSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Salvar perfil'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
                ...{ onSubmit: (__VLS_ctx.updatePassword) },
                ...{ class: "account-settings-form password-settings-form" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-section-heading" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            (__VLS_ctx.t('Senha'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Use pelo menos 12 caracteres'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                for: "newPassword",
            });
            (__VLS_ctx.t('Nova senha'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "newPassword",
                ...{ class: "settings-input" },
                type: "password",
                minlength: "12",
                autocomplete: "new-password",
                required: true,
            });
            (__VLS_ctx.newPassword);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                for: "newPasswordConfirm",
            });
            (__VLS_ctx.t('Confirme a nova senha'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "newPasswordConfirm",
                ...{ class: "settings-input" },
                type: "password",
                minlength: "12",
                autocomplete: "new-password",
                required: true,
            });
            (__VLS_ctx.newPasswordConfirm);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ class: "secondary-button settings-save-button" },
                type: "submit",
                disabled: (__VLS_ctx.accountSaving),
            });
            (__VLS_ctx.t('Alterar senha'));
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
                ...{ onSubmit: (__VLS_ctx.updateNotificationPreferences) },
                ...{ class: "settings-pane account-settings-form" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-section-heading" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            (__VLS_ctx.t('Alertas de alarmes'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Preferências de envio'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "theme-setting" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "theme-setting-icon" },
            });
            const __VLS_156 = {}.Mail;
            /** @type {[typeof __VLS_components.Mail, ]} */ ;
            // @ts-ignore
            const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
                size: (18),
            }));
            const __VLS_158 = __VLS_157({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_157));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "theme-setting-copy" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.t('Notificações por e-mail'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.t('Enviadas para '));
            (__VLS_ctx.profileEmail || __VLS_ctx.t('o e-mail da conta'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "theme-switch" },
                type: "checkbox",
            });
            (__VLS_ctx.profileEmailNotifications);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "theme-setting" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "theme-setting-icon" },
            });
            const __VLS_160 = {}.MessageCircle;
            /** @type {[typeof __VLS_components.MessageCircle, ]} */ ;
            // @ts-ignore
            const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
                size: (18),
            }));
            const __VLS_162 = __VLS_161({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_161));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "theme-setting-copy" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.t('Notificações por WhatsApp'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.t('É necessário cadastrar o número e ativar o canal'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "theme-switch" },
                type: "checkbox",
            });
            (__VLS_ctx.profileWhatsappNotifications);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                for: "profileWhatsappNumber",
            });
            (__VLS_ctx.t('WhatsApp (formato internacional)'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "profileWhatsappNumber",
                ...{ class: "settings-input" },
                type: "tel",
                maxlength: "24",
                autocomplete: "tel",
                placeholder: "+5521999999999",
            });
            (__VLS_ctx.profileWhatsappNumber);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "settings-help" },
            });
            (__VLS_ctx.t('Use o formato E.164, incluindo o código do país (por exemplo, +55...). O WhatsApp requer uma conta Meta Cloud API configurada pelo administrador.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                for: "notificationCurrentPassword",
            });
            (__VLS_ctx.t('Senha atual'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "notificationCurrentPassword",
                ...{ class: "settings-input" },
                type: "password",
                autocomplete: "current-password",
                required: true,
            });
            (__VLS_ctx.notificationCurrentPassword);
            if (__VLS_ctx.notificationError) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "error-message" },
                    role: "alert",
                });
                (__VLS_ctx.t(__VLS_ctx.notificationError));
            }
            if (__VLS_ctx.notificationMessage) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "success-message" },
                    role: "status",
                });
                (__VLS_ctx.t(__VLS_ctx.notificationMessage));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ class: "primary-button settings-save-button" },
                type: "submit",
                disabled: (__VLS_ctx.accountSaving),
            });
            (__VLS_ctx.accountSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Salvar notificações'));
        }
    }
}
/** @type {__VLS_StyleScopedClasses['loading-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['login-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['login-story']} */ ;
/** @type {__VLS_StyleScopedClasses['story-top']} */ ;
/** @type {__VLS_StyleScopedClasses['uerj-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['login-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['story-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['story-foot']} */ ;
/** @type {__VLS_StyleScopedClasses['live-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['orbit']} */ ;
/** @type {__VLS_StyleScopedClasses['orbit-one']} */ ;
/** @type {__VLS_StyleScopedClasses['orbit']} */ ;
/** @type {__VLS_StyleScopedClasses['orbit-two']} */ ;
/** @type {__VLS_StyleScopedClasses['login-side']} */ ;
/** @type {__VLS_StyleScopedClasses['login-form']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-brand']} */ ;
/** @type {__VLS_StyleScopedClasses['uerj-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['form-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['forgot-link']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['login-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['secure-note']} */ ;
/** @type {__VLS_StyleScopedClasses['back-link']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['form-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['login-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['form-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['login-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['login-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['app-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-mark']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-light']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-label']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-name']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-label']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-link']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-count']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-status']} */ ;
/** @type {__VLS_StyleScopedClasses['live-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['status-ping']} */ ;
/** @type {__VLS_StyleScopedClasses['account-row']} */ ;
/** @type {__VLS_StyleScopedClasses['account-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['account-info']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-logout']} */ ;
/** @type {__VLS_StyleScopedClasses['main-area']} */ ;
/** @type {__VLS_StyleScopedClasses['topbar']} */ ;
/** @type {__VLS_StyleScopedClasses['breadcrumb']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['top-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['last-update']} */ ;
/** @type {__VLS_StyleScopedClasses['live-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['language-flags']} */ ;
/** @type {__VLS_StyleScopedClasses['language-flag']} */ ;
/** @type {__VLS_StyleScopedClasses['language-flag-image']} */ ;
/** @type {__VLS_StyleScopedClasses['language-flag']} */ ;
/** @type {__VLS_StyleScopedClasses['language-flag-image']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-button']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-count']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-read-all']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-list']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-item']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-unread-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['account-menu-button']} */ ;
/** @type {__VLS_StyleScopedClasses['top-avatar-image']} */ ;
/** @type {__VLS_StyleScopedClasses['top-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-content']} */ ;
/** @type {__VLS_StyleScopedClasses['page-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['heading-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['notice-error']} */ ;
/** @type {__VLS_StyleScopedClasses['metrics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-total']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-top']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-foot']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-mark']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-top']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['green']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-foot']} */ ;
/** @type {__VLS_StyleScopedClasses['positive']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-top']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['amber']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-foot']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-top']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['rose']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-foot']} */ ;
/** @type {__VLS_StyleScopedClasses['device-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['export-button']} */ ;
/** @type {__VLS_StyleScopedClasses['table-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['table-count']} */ ;
/** @type {__VLS_StyleScopedClasses['count-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['search-field']} */ ;
/** @type {__VLS_StyleScopedClasses['device-list']} */ ;
/** @type {__VLS_StyleScopedClasses['device-card']} */ ;
/** @type {__VLS_StyleScopedClasses['device-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['device-identity']} */ ;
/** @type {__VLS_StyleScopedClasses['device-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['device-identity-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['device-health-overview']} */ ;
/** @type {__VLS_StyleScopedClasses['device-health-item']} */ ;
/** @type {__VLS_StyleScopedClasses['device-expand-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['device-details']} */ ;
/** @type {__VLS_StyleScopedClasses['device-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['device-readings-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['sensor-detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['sensor-detail-label']} */ ;
/** @type {__VLS_StyleScopedClasses['sensor-reading-time']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['table-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['live-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-header']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['language-setting']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['language-options']} */ ;
/** @type {__VLS_StyleScopedClasses['language-option']} */ ;
/** @type {__VLS_StyleScopedClasses['language-option-flag']} */ ;
/** @type {__VLS_StyleScopedClasses['language-option']} */ ;
/** @type {__VLS_StyleScopedClasses['language-option-flag']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['account-settings-form']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-avatar-fallback']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-upload-button']} */ ;
/** @type {__VLS_StyleScopedClasses['visually-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['remove-avatar-button']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['account-settings-form']} */ ;
/** @type {__VLS_StyleScopedClasses['password-settings-form']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['account-settings-form']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Activity: Activity,
            AlertTriangle: AlertTriangle,
            ArrowDownToLine: ArrowDownToLine,
            Bell: Bell,
            Check: Check,
            ChevronDown: ChevronDown,
            CircleCheck: CircleCheck,
            CircleMinus: CircleMinus,
            Clock3: Clock3,
            Cpu: Cpu,
            LayoutDashboard: LayoutDashboard,
            LoaderCircle: LoaderCircle,
            LogOut: LogOut,
            Mail: Mail,
            MapPin: MapPin,
            MessageCircle: MessageCircle,
            Moon: Moon,
            RefreshCw: RefreshCw,
            Search: Search,
            ShieldCheck: ShieldCheck,
            Signal: Signal,
            Sun: Sun,
            X: X,
            user: user,
            devices: devices,
            notifications: notifications,
            notificationOpen: notificationOpen,
            email: email,
            password: password,
            search: search,
            loginError: loginError,
            pageError: pageError,
            loading: loading,
            submitting: submitting,
            loginMode: loginMode,
            forgotEmail: forgotEmail,
            forgotMessage: forgotMessage,
            forgotError: forgotError,
            resetPasswordValue: resetPasswordValue,
            resetPasswordConfirm: resetPasswordConfirm,
            resetMessage: resetMessage,
            resetError: resetError,
            settingsOpen: settingsOpen,
            settingsTab: settingsTab,
            language: language,
            darkMode: darkMode,
            currentPassword: currentPassword,
            newPassword: newPassword,
            newPasswordConfirm: newPasswordConfirm,
            accountMessage: accountMessage,
            accountError: accountError,
            accountSaving: accountSaving,
            profileName: profileName,
            profileEmail: profileEmail,
            profileAvatar: profileAvatar,
            profileWhatsappNumber: profileWhatsappNumber,
            profileEmailNotifications: profileEmailNotifications,
            profileWhatsappNotifications: profileWhatsappNotifications,
            notificationCurrentPassword: notificationCurrentPassword,
            notificationMessage: notificationMessage,
            notificationError: notificationError,
            avatarError: avatarError,
            activeMobileTab: activeMobileTab,
            t: t,
            dateLocale: dateLocale,
            reportDate: reportDate,
            filteredDevices: filteredDevices,
            onlineCount: onlineCount,
            warningCount: warningCount,
            offlineCount: offlineCount,
            latestReadings: latestReadings,
            unreadNotificationCount: unreadNotificationCount,
            loadDevices: loadDevices,
            markAllNotificationsRead: markAllNotificationsRead,
            openDeviceNotification: openDeviceNotification,
            notificationMessageInEnglish: notificationMessageInEnglish,
            login: login,
            requestPasswordReset: requestPasswordReset,
            submitPasswordReset: submitPasswordReset,
            openSettings: openSettings,
            updateProfile: updateProfile,
            updateNotificationPreferences: updateNotificationPreferences,
            updatePassword: updatePassword,
            selectAvatar: selectAvatar,
            toggleDarkMode: toggleDarkMode,
            setLanguage: setLanguage,
            logout: logout,
            formatTime: formatTime,
            formatRefreshTime: formatRefreshTime,
            exportList: exportList,
            readingIcon: readingIcon,
            latestSensorReadings: latestSensorReadings,
            isDeviceExpanded: isDeviceExpanded,
            toggleDevice: toggleDevice,
            deviceStatusIcon: deviceStatusIcon,
            deviceStatusLabel: deviceStatusLabel,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
