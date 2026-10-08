import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Activity, AlertTriangle, ArrowDownToLine, Bell, Check, ChevronDown, CircleHelp, CircleAlert, CircleCheck, CircleMinus, Clock3, Cpu, Flame, LayoutDashboard, LoaderCircle, LogOut, MapPin, Moon, RefreshCw, Search, ShieldCheck, Signal, Sun, Thermometer, Waves, X } from 'lucide-vue-next';
const user = ref(null);
const devices = ref([]);
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
const avatarError = ref('');
const refreshedAt = ref(new Date());
const activeMobileTab = ref('home');
const expandedDeviceIds = ref([]);
const reportDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
let refreshTimer;
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
async function api(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? 'Nao foi possivel concluir a solicitacao.');
    }
    return response.json();
}
async function loadDevices() {
    if (!user.value)
        return;
    try {
        const result = await api('/api/devices');
        devices.value = result.devices;
        refreshedAt.value = new Date();
        pageError.value = '';
    }
    catch (error) {
        pageError.value = error instanceof Error ? error.message : 'Falha ao atualizar aparelhos.';
    }
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
}
function openSettings() {
    syncProfileForm();
    accountMessage.value = '';
    accountError.value = '';
    currentPassword.value = '';
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
async function logout() {
    try {
        await api('/api/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken.value } });
    }
    finally {
        user.value = null;
        devices.value = [];
        csrfToken.value = '';
    }
}
function formatTime(value) {
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
        { key: 'temperatura', name: 'Temperatura', shortName: 'Temp.', matches: (type) => type.includes('temper') },
        { key: 'umidade', name: 'Umidade', shortName: 'Umidade', matches: (type) => type.includes('umid') },
        { key: 'gas', name: 'Gás', shortName: 'Gás', matches: (type) => type.includes('gas') || type.includes('gás') }
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
        return 'Online';
    if (status === 'warning')
        return 'Atencao';
    return 'Offline';
}
function syncMobileTab() {
    const devicesSection = document.getElementById('aparelhos');
    if (devicesSection)
        activeMobileTab.value = devicesSection.getBoundingClientRect().top <= window.innerHeight * 0.45 ? 'devices' : 'home';
}
onMounted(() => {
    darkMode.value = localStorage.getItem('lab-monitor-dark-mode') === 'true';
    document.documentElement.classList.toggle('dark-mode', darkMode.value);
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
});
onUnmounted(() => {
    if (refreshTimer)
        clearInterval(refreshTimer);
    window.removeEventListener('scroll', syncMobileTab);
    window.removeEventListener('hashchange', syncMobileTab);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: "loading-screen" },
        'aria-label': "Carregando",
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
        alt: "Universidade do Estado do Rio de Janeiro",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "story-copy" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "eyebrow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "story-foot" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "live-dot" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
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
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "form-subtitle" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "email",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "email",
            type: "email",
            autocomplete: "username",
            placeholder: "voce@laboratorio.com",
            required: true,
        });
        (__VLS_ctx.email);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "password",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "password",
            type: "password",
            autocomplete: "current-password",
            placeholder: "Sua senha",
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
        (__VLS_ctx.submitting ? 'Entrando...' : 'Entrar');
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
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "eyebrow" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "form-subtitle" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "forgotEmail",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "forgotEmail",
            type: "email",
            autocomplete: "email",
            placeholder: "voce@laboratorio.com",
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
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "eyebrow" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "form-subtitle" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "resetPassword",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "resetPassword",
            type: "password",
            autocomplete: "new-password",
            minlength: "12",
            placeholder: "Pelo menos 12 caracteres",
            required: true,
        });
        (__VLS_ctx.resetPasswordValue);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "resetPasswordConfirm",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "resetPasswordConfirm",
            type: "password",
            autocomplete: "new-password",
            minlength: "12",
            placeholder: "Repita a senha",
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
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({
        ...{ class: "login-footer" },
    });
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "workspace-switch" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "workspace-avatar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "workspace-name" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "status-ping" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "account-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "account-avatar" },
    });
    (__VLS_ctx.user.email.slice(0, 1).toUpperCase());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "account-info" },
    });
    (__VLS_ctx.user.displayName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    (__VLS_ctx.user.email);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.logout) },
        ...{ class: "icon-button sidebar-logout" },
        title: "Sair",
        'aria-label': "Sair",
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "top-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "last-update" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "live-dot" },
    });
    (__VLS_ctx.formatRefreshTime());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ class: "icon-button" },
        title: "Ajuda",
        'aria-label': "Ajuda",
    });
    const __VLS_40 = {}.CircleHelp;
    /** @type {[typeof __VLS_components.CircleHelp, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        size: (18),
    }));
    const __VLS_42 = __VLS_41({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ class: "icon-button notification-button" },
        title: "Notificacoes",
        'aria-label': "Notificacoes",
    });
    const __VLS_44 = {}.Bell;
    /** @type {[typeof __VLS_components.Bell, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        size: (18),
    }));
    const __VLS_46 = __VLS_45({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.openSettings) },
        ...{ class: "account-menu-button" },
        type: "button",
        title: "Configuracoes da conta",
        'aria-label': "Abrir configuracoes da conta",
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
    (__VLS_ctx.reportDate.toLocaleUpperCase('pt-BR'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "heading-sub" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.loadDevices) },
        ...{ class: "secondary-button" },
        disabled: (__VLS_ctx.loading),
    });
    const __VLS_48 = {}.RefreshCw;
    /** @type {[typeof __VLS_components.RefreshCw, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        size: (16),
    }));
    const __VLS_50 = __VLS_49({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    if (__VLS_ctx.pageError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "notice-error" },
            role: "alert",
        });
        const __VLS_52 = {}.AlertTriangle;
        /** @type {[typeof __VLS_components.AlertTriangle, ]} */ ;
        // @ts-ignore
        const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
            size: (17),
        }));
        const __VLS_54 = __VLS_53({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_53));
        (__VLS_ctx.pageError);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "metrics-grid" },
        'aria-label': "Resumo dos aparelhos",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "metric metric-total" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-top" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "metric-icon" },
    });
    const __VLS_56 = {}.Cpu;
    /** @type {[typeof __VLS_components.Cpu, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        size: (17),
    }));
    const __VLS_58 = __VLS_57({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-value" },
    });
    (__VLS_ctx.devices.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-foot" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "metric-mark" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "metric" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-top" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "metric-icon green" },
    });
    const __VLS_60 = {}.Signal;
    /** @type {[typeof __VLS_components.Signal, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        size: (17),
    }));
    const __VLS_62 = __VLS_61({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-value" },
    });
    (__VLS_ctx.onlineCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-foot positive" },
    });
    const __VLS_64 = {}.Check;
    /** @type {[typeof __VLS_components.Check, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        size: (13),
    }));
    const __VLS_66 = __VLS_65({
        size: (13),
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "metric" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-top" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "metric-icon amber" },
    });
    const __VLS_68 = {}.AlertTriangle;
    /** @type {[typeof __VLS_components.AlertTriangle, ]} */ ;
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
    (__VLS_ctx.warningCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-foot" },
        ...{ class: (__VLS_ctx.warningCount ? 'warning-text' : '') },
    });
    (__VLS_ctx.warningCount ? 'Requer verificacao' : 'Nenhum alerta ativo');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "metric" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-top" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "metric-icon rose" },
    });
    const __VLS_72 = {}.Activity;
    /** @type {[typeof __VLS_components.Activity, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        size: (17),
    }));
    const __VLS_74 = __VLS_73({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-value" },
    });
    (__VLS_ctx.offlineCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "metric-foot" },
    });
    (__VLS_ctx.latestReadings);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        id: "aparelhos",
        ...{ class: "device-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-heading" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.exportList) },
        ...{ class: "export-button" },
        title: "Exportar lista",
    });
    const __VLS_76 = {}.ArrowDownToLine;
    /** @type {[typeof __VLS_components.ArrowDownToLine, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        size: (16),
    }));
    const __VLS_78 = __VLS_77({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "search-field" },
    });
    const __VLS_80 = {}.Search;
    /** @type {[typeof __VLS_components.Search, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        size: (16),
    }));
    const __VLS_82 = __VLS_81({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "search",
        placeholder: "Buscar aparelho...",
        'aria-label': "Buscar aparelho",
    });
    (__VLS_ctx.search);
    if (__VLS_ctx.filteredDevices.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "device-list" },
        });
        for (const [device] of __VLS_getVForSourceType((__VLS_ctx.filteredDevices))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
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
            const __VLS_84 = {}.Cpu;
            /** @type {[typeof __VLS_components.Cpu, ]} */ ;
            // @ts-ignore
            const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
                size: (17),
            }));
            const __VLS_86 = __VLS_85({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_85));
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
                'aria-label': "Estado dos sensores",
            });
            for (const [sensor] of __VLS_getVForSourceType((__VLS_ctx.latestSensorReadings(device.readings)))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    key: (sensor.key),
                    ...{ class: "device-health-item" },
                    ...{ class: (sensor.reading ? `health-${device.status}` : 'health-missing') },
                    title: (`${sensor.name}: ${sensor.reading ? __VLS_ctx.deviceStatusLabel(device.status) : 'sem leitura recebida'}`),
                });
                const __VLS_88 = ((__VLS_ctx.readingIcon(sensor.key)));
                // @ts-ignore
                const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
                    size: (15),
                }));
                const __VLS_90 = __VLS_89({
                    size: (15),
                }, ...__VLS_functionalComponentArgsRest(__VLS_89));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (sensor.shortName);
                const __VLS_92 = ((sensor.reading ? __VLS_ctx.deviceStatusIcon(device.status) : __VLS_ctx.CircleMinus));
                // @ts-ignore
                const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
                    size: (15),
                }));
                const __VLS_94 = __VLS_93({
                    size: (15),
                }, ...__VLS_functionalComponentArgsRest(__VLS_93));
            }
            const __VLS_96 = {}.ChevronDown;
            /** @type {[typeof __VLS_components.ChevronDown, ]} */ ;
            // @ts-ignore
            const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
                ...{ class: "device-expand-icon" },
                ...{ class: ({ expanded: __VLS_ctx.isDeviceExpanded(device.id) }) },
                size: (18),
            }));
            const __VLS_98 = __VLS_97({
                ...{ class: "device-expand-icon" },
                ...{ class: ({ expanded: __VLS_ctx.isDeviceExpanded(device.id) }) },
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_97));
            if (__VLS_ctx.isDeviceExpanded(device.id)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    id: (`device-details-${device.id}`),
                    ...{ class: "device-details" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "device-meta" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                const __VLS_100 = {}.MapPin;
                /** @type {[typeof __VLS_components.MapPin, ]} */ ;
                // @ts-ignore
                const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
                    size: (14),
                }));
                const __VLS_102 = __VLS_101({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_101));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (device.location || 'Nao informado');
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                const __VLS_104 = {}.Cpu;
                /** @type {[typeof __VLS_components.Cpu, ]} */ ;
                // @ts-ignore
                const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
                    size: (14),
                }));
                const __VLS_106 = __VLS_105({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_105));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (device.externalId);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                const __VLS_108 = {}.Clock3;
                /** @type {[typeof __VLS_components.Clock3, ]} */ ;
                // @ts-ignore
                const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
                    size: (14),
                }));
                const __VLS_110 = __VLS_109({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_109));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
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
                    const __VLS_112 = ((__VLS_ctx.readingIcon(sensor.key)));
                    // @ts-ignore
                    const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
                        size: (15),
                    }));
                    const __VLS_114 = __VLS_113({
                        size: (15),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
                    (sensor.name);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (sensor.reading ? `${sensor.reading.value} ${sensor.reading.unit}` : 'Sem leitura');
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
        const __VLS_116 = {}.Cpu;
        /** @type {[typeof __VLS_components.Cpu, ]} */ ;
        // @ts-ignore
        const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
            size: (22),
        }));
        const __VLS_118 = __VLS_117({
            size: (22),
        }, ...__VLS_functionalComponentArgsRest(__VLS_117));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.search ? 'Nenhum aparelho encontrado' : 'Nenhum aparelho conectado');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.search ? 'Tente outro termo de busca.' : 'Os aparelhos aparecerao aqui quando enviarem dados.');
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "table-footer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.filteredDevices.length);
    (__VLS_ctx.devices.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "live-dot" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({
        ...{ class: "dashboard-footer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
        ...{ class: "mobile-nav" },
        'aria-label': "Navegacao principal",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        ...{ class: "mobile-nav-item" },
        ...{ class: ({ active: __VLS_ctx.activeMobileTab === 'home' }) },
        href: "#inicio",
        'aria-current': (__VLS_ctx.activeMobileTab === 'home' ? 'page' : undefined),
    });
    const __VLS_120 = {}.LayoutDashboard;
    /** @type {[typeof __VLS_components.LayoutDashboard, ]} */ ;
    // @ts-ignore
    const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
        size: (20),
    }));
    const __VLS_122 = __VLS_121({
        size: (20),
    }, ...__VLS_functionalComponentArgsRest(__VLS_121));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        ...{ class: "mobile-nav-item" },
        ...{ class: ({ active: __VLS_ctx.activeMobileTab === 'devices' }) },
        href: "#aparelhos",
        'aria-current': (__VLS_ctx.activeMobileTab === 'devices' ? 'page' : undefined),
    });
    const __VLS_124 = {}.Cpu;
    /** @type {[typeof __VLS_components.Cpu, ]} */ ;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
        size: (20),
    }));
    const __VLS_126 = __VLS_125({
        size: (20),
    }, ...__VLS_functionalComponentArgsRest(__VLS_125));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.loadDevices) },
        ...{ class: "mobile-nav-item" },
        type: "button",
        disabled: (__VLS_ctx.loading),
    });
    const __VLS_128 = {}.RefreshCw;
    /** @type {[typeof __VLS_components.RefreshCw, ]} */ ;
    // @ts-ignore
    const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
        size: (19),
    }));
    const __VLS_130 = __VLS_129({
        size: (19),
    }, ...__VLS_functionalComponentArgsRest(__VLS_129));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.logout) },
        ...{ class: "mobile-nav-item" },
        type: "button",
    });
    const __VLS_132 = {}.LogOut;
    /** @type {[typeof __VLS_components.LogOut, ]} */ ;
    // @ts-ignore
    const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
        size: (19),
    }));
    const __VLS_134 = __VLS_133({
        size: (19),
    }, ...__VLS_functionalComponentArgsRest(__VLS_133));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
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
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            id: "settingsTitle",
        });
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
            'aria-label': "Fechar configuracoes",
        });
        const __VLS_136 = {}.X;
        /** @type {[typeof __VLS_components.X, ]} */ ;
        // @ts-ignore
        const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
            size: (19),
        }));
        const __VLS_138 = __VLS_137({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_137));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "theme-setting" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "theme-setting-icon" },
        });
        if (!__VLS_ctx.darkMode) {
            const __VLS_140 = {}.Moon;
            /** @type {[typeof __VLS_components.Moon, ]} */ ;
            // @ts-ignore
            const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
                size: (18),
            }));
            const __VLS_142 = __VLS_141({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_141));
        }
        else {
            const __VLS_144 = {}.Sun;
            /** @type {[typeof __VLS_components.Sun, ]} */ ;
            // @ts-ignore
            const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
                size: (18),
            }));
            const __VLS_146 = __VLS_145({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_145));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "theme-setting-copy" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onChange: (__VLS_ctx.toggleDarkMode) },
            ...{ class: "theme-switch" },
            type: "checkbox",
            checked: (__VLS_ctx.darkMode),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "account-settings-form" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "settings-section-heading" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "avatar-editor" },
        });
        if (__VLS_ctx.profileAvatar) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                ...{ class: "settings-avatar" },
                src: (__VLS_ctx.profileAvatar),
                alt: "Foto do perfil",
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
                        if (!(__VLS_ctx.profileAvatar))
                            return;
                        __VLS_ctx.profileAvatar = null;
                    } },
                ...{ class: "text-button remove-avatar-button" },
                type: "button",
            });
        }
        if (__VLS_ctx.avatarError) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "error-message" },
                role: "alert",
            });
            (__VLS_ctx.avatarError);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "profileName",
        });
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
            (__VLS_ctx.accountError);
        }
        if (__VLS_ctx.accountMessage) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "success-message" },
                role: "status",
            });
            (__VLS_ctx.accountMessage);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.updateProfile) },
            ...{ class: "primary-button settings-save-button" },
            type: "button",
            disabled: (__VLS_ctx.accountSaving),
        });
        (__VLS_ctx.accountSaving ? 'Salvando...' : 'Salvar perfil');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.updatePassword) },
            ...{ class: "account-settings-form password-settings-form" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "settings-section-heading" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "newPassword",
        });
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
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-button']} */ ;
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
/** @type {__VLS_StyleScopedClasses['theme-setting']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-switch']} */ ;
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
            CircleHelp: CircleHelp,
            CircleMinus: CircleMinus,
            Clock3: Clock3,
            Cpu: Cpu,
            LayoutDashboard: LayoutDashboard,
            LoaderCircle: LoaderCircle,
            LogOut: LogOut,
            MapPin: MapPin,
            Moon: Moon,
            RefreshCw: RefreshCw,
            Search: Search,
            ShieldCheck: ShieldCheck,
            Signal: Signal,
            Sun: Sun,
            X: X,
            user: user,
            devices: devices,
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
            avatarError: avatarError,
            activeMobileTab: activeMobileTab,
            reportDate: reportDate,
            filteredDevices: filteredDevices,
            onlineCount: onlineCount,
            warningCount: warningCount,
            offlineCount: offlineCount,
            latestReadings: latestReadings,
            loadDevices: loadDevices,
            login: login,
            requestPasswordReset: requestPasswordReset,
            submitPasswordReset: submitPasswordReset,
            openSettings: openSettings,
            updateProfile: updateProfile,
            updatePassword: updatePassword,
            selectAvatar: selectAvatar,
            toggleDarkMode: toggleDarkMode,
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
