<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import MessageTemplateEditor from './components/MessageTemplateEditor.vue';
import {
  Activity, AlertTriangle, ArrowDownToLine, Bell, Building2, Check, ChevronDown, EllipsisVertical,
  Bot, CircleAlert, CircleCheck, CircleMinus, Clock3, Copy, Cpu, Flame, ImagePlus, LayoutDashboard, LockKeyhole,
  List, LoaderCircle, LogOut, Mail, MapPin, MessageCircle, Moon, Pencil, Play, Plus, RefreshCw, Search, Trash2,
  Settings, Share2, ShieldCheck, Signal, Sun, Thermometer, UsersRound, Volume2, Waves, X
} from 'lucide-vue-next';

type User = {
  id: string;
  email: string;
  displayName: string;
  avatarDataUrl: string | null;
  whatsappNumber: string | null;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  emailVerifiedAt: string | null;
  isPlatformAdmin: boolean;
  isBootstrapAdmin: boolean;
  activeWorkspaceId: string | null;
  workspaces: Workspace[];
};
type Workspace = { id: string; name: string; role: string; accessCode?: string | null; iconDataUrl?: string | null };
type AccountLinkedDevice = {
  id: string;
  externalId: string;
  name: string;
  location: string | null;
  status: Device['status'];
  lastSeenAt: string;
  workspaceId: string | null;
  workspaceName: string | null;
  canAssign: boolean;
};
type WorkspaceMember = { id: string; email: string; displayName: string; role: string; emailVerifiedAt: string | null; isPlatformAdmin: boolean; createdAt: string };
type AdminUser = { id: string; email: string; displayName: string; isPlatformAdmin: boolean; emailVerifiedAt: string | null; passwordResetRequired: boolean; createdAt: string; workspaces: Workspace[] };
type WorkspaceInvitation = { id: string; email: string; role: string; expiresAt: string; createdAt: string };
type WhatsAppWebStatus = { state: 'disconnected' | 'connecting' | 'qr' | 'connected'; qrDataUrl: string | null; phoneNumber: string | null };
type WhatsAppWebLogEntry = { id: number; createdAt: string; level: 'info' | 'success' | 'error'; event: string; details: string };
type WhatsAppNotificationSettings = {
  senderName: string; onlineMessage: string; warningMessage: string; offlineMessage: string;
  onlineMediaType: 'none' | 'sticker' | 'image'; warningMediaType: 'none' | 'sticker' | 'image'; offlineMediaType: 'none' | 'sticker' | 'image';
  onlineMediaId: string | null; warningMediaId: string | null; offlineMediaId: string | null;
};
type FavoriteWhatsAppMedia = { id: string; name: string; createdAt: string; animated: boolean; previewDataUrl: string; previewUrl: string };
type WhatsAppCloudSettings = { connectionMode: 'qr' | 'cloud'; phoneNumberId: string; apiVersion: string; templateName: string; templateLanguage: string; accessTokenConfigured: boolean };
type WhatsAppCloudConnectivity = { connectionMode: 'qr' | 'cloud'; verifiedName: string | null; displayPhoneNumber: string | null };
type WhatsAppProfileSnapshot = { id: string; name: string; photoDataUrl: string | null; createdAt: string; isOriginal: boolean; restoredFromSnapshotId?: string };
type WhatsAppProfile = { accountId: string; name: string; photoDataUrl: string | null; originalSnapshotId: string; history: WhatsAppProfileSnapshot[] };
type WhatsAppPrivacySettings = { lastSeen: 'all' | 'contacts' | 'contact_blacklist' | 'none'; online: 'all' | 'match_last_seen'; profilePhoto: 'all' | 'contacts' | 'contact_blacklist' | 'none'; status: 'all' | 'contacts' | 'contact_blacklist' | 'none'; readReceipts: 'all' | 'none'; groupsAdd: 'all' | 'contacts' | 'contact_blacklist' };
type EmailNotificationSettings = {
  smtpHost: string; smtpPort: number; smtpSecure: boolean; smtpUser: string; senderName: string; senderEmail: string;
  onlineMessage: string; warningMessage: string; offlineMessage: string; passwordConfigured: boolean;
};
type EmailNotificationDraft = Pick<EmailNotificationSettings, 'onlineMessage' | 'warningMessage' | 'offlineMessage'>;
type EmailSmtpDraft = Pick<EmailNotificationSettings, 'smtpHost' | 'smtpPort' | 'smtpSecure' | 'smtpUser' | 'senderName' | 'senderEmail'> & { passwordConfigured: boolean };
type EmailLogEntry = { id: number; createdAt: string; level: 'info' | 'success' | 'error'; event: string; details: string };
type Reading = { id: string; type: string; value: number; unit: string; alert: boolean; recordedAt: string };
type Device = {
  id: string;
  externalId: string;
  name: string;
  alias: string | null;
  location: string | null;
  status: 'online' | 'offline' | 'warning';
  lastSeenAt: string;
  readings: Reading[];
  canSimulate?: boolean;
  canEditAlias: boolean;
};
type DemoSimulationForm = { status: Device['status']; temperature: number; humidity: number; gas: number };
type DeviceNotification = {
  id: string;
  deviceId: string;
  deviceName: string;
  status: Device['status'];
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};
type WorkspaceDeviceAlertPreference = { deviceId: string; name: string; emailEnabled: boolean; whatsappEnabled: boolean };
type WorkspaceAlertPreferences = { notifyAllDevices: boolean; devices: WorkspaceDeviceAlertPreference[] };
type Language = 'pt-BR' | 'en';
type AlertAudioOption = { id: string; name: string; mimeType: string; url: string; isDefault: boolean };
type AlertSoundPreferences = { online: string; warning: string; offline: string };
type AlertSoundStatus = keyof AlertSoundPreferences;

const user = ref<User | null>(null);
const devices = ref<Device[]>([]);
const simulationValues = ref<Record<string, DemoSimulationForm>>({});
const simulationSavingId = ref<string | null>(null);
const simulationMessages = ref<Record<string, string>>({});
const notifications = ref<DeviceNotification[]>([]);
const notificationOpen = ref(false);
const csrfToken = ref('');
const email = ref('');
const password = ref('');
const registerName = ref('');
const registerEmail = ref('');
const registerPassword = ref('');
const registerMessage = ref('');
const registerError = ref('');
const invitationToken = ref('');
const invitationWorkspaceName = ref('');
const invitationError = ref('');
const activationMessage = ref('');
const activationError = ref('');
const inviteEmail = ref('');
const inviteRole = ref('member');
const inviteError = ref('');
const inviteMessage = ref('');
const search = ref('');
const loginError = ref('');
const pageError = ref('');
const loading = ref(true);
const submitting = ref(false);
const loginMode = ref<'login' | 'register' | 'forgot' | 'reset'>('login');
const workspaceName = ref('');
const workspaceIconDataUrl = ref<string | null>(null);
const workspaceIconError = ref('');
const workspaceSaving = ref(false);
const editingDeviceAliasId = ref<string | null>(null);
const deviceAliasDraft = ref('');
const deviceAliasSavingId = ref<string | null>(null);
const importWorkspaceCode = ref('');
const workspaceShareMessage = ref('');
const workspaces = ref<Workspace[]>([]);
const accountLinkedDevices = ref<AccountLinkedDevice[]>([]);
const accountDevicesLoading = ref(false);
const accountDevicesError = ref('');
const accountDevicesMessage = ref('');
const workspaceDeviceTargetId = ref<string | null>(null);
const activeWorkspaceId = ref<string | null>(null);
const activeWorkspace = computed(() => workspaces.value.find((workspace) => workspace.id === activeWorkspaceId.value) ?? null);
const activeWorkspaceCode = computed(() => activeWorkspace.value?.accessCode ?? '');
const canManageActiveWorkspace = computed(() => ['owner', 'admin'].includes(activeWorkspace.value?.role ?? ''));
const workspaceMembers = ref<WorkspaceMember[]>([]);
const workspaceInvitations = ref<WorkspaceInvitation[]>([]);
const adminUsers = ref<AdminUser[]>([]);
const adminUsersLoading = ref(false);
const adminUsersError = ref('');
const adminUsersMessage = ref('');
const adminUserActionId = ref<string | null>(null);
const memberActionsOpenId = ref<string | null>(null);
const editingMemberId = ref<string | null>(null);
const editingMemberRole = ref('member');
const memberSavingId = ref<string | null>(null);
const userDeletionTarget = ref<Pick<WorkspaceMember, 'id' | 'email' | 'displayName' | 'isPlatformAdmin'> | AdminUser | null>(null);
const userDeletionConfirmation = ref('');
const userDeletionError = ref('');
const userDeletionSaving = ref(false);
const userDeletionMessage = ref('');
const accountEditTarget = ref<AdminUser | null>(null);
const accountEditName = ref('');
const accountEditEmail = ref('');
const accountEditSaving = ref(false);
const accountEditError = ref('');
const registrationEnabled = ref(false);
const isWhatsAppDashboardAdmin = computed(() => Boolean(user.value?.isBootstrapAdmin));
const canManageUserAccounts = computed(() => Boolean(user.value?.isPlatformAdmin));
const managementTab = ref<'overview' | 'users' | 'whatsapp' | 'email'>('overview');
const userManagementTab = ref<'members' | 'accounts' | 'registration'>('members');
const whatsappTab = ref<'log' | 'configuration' | 'notifications' | 'profile' | 'connection'>('log');
const emailTab = ref<'log' | 'configuration' | 'notifications' | 'connection'>('log');
const whatsappStatus = ref<WhatsAppWebStatus>({ state: 'disconnected', qrDataUrl: null, phoneNumber: null });
const whatsappLogs = ref<WhatsAppWebLogEntry[]>([]);
const whatsappSettings = ref<WhatsAppNotificationSettings>({
  senderName: 'LAB/MONITOR',
  onlineMessage: '{{laboratorio}}: {{aparelho}} voltou ao normal. Localização: {{localizacao}}.',
  warningMessage: '{{laboratorio}}: {{aparelho}} está em atenção. Localização: {{localizacao}}.',
  offlineMessage: '{{laboratorio}}: {{aparelho}} está offline. Localização: {{localizacao}}.',
  onlineMediaType: 'sticker', warningMediaType: 'sticker', offlineMediaType: 'sticker',
  onlineMediaId: 'default-success', warningMediaId: 'default-alert', offlineMediaId: 'default-alert'
});
const whatsappSettingsSaving = ref(false);
const whatsappSettingsMessage = ref('');
const favoriteWhatsAppMedia = ref<FavoriteWhatsAppMedia[]>([]);
const favoriteWhatsAppMediaLoading = ref(false);
const favoriteWhatsAppMediaError = ref('');
const favoriteMediaName = ref('');
const favoriteMediaDataUrl = ref('');
const favoriteMediaSaving = ref(false);
const favoriteMediaDeletingId = ref<string | null>(null);
const whatsappCloudSettings = ref<WhatsAppCloudSettings>({ connectionMode: 'cloud', phoneNumberId: '', apiVersion: 'v23.0', templateName: 'lab_monitor_alarm', templateLanguage: 'pt_BR', accessTokenConfigured: false });
const whatsappSavedConnectionMode = ref<'qr' | 'cloud'>('cloud');
const whatsappCloudAccessToken = ref('');
const whatsappCloudClearAccessToken = ref(false);
const whatsappCloudSaving = ref(false);
const whatsappCloudMessage = ref('');
const whatsappCloudConnectivity = ref<WhatsAppCloudConnectivity | null>(null);
const whatsappCloudConnectivityError = ref('');
const whatsappCloudConnectivityTesting = ref(false);
const whatsappProfile = ref<WhatsAppProfile | null>(null);
const whatsappProfileDraftName = ref('');
const whatsappProfileBaselineName = ref('');
const whatsappProfileDraftPhoto = ref<string | null>(null);
const whatsappProfilePhotoError = ref('');
const whatsappProfileSaving = ref(false);
const whatsappProfileBaselineSaving = ref(false);
const whatsappProfileRestoringId = ref<string | null>(null);
const whatsappProfileMessage = ref('');
const whatsappProfileError = ref('');
const whatsappPrivacySettings = ref<WhatsAppPrivacySettings>({ lastSeen: 'contacts', online: 'match_last_seen', profilePhoto: 'contacts', status: 'contacts', readReceipts: 'all', groupsAdd: 'contacts' });
const whatsappPrivacySaving = ref(false);
const whatsappPrivacyMessage = ref('');
const whatsappPrivacyError = ref('');
const whatsappNotificationPreviews = computed(() => [
  { id: 'online', label: t('Mensagem ao normalizar'), template: whatsappSettings.value.onlineMessage, status: 'normalizado', mediaType: whatsappSettings.value.onlineMediaType, mediaId: whatsappSettings.value.onlineMediaId },
  { id: 'warning', label: t('Mensagem em atenção'), template: whatsappSettings.value.warningMessage, status: 'em atenção', mediaType: whatsappSettings.value.warningMediaType, mediaId: whatsappSettings.value.warningMediaId },
  { id: 'offline', label: t('Mensagem offline'), template: whatsappSettings.value.offlineMessage, status: 'offline', mediaType: whatsappSettings.value.offlineMediaType, mediaId: whatsappSettings.value.offlineMediaId }
].map((preview) => ({
  ...preview,
  media: favoriteWhatsAppMedia.value.find((media) => media.id === preview.mediaId) ?? null,
  html: formatMessagePreview(interpolateNotificationTemplate(preview.template, whatsappSettings.value.senderName, preview.status))
})));
const emailSettings = ref<EmailNotificationSettings>({
  smtpHost: '', smtpPort: 587, smtpSecure: false, smtpUser: '', senderName: 'LAB/MONITOR', senderEmail: '',
  onlineMessage: '{{laboratorio}}: {{aparelho}} voltou ao normal. Localização: {{localizacao}}.',
  warningMessage: '{{laboratorio}}: {{aparelho}} está em atenção. Localização: {{localizacao}}.',
  offlineMessage: '{{laboratorio}}: {{aparelho}} está offline. Localização: {{localizacao}}.', passwordConfigured: false
});
const emailNotificationDraft = ref<EmailNotificationDraft>({
  onlineMessage: emailSettings.value.onlineMessage,
  warningMessage: emailSettings.value.warningMessage,
  offlineMessage: emailSettings.value.offlineMessage
});
const emailSmtpDraft = ref<EmailSmtpDraft>({
  smtpHost: '', smtpPort: 587, smtpSecure: false, smtpUser: '', senderName: 'LAB/MONITOR', senderEmail: '', passwordConfigured: false
});
const emailPassword = ref('');
const emailClearPassword = ref(false);
const emailLogs = ref<EmailLogEntry[]>([]);
const emailSettingsSaving = ref(false);
const emailWorking = ref(false);
const emailConnectionState = ref<'idle' | 'connected' | 'error'>('idle');
const emailMessage = ref('');
const emailError = ref('');
let emailRefreshTimer: ReturnType<typeof setInterval> | undefined;
const emailNotificationPreviews = computed(() => [
  { id: 'online', label: t('Mensagem de e-mail ao normalizar'), template: emailNotificationDraft.value.onlineMessage, status: 'normalizado' },
  { id: 'warning', label: t('Mensagem de e-mail em atenção'), template: emailNotificationDraft.value.warningMessage, status: 'em atenção' },
  { id: 'offline', label: t('Mensagem de e-mail offline'), template: emailNotificationDraft.value.offlineMessage, status: 'offline' }
].map((preview) => ({ ...preview, html: formatMessagePreview(interpolateNotificationTemplate(preview.template, emailSmtpDraft.value.senderName, preview.status)) })));
const whatsappWorking = ref(false);
const whatsappError = ref('');
let whatsappRefreshTimer: ReturnType<typeof setInterval> | undefined;
const forgotEmail = ref('');
const forgotMessage = ref('');
const forgotError = ref('');
const resetPasswordValue = ref('');
const resetPasswordConfirm = ref('');
const resetMessage = ref('');
const resetError = ref('');
const resetToken = ref('');
const settingsOpen = ref(false);
const settingsTab = ref<'preferences' | 'account' | 'notifications' | 'sounds'>('preferences');
const workspaceMenuOpen = ref(false);
const mobileWorkspaceSelectorOpen = ref(false);
const workspaceDialogOpen = ref(false);
const workspaceDialogAction = ref<'create' | 'edit' | 'import' | 'share' | 'devices' | 'members'>('create');
const language = ref<Language>('pt-BR');
const whatsappCountries = computed(() => {
  const displayNames = new Intl.DisplayNames([language.value === 'en' ? 'en' : 'pt-BR'], { type: 'region' });
  return getCountries().map((country) => ({
    country,
    name: displayNames.of(country) ?? country,
    dialCode: `+${getCountryCallingCode(country)}`
  })).sort((left, right) => left.name.localeCompare(right.name, language.value));
});
const darkMode = ref(false);
const alertSounds = ref<AlertAudioOption[]>([]);
const alertSoundPreferences = ref<AlertSoundPreferences>({ online: 'default', warning: 'default', offline: 'default' });
const alertSoundDraftPreferences = ref<AlertSoundPreferences>({ ...alertSoundPreferences.value });
const alertAudioUploadDataUrl = ref('');
const alertAudioUploadName = ref('');
const alertAudioUploadEnabled = ref(false);
const alertSoundSaving = ref(false);
const alertAudioUploading = ref(false);
const alertSoundError = ref('');
const alertSoundMessage = ref('');
const alertSoundPreviewStatus = ref<AlertSoundStatus | null>(null);
let alertSoundPreviewAudio: HTMLAudioElement | null = null;
let alertSoundPlaybackQueue: Promise<void> = Promise.resolve();
const currentPassword = ref('');
const newPassword = ref('');
const newPasswordConfirm = ref('');
const accountMessage = ref('');
const accountError = ref('');
const accountSaving = ref(false);
const profileName = ref('');
const profileEmail = ref('');
const profileAvatar = ref<string | null>(null);
const profileWhatsappCountry = ref<CountryCode>('BR');
const profileWhatsappNumber = ref('');
const profileEmailNotifications = ref(true);
const profileWhatsappNotifications = ref(false);
const notificationCurrentPassword = ref('');
const notificationMessage = ref('');
const notificationError = ref('');
const workspaceAlertPreferences = ref<WorkspaceAlertPreferences>({ notifyAllDevices: true, devices: [] });
const workspaceAlertPreferencesSaving = ref(false);
const workspaceAlertPreferencesMessage = ref('');
const workspaceAlertPreferencesError = ref('');
const avatarError = ref('');
const refreshedAt = ref(new Date());
const activeMobileTab = ref('home');
const expandedDeviceIds = ref<string[]>([]);
let refreshTimer: ReturnType<typeof setInterval> | undefined;
let deviceEvents: EventSource | null = null;
let deviceRefreshInProgress = false;
let deviceRefreshRequested = false;

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
  'Nenhum ambiente selecionado': 'No workspace selected',
  'Crie ou importe um ambiente': 'Create or import a workspace',
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
  'Apagar notificações': 'Delete notifications',
  'Apagar todas as notificações deste ambiente?': 'Delete all notifications in this workspace?',
  'Não foi possível apagar as notificações.': 'Could not delete notifications.',
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
  'Simular leituras': 'Simulate readings',
  'Temperatura (°C)': 'Temperature (°C)',
  'Umidade (%)': 'Humidity (%)',
  'Gás (ppm)': 'Gas (ppm)',
  'Estado simulado': 'Simulated status',
  'Aplicar simulação': 'Apply simulation',
  'Simulação aplicada. Alertas são disparados quando o estado muda.': 'Simulation applied. Alerts are triggered when the status changes.',
  'Em atenção': 'Needs attention',
  'A simulação está disponível somente para o aparelho fictício proprietário desta conta.': 'Simulation is only available for this account-owned fictional device.',
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
  'Sons': 'Sounds',
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
  'Sons de alerta': 'Alert sounds',
  'Retorno ao normal': 'Back to normal',
  'Som de retorno ao normal': 'Back-to-normal sound',
  'Som de atenção': 'Warning sound',
  'Som de aparelho offline': 'Device-offline sound',
  'Biblioteca compartilhada': 'Shared library',
  'Adicione um áudio para disponibilizá-lo a todas as contas.': 'Add audio to make it available to all accounts.',
  'O envio de áudios está desativado pelo administrador.': 'Audio uploads are disabled by the administrator.',
  'Nome do áudio': 'Audio name',
  'Escolher áudio': 'Choose audio',
  'MP3, WAV, OGG ou WebM, até 1 MB': 'MP3, WAV, OGG, or WebM, up to 1 MB',
  'Testar som': 'Test sound',
  'Tocar som': 'Play sound',
  'Parar som': 'Stop sound',
  'Adicionar à biblioteca': 'Add to library',
  'Salvar sons por alerta': 'Save sounds per alert',
  'Áudio adicionado à biblioteca compartilhada.': 'Audio added to the shared library.',
  'Sons por alerta salvos.': 'Alert sounds saved.',
  'Carregando sons...': 'Loading sounds...',
  'Selecione um som': 'Select a sound',
  'Escolha um áudio MP3, WAV, OGG ou WebM de até 1 MB.': 'Choose an MP3, WAV, OGG, or WebM audio file up to 1 MB.',
  'Não foi possível ler o arquivo de áudio.': 'Could not read the audio file.',
  'Não foi possível salvar o som de alerta.': 'Could not save the alert sound.',
  'O navegador bloqueou a reprodução do áudio.': 'The browser blocked audio playback.',
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
  'País e código do WhatsApp': 'WhatsApp country and calling code',
  'Número do WhatsApp': 'WhatsApp number',
  'Digite o número local com DDD.': 'Enter the local number including area code.',
  'O WhatsApp requer uma conta conectada pelo administrador.': 'WhatsApp requires an account connected by the administrator.',
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
  'Informe sua senha atual para salvar.': 'Enter your current password to save.',
  'AMBIENTES': 'WORKSPACES',
  'Ambientes': 'Workspaces',
  'Ações de ambiente': 'Workspace actions',
  'Fechar seleção de ambientes': 'Close workspace selection',
  'Fechar gerenciamento de ambientes': 'Close workspace management',
  'Selecionar ambiente': 'Select workspace',
  'Adicionar/editar ambiente': 'Add/edit workspace',
  'Criar': 'Create',
  'Editar': 'Edit',
  'Importar': 'Import',
  'Compartilhar': 'Share',
  'Nome do ambiente': 'Workspace name',
  'Ex.: Laboratório Central': 'E.g. Central Laboratory',
  'Ícone do ambiente': 'Workspace icon',
  'Imagem JPG, PNG ou WebP, até 8 MB': 'JPG, PNG, or WebP image, up to 8 MB',
  'Escolher imagem': 'Choose image',
  'Escolha uma imagem JPG, PNG ou WebP de até 8 MB.': 'Choose a JPG, PNG, or WebP image up to 8 MB.',
  'Não foi possível processar essa imagem.': 'Could not process this image.',
  'Criar ambiente': 'Create workspace',
  'Salvar alterações': 'Save changes',
  'Você pode ver e compartilhar este ambiente, mas apenas um owner ou admin pode editar seu nome e ícone.': 'You can view and share this workspace, but only an owner or admin can edit its name and icon.',
  'Insira o código compartilhado para adicionar o ambiente à sua lista.': 'Enter the shared code to add this workspace to your list.',
  'Código do ambiente': 'Workspace code',
  'Importar ambiente': 'Import workspace',
  'Selecione ou crie um ambiente antes de compartilhar.': 'Select or create a workspace before sharing.',
  'Código de acesso para compartilhar': 'Access code to share',
  'Copiar código do ambiente': 'Copy workspace code',
  'Envie este código para outro usuário importar o ambiente e acompanhar os mesmos aparelhos.': 'Send this code to another user so they can import the workspace and monitor the same devices.',
  'Código do ambiente copiado.': 'Workspace code copied.',
  'Não foi possível copiar automaticamente. Copie manualmente: ': 'Could not copy automatically. Copy manually: ',
  'Selecionar ambiente de destino': 'Select destination workspace',
  'Ambiente atual': 'Current workspace',
  'Sem ambiente': 'No workspace',
  'Adicionar a este ambiente': 'Add to this workspace',
  'Mover para este ambiente': 'Move to this workspace',
  'Este aparelho já está neste ambiente': 'This device is already in this workspace',
  'Mover este aparelho? Ele deixará de aparecer no ambiente atual.': 'Move this device? It will no longer appear in its current workspace.',
  'Aparelho adicionado ao ambiente.': 'Device added to workspace.',
  'Aparelho movido para o ambiente.': 'Device moved to workspace.',
  'Nenhum aparelho de monitoramento vinculado à sua conta.': 'No monitoring devices are linked to your account.',
  'Falha ao carregar aparelhos vinculados.': 'Failed to load linked devices.',
  'Não foi possível adicionar o aparelho ao ambiente.': 'Could not add the device to the workspace.',
  'Você não pertence a esse ambiente.': 'You do not belong to this workspace.',
  'Aparelho inválido.': 'Invalid device.',
  'Aparelho não vinculado à sua conta.': 'This device is not linked to your account.',
  'Você não tem permissão para mover este aparelho.': 'You do not have permission to move this device.',
  'Gerenciamento de aparelhos': 'Device management',
  'Aparelhos de monitoramento vinculados à sua conta': 'Monitoring devices linked to your account',
  'Sem permissão para mover este aparelho.': 'You do not have permission to move this device.',
  'Escolha o ambiente de destino para adicionar ou mover seus aparelhos vinculados.': 'Choose a destination workspace to add or move your linked devices.',
  'Carregando aparelhos...': 'Loading devices...',
  'O aparelho será associado ao ambiente selecionado acima.': 'The device will be assigned to the workspace selected above.',
  'Cadastro público': 'Public registration',
  'Permitir criação de contas': 'Allow account creation',
  'Habilitado na tela de login': 'Enabled on the sign-in screen',
  'Desabilitado': 'Disabled',
  'Convite enviado por e-mail.': 'Invitation sent by email.',
  'Informe um e-mail válido.': 'Enter a valid email address.',
  'Sem permissão para convidar pessoas para este ambiente.': 'You do not have permission to invite people to this workspace.',
  'Sem permissão para gerenciar este ambiente.': 'You do not have permission to manage this workspace.',
  'Nao foi possivel carregar os ambientes.': 'Could not load workspaces.',
  'Nao foi possivel criar o ambiente.': 'Could not create the workspace.',
  'Nao foi possivel atualizar o ambiente.': 'Could not update the workspace.',
  'Nao foi possivel importar o ambiente.': 'Could not import the workspace.',
  'Nao foi possivel trocar de ambiente.': 'Could not switch workspaces.',
  'Excluir ambiente': 'Delete workspace',
  'Remover da minha lista': 'Remove from my list',
  'Excluir este ambiente para todos? Esta ação não pode ser desfeita.': 'Delete this workspace for everyone? This action cannot be undone.',
  'Remover este ambiente apenas da sua lista? Você poderá entrar novamente pelo código compartilhado.': 'Remove this workspace from your list only? You can rejoin with the shared code.',
  'Isso excluirá o ambiente e o removerá para todos os membros.': 'This deletes the workspace for all members.',
  'Isso remove sua participação, mas mantém o ambiente para os outros membros.': 'This removes your membership but keeps the workspace for other members.',
  'Usuários': 'Users',
  'Membros': 'Members',
  'Contas': 'Accounts',
  'Contas cadastradas': 'Registered accounts',
  'Usuários cadastrados': 'Registered users',
  'Editar usuário': 'Edit user',
  'A senha não pode ser alterada por aqui. Use a ação de redefinição para exigir uma nova senha.': 'The password cannot be changed here. Use the reset action to require a new password.',
  'Usuário atualizado.': 'User updated.',
  'Usuário atualizado. O e-mail de acesso foi alterado.': 'User updated. The sign-in email was changed.',
  'Não foi possível atualizar o usuário.': 'Could not update the user.',
  'Informe um nome e um e-mail válidos.': 'Enter a valid name and email address.',
  'Este e-mail já está sendo usado por outra conta.': 'This email address is already used by another account.',
  'Contas administradoras da plataforma não podem ser editadas por esta ação.': 'Platform administrator accounts cannot be edited with this action.',
  'Edite sua própria conta nas configurações do perfil.': 'Edit your own account in profile settings.',
  'Senha removida. O usuário deverá criar uma nova senha usando Esqueci a senha antes de entrar novamente.': 'Password removed. The user must create a new password using Forgot password before signing in again.',
  'Sua senha foi removida. Use Esqueci a senha para criar uma nova antes de entrar.': 'Your password was removed. Use Forgot password to create a new one before signing in.',
  'contas': 'accounts',
  'Redefinição de senha exigida': 'Password reset required',
  'Conta ativa': 'Active account',
  'E-mail pendente': 'Email pending',
  'Carregando contas...': 'Loading accounts...',
  'Nenhuma conta cadastrada.': 'No registered accounts.',
  'Abrir ações da conta': 'Open account actions',
  'Exigir redefinição de senha': 'Require password reset',
  'Remover senha e exigir nova senha': 'Remove password and require a new one',
  'Redefinição já exigida': 'Reset already required',
  'Excluindo...': 'Deleting...',
  'WhatsApp API': 'WhatsApp API',
  'E-mail API': 'Email API',
  'Configuração da Cloud API': 'Cloud API settings',
  'Cloud API configurada': 'Cloud API configured',
  'Cloud API não configurada': 'Cloud API not configured',
  'Token de acesso da Meta': 'Meta access token',
  'ID do número WhatsApp': 'WhatsApp phone number ID',
  'Versão da API Graph': 'Graph API version',
  'Nome do modelo aprovado': 'Approved template name',
  'Idioma do modelo': 'Template language',
  'Remover token salvo': 'Remove saved token',
  'Desativa o envio pela Cloud API; a conexão QR continua independente.': 'Disables Cloud API sending; the QR connection remains independent.',
  'Use o nome e idioma de um modelo aprovado no WhatsApp Manager. Para modelos diferentes de hello_world, o servidor envia três parâmetros: aparelho, estado e localização.': 'Use an approved template name and language from WhatsApp Manager. For templates other than hello_world, the server sends three parameters: device, status, and location.',
  'Deixe em branco para manter o token salvo.': 'Leave blank to keep the saved token.',
  'Configuração da Cloud API salva.': 'Cloud API settings saved.',
  'Confira o token, o ID do número, a versão da API e os dados do modelo.': 'Check the token, phone number ID, API version, and template details.',
  'Configure o ID do número antes de salvar o token de acesso.': 'Set the phone number ID before saving the access token.',
  'Não foi possível salvar a configuração da Cloud API.': 'Could not save Cloud API settings.',
  'Servidor SMTP': 'SMTP server',
  'Porta SMTP': 'SMTP port',
  'Conexão segura (TLS)': 'Secure connection (TLS)',
  'Usuário SMTP': 'SMTP username',
  'Senha SMTP': 'SMTP password',
  'Deixe em branco para manter a senha salva.': 'Leave blank to keep the saved password.',
  'Apagar senha salva': 'Clear saved password',
  'Nome do remetente': 'Sender name',
  'E-mail do remetente': 'Sender email address',
  'Mensagem de e-mail ao normalizar': 'Email recovery message',
  'Mensagem de e-mail em atenção': 'Email warning message',
  'Mensagem de e-mail offline': 'Email offline message',
  'Prévia do e-mail em atenção': 'Email warning preview',
  'Assunto': 'Subject',
  'agora': 'now',
  'Notificação automática do sistema de monitoramento.': 'Automated monitoring system notification.',
  'Salvar configuração de e-mail': 'Save email settings',
  'Configuração de e-mail salva.': 'Email settings saved.',
  'As mensagens são enviadas em HTML e texto simples. A senha SMTP é cifrada no servidor.': 'Messages are sent as HTML and plain text. The SMTP password is encrypted on the server.',
  'Testar conexão SMTP': 'Test SMTP connection',
  'Conexão SMTP verificada.': 'SMTP connection verified.',
  'Conexão SMTP não testada': 'SMTP connection not tested',
  'Conexão SMTP ativa': 'SMTP connection active',
  'Falha na conexão SMTP': 'SMTP connection failed',
  'Apagar log de e-mail': 'Clear email log',
  'Tem certeza que deseja apagar todo o log de e-mail?': 'Are you sure you want to clear the entire email log?',
  'Nenhum e-mail enviado.': 'No emails sent.',
  'O log guarda resultados e destinatários mascarados, nunca o conteúdo.': 'The log stores results and masked recipients, never message content.',
  'eventos': 'events',
  'Log de eventos': 'Event log',
  'Configuração de e-mail': 'Email settings',
  'Conexão SMTP': 'SMTP connection',
  'Configuração': 'Settings',
  'Nome exibido nas mensagens': 'Name shown in messages',
  'Mensagem ao normalizar': 'Recovery message',
  'Mensagem em atenção': 'Warning message',
  'Mensagem offline': 'Offline message',
  'Prévia da mensagem em atenção': 'Warning message preview',
  'Salvar configuração': 'Save settings',
  'Configuração salva.': 'Settings saved.',
  'Modelos de notificação salvos.': 'Notification templates saved.',
  'Use {{laboratorio}}, {{aparelho}}, {{status}}, {{localizacao}} e {{identificador}} como campos dinâmicos.': 'Use {{laboratorio}}, {{aparelho}}, {{status}}, {{localizacao}} and {{identificador}} as dynamic fields.',
  'Estas mensagens são usadas pela conexão via QR. O nome não altera o perfil da conta WhatsApp.': 'These messages are used by the QR connection. The name does not change the WhatsApp account profile.',
  'Apagar log': 'Clear log',
  'Tem certeza que deseja apagar todo o log do WhatsApp?': 'Are you sure you want to clear the entire WhatsApp log?',
  'Log': 'Log',
  'Conexão': 'Connection',
  'Perfil da conta WhatsApp': 'WhatsApp account profile',
  'Nome do perfil WhatsApp': 'WhatsApp profile name',
  'Foto do perfil WhatsApp': 'WhatsApp profile photo',
  'Escolher foto': 'Choose photo',
  'Remover foto atual': 'Remove current photo',
  'Histórico de perfis': 'Profile history',
  'Perfil original': 'Original profile',
  'Versão salva': 'Saved version',
  'Restaurar esta versão': 'Restore this version',
  'O perfil original será restaurado automaticamente ao desconectar a conta.': 'The original profile will be restored automatically when disconnecting the account.',
  'As fotos e nomes salvos continuam disponíveis para restauração.': 'Saved photos and names remain available for restoration.',
  'Conecte a conta via QR para editar o perfil.': 'Connect the account via QR to edit its profile.',
  'Perfil WhatsApp atualizado e guardado no histórico.': 'WhatsApp profile updated and saved to history.',
  'Perfil original restaurado. Ele também será restaurado automaticamente ao desconectar.': 'Original profile restored. It will also be restored automatically when disconnecting.',
  'Versão do perfil restaurada.': 'Profile version restored.',
  'Não foi possível carregar o perfil da conta WhatsApp.': 'Could not load the WhatsApp account profile.',
  'Recuperar ponto de restauração': 'Recover restore point',
  'O WhatsApp não forneceu o nome do perfil. Confira no aplicativo do celular e informe abaixo o nome que está usando agora. O servidor salvará esse nome e a foto atual como referência antes de liberar as edições.': 'WhatsApp did not provide the profile name. Check the WhatsApp mobile app and enter the current name below. The server will save that name and the current photo as a restore point before enabling edits.',
  'Nome atual exibido no WhatsApp': 'Current name shown in WhatsApp',
  'Salvar referência e abrir editor': 'Save restore point and open editor',
  'Perfil original salvo. Agora você pode editar a conta.': 'Original profile saved. You can now edit the account.',
  'Não foi possível atualizar o perfil WhatsApp.': 'Could not update the WhatsApp profile.',
  'Não foi possível restaurar essa versão do perfil.': 'Could not restore this profile version.',
  'Privacidade da conta': 'Account privacy',
  'Quem pode ver meu visto por último': 'Who can see my last seen',
  'Quem pode ver quando estou online': 'Who can see when I am online',
  'Quem pode ver minha foto': 'Who can see my profile photo',
  'Quem pode ver minhas atualizações de Status': 'Who can see my Status updates',
  'Confirmações de leitura': 'Read receipts',
  'Quem pode me adicionar em grupos': 'Who can add me to groups',
  'Todos': 'Everyone',
  'Meus contatos': 'My contacts',
  'Meus contatos, exceto...': 'My contacts except...',
  'Ninguém': 'Nobody',
  'Igual ao visto por último': 'Same as last seen',
  'Salvar privacidade': 'Save privacy settings',
  'Ativadas': 'On',
  'Desativadas': 'Off',
  'Figurinha por alerta': 'Sticker per alert',
  'Figurinhas são enviadas pelo WhatsApp Web via QR; a Cloud API deste projeto usa modelos aprovados.': 'Stickers are sent through WhatsApp Web via QR; this project’s Cloud API uses approved templates.',
  'Mídia de cada alerta': 'Media for each alert',
  'Mídia': 'Media',
  'Mídia favorita': 'Favorite media',
  'Selecione uma mídia': 'Select media',
  'Biblioteca de mídia': 'Media library',
  'Adicione GIF, WebP, PNG ou JPEG. GIFs e WebPs animados são detectados automaticamente e aparecem em movimento na prévia.': 'Add GIF, WebP, PNG, or JPEG. Animated GIFs and WebPs are detected automatically and play in the preview.',
  'Nome da mídia': 'Media name',
  'Ex.: Alerta do sensor': 'E.g. Sensor alert',
  'Mídia selecionada': 'Media selected',
  'Escolher mídia': 'Choose media',
  'Excluir a mídia': 'Delete this media',
  'Esta ação não pode ser desfeita.': 'This action cannot be undone.',
  'Mídia excluída da biblioteca.': 'Media deleted from the library.',
  'Não foi possível excluir a mídia.': 'Could not delete the media.',
  'Carregando mídias...': 'Loading media...',
  'Nenhuma mídia favorita.': 'No favorite media.',
  'Imagem': 'Image',
  'Figurinha': 'Sticker',
  'Imagem e figurinha são enviadas pelo WhatsApp Web via QR; a Cloud API deste projeto usa modelos aprovados.': 'Images and stickers are sent through WhatsApp Web via QR; this project’s Cloud API uses approved templates.',
  'Somente texto': 'Text only',
  'Imagem com mensagem': 'Image with message',
  'Selecione uma figurinha': 'Select a sticker',
  'Selecione uma imagem': 'Select an image',
  'Imagens favoritas': 'Favorite images',
  'Ao escolher imagem, o texto do alerta vai como legenda na mesma mensagem.': 'When an image is selected, the alert text is sent as its caption in the same message.',
  'Nome da imagem': 'Image name',
  'Ex.: Foto do sensor': 'E.g. Sensor photo',
  'Imagem selecionada': 'Image selected',
  'Nenhuma imagem favorita.': 'No favorite images.',
  'Canvas indisponível.': 'Canvas is unavailable.',
  'A imagem não pôde ser reduzida para o limite permitido.': 'The image could not be reduced to the allowed size.',
  'Não foi possível carregar as imagens favoritas.': 'Could not load favorite images.',
  'Não foi possível salvar a imagem favorita.': 'Could not save the favorite image.',
  'Informe um nome e uma imagem compatível.': 'Enter a name and a compatible image.',
  'Envie uma imagem compatível.': 'Upload a compatible image.',
  'A imagem importada excede o limite de 600 KB.': 'The imported image exceeds the 600 KB limit.',
  'Não foi possível ler a imagem enviada.': 'Could not read the uploaded image.',
  'A imagem excede 1 MB após a otimização.': 'The image exceeds 1 MB after optimization.',
  'Uma das imagens selecionadas não está na biblioteca.': 'One of the selected images is not in the library.',
  'A imagem selecionada não está na biblioteca.': 'The selected image is not in the library.',
  'Uma das figurinhas selecionadas não está na biblioteca de favoritos.': 'One of the selected stickers is not in the favorites library.',
  'A figurinha selecionada não está na biblioteca.': 'The selected sticker is not in the library.',
  'Imagem adicionada aos favoritos.': 'Image added to favorites.',
  'Sem figurinha': 'No sticker',
  'Figurinhas favoritas': 'Favorite stickers',
  'Os stickers ficam salvos no servidor para reutilização. Importe WebP estáticos ou animados; o servidor normaliza para 512 × 512, com até 100 KB estáticos ou 500 KB e 10 segundos animados.': 'Stickers are stored on the server for reuse. Import static or animated WebP; the server normalizes them to 512 × 512, up to 100 KB static or 500 KB and 10 seconds animated.',
  'A imagem será enviada junto com o texto como uma única mensagem.': 'The image and text will be sent together as one message.',
  'A figurinha é enviada antes da mensagem de texto.': 'The sticker is sent before the text message.',
  'Nome da figurinha': 'Sticker name',
  'Ex.: Alerta vermelho': 'E.g. Red alert',
  'WebP selecionado': 'WebP selected',
  'Escolher figurinha WebP': 'Choose WebP sticker',
  'Adicionar aos favoritos': 'Add to favorites',
  'Figurinha adicionada aos favoritos.': 'Sticker added to favorites.',
  'Animada': 'Animated',
  'Estática': 'Static',
  'Carregando figurinhas...': 'Loading stickers...',
  'Nenhuma figurinha favorita.': 'No favorite stickers.',
  'Escolha uma figurinha WebP de até 500 KB.': 'Choose a WebP sticker up to 500 KB.',
  'O arquivo WebP deve ter até 500 KB.': 'The WebP file must be at most 500 KB.',
  'O arquivo enviado não é uma figurinha WebP válida.': 'The uploaded file is not a valid WebP sticker.',
  'A figurinha excede as dimensões ou o número de quadros permitidos.': 'The sticker exceeds the allowed dimensions or frame count.',
  'A animação deve durar no máximo 10 segundos.': 'The animation must be at most 10 seconds long.',
  'A figurinha animada excede 500 KB após a conversão.': 'The animated sticker exceeds 500 KB after conversion.',
  'A figurinha estática excede 100 KB após a conversão.': 'The static sticker exceeds 100 KB after conversion.',
  'Não foi possível normalizar todos os quadros da figurinha.': 'Could not normalize all sticker frames.',
  'Normalização': 'Recovery',
  'Atenção': 'Warning',
  'As alterações de privacidade são aplicadas diretamente à conta WhatsApp e permanecem mesmo depois de desconectar o Baileys.': 'Privacy changes are applied directly to the WhatsApp account and remain after disconnecting Baileys.',
  'A regra de exceções pode ser selecionada aqui, mas a lista de pessoas excluídas é gerenciada no próprio WhatsApp.': 'The exception rule can be selected here, but the list of excluded people is managed in WhatsApp itself.',
  'Privacidade do WhatsApp atualizada.': 'WhatsApp privacy settings updated.',
  'Não foi possível carregar as opções de privacidade.': 'Could not load privacy settings.',
  'Não foi possível salvar as opções de privacidade.': 'Could not save privacy settings.',
  'As opções de privacidade informadas são inválidas.': 'The supplied privacy settings are invalid.',
  'Conecte a conta WhatsApp via QR para gerenciar a privacidade.': 'Connect the WhatsApp account via QR to manage privacy.',
  'Conecte a conta WhatsApp via QR para alterar a privacidade.': 'Connect the WhatsApp account via QR to change privacy.',
  'Desconexão cancelada: ': 'Disconnect cancelled: ',
  'Falha ao salvar perfil original': 'Failed to save original profile',
  'Falha ao restaurar perfil original': 'Failed to restore original profile',
  'Não foi possível ler o nome original do perfil WhatsApp. A edição foi bloqueada para preservar a restauração.': 'Could not read the original WhatsApp profile name. Editing was blocked to preserve restoration.',
  'Não foi possível baixar a foto atual da conta WhatsApp.': 'Could not download the current WhatsApp account photo.',
  'O histórico do perfil do WhatsApp está inválido.': 'The WhatsApp profile history is invalid.',
  'A versão selecionada do perfil não foi encontrada.': 'The selected profile version was not found.',
  'A conta WhatsApp ainda não está conectada.': 'The WhatsApp account is not connected yet.',
  'Conecte a conta WhatsApp via QR para gerenciar o perfil.': 'Connect the WhatsApp account via QR to manage its profile.',
  'Conecte a conta WhatsApp via QR para restaurar o perfil.': 'Connect the WhatsApp account via QR to restore its profile.',
  'Últimos 100 eventos em memória; o histórico é limpo quando a API reinicia.': 'Latest 100 in-memory events; history clears when the API restarts.',
  'Nenhum evento registrado.': 'No events recorded.',
  'O log não armazena o conteúdo das mensagens nem números completos.': 'The log does not store message content or full phone numbers.',
  'Conexão WhatsApp Web': 'WhatsApp Web connection',
  'Teste de conectividade do canal ativo': 'Active channel connectivity test',
  'Cloud API operacional': 'Cloud API operational',
  'WhatsApp Web conectado': 'WhatsApp Web connected',
  'Falha no teste de conexão': 'Connection test failed',
  'Cloud API não testada': 'Cloud API not tested',
  'Sessão QR não testada': 'QR session not tested',
  'Conexão não testada': 'Connection not tested',
  'O teste consulta os dados do número na Meta Graph API sem enviar mensagens.': 'The test checks the number details through Meta Graph API without sending messages.',
  'Configure e salve o token e o ID do número antes de testar.': 'Configure and save the token and phone number ID before testing.',
  'Salve o canal selecionado na aba Configuração antes de testar.': 'Save the selected channel in Settings before testing.',
  'Conecte o WhatsApp via QR code na aba Configuração antes de testar.': 'Connect WhatsApp via QR code in Settings before testing.',
  'O teste verifica se a sessão vinculada via QR está conectada.': 'The test checks whether the linked QR session is connected.',
  'Seleção pendente. Salve a configuração para ativar este canal.': 'Selection pending. Save settings to activate this channel.',
  'Somente o canal selecionado e salvo será usado para enviar notificações. O outro canal não fará fallback.': 'Only the selected and saved channel will send notifications. There is no fallback to the other channel.',
  'Canal ativo para notificações': 'Active notification channel',
  'WhatsApp Web via QR (API particular)': 'WhatsApp Web via QR (private API)',
  'Usa a sessão vinculada por QR para enviar os alertas.': 'Uses the QR-linked session to send alerts.',
  'WhatsApp Cloud API': 'WhatsApp Cloud API',
  'Usa o token e o número configurados na Meta.': 'Uses the token and number configured in Meta.',
  'Conexão via QR code': 'QR code connection',
  'Salve a seleção para ativar este canal.': 'Save the selection to activate this channel.',
  'Salvar seleção do canal': 'Save channel selection',
  'Testar conexão': 'Test connection',
  'Selecione e salve WhatsApp Web via QR como canal ativo antes de conectar.': 'Select and save WhatsApp Web via QR as the active channel before connecting.',
  'Testando conexão...': 'Testing connection...',
  'Desconectado': 'Disconnected',
  'Conectando': 'Connecting',
  'Aguardando leitura do QR code': 'Waiting for QR code scan',
  'Conectado': 'Connected',
  'Iniciar conexão': 'Start connection',
  'Desconectar conta': 'Disconnect account',
  'Escaneie o QR code com o WhatsApp da conta que enviará os alertas.': 'Scan the QR code with the WhatsApp account that will send alerts.',
  'Os alertas serão enviados somente a usuários que ativaram WhatsApp no perfil.': 'Alerts are sent only to users who enabled WhatsApp in their profile.',
  'Este conector não é oficial. O WhatsApp pode desconectar ou bloquear contas que automatizam mensagens.': 'This connector is unofficial. WhatsApp may disconnect or block accounts that automate messages.',
  'Voltar': 'Back',
  'Gerencie membros, papéis e convites do ambiente ativo.': 'Manage members, roles, and invitations for the active workspace.',
  'Convidar usuário': 'Invite user',
  'Convidar': 'Invite',
  'Membro': 'Member',
  'Administrador': 'Administrator',
  'Proprietário': 'Owner',
  'Administrador da plataforma': 'Platform administrator',
  'O papel deste administrador da plataforma não pode ser alterado.': 'This platform administrator role cannot be changed.',
  'O papel da conta administradora da plataforma não pode ser alterado.': 'The platform administrator account role cannot be changed.',
  'Convites pendentes': 'Pending invitations',
  'Remover': 'Remove',
  'Remover acesso': 'Remove access',
  'Este ambiente ainda não tem membros convidados.': 'This workspace has no invited members yet.',
  'Membros com acesso ao ambiente ativo.': 'Members with access to the active workspace.',
  'Remover alguém daqui não exclui a conta.': 'Removing someone here does not delete their account.',
  'Excluir usuário permanentemente': 'Permanently delete user',
  'AÇÃO IRREVERSÍVEL': 'IRREVERSIBLE ACTION',
  'A conta será removida permanentemente.': 'This account will be permanently deleted.',
  'Dispositivos vinculados e leituras serão apagados. Workspaces compartilhados serão preservados e transferidos a outro membro quando necessário.': 'Linked devices and readings will be deleted. Shared workspaces will be preserved and transferred to another member when necessary.',
  'Digite o e-mail do usuário para confirmar': 'Type the user email to confirm',
  'Excluir conta e dados': 'Delete account and data',
  'usuario@empresa.com': 'user@company.com'
};

function t(text: string) {
  return language.value === 'en' ? englishText[text] ?? text : text;
}

function interpolateNotificationTemplate(template: string, senderName: string, status: string) {
  const values: Record<string, string> = {
    laboratorio: senderName || 'LAB/MONITOR',
    aparelho: 'Sensor de demonstração',
    status,
    localizacao: 'Laboratório Central',
    identificador: 'sensor-01'
  };
  return template.replace(/\{\{([^{}]+)\}\}/g, (_placeholder, key: string) => values[key] ?? '');
}

function formatMessagePreview(message: string) {
  const replacements: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const codeSegments: string[] = [];
  let formatted = message.replace(/[&<>"']/g, (character) => replacements[character] ?? character);
  formatted = formatted.replace(/```([\s\S]*?)```|`([^`\n]+)`/g, (_match, block: string | undefined, inline: string | undefined) => {
    const codeHtml = block !== undefined
      ? `<pre class="message-preview-code"><code>${block}</code></pre>`
      : `<code class="message-preview-inline-code">${inline}</code>`;
    const token = `MESSAGEPREVIEWCODE${codeSegments.length}TOKEN`;
    codeSegments.push(codeHtml);
    return token;
  });
  formatted = formatted
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')
    .replace(/~([^~\n]+)~/g, '<del>$1</del>')
    .replace(/^&gt; ?([^\n]+)/gm, '<blockquote class="message-preview-quote">$1</blockquote>')
    .replace(/^- ([^\n]+)/gm, '&bull; $1')
    .replace(/^(\d+)\. ([^\n]+)/gm, '$1. $2')
    .replace(/\r?\n/g, '<br>');
  return formatted.replace(/MESSAGEPREVIEWCODE(\d+)TOKEN/g, (_token, index: string) => codeSegments[Number(index)] ?? '');
}

function workspaceRoleLabel(role: string) {
  const labels: Record<string, string> = { owner: 'Proprietário', admin: 'Administrador', member: 'Membro' };
  return t(labels[role] ?? role);
}

const dateLocale = computed(() => language.value === 'en' ? 'en-GB' : 'pt-BR');
const reportDate = computed(() => new Intl.DateTimeFormat(dateLocale.value, {
  weekday: 'long', day: 'numeric', month: 'long'
}).format(new Date()));

function deviceDisplayName(device: Device): string {
  return device.alias?.trim() || device.name;
}

const filteredDevices = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('pt-BR');
  const matchingDevices = query
    ? devices.value.filter((device) => `${deviceDisplayName(device)} ${device.name} ${device.externalId} ${device.location ?? ''}`.toLocaleLowerCase('pt-BR').includes(query))
    : devices.value;
  return [...matchingDevices].sort((left, right) => Number(Boolean(left.canSimulate)) - Number(Boolean(right.canSimulate)));
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
  if (!user.value || !activeWorkspaceId.value) {
    if (!activeWorkspaceId.value) devices.value = [];
    return;
  }
  if (deviceRefreshInProgress) {
    deviceRefreshRequested = true;
    return;
  }
  deviceRefreshInProgress = true;
  try {
    const result = await api<{ devices: Device[] }>('/api/devices');
    devices.value = result.devices;
    const nextSimulationValues = { ...simulationValues.value };
    for (const device of result.devices) {
      if (device.canSimulate && !nextSimulationValues[device.id]) {
        nextSimulationValues[device.id] = { status: device.status, temperature: 22.5, humidity: 48, gas: 180 };
      }
    }
    simulationValues.value = nextSimulationValues;
    refreshedAt.value = new Date();
    pageError.value = '';
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Falha ao atualizar aparelhos.';
  } finally {
    deviceRefreshInProgress = false;
    if (deviceRefreshRequested) {
      deviceRefreshRequested = false;
      queueMicrotask(() => void loadDevices());
    }
  }
}

async function loadNotifications(playSoundsForNew = false): Promise<void> {
  if (!user.value || !activeWorkspaceId.value) {
    notifications.value = [];
    return;
  }
  const existingIds = new Set(notifications.value.map((notification) => notification.id));
  try {
    const result = await api<{ notifications: DeviceNotification[] }>('/api/notifications');
    notifications.value = result.notifications;
    if (playSoundsForNew) {
      for (const status of new Set(result.notifications.filter((notification) => !existingIds.has(notification.id)).map((notification) => notification.status))) {
        playAlertSound(alertSoundPreferences.value[status]);
      }
    }
  } catch {
    return;
  }
}

function connectDeviceEvents(workspaceId: string | null): void {
  deviceEvents?.close();
  deviceEvents = null;
  if (!user.value || !workspaceId) return;
  const events = new EventSource('/api/events/devices');
  events.addEventListener('devices-updated', () => {
    void loadDevices();
    void loadNotifications(true);
  });
  deviceEvents = events;
}

function toggleNotificationPanel(): void {
  notificationOpen.value = !notificationOpen.value;
  if (notificationOpen.value) void markAllNotificationsRead();
}

async function markAllNotificationsRead(): Promise<void> {
  if (!unreadNotificationCount.value) return;
  notifications.value = notifications.value.map((notification) => ({ ...notification, read: true }));
  try {
    await api('/api/notifications/read-all', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken.value } });
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Não foi possível marcar as notificações como lidas.';
    void loadNotifications();
  }
}

async function deleteAllNotifications(): Promise<void> {
  if (!notifications.value.length || !window.confirm(t('Apagar todas as notificações deste ambiente?'))) return;
  try {
    await api('/api/notifications', { method: 'DELETE', headers: { 'X-CSRF-Token': csrfToken.value } });
    notifications.value = [];
  } catch {
    pageError.value = t('Não foi possível apagar as notificações.');
  }
}

function openDeviceNotification(notification: DeviceNotification) {
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

async function loadWorkspaces() {
  if (!user.value) {
    workspaces.value = [];
    activeWorkspaceId.value = null;
    workspaceMembers.value = [];
    workspaceInvitations.value = [];
    return;
  }
  try {
    const result = await api<{ workspaces: Workspace[]; activeWorkspaceId: string | null; isPlatformAdmin: boolean; isBootstrapAdmin: boolean; showWorkspaceSetupWhenEmpty: boolean }>('/api/workspaces');
    workspaces.value = result.workspaces;
    activeWorkspaceId.value = result.activeWorkspaceId;
    user.value = { ...user.value, activeWorkspaceId: result.activeWorkspaceId, workspaces: result.workspaces, isPlatformAdmin: result.isPlatformAdmin, isBootstrapAdmin: result.isBootstrapAdmin };
    if (result.activeWorkspaceId) {
      await loadWorkspaceMembers();
    } else {
      workspaceMembers.value = [];
      workspaceInvitations.value = [];
      if (result.workspaces.length) workspaceMenuOpen.value = true;
      else if (result.showWorkspaceSetupWhenEmpty) openWorkspaceManager('create');
    }
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Nao foi possivel carregar os ambientes.';
  }
}

async function loadWorkspaceMembers() {
  if (!user.value || !activeWorkspaceId.value || !canManageActiveWorkspace.value) {
    workspaceMembers.value = [];
    workspaceInvitations.value = [];
    return;
  }
  try {
    const [membersResult, invitationsResult] = await Promise.all([
      api<{ members: WorkspaceMember[] }>('/api/workspaces/' + activeWorkspaceId.value + '/members'),
      api<{ invitations: WorkspaceInvitation[] }>('/api/workspaces/' + activeWorkspaceId.value + '/invitations')
    ]);
    workspaceMembers.value = membersResult.members;
    workspaceInvitations.value = invitationsResult.invitations;
  } catch {
    workspaceMembers.value = [];
    workspaceInvitations.value = [];
  }
}

async function loadAdminUsers() {
  if (!canManageUserAccounts.value) return;
  adminUsersLoading.value = true;
  adminUsersError.value = '';
  try {
    const result = await api<{ users: AdminUser[] }>('/api/admin/users');
    adminUsers.value = result.users;
  } catch (error) {
    adminUsersError.value = error instanceof Error ? t(error.message) : t('Não foi possível carregar as contas cadastradas.');
  } finally {
    adminUsersLoading.value = false;
  }
}

function openUserManagement() {
  managementTab.value = 'users';
  userManagementTab.value = canManageUserAccounts.value ? 'accounts' : 'members';
  if (canManageUserAccounts.value) void loadAdminUsers();
}

async function loadAccountDevices() {
  accountDevicesLoading.value = true;
  accountDevicesError.value = '';
  try {
    const result = await api<{ devices: AccountLinkedDevice[] }>('/api/account/devices');
    accountLinkedDevices.value = result.devices;
  } catch (error) {
    accountDevicesError.value = error instanceof Error ? t(error.message) : t('Falha ao carregar aparelhos vinculados.');
  } finally {
    accountDevicesLoading.value = false;
  }
}

async function assignAccountDevice(device: AccountLinkedDevice) {
  const targetWorkspaceId = workspaceDeviceTargetId.value;
  if (!targetWorkspaceId || device.workspaceId === targetWorkspaceId) return;
  if (device.workspaceId && !window.confirm(t('Mover este aparelho? Ele deixará de aparecer no ambiente atual.'))) return;
  accountDevicesError.value = '';
  accountDevicesMessage.value = '';
  try {
    await api('/api/workspaces/' + targetWorkspaceId + '/devices', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ deviceId: device.id })
    });
    accountDevicesMessage.value = t(device.workspaceId ? 'Aparelho movido para o ambiente.' : 'Aparelho adicionado ao ambiente.');
    await loadAccountDevices();
    await loadDevices();
  } catch (error) {
    accountDevicesError.value = error instanceof Error ? t(error.message) : t('Não foi possível adicionar o aparelho ao ambiente.');
  }
}

async function createWorkspace() {
  if (!workspaceName.value.trim()) return;
  workspaceSaving.value = true;
  try {
    const result = await api<{ workspace: Workspace; activeWorkspaceId: string }>('/api/workspaces', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ name: workspaceName.value.trim(), iconDataUrl: workspaceIconDataUrl.value })
    });
    activeWorkspaceId.value = result.activeWorkspaceId;
    workspaceName.value = '';
    workspaceIconDataUrl.value = null;
    workspaceDialogOpen.value = false;
    await loadWorkspaces();
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Nao foi possivel criar o ambiente.';
  } finally {
    workspaceSaving.value = false;
  }
}

function openWorkspaceManager(action: 'create' | 'edit' | 'import' | 'share' | 'devices' | 'members' = 'create') {
  workspaceDialogAction.value = action;
  workspaceName.value = action === 'edit' ? activeWorkspace.value?.name ?? '' : '';
  workspaceIconDataUrl.value = action === 'edit' ? activeWorkspace.value?.iconDataUrl ?? null : null;
  workspaceIconError.value = '';
  workspaceShareMessage.value = '';
  accountDevicesError.value = '';
  accountDevicesMessage.value = '';
  if (action === 'devices') {
    workspaceDeviceTargetId.value = activeWorkspaceId.value;
    void loadAccountDevices();
  }
  if (action === 'members') void loadWorkspaceMembers();
  workspaceDialogOpen.value = true;
}

async function updateWorkspace() {
  if (!activeWorkspaceId.value || !workspaceName.value.trim() || !canManageActiveWorkspace.value) return;
  workspaceSaving.value = true;
  try {
    await api<{ workspace: Workspace }>('/api/workspaces/' + activeWorkspaceId.value, {
      method: 'PATCH',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ name: workspaceName.value.trim(), iconDataUrl: workspaceIconDataUrl.value })
    });
    await loadWorkspaces();
    workspaceDialogOpen.value = false;
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Nao foi possivel atualizar o ambiente.';
  } finally {
    workspaceSaving.value = false;
  }
}

async function removeActiveWorkspace() {
  const workspace = activeWorkspace.value;
  if (!workspace || !activeWorkspaceId.value) return;
  const isOwner = workspace.role === 'owner';
  const confirmation = isOwner
    ? t('Excluir este ambiente para todos? Esta ação não pode ser desfeita.')
    : t('Remover este ambiente apenas da sua lista? Você poderá entrar novamente pelo código compartilhado.');
  if (!window.confirm(confirmation)) return;

  workspaceSaving.value = true;
  pageError.value = '';
  try {
    await api<{ action: 'deleted' | 'removed'; activeWorkspaceId: string | null }>('/api/workspaces/' + activeWorkspaceId.value, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken.value }
    });
    workspaceDialogOpen.value = false;
    managementTab.value = 'overview';
    await loadWorkspaces();
    if (activeWorkspaceId.value) {
      await loadDevices();
    } else {
      devices.value = [];
      notifications.value = [];
    }
  } catch (error) {
    pageError.value = error instanceof Error ? t(error.message) : t('Nao foi possivel remover o ambiente.');
  } finally {
    workspaceSaving.value = false;
  }
}

async function selectWorkspaceIcon(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  workspaceIconError.value = '';
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
    workspaceIconError.value = 'Escolha uma imagem JPG, PNG ou WebP de até 8 MB.';
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
    if (!context) throw new Error('Canvas indisponível.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    workspaceIconDataUrl.value = canvas.toDataURL('image/webp', 0.78);
  } catch {
    workspaceIconError.value = 'Não foi possível processar essa imagem.';
  } finally {
    input.value = '';
  }
}

async function joinWorkspaceByCode() {
  const code = importWorkspaceCode.value.trim();
  if (!code) return;
  workspaceShareMessage.value = '';
  try {
    const result = await api<{ workspace: Workspace; activeWorkspaceId: string; message: string }>('/api/workspaces/join', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ code })
    });
    importWorkspaceCode.value = '';
    activeWorkspaceId.value = result.activeWorkspaceId;
    workspaceMenuOpen.value = false;
    await loadWorkspaces();
    workspaceDialogOpen.value = false;
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Nao foi possivel importar o ambiente.';
  }
}

async function shareWorkspaceCode() {
  const code = activeWorkspaceCode.value;
  if (!code) {
    pageError.value = 'Este ambiente ainda não possui um código de compartilhamento.';
    return;
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(code);
    } else {
      const fallback = document.createElement('textarea');
      fallback.value = code;
      fallback.setAttribute('readonly', 'true');
      fallback.style.position = 'fixed';
      fallback.style.opacity = '0';
      document.body.appendChild(fallback);
      fallback.select();
      document.execCommand('copy');
      document.body.removeChild(fallback);
    }
    workspaceShareMessage.value = t('Código do ambiente copiado.');
    pageError.value = '';
  } catch {
    workspaceShareMessage.value = t('Não foi possível copiar automaticamente. Copie manualmente: ') + code;
  }
}

async function toggleRegistrationSetting() {
  if (!isWhatsAppDashboardAdmin.value) return;
  try {
    const result = await api<{ enabled: boolean }>('/api/admin/registration-settings', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ enabled: !registrationEnabled.value })
    });
    registrationEnabled.value = result.enabled;
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Nao foi possivel alterar a abertura de cadastro.';
  }
}

async function loadWhatsAppStatus() {
  if (!isWhatsAppDashboardAdmin.value) return;
  try {
    whatsappStatus.value = await api<WhatsAppWebStatus>('/api/admin/whatsapp');
    whatsappError.value = '';
  } catch (error) {
    whatsappError.value = error instanceof Error ? error.message : 'Falha ao consultar o estado do WhatsApp.';
  }
}

async function loadWhatsAppLogs() {
  if (!isWhatsAppDashboardAdmin.value) return;
  try {
    const result = await api<{ logs: WhatsAppWebLogEntry[] }>('/api/admin/whatsapp/logs');
    whatsappLogs.value = result.logs;
    whatsappError.value = '';
  } catch (error) {
    whatsappError.value = error instanceof Error ? error.message : 'Falha ao carregar o log do WhatsApp.';
  }
}

async function loadWhatsAppSettings() {
  if (!isWhatsAppDashboardAdmin.value) return;
  try {
    const result = await api<{ settings: WhatsAppNotificationSettings }>('/api/admin/whatsapp/settings');
    whatsappSettings.value = result.settings;
    whatsappSettingsMessage.value = '';
    whatsappError.value = '';
  } catch (error) {
    whatsappError.value = error instanceof Error ? error.message : 'Falha ao carregar as configurações do WhatsApp.';
  }
}

async function loadFavoriteWhatsAppMedia() {
  if (!isWhatsAppDashboardAdmin.value) return;
  favoriteWhatsAppMediaLoading.value = true;
  favoriteWhatsAppMediaError.value = '';
  try {
    const result = await api<{ media: FavoriteWhatsAppMedia[] }>('/api/admin/whatsapp/media');
    favoriteWhatsAppMedia.value = result.media;
  } catch (error) {
    favoriteWhatsAppMediaError.value = error instanceof Error ? error.message : 'Não foi possível carregar a biblioteca de mídia.';
  } finally {
    favoriteWhatsAppMediaLoading.value = false;
  }
}

async function refreshWhatsAppNotifications() {
  await Promise.all([loadWhatsAppSettings(), loadFavoriteWhatsAppMedia(), loadWhatsAppCloudSettings()]);
}

async function selectFavoriteWhatsAppMedia(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  favoriteWhatsAppMediaError.value = '';
  if (!file) return;
  if (!['image/gif', 'image/webp', 'image/png', 'image/jpeg'].includes(file.type) || file.size > 1024 * 1024) {
    favoriteWhatsAppMediaError.value = 'Escolha GIF, WebP, PNG ou JPEG de até 1 MB.';
    input.value = '';
    return;
  }
  try {
    favoriteMediaDataUrl.value = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Não foi possível ler o arquivo de mídia.'));
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo de mídia.'));
      reader.readAsDataURL(file);
    });
    if (favoriteMediaDataUrl.value.length > 1_400_000) throw new Error('A mídia excede o limite de upload.');
    favoriteMediaName.value = file.name.replace(/\.[^.]+$/, '').slice(0, 48);
  } catch (error) {
    favoriteWhatsAppMediaError.value = error instanceof Error ? error.message : 'Não foi possível ler o arquivo de mídia.';
  } finally {
    input.value = '';
  }
}

async function addFavoriteWhatsAppMedia() {
  if (!favoriteMediaName.value.trim() || !favoriteMediaDataUrl.value) return;
  favoriteMediaSaving.value = true;
  favoriteWhatsAppMediaError.value = '';
  try {
    const result = await api<{ media: FavoriteWhatsAppMedia[] }>('/api/admin/whatsapp/media', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ name: favoriteMediaName.value, mediaDataUrl: favoriteMediaDataUrl.value })
    });
    favoriteWhatsAppMedia.value = result.media;
    favoriteMediaName.value = '';
    favoriteMediaDataUrl.value = '';
    whatsappSettingsMessage.value = 'Mídia adicionada aos favoritos.';
  } catch (error) {
    favoriteWhatsAppMediaError.value = error instanceof Error ? error.message : 'Não foi possível salvar a mídia favorita.';
  } finally {
    favoriteMediaSaving.value = false;
  }
}

async function removeFavoriteWhatsAppMedia(media: FavoriteWhatsAppMedia): Promise<void> {
  if (favoriteMediaDeletingId.value) return;
  if (!window.confirm(`${t('Excluir a mídia')} "${media.name}"? ${t('Esta ação não pode ser desfeita.')}`)) return;
  favoriteMediaDeletingId.value = media.id;
  favoriteWhatsAppMediaError.value = '';
  try {
    const result = await api<{ media: FavoriteWhatsAppMedia[]; settings: WhatsAppNotificationSettings }>(
      `/api/admin/whatsapp/media/${encodeURIComponent(media.id)}`,
      { method: 'DELETE', headers: { 'X-CSRF-Token': csrfToken.value } }
    );
    favoriteWhatsAppMedia.value = result.media;
    whatsappSettings.value = result.settings;
    whatsappSettingsMessage.value = 'Mídia excluída da biblioteca.';
  } catch (error) {
    favoriteWhatsAppMediaError.value = error instanceof Error ? error.message : 'Não foi possível excluir a mídia.';
  } finally {
    favoriteMediaDeletingId.value = null;
  }
}

function setWhatsAppAlertMediaType(alert: 'online' | 'warning' | 'offline', event: Event) {
  const mediaType = (event.target as HTMLSelectElement).value as 'none' | 'sticker' | 'image';
  const firstMediaId = favoriteWhatsAppMedia.value[0]?.id ?? null;
  const settings = whatsappSettings.value;
  if (alert === 'online') {
    settings.onlineMediaType = mediaType;
    settings.onlineMediaId = mediaType === 'none' ? null : settings.onlineMediaId ?? firstMediaId;
  } else if (alert === 'warning') {
    settings.warningMediaType = mediaType;
    settings.warningMediaId = mediaType === 'none' ? null : settings.warningMediaId ?? firstMediaId;
  } else {
    settings.offlineMediaType = mediaType;
    settings.offlineMediaId = mediaType === 'none' ? null : settings.offlineMediaId ?? firstMediaId;
  }
}

function canSaveWhatsAppNotificationSettings() {
  return (['online', 'warning', 'offline'] as const).every((alert) =>
    whatsappSettings.value[`${alert}MediaType`] === 'none' || Boolean(whatsappSettings.value[`${alert}MediaId`])
  );
}

async function loadWhatsAppProfile() {
  if (!isWhatsAppDashboardAdmin.value) return;
  whatsappProfileError.value = '';
  try {
    const result = await api<{ profile: WhatsAppProfile }>('/api/admin/whatsapp/profile');
    whatsappProfile.value = result.profile;
    whatsappProfileDraftName.value = result.profile.name;
    whatsappProfileDraftPhoto.value = result.profile.photoDataUrl;
    whatsappProfilePhotoError.value = '';
    whatsappProfileMessage.value = '';
    await loadWhatsAppPrivacySettings();
  } catch (error) {
    whatsappProfileError.value = error instanceof Error ? error.message : 'Não foi possível carregar o perfil da conta WhatsApp.';
  }
}

async function initializeWhatsAppProfileBaseline(): Promise<void> {
  if (!whatsappProfileBaselineName.value.trim() || whatsappProfileBaselineSaving.value) return;
  whatsappProfileBaselineSaving.value = true;
  whatsappProfileError.value = '';
  whatsappProfileMessage.value = '';
  try {
    const result = await api<{ profile: WhatsAppProfile }>('/api/admin/whatsapp/profile/initialize', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ name: whatsappProfileBaselineName.value })
    });
    whatsappProfile.value = result.profile;
    whatsappProfileDraftName.value = result.profile.name;
    whatsappProfileDraftPhoto.value = result.profile.photoDataUrl;
    whatsappProfileBaselineName.value = '';
    whatsappProfileMessage.value = 'Perfil original salvo. Agora você pode editar a conta.';
    await loadWhatsAppPrivacySettings();
  } catch (error) {
    whatsappProfileError.value = error instanceof Error ? error.message : 'Não foi possível salvar o perfil original.';
  } finally {
    whatsappProfileBaselineSaving.value = false;
  }
}

async function loadWhatsAppPrivacySettings() {
  try {
    const result = await api<{ settings: WhatsAppPrivacySettings }>('/api/admin/whatsapp/profile/privacy');
    whatsappPrivacySettings.value = result.settings;
    whatsappPrivacyError.value = '';
    whatsappPrivacyMessage.value = '';
  } catch (error) {
    whatsappPrivacyError.value = error instanceof Error ? error.message : 'Não foi possível carregar as opções de privacidade.';
  }
}

async function saveWhatsAppPrivacySettings() {
  whatsappPrivacySaving.value = true;
  whatsappPrivacyError.value = '';
  whatsappPrivacyMessage.value = '';
  try {
    const result = await api<{ settings: WhatsAppPrivacySettings }>('/api/admin/whatsapp/profile/privacy', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify(whatsappPrivacySettings.value)
    });
    whatsappPrivacySettings.value = result.settings;
    whatsappPrivacyMessage.value = 'Privacidade do WhatsApp atualizada.';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível salvar as opções de privacidade.';
    await loadWhatsAppPrivacySettings();
    whatsappPrivacyError.value = message;
  } finally {
    whatsappPrivacySaving.value = false;
  }
}

async function saveWhatsAppProfile() {
  whatsappProfileSaving.value = true;
  whatsappProfileError.value = '';
  whatsappProfileMessage.value = '';
  try {
    const result = await api<{ profile: WhatsAppProfile }>('/api/admin/whatsapp/profile', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ name: whatsappProfileDraftName.value, photoDataUrl: whatsappProfileDraftPhoto.value })
    });
    whatsappProfile.value = result.profile;
    whatsappProfileDraftName.value = result.profile.name;
    whatsappProfileDraftPhoto.value = result.profile.photoDataUrl;
    whatsappProfileMessage.value = 'Perfil WhatsApp atualizado e guardado no histórico.';
  } catch (error) {
    whatsappProfileError.value = error instanceof Error ? error.message : 'Não foi possível atualizar o perfil WhatsApp.';
  } finally {
    whatsappProfileSaving.value = false;
  }
}

async function restoreWhatsAppProfileSnapshot(snapshot: WhatsAppProfileSnapshot) {
  if (whatsappProfileRestoringId.value) return;
  whatsappProfileRestoringId.value = snapshot.id;
  whatsappProfileError.value = '';
  whatsappProfileMessage.value = '';
  try {
    const result = await api<{ profile: WhatsAppProfile }>('/api/admin/whatsapp/profile/restore', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ snapshotId: snapshot.id })
    });
    whatsappProfile.value = result.profile;
    whatsappProfileDraftName.value = result.profile.name;
    whatsappProfileDraftPhoto.value = result.profile.photoDataUrl;
    whatsappProfileMessage.value = snapshot.isOriginal
      ? 'Perfil original restaurado. Ele também será restaurado automaticamente ao desconectar.'
      : 'Versão do perfil restaurada.';
  } catch (error) {
    whatsappProfileError.value = error instanceof Error ? error.message : 'Não foi possível restaurar essa versão do perfil.';
  } finally {
    whatsappProfileRestoringId.value = null;
  }
}

async function selectWhatsAppProfilePhoto(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  whatsappProfilePhotoError.value = '';
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
    whatsappProfilePhotoError.value = 'Escolha uma imagem JPG, PNG ou WebP de até 8 MB.';
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
    if (!context) throw new Error('Canvas indisponível.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    whatsappProfileDraftPhoto.value = canvas.toDataURL('image/webp', 0.72);
  } catch {
    whatsappProfilePhotoError.value = 'Não foi possível processar essa imagem.';
  } finally {
    input.value = '';
  }
}

async function saveWhatsAppSettings() {
  whatsappSettingsSaving.value = true;
  whatsappSettingsMessage.value = '';
  whatsappError.value = '';
  try {
    const result = await api<{ settings: WhatsAppNotificationSettings }>('/api/admin/whatsapp/settings', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify(whatsappSettings.value)
    });
    whatsappSettings.value = result.settings;
    whatsappSettingsMessage.value = 'Modelos de notificação salvos.';
  } catch (error) {
    whatsappError.value = error instanceof Error ? error.message : 'Não foi possível salvar as configurações do WhatsApp.';
  } finally {
    whatsappSettingsSaving.value = false;
  }
}

async function loadWhatsAppCloudSettings() {
  if (!isWhatsAppDashboardAdmin.value) return;
  try {
    const result = await api<{ settings: WhatsAppCloudSettings }>('/api/admin/whatsapp/cloud-settings');
    whatsappCloudSettings.value = result.settings;
    whatsappSavedConnectionMode.value = result.settings.connectionMode;
    whatsappCloudAccessToken.value = '';
    whatsappCloudClearAccessToken.value = false;
    whatsappCloudMessage.value = '';
    whatsappCloudConnectivity.value = null;
    whatsappCloudConnectivityError.value = '';
    whatsappError.value = '';
  } catch (error) {
    whatsappError.value = error instanceof Error ? error.message : 'Falha ao carregar a configuração da Cloud API.';
  }
}

async function saveWhatsAppCloudSettings() {
  whatsappCloudSaving.value = true;
  whatsappCloudMessage.value = '';
  whatsappError.value = '';
  try {
    const { accessTokenConfigured: _accessTokenConfigured, ...settings } = whatsappCloudSettings.value;
    const result = await api<{ settings: WhatsAppCloudSettings }>('/api/admin/whatsapp/cloud-settings', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({
        ...settings,
        accessToken: whatsappCloudAccessToken.value,
        clearAccessToken: whatsappCloudClearAccessToken.value
      })
    });
    whatsappCloudSettings.value = result.settings;
    whatsappSavedConnectionMode.value = result.settings.connectionMode;
    whatsappCloudAccessToken.value = '';
    whatsappCloudClearAccessToken.value = false;
    whatsappCloudMessage.value = 'Configuração da Cloud API salva.';
    whatsappCloudConnectivity.value = null;
    whatsappCloudConnectivityError.value = '';
  } catch (error) {
    whatsappError.value = error instanceof Error ? error.message : 'Não foi possível salvar a configuração da Cloud API.';
  } finally {
    whatsappCloudSaving.value = false;
  }
}

async function loadWhatsAppConfiguration() {
  await Promise.all([loadWhatsAppCloudSettings(), loadWhatsAppStatus()]);
}

function clearWhatsAppConnectivityTest() {
  whatsappCloudConnectivity.value = null;
  whatsappCloudConnectivityError.value = '';
}

async function testWhatsAppCloudConnection() {
  whatsappCloudConnectivityTesting.value = true;
  whatsappCloudConnectivity.value = null;
  whatsappCloudConnectivityError.value = '';
  try {
    whatsappCloudConnectivity.value = await api<WhatsAppCloudConnectivity>('/api/admin/whatsapp/test-connection', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value }
    });
  } catch (error) {
    whatsappCloudConnectivityError.value = error instanceof Error ? error.message : 'Não foi possível testar a conexão com a Cloud API.';
  } finally {
    whatsappCloudConnectivityTesting.value = false;
  }
}

async function clearWhatsAppLogs() {
  if (!isWhatsAppDashboardAdmin.value || !whatsappLogs.value.length) return;
  if (!window.confirm(t('Tem certeza que deseja apagar todo o log do WhatsApp?'))) return;
  whatsappWorking.value = true;
  whatsappError.value = '';
  try {
    await api('/api/admin/whatsapp/logs/clear', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value }
    });
    whatsappLogs.value = [];
  } catch (error) {
    whatsappError.value = error instanceof Error ? error.message : 'Não foi possível apagar o log do WhatsApp.';
  } finally {
    whatsappWorking.value = false;
  }
}

async function connectWhatsApp() {
  whatsappWorking.value = true;
  whatsappError.value = '';
  try {
    whatsappStatus.value = await api<WhatsAppWebStatus>('/api/admin/whatsapp/connect', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value }
    });
  } catch (error) {
    whatsappError.value = error instanceof Error ? error.message : 'Não foi possível iniciar a conexão.';
  } finally {
    whatsappWorking.value = false;
  }
}

async function disconnectWhatsApp() {
  whatsappWorking.value = true;
  whatsappError.value = '';
  try {
    whatsappStatus.value = await api<WhatsAppWebStatus>('/api/admin/whatsapp/disconnect', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value }
    });
  } catch (error) {
    whatsappError.value = error instanceof Error ? error.message : 'Não foi possível desconectar o WhatsApp.';
  } finally {
    whatsappWorking.value = false;
  }
}

async function applyDeviceSimulation(device: Device) {
  const values = simulationValues.value[device.id];
  if (!device.canSimulate || !values) return;
  simulationSavingId.value = device.id;
  simulationMessages.value = { ...simulationMessages.value, [device.id]: '' };
  try {
    await api<{ device: Device }>(`/api/devices/${device.id}/simulation`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify(values)
    });
    simulationMessages.value = { ...simulationMessages.value, [device.id]: 'Simulação aplicada. Alertas são disparados quando o estado muda.' };
    await loadDevices();
  } catch (error) {
    simulationMessages.value = {
      ...simulationMessages.value,
      [device.id]: error instanceof Error ? error.message : 'Não foi possível aplicar a simulação.'
    };
  } finally {
    simulationSavingId.value = null;
  }
}

async function loadEmailSettings() {
  if (!isWhatsAppDashboardAdmin.value) return;
  try {
    const result = await api<{ settings: EmailNotificationSettings }>('/api/admin/email/settings');
    emailSettings.value = result.settings;
    emailNotificationDraft.value = {
      onlineMessage: result.settings.onlineMessage,
      warningMessage: result.settings.warningMessage,
      offlineMessage: result.settings.offlineMessage
    };
    emailSmtpDraft.value = {
      smtpHost: result.settings.smtpHost,
      smtpPort: result.settings.smtpPort,
      smtpSecure: result.settings.smtpSecure,
      smtpUser: result.settings.smtpUser,
      senderName: result.settings.senderName,
      senderEmail: result.settings.senderEmail,
      passwordConfigured: result.settings.passwordConfigured
    };
    emailPassword.value = '';
    emailClearPassword.value = false;
    emailError.value = '';
  } catch (error) {
    emailError.value = error instanceof Error ? error.message : 'Falha ao carregar a configuração de e-mail.';
  }
}

async function saveEmailSettings() {
  emailSettingsSaving.value = true;
  emailMessage.value = '';
  emailError.value = '';
  try {
    const { passwordConfigured: _passwordConfigured, ...savedSettings } = emailSettings.value;
    const { passwordConfigured: _smtpPasswordConfigured, ...smtpSettings } = emailSmtpDraft.value;
    const result = await api<{ settings: EmailNotificationSettings }>('/api/admin/email/settings', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ ...savedSettings, ...smtpSettings, smtpPassword: emailPassword.value, clearSmtpPassword: emailClearPassword.value })
    });
    emailSettings.value = result.settings;
    emailSmtpDraft.value = {
      smtpHost: result.settings.smtpHost,
      smtpPort: result.settings.smtpPort,
      smtpSecure: result.settings.smtpSecure,
      smtpUser: result.settings.smtpUser,
      senderName: result.settings.senderName,
      senderEmail: result.settings.senderEmail,
      passwordConfigured: result.settings.passwordConfigured
    };
    emailPassword.value = '';
    emailClearPassword.value = false;
    emailMessage.value = 'Configuração de e-mail salva.';
  } catch (error) {
    emailError.value = error instanceof Error ? error.message : 'Não foi possível salvar a configuração de e-mail.';
  } finally {
    emailSettingsSaving.value = false;
  }
}

async function saveEmailNotificationDraft() {
  emailSettingsSaving.value = true;
  emailMessage.value = '';
  emailError.value = '';
  try {
    const { passwordConfigured: _passwordConfigured, ...savedSettings } = emailSettings.value;
    const result = await api<{ settings: EmailNotificationSettings }>('/api/admin/email/settings', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ ...savedSettings, ...emailNotificationDraft.value, smtpPassword: '', clearSmtpPassword: false })
    });
    emailSettings.value = result.settings;
    emailNotificationDraft.value = {
      onlineMessage: result.settings.onlineMessage,
      warningMessage: result.settings.warningMessage,
      offlineMessage: result.settings.offlineMessage
    };
    emailMessage.value = 'Modelos de notificação salvos.';
  } catch (error) {
    emailError.value = error instanceof Error ? error.message : 'Não foi possível salvar os modelos de notificação.';
  } finally {
    emailSettingsSaving.value = false;
  }
}

async function loadEmailLogs() {
  if (!isWhatsAppDashboardAdmin.value) return;
  try {
    const result = await api<{ logs: EmailLogEntry[] }>('/api/admin/email/logs');
    emailLogs.value = result.logs;
    emailError.value = '';
  } catch (error) {
    emailError.value = error instanceof Error ? error.message : 'Falha ao carregar o log de e-mail.';
  }
}

async function clearEmailLogs() {
  if (!emailLogs.value.length || !window.confirm(t('Tem certeza que deseja apagar todo o log de e-mail?'))) return;
  emailWorking.value = true;
  try {
    await api('/api/admin/email/logs/clear', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken.value } });
    emailLogs.value = [];
  } catch (error) {
    emailError.value = error instanceof Error ? error.message : 'Não foi possível apagar o log de e-mail.';
  } finally {
    emailWorking.value = false;
  }
}

async function testEmailConnection() {
  emailWorking.value = true;
  emailConnectionState.value = 'idle';
  emailError.value = '';
  try {
    await api('/api/admin/email/test', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken.value } });
    emailConnectionState.value = 'connected';
    emailMessage.value = 'Conexão SMTP verificada.';
    await loadEmailLogs();
  } catch (error) {
    emailConnectionState.value = 'error';
    emailError.value = error instanceof Error ? error.message : 'Falha na conexão SMTP.';
  } finally {
    emailWorking.value = false;
  }
}

async function changeWorkspace(workspaceId: string) {
  try {
    await api<{ activeWorkspaceId: string }>('/api/workspaces/active', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ workspaceId })
    });
    activeWorkspaceId.value = workspaceId;
    if (user.value) user.value.activeWorkspaceId = workspaceId;
    managementTab.value = 'overview';
    activeMobileTab.value = 'home';
    await loadDevices();
    await loadWorkspaceMembers();
    await nextTick();
    document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Nao foi possivel trocar de ambiente.';
  }
}

async function registerAccount() {
  registerError.value = '';
  registerMessage.value = '';
  if (!registerName.value.trim() || !registerEmail.value.trim() || !registerPassword.value.trim()) {
    registerError.value = 'Preencha nome, e-mail e senha.';
    return;
  }
  submitting.value = true;
  try {
    const result = await api<{ message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        displayName: registerName.value.trim(),
        email: registerEmail.value.trim(),
        password: registerPassword.value,
        invitationToken: invitationToken.value || undefined
      })
    });
    activationMessage.value = result.message;
    email.value = registerEmail.value.trim();
    registerName.value = '';
    registerEmail.value = '';
    registerPassword.value = '';
    invitationToken.value = '';
    loginMode.value = 'login';
  } catch (error) {
    registerError.value = error instanceof Error ? error.message : 'Nao foi possivel criar a conta.';
  } finally {
    submitting.value = false;
  }
}

async function activateAccount(token: string) {
  try {
    const result = await api<{ message: string; user: { email: string } }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
    activationMessage.value = result.message;
    email.value = result.user.email;
  } catch (error) {
    activationError.value = error instanceof Error ? error.message : 'Link de ativação inválido ou expirado.';
  } finally {
    loading.value = false;
  }
}

async function prepareInvitation(token: string) {
  invitationToken.value = token;
  try {
    const invitation = await api<{ email: string; workspaceName: string }>(`/api/auth/invitations/${encodeURIComponent(token)}`);
    registerEmail.value = invitation.email;
    invitationWorkspaceName.value = invitation.workspaceName;
    loginMode.value = 'register';
  } catch (error) {
    invitationError.value = error instanceof Error ? error.message : 'Convite inválido ou expirado.';
  } finally {
    loading.value = false;
  }
}

async function loadAlertSoundPreference(): Promise<void> {
  try {
    const result = await api<{ audios: AlertAudioOption[]; preferences: AlertSoundPreferences; uploadEnabled: boolean }>('/api/account/alert-sounds');
    alertSounds.value = result.audios;
    alertAudioUploadEnabled.value = result.uploadEnabled;
    alertSoundPreferences.value = result.preferences;
    alertSoundDraftPreferences.value = { ...result.preferences };
    alertSoundError.value = '';
  } catch {
    alertSoundError.value = 'Não foi possível carregar sons.';
  }
}

function playAlertSound(audioId: string, reportFailure = false): void {
  const source = alertSounds.value.find((audio) => audio.id === audioId)?.url ?? '/audio/alert.mp3';
  alertSoundPlaybackQueue = alertSoundPlaybackQueue.then(() => new Promise<void>((resolve) => {
    const audio = new Audio(source);
    audio.volume = 0.7;
    audio.addEventListener('ended', () => resolve(), { once: true });
    audio.addEventListener('error', () => resolve(), { once: true });
    void audio.play().catch(() => {
      if (reportFailure) alertSoundError.value = 'O navegador bloqueou a reprodução do áudio.';
      resolve();
    });
  }));
}

function stopAlertSoundPreview(): void {
  const audio = alertSoundPreviewAudio;
  alertSoundPreviewAudio = null;
  alertSoundPreviewStatus.value = null;
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

function toggleAlertSoundPreview(status: AlertSoundStatus): void {
  if (alertSoundPreviewStatus.value === status) {
    stopAlertSoundPreview();
    return;
  }
  stopAlertSoundPreview();
  const audioId = alertSoundDraftPreferences.value[status];
  const source = alertSounds.value.find((audio) => audio.id === audioId)?.url ?? '/audio/alert.mp3';
  const audio = new Audio(source);
  alertSoundPreviewAudio = audio;
  alertSoundPreviewStatus.value = status;
  audio.volume = 0.7;
  const clearPreview = () => {
    if (alertSoundPreviewAudio !== audio) return;
    alertSoundPreviewAudio = null;
    alertSoundPreviewStatus.value = null;
  };
  audio.addEventListener('ended', clearPreview, { once: true });
  audio.addEventListener('error', clearPreview, { once: true });
  void audio.play().catch(() => {
    clearPreview();
    alertSoundError.value = 'O navegador bloqueou a reprodução do áudio.';
  });
}

async function selectAlertSoundFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  alertSoundError.value = '';
  if (!file) return;
  if (!['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm'].includes(file.type) || file.size > 1024 * 1024) {
    alertSoundError.value = 'Escolha um áudio MP3, WAV, OGG ou WebM de até 1 MB.';
    input.value = '';
    return;
  }
  try {
    alertAudioUploadDataUrl.value = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Não foi possível ler o arquivo de áudio.'));
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo de áudio.'));
      reader.readAsDataURL(file);
    });
    alertAudioUploadName.value = file.name.replace(/\.[^.]+$/, '').slice(0, 80);
  } catch {
    alertSoundError.value = 'Não foi possível ler o arquivo de áudio.';
  } finally {
    input.value = '';
  }
}

async function uploadAlertSound(): Promise<void> {
  if (!alertAudioUploadEnabled.value || alertAudioUploading.value || !alertAudioUploadDataUrl.value || !alertAudioUploadName.value.trim()) return;
  alertAudioUploading.value = true;
  alertSoundError.value = '';
  alertSoundMessage.value = '';
  try {
    const result = await api<{ audios: AlertAudioOption[] }>('/api/account/alert-sounds', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ audioDataUrl: alertAudioUploadDataUrl.value, audioName: alertAudioUploadName.value })
    });
    alertSounds.value = result.audios;
    alertAudioUploadDataUrl.value = '';
    alertAudioUploadName.value = '';
    alertSoundMessage.value = 'Áudio adicionado à biblioteca compartilhada.';
  } catch (error) {
    alertSoundError.value = error instanceof Error ? error.message : 'Não foi possível adicionar o áudio.';
  } finally {
    alertAudioUploading.value = false;
  }
}

async function saveAlertSoundPreferences(): Promise<void> {
  if (alertSoundSaving.value) return;
  alertSoundSaving.value = true;
  alertSoundError.value = '';
  alertSoundMessage.value = '';
  try {
    const result = await api<{ preferences: AlertSoundPreferences }>('/api/account/alert-sound-preferences', {
      method: 'PUT',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify(alertSoundDraftPreferences.value)
    });
    alertSoundPreferences.value = result.preferences;
    alertSoundDraftPreferences.value = { ...result.preferences };
    alertSoundMessage.value = 'Sons por alerta salvos.';
  } catch (error) {
    alertSoundError.value = error instanceof Error ? error.message : 'Não foi possível salvar os sons por alerta.';
  } finally {
    alertSoundSaving.value = false;
  }
}

async function checkSession() {
  try {
    const [meResult, settingsResult] = await Promise.all([
      api<{ user: User; csrfToken: string }>('/api/auth/me'),
      api<{ enabled: boolean }>('/api/auth/registration-settings')
    ]);
    user.value = meResult.user;
    csrfToken.value = meResult.csrfToken;
    registrationEnabled.value = settingsResult.enabled;
    syncProfileForm();
    await loadWorkspaces();
    await loadAlertSoundPreference();
    await loadDevices();
    await loadNotifications();
  } catch {
    user.value = null;
    try {
      const settingsResult = await api<{ enabled: boolean }>('/api/auth/registration-settings');
      registrationEnabled.value = settingsResult.enabled;
    } catch {
      registrationEnabled.value = false;
    }
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
    await loadWorkspaces();
    await loadAlertSoundPreference();
    await loadDevices();
    await loadNotifications();
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
  const savedWhatsappNumber = user.value.whatsappNumber;
  const parsedWhatsappNumber = savedWhatsappNumber ? parsePhoneNumberFromString(savedWhatsappNumber) : undefined;
  profileWhatsappCountry.value = parsedWhatsappNumber?.country ?? 'BR';
  profileWhatsappNumber.value = parsedWhatsappNumber?.formatNational() ?? '';
  profileEmailNotifications.value = user.value.emailNotifications;
  profileWhatsappNotifications.value = user.value.whatsappNotifications;
}

function formatWhatsappNumberInput(event: Event) {
  const input = event.target as HTMLInputElement;
  profileWhatsappNumber.value = new AsYouType(profileWhatsappCountry.value).input(input.value.replace(/\D/g, ''));
}

function reformatWhatsappNumberForCountry() {
  const digits = profileWhatsappNumber.value.replace(/\D/g, '');
  profileWhatsappNumber.value = digits ? new AsYouType(profileWhatsappCountry.value).input(digits) : '';
}

function openSettings() {
  syncProfileForm();
  settingsTab.value = 'preferences';
  accountMessage.value = '';
  accountError.value = '';
  notificationMessage.value = '';
  notificationError.value = '';
  alertSoundError.value = '';
  alertSoundMessage.value = '';
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
  const parsedWhatsappNumber = profileWhatsappNumber.value.trim()
    ? parsePhoneNumberFromString(profileWhatsappNumber.value, profileWhatsappCountry.value)
    : undefined;
  if (profileWhatsappNumber.value.trim() && !parsedWhatsappNumber?.isValid()) {
    notificationError.value = 'Confira o país, o DDD e o número do WhatsApp.';
    return;
  }
  if (profileWhatsappNotifications.value && !parsedWhatsappNumber) {
    notificationError.value = 'Informe um número de WhatsApp válido para ativar as notificações.';
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
        whatsappNumber: parsedWhatsappNumber?.number ?? null,
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

async function loadWorkspaceAlertPreferences() {
  workspaceAlertPreferencesMessage.value = '';
  workspaceAlertPreferencesError.value = '';
  if (!activeWorkspaceId.value) {
    workspaceAlertPreferences.value = { notifyAllDevices: true, devices: [] };
    return;
  }
  try {
    workspaceAlertPreferences.value = await api<WorkspaceAlertPreferences>(`/api/workspaces/${activeWorkspaceId.value}/notification-preferences`);
  } catch (error) {
    workspaceAlertPreferencesError.value = error instanceof Error ? t(error.message) : t('Não foi possível carregar as preferências deste ambiente.');
  }
}

async function saveWorkspaceAlertPreferences() {
  if (!activeWorkspaceId.value) return;
  workspaceAlertPreferencesSaving.value = true;
  workspaceAlertPreferencesMessage.value = '';
  workspaceAlertPreferencesError.value = '';
  try {
    await api(`/api/workspaces/${activeWorkspaceId.value}/notification-preferences`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify(workspaceAlertPreferences.value)
    });
    workspaceAlertPreferencesMessage.value = 'Preferências deste ambiente salvas.';
  } catch (error) {
    workspaceAlertPreferencesError.value = error instanceof Error ? t(error.message) : t('Não foi possível salvar as preferências deste ambiente.');
  } finally {
    workspaceAlertPreferencesSaving.value = false;
  }
}

function toggleWorkspaceAlertMode(event: Event) {
  workspaceAlertPreferences.value.notifyAllDevices = (event.target as HTMLInputElement).checked;
  void saveWorkspaceAlertPreferences();
}

function toggleDeviceAlertChannel(deviceId: string, channel: 'emailEnabled' | 'whatsappEnabled', event: Event) {
  const preference = workspaceAlertPreferences.value.devices.find((device) => device.deviceId === deviceId);
  if (!preference) return;
  preference[channel] = (event.target as HTMLInputElement).checked;
  void saveWorkspaceAlertPreferences();
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

async function inviteUser() {
  if (!activeWorkspaceId.value || !inviteEmail.value.trim()) return;
  inviteError.value = '';
  inviteMessage.value = '';
  try {
    const result = await api<{ message: string }>('/api/workspaces/' + activeWorkspaceId.value + '/invitations', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ email: inviteEmail.value.trim(), role: inviteRole.value })
    });
    inviteMessage.value = result.message;
    inviteEmail.value = '';
    inviteRole.value = 'member';
    await loadWorkspaceMembers();
  } catch (error) {
    inviteError.value = error instanceof Error ? error.message : 'Nao foi possivel enviar o convite.';
  }
}

function toggleMemberActions(memberId: string) {
  memberActionsOpenId.value = memberActionsOpenId.value === memberId ? null : memberId;
}

function editMemberRole(member: WorkspaceMember) {
  editingMemberId.value = member.id;
  editingMemberRole.value = member.role;
  memberActionsOpenId.value = null;
}

function cancelMemberRoleEdit() {
  editingMemberId.value = null;
}

async function updateMemberRole(memberId: string) {
  if (!activeWorkspaceId.value) return;
  if (editingMemberRole.value !== 'admin' && editingMemberRole.value !== 'member') return;
  memberSavingId.value = memberId;
  try {
    await api('/api/workspaces/' + activeWorkspaceId.value + '/members', {
      method: 'PATCH',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ userId: memberId, role: editingMemberRole.value })
    });
    editingMemberId.value = null;
    await loadWorkspaceMembers();
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Nao foi possivel atualizar o papel do usuário.';
  } finally {
    memberSavingId.value = null;
  }
}

async function removeMember(memberId: string, displayName: string) {
  if (!activeWorkspaceId.value) return;
  if (!window.confirm(`Remover ${displayName} do ambiente ativo?`)) return;
  memberActionsOpenId.value = null;
  try {
    await api('/api/workspaces/' + activeWorkspaceId.value + '/members/' + memberId, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken.value }
    });
    await loadWorkspaceMembers();
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Nao foi possivel remover o usuário.';
  }
}

function requestUserDeletion(member: WorkspaceMember | AdminUser) {
  if (!canManageUserAccounts.value || member.isPlatformAdmin || member.email === user.value?.email) return;
  memberActionsOpenId.value = null;
  userDeletionTarget.value = member;
  userDeletionConfirmation.value = '';
  userDeletionError.value = '';
}

function cancelUserDeletion() {
  if (userDeletionSaving.value) return;
  userDeletionTarget.value = null;
  userDeletionConfirmation.value = '';
  userDeletionError.value = '';
}

async function deleteUserPermanently() {
  const target = userDeletionTarget.value;
  if (!target || !canManageUserAccounts.value || userDeletionConfirmation.value.trim().toLowerCase() !== target.email.toLowerCase()) return;
  userDeletionSaving.value = true;
  userDeletionError.value = '';
  userDeletionMessage.value = '';
  try {
    const result = await api<{ deletedDevices: number; deletedWorkspaces: number }>(`/api/admin/users/${target.id}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken.value }
    });
    userDeletionTarget.value = null;
    userDeletionConfirmation.value = '';
    userDeletionMessage.value = `Conta excluída definitivamente. ${result.deletedDevices} aparelho(s) vinculado(s) removido(s).`;
    await loadAdminUsers();
    await loadWorkspaces();
    await loadDevices();
  } catch (error) {
    userDeletionError.value = error instanceof Error ? error.message : 'Não foi possível excluir a conta.';
  } finally {
    userDeletionSaving.value = false;
  }
}

async function requireUserPasswordReset(account: AdminUser) {
  if (!canManageUserAccounts.value || account.isPlatformAdmin || account.email === user.value?.email) return;
  if (!window.confirm(`Remover a senha de ${account.displayName || account.email} e exigir uma nova? As sessões ativas serão encerradas.`)) return;
  adminUserActionId.value = account.id;
  adminUsersError.value = '';
  adminUsersMessage.value = '';
  try {
    const result = await api<{ message: string }>(`/api/admin/users/${account.id}/require-password-reset`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken.value }
    });
    adminUsersMessage.value = result.message;
    await loadAdminUsers();
  } catch (error) {
    adminUsersError.value = error instanceof Error ? t(error.message) : t('Não foi possível exigir a redefinição de senha.');
  } finally {
    adminUserActionId.value = null;
  }
}

function editAdminUser(account: AdminUser) {
  if (!canManageUserAccounts.value || account.isPlatformAdmin || account.email === user.value?.email) return;
  memberActionsOpenId.value = null;
  accountEditTarget.value = account;
  accountEditName.value = account.displayName;
  accountEditEmail.value = account.email;
  accountEditError.value = '';
}

function cancelAdminUserEdit() {
  if (accountEditSaving.value) return;
  accountEditTarget.value = null;
  accountEditError.value = '';
}

async function saveAdminUserEdit() {
  const target = accountEditTarget.value;
  if (!target || !canManageUserAccounts.value) return;
  accountEditSaving.value = true;
  accountEditError.value = '';
  adminUsersMessage.value = '';
  try {
    const result = await api<{ emailChanged: boolean }>(`/api/admin/users/${target.id}`, {
      method: 'PATCH',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ displayName: accountEditName.value, email: accountEditEmail.value })
    });
    accountEditTarget.value = null;
    adminUsersMessage.value = result.emailChanged
      ? 'Usuário atualizado. O e-mail de acesso foi alterado.'
      : 'Usuário atualizado.';
    await loadAdminUsers();
  } catch (error) {
    accountEditError.value = error instanceof Error ? t(error.message) : t('Não foi possível atualizar o usuário.');
  } finally {
    accountEditSaving.value = false;
  }
}

async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken.value } });
    user.value = null;
    workspaces.value = [];
    activeWorkspaceId.value = null;
    workspaceMembers.value = [];
    workspaceInvitations.value = [];
    registrationEnabled.value = false;
    devices.value = [];
    notifications.value = [];
    alertSounds.value = [];
    alertSoundPreferences.value = { online: 'default', warning: 'default', offline: 'default' };
    alertSoundDraftPreferences.value = { ...alertSoundPreferences.value };
    alertAudioUploadDataUrl.value = '';
    alertAudioUploadName.value = '';
    notificationOpen.value = false;
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
function editDeviceAlias(device: Device) {
  if (!device.canEditAlias) return;
  editingDeviceAliasId.value = device.id;
  deviceAliasDraft.value = device.alias ?? '';
  pageError.value = '';
}
function cancelDeviceAliasEdit() {
  editingDeviceAliasId.value = null;
  deviceAliasDraft.value = '';
}
async function saveDeviceAlias(device: Device) {
  if (!device.canEditAlias || !activeWorkspaceId.value || deviceAliasDraft.value.length > 80) return;
  deviceAliasSavingId.value = device.id;
  pageError.value = '';
  try {
    const result = await api<{ device: { id: string; alias: string | null } }>(`/api/devices/${device.id}/alias`, {
      method: 'PATCH',
      headers: { 'X-CSRF-Token': csrfToken.value },
      body: JSON.stringify({ alias: deviceAliasDraft.value.trim() || null })
    });
    devices.value = devices.value.map((current) => current.id === device.id ? { ...current, alias: result.device.alias } : current);
    cancelDeviceAliasEdit();
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Não foi possível salvar o apelido do aparelho.';
  } finally {
    deviceAliasSavingId.value = null;
  }
}
function exportList() {
  const columns = language.value === 'en'
    ? ['Device', 'Identifier', 'Location', 'Status', 'Last reading']
    : ['Aparelho', 'Identificador', 'Localizacao', 'Status', 'Ultima leitura'];
  const rows = filteredDevices.value.map((device) => [
    deviceDisplayName(device),
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
  if (managementTab.value === 'users') {
    activeMobileTab.value = 'users';
    return;
  }
  const devicesSection = document.getElementById('aparelhos');
  if (devicesSection) activeMobileTab.value = devicesSection.getBoundingClientRect().top <= window.innerHeight * 0.45 ? 'devices' : 'home';
}

async function navigateMobileSection(section: 'home' | 'devices') {
  managementTab.value = 'overview';
  activeMobileTab.value = section;
  await nextTick();
  const sectionId = section === 'devices' ? 'aparelhos' : 'inicio';
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.history.replaceState({}, '', `#${sectionId}`);
}

watch([managementTab, whatsappTab], ([tab, subtab]) => {
  if (whatsappRefreshTimer) clearInterval(whatsappRefreshTimer);
  whatsappRefreshTimer = undefined;
  if (tab === 'whatsapp' && isWhatsAppDashboardAdmin.value) {
    if (subtab === 'configuration') {
      void loadWhatsAppConfiguration();
      whatsappRefreshTimer = setInterval(() => void loadWhatsAppStatus(), 2000);
    } else if (subtab === 'notifications') {
      void refreshWhatsAppNotifications();
    } else if (subtab === 'connection') {
      void Promise.all([loadWhatsAppCloudSettings(), loadWhatsAppStatus()]);
    } else if (subtab === 'profile') {
      void (async () => {
        await loadWhatsAppStatus();
        if (whatsappStatus.value.state === 'connected') await loadWhatsAppProfile();
        else {
          whatsappProfile.value = null;
          whatsappProfileError.value = '';
        }
      })();
    } else if (subtab === 'log') {
      void loadWhatsAppLogs();
      whatsappRefreshTimer = setInterval(() => void loadWhatsAppLogs(), 2000);
    }
  }
});

watch([activeWorkspaceId, settingsTab], ([, tab]) => {
  if (tab === 'notifications') void loadWorkspaceAlertPreferences();
});

watch(activeWorkspaceId, (workspaceId) => {
  connectDeviceEvents(workspaceId);
  void loadNotifications();
});

watch([managementTab, emailTab], ([tab, subtab], [previousTab]) => {
  if (emailRefreshTimer) clearInterval(emailRefreshTimer);
  emailRefreshTimer = undefined;
  if (tab !== 'email' || !isWhatsAppDashboardAdmin.value) return;
  if (previousTab !== 'email') {
    void loadEmailSettings();
    void loadEmailLogs();
  } else if (subtab === 'log') {
    void loadEmailLogs();
  }
  if (subtab === 'log') emailRefreshTimer = setInterval(() => void loadEmailLogs(), 3000);
});

onMounted(() => {
  darkMode.value = localStorage.getItem('lab-monitor-dark-mode') === 'true';
  document.documentElement.classList.toggle('dark-mode', darkMode.value);
  language.value = localStorage.getItem('lab-monitor-language') === 'en' ? 'en' : 'pt-BR';
  const query = new URLSearchParams(window.location.search);
  resetToken.value = query.get('resetToken') ?? '';
  const activationToken = query.get('activationToken');
  const rawInvitationToken = query.get('invitationToken');
  if (activationToken || rawInvitationToken) window.history.replaceState({}, '', window.location.pathname);
  if (resetToken.value) {
    loginMode.value = 'reset';
    loading.value = false;
  } else if (activationToken) {
    void activateAccount(activationToken);
  } else if (rawInvitationToken) {
    void prepareInvitation(rawInvitationToken);
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
  deviceEvents?.close();
  if (refreshTimer) clearInterval(refreshTimer);
  if (whatsappRefreshTimer) clearInterval(whatsappRefreshTimer);
  if (emailRefreshTimer) clearInterval(emailRefreshTimer);
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
          <p v-if="activationMessage" class="success-message" role="status">{{ activationMessage }}</p>
          <p v-if="activationError || invitationError" class="error-message" role="alert">{{ activationError || invitationError }}</p>
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
          <button v-if="registrationEnabled" class="secondary-button login-button" type="button" @click="loginMode = 'register'">
            <span>Criar conta</span>
          </button>
          <div class="secure-note"><ShieldCheck :size="16" /><span>{{ t('Sessao protegida com criptografia') }}</span></div>
        </template>
        <template v-else-if="loginMode === 'register'">
          <button class="back-link" type="button" @click="loginMode = 'login'; registerError = ''; registerMessage = ''"><ChevronDown :size="16" /> {{ t('Voltar ao login') }}</button>
          <p class="eyebrow">NOVA CONTA</p>
          <h2>Criar conta</h2>
          <p class="form-subtitle">{{ invitationToken ? `Convite para ${invitationWorkspaceName}. O ambiente aparecerá na sua lista após a confirmação do e-mail.` : 'Crie sua conta; depois você poderá criar ou importar um ambiente.' }}</p>
          <label for="registerName">{{ t('Nome') }}</label>
          <input id="registerName" v-model="registerName" type="text" maxlength="80" autocomplete="name" placeholder="Seu nome" required />
          <label for="registerEmail">{{ t('E-mail') }}</label>
          <input id="registerEmail" v-model="registerEmail" type="email" autocomplete="email" placeholder="voce@laboratorio.com" :readonly="!!invitationToken" required />
          <label for="registerPassword">{{ t('Senha') }}</label>
          <input id="registerPassword" v-model="registerPassword" type="password" minlength="12" autocomplete="new-password" placeholder="Pelo menos 12 caracteres" required />
          <p v-if="registerError" class="error-message" role="alert">{{ registerError }}</p>
          <p v-if="registerMessage" class="success-message" role="status">{{ registerMessage }}</p>
          <button class="primary-button login-button" type="button" :disabled="submitting" @click="registerAccount">
            <LoaderCircle v-if="submitting" class="spin" :size="17" />
            <span>{{ submitting ? 'Criando conta...' : 'Criar conta' }}</span>
          </button>
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

  <div v-else class="app-shell" :class="{ 'app-shell-whatsapp-admin': isWhatsAppDashboardAdmin }">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark"><Activity :size="18" /></span><span>LAB<span class="brand-light">/MONITOR</span></span></div>
      <div class="workspace-label">{{ t('AMBIENTE') }}</div>
      <div class="workspace-switch" @click="workspaceMenuOpen = !workspaceMenuOpen" style="cursor:pointer;">
        <span class="workspace-avatar"><img v-if="activeWorkspace?.iconDataUrl" :src="activeWorkspace.iconDataUrl" :alt="''" /><span v-else>{{ activeWorkspace?.name.slice(0, 1).toUpperCase() || 'L' }}</span></span>
        <span class="workspace-name">{{ activeWorkspace?.name || t('Nenhum ambiente selecionado') }}<small>{{ activeWorkspace ? t('Plano operacional') : t('Crie ou importe um ambiente') }}</small></span>
        <ChevronDown :size="15" />
      </div>
      <div v-if="workspaceMenuOpen" class="workspace-dropdown">
        <div class="workspace-list" v-if="workspaces.length">
          <button v-for="workspace in workspaces" :key="workspace.id" class="workspace-option" type="button" :class="{ active: workspace.id === activeWorkspaceId }" @click="workspaceMenuOpen = false; changeWorkspace(workspace.id)">
            <span class="workspace-option-main"><span class="workspace-option-avatar"><img v-if="workspace.iconDataUrl" :src="workspace.iconDataUrl" alt="" /><span v-else>{{ workspace.name.slice(0, 1).toUpperCase() }}</span></span>{{ workspace.name }}</span>
            <small>{{ workspaceRoleLabel(workspace.role) }}</small>
          </button>
        </div>
        <button class="workspace-manage-button" type="button" @click="workspaceMenuOpen = false; openWorkspaceManager('create')"><Plus :size="15" /> {{ t('Adicionar/editar ambiente') }}</button>
      </div>
      <div class="nav-label">{{ t('GERENCIAMENTO') }}</div>
      <nav>
        <a class="nav-link" :class="{ active: managementTab === 'overview' }" href="#inicio" @click="managementTab = 'overview'"><LayoutDashboard :size="17" /><span>{{ t('Visao geral') }}</span><span class="nav-count">{{ devices.length }}</span></a>
        <button v-if="canManageActiveWorkspace" class="nav-link" :class="{ active: managementTab === 'users' }" type="button" @click="openUserManagement">
          <Settings :size="17" /><span>{{ t('Usuários') }}</span>
        </button>
        <button v-if="isWhatsAppDashboardAdmin" class="nav-link" :class="{ active: managementTab === 'whatsapp' }" type="button" @click="managementTab = 'whatsapp'">
          <MessageCircle :size="17" /><span>{{ t('WhatsApp API') }}</span>
        </button>
        <button v-if="isWhatsAppDashboardAdmin" class="nav-link" :class="{ active: managementTab === 'email' }" type="button" @click="managementTab = 'email'">
          <Mail :size="17" /><span>{{ t('E-mail API') }}</span>
        </button>
      </nav>
      <div class="sidebar-bottom">
        <div class="sidebar-status"><span class="live-dot"></span><div>{{ t('API conectada') }}<small>{{ t('Atualizacao automatica') }}</small></div><span class="status-ping"></span></div>
        <div class="account-row"><div class="account-avatar"><img v-if="user.avatarDataUrl" :src="user.avatarDataUrl" alt="" /><span v-else>{{ user.displayName.slice(0, 1).toUpperCase() }}</span></div><div class="account-info">{{ user.displayName }}<small>{{ user.email }}</small></div><button class="icon-button sidebar-logout" :title="t('Sair')" :aria-label="t('Sair')" @click="logout"><LogOut :size="17" /></button></div>
      </div>
    </aside>

    <section class="main-area">
      <header class="topbar">
        <div class="breadcrumb"><img class="dashboard-logo" src="/logo.jpg" alt="UERJ" /><span>{{ t('Monitoramento') }}</span><span>/</span><strong>{{ t(managementTab === 'users' ? 'Usuários' : managementTab === 'whatsapp' ? 'WhatsApp API' : managementTab === 'email' ? 'E-mail API' : 'Visao geral') }}</strong></div>
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
              @click="toggleNotificationPanel"
            >
              <Bell :size="18" />
              <span v-if="unreadNotificationCount" class="notification-count">{{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}</span>
            </button>
            <section v-if="notificationOpen" class="notification-panel" role="dialog" :aria-label="t('Notificações')">
              <header class="notification-panel-header">
                <div><h2>{{ t('Notificações') }}</h2><p>{{ unreadNotificationCount ? `${unreadNotificationCount} ${t('não lidas')}` : t('Todas as notificações foram lidas') }}</p></div>
                <button v-if="notifications.length" class="notification-read-all" type="button" @click="deleteAllNotifications">{{ t('Apagar notificações') }}</button>
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
        <div v-if="managementTab === 'users' && canManageActiveWorkspace" class="user-management-panel">
          <div class="page-heading">
            <div><p class="eyebrow">{{ t('GERENCIAMENTO') }}</p><h1>{{ t('Usuários') }}</h1><p class="heading-sub">{{ t('Gerencie membros, papéis e convites do ambiente ativo.') }}</p></div>
            <button class="secondary-button" type="button" @click="managementTab = 'overview'">{{ t('Voltar') }}</button>
          </div>
          <nav class="settings-tabs whatsapp-tabs user-management-tabs" role="tablist" :aria-label="t('Usuários')">
            <button class="settings-tab" :class="{ active: userManagementTab === 'members' }" type="button" role="tab" :aria-selected="userManagementTab === 'members'" @click="userManagementTab = 'members'"><UsersRound :size="15" />{{ t('Membros') }}</button>
            <button v-if="canManageUserAccounts" class="settings-tab" :class="{ active: userManagementTab === 'accounts' }" type="button" role="tab" :aria-selected="userManagementTab === 'accounts'" @click="userManagementTab = 'accounts'; void loadAdminUsers()"><UsersRound :size="15" />{{ t('Usuários cadastrados') }}</button>
            <button v-if="isWhatsAppDashboardAdmin" class="settings-tab" :class="{ active: userManagementTab === 'registration' }" type="button" role="tab" :aria-selected="userManagementTab === 'registration'" @click="userManagementTab = 'registration'"><ShieldCheck :size="15" />{{ t('Cadastro público') }}</button>
          </nav>
          <section v-if="userManagementTab === 'registration' && isWhatsAppDashboardAdmin" class="settings-pane user-management-card">
            <div class="settings-section-heading"><h3>{{ t('Cadastro público') }}</h3></div>
            <label class="theme-setting">
              <span class="theme-setting-icon"><ShieldCheck :size="18" /></span>
              <span class="theme-setting-copy"><strong>{{ t('Permitir criação de contas') }}</strong><small>{{ registrationEnabled ? t('Habilitado na tela de login') : t('Desabilitado') }}</small></span>
              <input class="theme-switch" type="checkbox" :checked="registrationEnabled" @change="toggleRegistrationSetting" />
            </label>
          </section>
          <section v-else-if="userManagementTab === 'accounts' && canManageUserAccounts" class="settings-pane user-management-card">
            <div class="settings-section-heading"><h3>{{ t('Contas cadastradas') }}</h3><span>{{ adminUsers.length }} {{ t('contas') }}</span></div>
            <p v-if="adminUsersMessage" class="success-message" role="status">{{ t(adminUsersMessage) }}</p>
            <p v-if="adminUsersError" class="error-message" role="alert">{{ t(adminUsersError) }}</p>
            <p v-if="userDeletionMessage" class="success-message" role="status">{{ userDeletionMessage }}</p>
            <div v-if="adminUsersLoading" class="workspace-device-empty">{{ t('Carregando contas...') }}</div>
            <div v-else-if="adminUsers.length" class="member-list admin-account-list">
              <div v-for="account in adminUsers" :key="account.id" class="member-row admin-account-row">
                <div class="admin-account-identity">
                  <strong>{{ account.displayName || account.email }}</strong>
                  <small>{{ account.email }}</small>
                  <small>{{ account.workspaces.length ? account.workspaces.map((workspace) => workspace.name).join(', ') : t('Sem ambiente') }}</small>
                </div>
                <span v-if="account.isPlatformAdmin" class="protected-member-role"><LockKeyhole :size="14" />{{ t('Administrador da plataforma') }}</span>
                <span v-else class="admin-account-status">{{ account.passwordResetRequired ? t('Redefinição de senha exigida') : account.emailVerifiedAt ? t('Conta ativa') : t('E-mail pendente') }}</span>
                <div v-if="!account.isPlatformAdmin && account.email !== user?.email" class="member-actions">
                  <button class="icon-button member-actions-button" type="button" :aria-label="t('Abrir ações da conta')" :aria-expanded="memberActionsOpenId === `account-${account.id}`" :title="t('Ações')" @click="toggleMemberActions(`account-${account.id}`)"><EllipsisVertical :size="18" /></button>
                  <div v-if="memberActionsOpenId === `account-${account.id}`" class="member-actions-menu admin-account-actions" role="menu">
                    <button type="button" role="menuitem" @click="editAdminUser(account)"><Pencil :size="14" />{{ t('Editar usuário') }}</button>
                    <button type="button" role="menuitem" :disabled="adminUserActionId === account.id || account.passwordResetRequired" @click="memberActionsOpenId = null; requireUserPasswordReset(account)"><LockKeyhole :size="14" />{{ account.passwordResetRequired ? t('Redefinição já exigida') : t('Remover senha e exigir nova senha') }}</button>
                    <button class="member-remove-action" type="button" role="menuitem" @click="requestUserDeletion(account)"><Trash2 :size="14" />{{ t('Excluir usuário permanentemente') }}</button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="!adminUsersError" class="workspace-device-empty">{{ t('Nenhuma conta cadastrada.') }}</div>
          </section>
          <section v-else-if="userManagementTab === 'members'" class="settings-pane user-management-card">
            <div class="settings-section-heading"><h3>{{ t('Convidar usuário') }}</h3></div>
            <div class="invite-form">
              <input v-model="inviteEmail" class="settings-input" type="email" :placeholder="t('usuario@empresa.com')" />
              <select v-model="inviteRole" class="settings-input select-input">
                <option value="member">{{ t('Membro') }}</option>
                <option value="admin">{{ t('Administrador') }}</option>
              </select>
              <button class="primary-button" type="button" @click="inviteUser">{{ t('Convidar') }}</button>
            </div>
            <p v-if="inviteMessage" class="success-message" role="status">{{ t(inviteMessage) }}</p>
            <p v-if="inviteError" class="error-message" role="alert">{{ t(inviteError) }}</p>
            <p v-if="userDeletionMessage" class="success-message" role="status">{{ userDeletionMessage }}</p>
            <div class="member-list" v-if="workspaceMembers.length">
              <div v-for="member in workspaceMembers" :key="member.id" class="member-row">
                <div>
                  <strong>{{ member.displayName || member.email }}</strong>
                  <small>{{ member.email }}</small>
                </div>
                <span v-if="member.isPlatformAdmin" class="protected-member-role" :title="t('O papel deste administrador da plataforma não pode ser alterado.')" :aria-label="t('Administrador da plataforma')">
                  <LockKeyhole :size="14" /> {{ t('Administrador da plataforma') }}
                </span>
                <template v-else-if="editingMemberId === member.id">
                  <div class="member-edit-controls">
                    <select v-model="editingMemberRole" class="settings-input select-input small" :aria-label="`${t('Papel de')} ${member.displayName || member.email}`">
                      <option value="member">{{ t('Membro') }}</option>
                      <option value="admin">{{ t('Administrador') }}</option>
                      <option value="owner" disabled>{{ t('Proprietário') }}</option>
                    </select>
                    <button class="icon-button member-save-button" type="button" :disabled="memberSavingId === member.id || editingMemberRole === 'owner'" :title="t('Salvar')" :aria-label="t('Salvar')" @click="updateMemberRole(member.id)"><Check :size="16" /></button>
                    <button class="icon-button member-cancel-button" type="button" :disabled="memberSavingId === member.id" :title="t('Cancelar')" :aria-label="t('Cancelar')" @click="cancelMemberRoleEdit"><X :size="16" /></button>
                  </div>
                </template>
                <span v-else class="member-role-label">{{ workspaceRoleLabel(member.role) }}</span>
                <div v-if="!member.isPlatformAdmin && member.email !== user?.email && editingMemberId !== member.id" class="member-actions">
                  <button class="icon-button member-actions-button" type="button" :aria-label="t('Abrir ações do membro')" :aria-expanded="memberActionsOpenId === member.id" :title="t('Ações')" @click="toggleMemberActions(member.id)"><EllipsisVertical :size="18" /></button>
                  <div v-if="memberActionsOpenId === member.id" class="member-actions-menu" role="menu">
                    <button type="button" role="menuitem" @click="editMemberRole(member)"><Pencil :size="14" />{{ t('Editar papel') }}</button>
                    <button v-if="isWhatsAppDashboardAdmin" class="member-remove-action" type="button" role="menuitem" @click="requestUserDeletion(member)"><Trash2 :size="14" />{{ t('Excluir usuário permanentemente') }}</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="member-list" v-if="workspaceInvitations.length">
              <div class="settings-section-heading"><h3>{{ t('Convites pendentes') }}</h3></div>
              <div v-for="invitation in workspaceInvitations" :key="invitation.id" class="member-row invitation-row">
                <div>
                  <strong>{{ invitation.email }}</strong>
                  <small>{{ workspaceRoleLabel(invitation.role) }}</small>
                </div>
                <span>{{ new Date(invitation.expiresAt).toLocaleDateString('pt-BR') }}</span>
              </div>
            </div>
          </section>
        </div>
        <div v-else-if="managementTab === 'whatsapp' && isWhatsAppDashboardAdmin" class="whatsapp-management-panel">
          <div class="page-heading">
            <div><p class="eyebrow">{{ t('GERENCIAMENTO') }}</p><h1>{{ t('WhatsApp API') }}</h1><p class="heading-sub">{{ t(whatsappTab === 'log' ? 'Log de eventos' : whatsappTab === 'configuration' ? 'Configuração da Cloud API' : whatsappTab === 'notifications' ? 'Notificações' : whatsappTab === 'profile' ? 'Perfil da conta WhatsApp' : 'Teste de conectividade do canal ativo') }}</p></div>
            <button class="secondary-button" type="button" :disabled="whatsappWorking || whatsappCloudSaving || whatsappCloudConnectivityTesting || whatsappProfileSaving || favoriteMediaSaving" :aria-label="t('Atualizar')" :title="t('Atualizar')" @click="whatsappTab === 'log' ? loadWhatsAppLogs() : whatsappTab === 'configuration' ? loadWhatsAppConfiguration() : whatsappTab === 'notifications' ? refreshWhatsAppNotifications() : whatsappTab === 'profile' ? loadWhatsAppProfile() : testWhatsAppCloudConnection()"><RefreshCw :size="16" /></button>
          </div>
          <nav class="settings-tabs whatsapp-tabs" role="tablist" :aria-label="t('WhatsApp API')">
            <button id="whatsappLogTab" class="settings-tab" :class="{ active: whatsappTab === 'log' }" type="button" role="tab" :aria-selected="whatsappTab === 'log'" aria-controls="whatsappLogPanel" @click="whatsappTab = 'log'"><List :size="15" />{{ t('Log') }}</button>
            <button id="whatsappConfigurationTab" class="settings-tab" :class="{ active: whatsappTab === 'configuration' }" type="button" role="tab" :aria-selected="whatsappTab === 'configuration'" aria-controls="whatsappConfigurationPanel" @click="whatsappTab = 'configuration'"><Settings :size="15" />{{ t('Configuração') }}</button>
            <button id="whatsappNotificationsTab" class="settings-tab" :class="{ active: whatsappTab === 'notifications' }" type="button" role="tab" :aria-selected="whatsappTab === 'notifications'" aria-controls="whatsappNotificationsPanel" @click="whatsappTab = 'notifications'"><Bell :size="15" />{{ t('Notificações') }}</button>
            <button id="whatsappProfileTab" class="settings-tab" :class="{ active: whatsappTab === 'profile' }" type="button" role="tab" :aria-selected="whatsappTab === 'profile'" aria-controls="whatsappProfilePanel" @click="whatsappTab = 'profile'"><Pencil :size="15" />{{ t('Perfil') }}</button>
            <button id="whatsappConnectionTab" class="settings-tab" :class="{ active: whatsappTab === 'connection' }" type="button" role="tab" :aria-selected="whatsappTab === 'connection'" aria-controls="whatsappConnectionPanel" @click="whatsappTab = 'connection'"><MessageCircle :size="15" />{{ t('Conexão') }}</button>
          </nav>
          <div v-if="whatsappError" class="notice-error" role="alert"><AlertTriangle :size="17" />{{ t(whatsappError) }}</div>
          <section v-if="whatsappTab === 'log'" id="whatsappLogPanel" class="whatsapp-log-section" role="tabpanel" aria-labelledby="whatsappLogTab">
            <div class="whatsapp-log-heading">
              <div class="whatsapp-log-actions">
                <strong>{{ whatsappLogs.length }} {{ t('eventos') }}</strong>
                <button v-if="whatsappLogs.length" class="danger-button whatsapp-log-clear" type="button" :disabled="whatsappWorking" @click="clearWhatsAppLogs"><Trash2 :size="14" />{{ t('Apagar log') }}</button>
              </div>
              <span>{{ t('Últimos 100 eventos em memória; o histórico é limpo quando a API reinicia.') }}</span>
            </div>
            <div v-if="whatsappLogs.length" class="whatsapp-log-list" role="list">
              <article v-for="entry in whatsappLogs" :key="entry.id" class="whatsapp-log-row" :class="`whatsapp-log-${entry.level}`" role="listitem">
                <span class="whatsapp-log-icon"><CircleCheck v-if="entry.level === 'success'" :size="16" /><CircleAlert v-else-if="entry.level === 'error'" :size="16" /><Activity v-else :size="16" /></span>
                <span class="whatsapp-log-copy"><strong>{{ entry.event }}</strong><small>{{ entry.details }}</small></span>
                <time :datetime="entry.createdAt">{{ new Date(entry.createdAt).toLocaleString(dateLocale) }}</time>
              </article>
            </div>
            <div v-else class="whatsapp-log-empty"><List :size="20" /><strong>{{ t('Nenhum evento registrado.') }}</strong><span>{{ t('O log não armazena o conteúdo das mensagens nem números completos.') }}</span></div>
          </section>
          <section v-else-if="whatsappTab === 'configuration'" id="whatsappConfigurationPanel" class="whatsapp-config-section" role="tabpanel" aria-labelledby="whatsappConfigurationTab">
            <fieldset class="whatsapp-channel-choice">
              <legend>{{ t('Canal ativo para notificações') }}</legend>
              <div class="whatsapp-channel-options" role="radiogroup" :aria-label="t('Canal ativo para notificações')">
                <label class="whatsapp-channel-option" :class="{ selected: whatsappCloudSettings.connectionMode === 'qr' }">
                  <input v-model="whatsappCloudSettings.connectionMode" type="radio" name="whatsappConnectionMode" value="qr" @change="clearWhatsAppConnectivityTest" />
                  <span><strong>{{ t('WhatsApp Web via QR (API particular)') }}</strong><small>{{ t('Usa a sessão vinculada por QR para enviar os alertas.') }}</small></span>
                </label>
                <label class="whatsapp-channel-option" :class="{ selected: whatsappCloudSettings.connectionMode === 'cloud' }">
                  <input v-model="whatsappCloudSettings.connectionMode" type="radio" name="whatsappConnectionMode" value="cloud" @change="clearWhatsAppConnectivityTest" />
                  <span><strong>{{ t('WhatsApp Cloud API') }}</strong><small>{{ t('Usa o token e o número configurados na Meta.') }}</small></span>
                </label>
              </div>
              <p class="settings-help">{{ t('Somente o canal selecionado e salvo será usado para enviar notificações. O outro canal não fará fallback.') }}</p>
              <p v-if="whatsappCloudSettings.connectionMode !== whatsappSavedConnectionMode" class="whatsapp-manager-warning" role="status">{{ t('Seleção pendente. Salve a configuração para ativar este canal.') }}</p>
            </fieldset>
            <div v-if="whatsappCloudSettings.connectionMode === 'cloud'" class="whatsapp-config-form">
              <div class="whatsapp-status-line">
                <span class="whatsapp-status-dot" :class="whatsappCloudSettings.accessTokenConfigured ? 'whatsapp-status-connected' : 'whatsapp-status-disconnected'"></span>
                <strong>{{ t(whatsappCloudSettings.accessTokenConfigured ? 'Cloud API configurada' : 'Cloud API não configurada') }}</strong>
              </div>
              <label class="whatsapp-config-field" for="whatsappCloudAccessToken"><span>{{ t('Token de acesso da Meta') }}</span><input id="whatsappCloudAccessToken" v-model="whatsappCloudAccessToken" class="settings-input" type="password" autocomplete="new-password" :disabled="whatsappCloudClearAccessToken" :placeholder="whatsappCloudSettings.accessTokenConfigured ? t('Deixe em branco para manter o token salvo.') : ''" @input="whatsappCloudClearAccessToken = false" /></label>
              <label v-if="whatsappCloudSettings.accessTokenConfigured" class="theme-setting email-secure-toggle" for="whatsappCloudClearToken"><span class="theme-setting-icon"><LockKeyhole :size="17" /></span><span class="theme-setting-copy"><strong>{{ t('Remover token salvo') }}</strong><small>{{ t('Desativa o envio pela Cloud API; a conexão QR continua independente.') }}</small></span><input id="whatsappCloudClearToken" v-model="whatsappCloudClearAccessToken" class="theme-switch" type="checkbox" @change="whatsappCloudAccessToken = ''" /></label>
              <label class="whatsapp-config-field" for="whatsappPhoneNumberId"><span>{{ t('ID do número WhatsApp') }}</span><input id="whatsappPhoneNumberId" v-model="whatsappCloudSettings.phoneNumberId" class="settings-input" type="text" inputmode="numeric" autocomplete="off" placeholder="123456789012345" /></label>
              <div class="email-config-grid whatsapp-cloud-config-grid">
                <label class="whatsapp-config-field" for="whatsappGraphApiVersion"><span>{{ t('Versão da API Graph') }}</span><input id="whatsappGraphApiVersion" v-model="whatsappCloudSettings.apiVersion" class="settings-input" type="text" placeholder="v23.0" /></label>
                <label class="whatsapp-config-field" for="whatsappTemplateLanguage"><span>{{ t('Idioma do modelo') }}</span><input id="whatsappTemplateLanguage" v-model="whatsappCloudSettings.templateLanguage" class="settings-input" type="text" placeholder="pt_BR" /></label>
              </div>
              <label class="whatsapp-config-field" for="whatsappTemplateName"><span>{{ t('Nome do modelo aprovado') }}</span><input id="whatsappTemplateName" v-model="whatsappCloudSettings.templateName" class="settings-input" type="text" autocomplete="off" placeholder="lab_monitor_alarm" /></label>
              <p class="settings-help">{{ t('Use o nome e idioma de um modelo aprovado no WhatsApp Manager. Para modelos diferentes de hello_world, o servidor envia três parâmetros: aparelho, estado e localização.') }}</p>
              <p v-if="whatsappCloudMessage" class="success-message" role="status">{{ t(whatsappCloudMessage) }}</p>
              <button class="primary-button settings-save-button" type="button" :disabled="whatsappCloudSaving" @click="saveWhatsAppCloudSettings"><LoaderCircle v-if="whatsappCloudSaving" class="spin" :size="16" />{{ whatsappCloudSaving ? t('Salvando...') : t('Salvar configuração') }}</button>
            </div>
            <div v-else class="whatsapp-config-form whatsapp-qr-configuration">
              <div class="settings-section-heading"><h3>{{ t('Conexão via QR code') }}</h3></div>
              <div class="whatsapp-status-line">
                <span class="whatsapp-status-dot" :class="`whatsapp-status-${whatsappStatus.state}`"></span>
                <strong>{{ t(whatsappStatus.state === 'connected' ? 'Conectado' : whatsappStatus.state === 'qr' ? 'Aguardando leitura do QR code' : whatsappStatus.state === 'connecting' ? 'Conectando' : 'Desconectado') }}</strong>
              </div>
              <p v-if="whatsappStatus.state === 'connected' && whatsappStatus.phoneNumber" class="whatsapp-phone">+{{ whatsappStatus.phoneNumber }}</p>
              <p v-if="whatsappStatus.state === 'qr'" class="whatsapp-manager-help">{{ t('Escaneie o QR code com o WhatsApp da conta que enviará os alertas.') }}</p>
              <p class="whatsapp-manager-help">{{ t('Os alertas serão enviados somente a usuários que ativaram WhatsApp no perfil.') }}</p>
              <p class="whatsapp-manager-warning">{{ t('Este conector não é oficial. O WhatsApp pode desconectar ou bloquear contas que automatizam mensagens.') }}</p>
              <button v-if="whatsappStatus.state === 'disconnected'" class="primary-button whatsapp-action" type="button" :disabled="whatsappWorking || whatsappCloudSettings.connectionMode !== whatsappSavedConnectionMode" @click="connectWhatsApp">
                <LoaderCircle v-if="whatsappWorking" class="spin" :size="16" /><MessageCircle v-else :size="16" />{{ t('Iniciar conexão') }}
              </button>
              <button v-else class="secondary-button whatsapp-action" type="button" :disabled="whatsappWorking" @click="disconnectWhatsApp">
                <LoaderCircle v-if="whatsappWorking" class="spin" :size="16" /><X v-else :size="16" />{{ t('Desconectar conta') }}
              </button>
              <div v-if="whatsappStatus.state === 'qr'" class="whatsapp-qr-panel">
                <img v-if="whatsappStatus.qrDataUrl" class="whatsapp-qr-image" :src="whatsappStatus.qrDataUrl" :alt="t('Escaneie o QR code com o WhatsApp da conta que enviará os alertas.')" />
                <div v-else class="whatsapp-qr-placeholder"><LoaderCircle class="spin" :size="24" /></div>
              </div>
              <div v-else-if="whatsappStatus.state === 'connecting'" class="whatsapp-qr-placeholder"><LoaderCircle class="spin" :size="24" /></div>
              <p v-if="whatsappCloudSettings.connectionMode !== whatsappSavedConnectionMode" class="success-message" role="status">{{ t('Salve a seleção para ativar este canal.') }}</p>
              <button v-if="whatsappCloudSettings.connectionMode !== whatsappSavedConnectionMode" class="primary-button settings-save-button" type="button" :disabled="whatsappCloudSaving" @click="saveWhatsAppCloudSettings"><LoaderCircle v-if="whatsappCloudSaving" class="spin" :size="16" />{{ whatsappCloudSaving ? t('Salvando...') : t('Salvar seleção do canal') }}</button>
            </div>
          </section>
          <section v-else-if="whatsappTab === 'notifications'" id="whatsappNotificationsPanel" class="whatsapp-config-section" role="tabpanel" aria-labelledby="whatsappNotificationsTab">
            <div class="whatsapp-config-form">
              <label class="whatsapp-config-field" for="whatsappSenderName"><span>{{ t('Nome exibido nas mensagens') }}</span><input id="whatsappSenderName" v-model="whatsappSettings.senderName" class="settings-input" type="text" maxlength="80" /></label>
              <MessageTemplateEditor id="whatsappOnlineMessage" v-model="whatsappSettings.onlineMessage" :label="t('Mensagem ao normalizar')" :maxlength="500" />
              <MessageTemplateEditor id="whatsappWarningMessage" v-model="whatsappSettings.warningMessage" :label="t('Mensagem em atenção')" :maxlength="500" />
              <MessageTemplateEditor id="whatsappOfflineMessage" v-model="whatsappSettings.offlineMessage" :label="t('Mensagem offline')" :maxlength="500" />
              <fieldset class="whatsapp-sticker-assignments" :disabled="whatsappSavedConnectionMode !== 'qr'">
                <legend>{{ t('Mídia de cada alerta') }}</legend>
                <p v-if="whatsappSavedConnectionMode !== 'qr'" class="whatsapp-manager-warning">{{ t('Imagem e figurinha são enviadas pelo WhatsApp Web via QR; a Cloud API deste projeto usa modelos aprovados.') }}</p>
                <div class="whatsapp-alert-media-grid">
                  <div class="whatsapp-alert-media-setting">
                    <label class="whatsapp-config-field" for="onlineAlertMediaType"><span>{{ t('Mídia') }}</span><select id="onlineAlertMediaType" v-model="whatsappSettings.onlineMediaType" class="settings-input select-input" @change="setWhatsAppAlertMediaType('online', $event)"><option value="none">{{ t('Somente texto') }}</option><option value="image">{{ t('Imagem com mensagem') }}</option><option value="sticker">{{ t('Figurinha') }}</option></select></label>
                    <label v-if="whatsappSettings.onlineMediaType !== 'none'" class="whatsapp-config-field"><span>{{ t('Mídia favorita') }}</span><select v-model="whatsappSettings.onlineMediaId" class="settings-input select-input"><option :value="null">{{ t('Selecione uma mídia') }}</option><option v-for="media in favoriteWhatsAppMedia" :key="media.id" :value="media.id">{{ media.name }}{{ media.animated ? ` (${t('Animada')})` : '' }}</option></select></label>
                  </div>
                  <div class="whatsapp-alert-media-setting">
                    <label class="whatsapp-config-field" for="warningAlertMediaType"><span>{{ t('Mídia') }}</span><select id="warningAlertMediaType" v-model="whatsappSettings.warningMediaType" class="settings-input select-input" @change="setWhatsAppAlertMediaType('warning', $event)"><option value="none">{{ t('Somente texto') }}</option><option value="image">{{ t('Imagem com mensagem') }}</option><option value="sticker">{{ t('Figurinha') }}</option></select></label>
                    <label v-if="whatsappSettings.warningMediaType !== 'none'" class="whatsapp-config-field"><span>{{ t('Mídia favorita') }}</span><select v-model="whatsappSettings.warningMediaId" class="settings-input select-input"><option :value="null">{{ t('Selecione uma mídia') }}</option><option v-for="media in favoriteWhatsAppMedia" :key="media.id" :value="media.id">{{ media.name }}{{ media.animated ? ` (${t('Animada')})` : '' }}</option></select></label>
                  </div>
                  <div class="whatsapp-alert-media-setting">
                    <label class="whatsapp-config-field" for="offlineAlertMediaType"><span>{{ t('Mídia') }}</span><select id="offlineAlertMediaType" v-model="whatsappSettings.offlineMediaType" class="settings-input select-input" @change="setWhatsAppAlertMediaType('offline', $event)"><option value="none">{{ t('Somente texto') }}</option><option value="image">{{ t('Imagem com mensagem') }}</option><option value="sticker">{{ t('Figurinha') }}</option></select></label>
                    <label v-if="whatsappSettings.offlineMediaType !== 'none'" class="whatsapp-config-field"><span>{{ t('Mídia favorita') }}</span><select v-model="whatsappSettings.offlineMediaId" class="settings-input select-input"><option :value="null">{{ t('Selecione uma mídia') }}</option><option v-for="media in favoriteWhatsAppMedia" :key="media.id" :value="media.id">{{ media.name }}{{ media.animated ? ` (${t('Animada')})` : '' }}</option></select></label>
                  </div>
                </div>
              </fieldset>
              <section class="whatsapp-sticker-library" aria-labelledby="whatsappMediaLibraryTitle">
                <div class="settings-section-heading"><h3 id="whatsappMediaLibraryTitle">{{ t('Biblioteca de mídia') }}</h3><span>{{ favoriteWhatsAppMedia.length }}</span></div>
                <p class="settings-help">{{ t('Adicione GIF, WebP, PNG ou JPEG. GIFs e WebPs animados são detectados automaticamente e aparecem em movimento na prévia.') }}</p>
                <div class="whatsapp-sticker-import">
                  <label class="whatsapp-config-field" for="favoriteMediaName"><span>{{ t('Nome da mídia') }}</span><input id="favoriteMediaName" v-model="favoriteMediaName" class="settings-input" type="text" maxlength="48" :placeholder="t('Ex.: Alerta do sensor')" /></label>
                  <label class="secondary-button whatsapp-sticker-file" for="favoriteMediaFile"><ImagePlus :size="15" />{{ favoriteMediaDataUrl ? t('Mídia selecionada') : t('Escolher mídia') }}</label>
                  <input id="favoriteMediaFile" class="visually-hidden" type="file" accept="image/gif,image/webp,image/png,image/jpeg" @change="selectFavoriteWhatsAppMedia" />
                  <button class="primary-button" type="button" :disabled="favoriteMediaSaving || !favoriteMediaName.trim() || !favoriteMediaDataUrl" @click="addFavoriteWhatsAppMedia"><LoaderCircle v-if="favoriteMediaSaving" class="spin" :size="15" /><Plus v-else :size="15" />{{ favoriteMediaSaving ? t('Salvando...') : t('Adicionar aos favoritos') }}</button>
                </div>
                <img v-if="favoriteMediaDataUrl" class="whatsapp-selected-media-preview" :src="favoriteMediaDataUrl" :alt="favoriteMediaName" />
                <p v-if="favoriteWhatsAppMediaError" class="error-message" role="alert">{{ t(favoriteWhatsAppMediaError) }}</p>
                <div v-if="favoriteWhatsAppMediaLoading" class="workspace-device-empty">{{ t('Carregando mídias...') }}</div>
                <div v-else-if="favoriteWhatsAppMedia.length" class="whatsapp-sticker-library-grid">
                  <article v-for="media in favoriteWhatsAppMedia" :key="media.id" class="whatsapp-sticker-favorite">
                    <img :src="media.previewUrl" :alt="media.name" />
                    <strong>{{ media.name }}</strong>
                    <small>{{ media.animated ? t('Animada') : t('Estática') }}</small>
                    <button class="whatsapp-media-delete" type="button" :disabled="favoriteMediaDeletingId !== null" :aria-label="`${t('Excluir a mídia')} ${media.name}`" :title="t('Excluir a mídia')" @click="removeFavoriteWhatsAppMedia(media)"><Trash2 :size="14" /></button>
                  </article>
                </div>
                <div v-else class="workspace-device-empty">{{ t('Nenhuma mídia favorita.') }}</div>
              </section>
              <p class="settings-help">{{ t('Use &#123;&#123;laboratorio&#125;&#125;, &#123;&#123;aparelho&#125;&#125;, &#123;&#123;status&#125;&#125;, &#123;&#123;localizacao&#125;&#125; e &#123;&#123;identificador&#125;&#125; como campos dinâmicos.') }}</p>
              <div class="notification-preview-list whatsapp-notification-previews">
                <article v-for="preview in whatsappNotificationPreviews" :key="preview.id" class="whatsapp-notification-preview">
                  <h3>{{ t(preview.label) }}</h3>
                  <div class="whatsapp-chat-preview"><img v-if="preview.media && preview.mediaType === 'sticker'" class="whatsapp-message-sticker-preview" :src="preview.media.previewUrl" :alt="preview.media.name" /><div class="whatsapp-preview-bubble"><img v-if="preview.media && preview.mediaType === 'image'" class="whatsapp-message-image-preview" :src="preview.media.previewUrl" :alt="preview.media.name" /><div v-html="preview.html"></div></div><small>{{ t('agora') }}</small></div>
                </article>
              </div>
              <p class="settings-help">{{ t('Estas mensagens são usadas pela conexão via QR. O nome não altera o perfil da conta WhatsApp.') }}</p>
              <p v-if="whatsappSettingsMessage" class="success-message" role="status">{{ t(whatsappSettingsMessage) }}</p>
              <button class="primary-button settings-save-button" type="button" :disabled="whatsappSettingsSaving || !canSaveWhatsAppNotificationSettings()" @click="saveWhatsAppSettings"><LoaderCircle v-if="whatsappSettingsSaving" class="spin" :size="16" />{{ whatsappSettingsSaving ? t('Salvando...') : t('Salvar notificações') }}</button>
            </div>
          </section>
          <section v-else-if="whatsappTab === 'profile'" id="whatsappProfilePanel" class="whatsapp-config-section whatsapp-profile-panel" role="tabpanel" aria-labelledby="whatsappProfileTab">
            <template v-if="whatsappStatus.state === 'connected' && whatsappProfile">
              <div class="whatsapp-config-form">
                <p class="settings-help">{{ t('O perfil original será restaurado automaticamente ao desconectar a conta.') }} {{ t('As fotos e nomes salvos continuam disponíveis para restauração.') }}</p>
                <label class="whatsapp-config-field" for="whatsappProfileName"><span>{{ t('Nome do perfil WhatsApp') }}</span><input id="whatsappProfileName" v-model="whatsappProfileDraftName" class="settings-input" type="text" maxlength="80" autocomplete="off" /></label>
                <div class="whatsapp-profile-photo-editor">
                  <span class="whatsapp-profile-photo-preview"><img v-if="whatsappProfileDraftPhoto" :src="whatsappProfileDraftPhoto" :alt="t('Foto do perfil WhatsApp')" /><span v-else>{{ whatsappProfileDraftName.slice(0, 1).toUpperCase() || '?' }}</span></span>
                  <div class="whatsapp-profile-photo-actions">
                    <strong>{{ t('Foto do perfil WhatsApp') }}</strong>
                    <div class="whatsapp-profile-photo-buttons">
                      <label class="secondary-button" for="whatsappProfilePhotoFile"><ImagePlus :size="15" />{{ t('Escolher foto') }}</label>
                      <input id="whatsappProfilePhotoFile" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" @change="selectWhatsAppProfilePhoto" />
                      <button v-if="whatsappProfileDraftPhoto" class="text-button" type="button" @click="whatsappProfileDraftPhoto = null">{{ t('Remover foto atual') }}</button>
                    </div>
                  </div>
                </div>
                <p v-if="whatsappProfilePhotoError" class="error-message" role="alert">{{ t(whatsappProfilePhotoError) }}</p>
                <p v-if="whatsappProfileError" class="error-message" role="alert">{{ t(whatsappProfileError) }}</p>
                <p v-if="whatsappProfileMessage" class="success-message" role="status">{{ t(whatsappProfileMessage) }}</p>
                <button class="primary-button settings-save-button" type="button" :disabled="whatsappProfileSaving || !whatsappProfileDraftName.trim()" @click="saveWhatsAppProfile"><LoaderCircle v-if="whatsappProfileSaving" class="spin" :size="16" />{{ whatsappProfileSaving ? t('Salvando...') : t('Salvar perfil') }}</button>
              </div>
              <div class="whatsapp-privacy-settings">
                <div class="settings-section-heading"><h3>{{ t('Privacidade da conta') }}</h3></div>
                <p class="settings-help">{{ t('As alterações de privacidade são aplicadas diretamente à conta WhatsApp e permanecem mesmo depois de desconectar o Baileys.') }}</p>
                <p class="settings-help">{{ t('A regra de exceções pode ser selecionada aqui, mas a lista de pessoas excluídas é gerenciada no próprio WhatsApp.') }}</p>
                <label class="whatsapp-config-field" for="whatsappPrivacyLastSeen"><span>{{ t('Quem pode ver meu visto por último') }}</span><select id="whatsappPrivacyLastSeen" v-model="whatsappPrivacySettings.lastSeen" class="settings-input select-input"><option value="all">{{ t('Todos') }}</option><option value="contacts">{{ t('Meus contatos') }}</option><option value="contact_blacklist">{{ t('Meus contatos, exceto...') }}</option><option value="none">{{ t('Ninguém') }}</option></select></label>
                <label class="whatsapp-config-field" for="whatsappPrivacyOnline"><span>{{ t('Quem pode ver quando estou online') }}</span><select id="whatsappPrivacyOnline" v-model="whatsappPrivacySettings.online" class="settings-input select-input"><option value="all">{{ t('Todos') }}</option><option value="match_last_seen">{{ t('Igual ao visto por último') }}</option></select></label>
                <label class="whatsapp-config-field" for="whatsappPrivacyPhoto"><span>{{ t('Quem pode ver minha foto') }}</span><select id="whatsappPrivacyPhoto" v-model="whatsappPrivacySettings.profilePhoto" class="settings-input select-input"><option value="all">{{ t('Todos') }}</option><option value="contacts">{{ t('Meus contatos') }}</option><option value="contact_blacklist">{{ t('Meus contatos, exceto...') }}</option><option value="none">{{ t('Ninguém') }}</option></select></label>
                <label class="whatsapp-config-field" for="whatsappPrivacyStatus"><span>{{ t('Quem pode ver minhas atualizações de Status') }}</span><select id="whatsappPrivacyStatus" v-model="whatsappPrivacySettings.status" class="settings-input select-input"><option value="all">{{ t('Todos') }}</option><option value="contacts">{{ t('Meus contatos') }}</option><option value="contact_blacklist">{{ t('Meus contatos, exceto...') }}</option><option value="none">{{ t('Ninguém') }}</option></select></label>
                <label class="whatsapp-config-field" for="whatsappPrivacyReadReceipts"><span>{{ t('Confirmações de leitura') }}</span><select id="whatsappPrivacyReadReceipts" v-model="whatsappPrivacySettings.readReceipts" class="settings-input select-input"><option value="all">{{ t('Ativadas') }}</option><option value="none">{{ t('Desativadas') }}</option></select></label>
                <label class="whatsapp-config-field" for="whatsappPrivacyGroups"><span>{{ t('Quem pode me adicionar em grupos') }}</span><select id="whatsappPrivacyGroups" v-model="whatsappPrivacySettings.groupsAdd" class="settings-input select-input"><option value="all">{{ t('Todos') }}</option><option value="contacts">{{ t('Meus contatos') }}</option><option value="contact_blacklist">{{ t('Meus contatos, exceto...') }}</option></select></label>
                <p v-if="whatsappPrivacyError" class="error-message" role="alert">{{ t(whatsappPrivacyError) }}</p>
                <p v-if="whatsappPrivacyMessage" class="success-message" role="status">{{ t(whatsappPrivacyMessage) }}</p>
                <button class="primary-button settings-save-button" type="button" :disabled="whatsappPrivacySaving" @click="saveWhatsAppPrivacySettings"><LoaderCircle v-if="whatsappPrivacySaving" class="spin" :size="16" />{{ whatsappPrivacySaving ? t('Salvando...') : t('Salvar privacidade') }}</button>
              </div>
              <div class="whatsapp-profile-history">
                <div class="settings-section-heading"><h3>{{ t('Histórico de perfis') }}</h3><span>{{ whatsappProfile.history.length }}</span></div>
                <article v-for="snapshot in whatsappProfile.history" :key="snapshot.id" class="whatsapp-profile-snapshot">
                  <img v-if="snapshot.photoDataUrl" class="whatsapp-profile-snapshot-photo" :src="snapshot.photoDataUrl" :alt="''" />
                  <span v-else class="whatsapp-profile-snapshot-photo whatsapp-profile-snapshot-fallback">{{ snapshot.name.slice(0, 1).toUpperCase() }}</span>
                  <div class="whatsapp-profile-snapshot-copy"><strong>{{ snapshot.name }}</strong><small>{{ snapshot.isOriginal ? t('Perfil original') : t('Versão salva') }} · {{ new Date(snapshot.createdAt).toLocaleString(dateLocale) }}</small></div>
                  <button class="secondary-button whatsapp-profile-restore" type="button" :disabled="whatsappProfileRestoringId !== null || snapshot.id === whatsappProfile.history[0]?.id" @click="restoreWhatsAppProfileSnapshot(snapshot)"><LoaderCircle v-if="whatsappProfileRestoringId === snapshot.id" class="spin" :size="14" /><RefreshCw v-else :size="14" />{{ t('Restaurar esta versão') }}</button>
                </article>
              </div>
            </template>
            <form v-else-if="whatsappStatus.state === 'connected' && whatsappProfileError.includes('Não foi possível ler o nome original do perfil WhatsApp.')" class="whatsapp-config-form whatsapp-profile-recovery" @submit.prevent="initializeWhatsAppProfileBaseline">
              <div class="settings-section-heading"><h3>{{ t('Recuperar ponto de restauração') }}</h3></div>
              <p v-if="whatsappProfileError" class="error-message" role="alert">{{ t(whatsappProfileError) }}</p>
              <p class="settings-help">{{ t('O WhatsApp não forneceu o nome do perfil. Confira no aplicativo do celular e informe abaixo o nome que está usando agora. O servidor salvará esse nome e a foto atual como referência antes de liberar as edições.') }}</p>
              <label class="whatsapp-config-field" for="whatsappProfileBaselineName"><span>{{ t('Nome atual exibido no WhatsApp') }}</span><input id="whatsappProfileBaselineName" v-model="whatsappProfileBaselineName" class="settings-input" type="text" maxlength="80" autocomplete="off" required /></label>
              <p v-if="whatsappProfileMessage" class="success-message" role="status">{{ t(whatsappProfileMessage) }}</p>
              <button class="primary-button settings-save-button" type="submit" :disabled="whatsappProfileBaselineSaving || !whatsappProfileBaselineName.trim()"><LoaderCircle v-if="whatsappProfileBaselineSaving" class="spin" :size="16" />{{ whatsappProfileBaselineSaving ? t('Salvando...') : t('Salvar referência e abrir editor') }}</button>
            </form>
            <div v-else class="whatsapp-log-empty"><MessageCircle :size="22" /><strong>{{ t('Conecte a conta via QR para editar o perfil.') }}</strong><span>{{ t('Conecte a conta WhatsApp via QR para gerenciar o perfil.') }}</span></div>
          </section>
          <section v-else id="whatsappConnectionPanel" class="whatsapp-manager-section" role="tabpanel" aria-labelledby="whatsappConnectionTab">
            <div class="whatsapp-manager-copy">
              <div class="whatsapp-status-line"><span class="whatsapp-status-dot" :class="whatsappCloudConnectivity ? 'whatsapp-status-connected' : whatsappCloudConnectivityError ? 'whatsapp-status-qr' : 'whatsapp-status-disconnected'"></span><strong>{{ t(whatsappCloudConnectivity ? whatsappCloudConnectivity.connectionMode === 'qr' ? 'WhatsApp Web conectado' : 'Cloud API operacional' : whatsappCloudConnectivityError ? 'Falha no teste de conexão' : whatsappCloudSettings.connectionMode === 'qr' ? 'Sessão QR não testada' : 'Cloud API não testada') }}</strong></div>
              <p class="whatsapp-manager-help">{{ t(whatsappCloudSettings.connectionMode === 'qr' ? 'O teste verifica se a sessão vinculada via QR está conectada.' : 'O teste consulta os dados do número na Meta Graph API sem enviar mensagens.') }}</p>
              <p v-if="whatsappCloudConnectivity?.verifiedName" class="whatsapp-phone">{{ whatsappCloudConnectivity.verifiedName }}</p>
              <p v-if="whatsappCloudConnectivity?.displayPhoneNumber" class="whatsapp-manager-help">{{ whatsappCloudConnectivity.displayPhoneNumber }}</p>
              <p v-if="whatsappCloudConnectivityError" class="error-message" role="alert">{{ t(whatsappCloudConnectivityError) }}</p>
              <p v-if="whatsappCloudSettings.connectionMode !== whatsappSavedConnectionMode" class="whatsapp-manager-warning">{{ t('Salve o canal selecionado na aba Configuração antes de testar.') }}</p>
              <p v-else-if="whatsappCloudSettings.connectionMode === 'cloud' && (!whatsappCloudSettings.accessTokenConfigured || !whatsappCloudSettings.phoneNumberId)" class="whatsapp-manager-warning">{{ t('Configure e salve o token e o ID do número antes de testar.') }}</p>
              <p v-else-if="whatsappCloudSettings.connectionMode === 'qr' && whatsappStatus.state !== 'connected'" class="whatsapp-manager-warning">{{ t('Conecte o WhatsApp via QR code na aba Configuração antes de testar.') }}</p>
              <button class="primary-button whatsapp-action" type="button" :disabled="whatsappCloudConnectivityTesting || whatsappCloudSettings.connectionMode !== whatsappSavedConnectionMode || (whatsappCloudSettings.connectionMode === 'cloud' && (!whatsappCloudSettings.accessTokenConfigured || !whatsappCloudSettings.phoneNumberId)) || (whatsappCloudSettings.connectionMode === 'qr' && whatsappStatus.state !== 'connected')" @click="testWhatsAppCloudConnection">
                <LoaderCircle v-if="whatsappCloudConnectivityTesting" class="spin" :size="16" /><RefreshCw v-else :size="16" />{{ whatsappCloudConnectivityTesting ? t('Testando conexão...') : t('Testar conexão') }}
              </button>
            </div>
            <div class="email-connection-mark"><MessageCircle :size="36" /></div>
          </section>
        </div>
        <div v-else-if="managementTab === 'email' && isWhatsAppDashboardAdmin" class="whatsapp-management-panel email-management-panel">
          <div class="page-heading">
            <div><p class="eyebrow">{{ t('GERENCIAMENTO') }}</p><h1>{{ t('E-mail API') }}</h1><p class="heading-sub">{{ t(emailTab === 'log' ? 'Log de eventos' : emailTab === 'configuration' ? 'Configuração de e-mail' : emailTab === 'notifications' ? 'Notificações' : 'Conexão SMTP') }}</p></div>
            <button class="secondary-button" type="button" :disabled="emailWorking || emailSettingsSaving" :aria-label="t('Atualizar')" :title="t('Atualizar')" @click="emailTab === 'log' ? loadEmailLogs() : loadEmailSettings()"><RefreshCw :size="16" /></button>
          </div>
          <nav class="settings-tabs whatsapp-tabs" role="tablist" :aria-label="t('E-mail API')">
            <button id="emailLogTab" class="settings-tab" :class="{ active: emailTab === 'log' }" type="button" role="tab" :aria-selected="emailTab === 'log'" aria-controls="emailLogPanel" @click="emailTab = 'log'"><List :size="15" />{{ t('Log') }}</button>
            <button id="emailConfigurationTab" class="settings-tab" :class="{ active: emailTab === 'configuration' }" type="button" role="tab" :aria-selected="emailTab === 'configuration'" aria-controls="emailConfigurationPanel" @click="emailTab = 'configuration'"><Settings :size="15" />{{ t('Configuração') }}</button>
            <button id="emailNotificationsTab" class="settings-tab" :class="{ active: emailTab === 'notifications' }" type="button" role="tab" :aria-selected="emailTab === 'notifications'" aria-controls="emailNotificationsPanel" @click="emailTab = 'notifications'"><Bell :size="15" />{{ t('Notificações') }}</button>
            <button id="emailConnectionTab" class="settings-tab" :class="{ active: emailTab === 'connection' }" type="button" role="tab" :aria-selected="emailTab === 'connection'" aria-controls="emailConnectionPanel" @click="emailTab = 'connection'"><Mail :size="15" />{{ t('Conexão') }}</button>
          </nav>
          <div v-if="emailError" class="notice-error" role="alert"><AlertTriangle :size="17" />{{ t(emailError) }}</div>
          <p v-if="emailMessage" class="success-message" role="status">{{ t(emailMessage) }}</p>
          <section v-if="emailTab === 'log'" id="emailLogPanel" class="whatsapp-log-section" role="tabpanel" aria-labelledby="emailLogTab">
            <div class="whatsapp-log-heading">
              <div class="whatsapp-log-actions">
                <strong>{{ emailLogs.length }} {{ t('eventos') }}</strong>
                <button v-if="emailLogs.length" class="danger-button whatsapp-log-clear" type="button" :disabled="emailWorking" @click="clearEmailLogs"><Trash2 :size="14" />{{ t('Apagar log de e-mail') }}</button>
              </div>
              <span>{{ t('Últimos 100 eventos em memória; o histórico é limpo quando a API reinicia.') }}</span>
            </div>
            <div v-if="emailLogs.length" class="whatsapp-log-list" role="list">
              <article v-for="entry in emailLogs" :key="entry.id" class="whatsapp-log-row" :class="`whatsapp-log-${entry.level}`" role="listitem">
                <span class="whatsapp-log-icon"><CircleCheck v-if="entry.level === 'success'" :size="16" /><CircleAlert v-else-if="entry.level === 'error'" :size="16" /><Activity v-else :size="16" /></span>
                <span class="whatsapp-log-copy"><strong>{{ entry.event }}</strong><small>{{ entry.details }}</small></span>
                <time :datetime="entry.createdAt">{{ new Date(entry.createdAt).toLocaleString(dateLocale) }}</time>
              </article>
            </div>
            <div v-else class="whatsapp-log-empty"><List :size="20" /><strong>{{ t('Nenhum e-mail enviado.') }}</strong><span>{{ t('O log guarda resultados e destinatários mascarados, nunca o conteúdo.') }}</span></div>
          </section>
          <section v-else-if="emailTab === 'configuration'" id="emailConfigurationPanel" class="whatsapp-config-section" role="tabpanel" aria-labelledby="emailConfigurationTab">
            <div class="whatsapp-config-form">
              <div class="email-config-grid">
                <label class="whatsapp-config-field" for="emailSmtpHost"><span>{{ t('Servidor SMTP') }}</span><input id="emailSmtpHost" v-model="emailSmtpDraft.smtpHost" class="settings-input" type="text" autocomplete="off" placeholder="smtp.example.com" /></label>
                <label class="whatsapp-config-field" for="emailSmtpPort"><span>{{ t('Porta SMTP') }}</span><input id="emailSmtpPort" v-model.number="emailSmtpDraft.smtpPort" class="settings-input" type="number" min="1" max="65535" /></label>
                <label class="whatsapp-config-field" for="emailSmtpUser"><span>{{ t('Usuário SMTP') }}</span><input id="emailSmtpUser" v-model="emailSmtpDraft.smtpUser" class="settings-input" type="text" autocomplete="username" /></label>
                <label class="whatsapp-config-field" for="emailSenderAddress"><span>{{ t('E-mail do remetente') }}</span><input id="emailSenderAddress" v-model="emailSmtpDraft.senderEmail" class="settings-input" type="email" autocomplete="email" /></label>
                <label class="whatsapp-config-field" for="emailSenderName"><span>{{ t('Nome do remetente') }}</span><input id="emailSenderName" v-model="emailSmtpDraft.senderName" class="settings-input" type="text" maxlength="80" /></label>
                <label class="whatsapp-config-field" for="emailSmtpPassword"><span>{{ t('Senha SMTP') }}</span><input id="emailSmtpPassword" v-model="emailPassword" class="settings-input" type="password" autocomplete="new-password" :placeholder="emailSettings.passwordConfigured ? t('Deixe em branco para manter a senha salva.') : ''" /></label>
              </div>
              <label class="theme-setting email-secure-toggle" for="emailSmtpSecure"><span class="theme-setting-icon"><ShieldCheck :size="17" /></span><span class="theme-setting-copy"><strong>{{ t('Conexão segura (TLS)') }}</strong><small>{{ t('Ative para SMTP com TLS implícito, geralmente na porta 465.') }}</small></span><input id="emailSmtpSecure" v-model="emailSmtpDraft.smtpSecure" class="theme-switch" type="checkbox" /></label>
              <label v-if="emailSettings.passwordConfigured" class="theme-setting email-secure-toggle" for="emailClearPassword"><span class="theme-setting-icon"><LockKeyhole :size="17" /></span><span class="theme-setting-copy"><strong>{{ t('Apagar senha salva') }}</strong><small>{{ t('Remova a senha cifrada do servidor.') }}</small></span><input id="emailClearPassword" v-model="emailClearPassword" class="theme-switch" type="checkbox" /></label>
              <p class="settings-help">{{ t('A senha SMTP é cifrada no servidor.') }}</p>
              <button class="primary-button settings-save-button" type="button" :disabled="emailSettingsSaving" @click="saveEmailSettings"><LoaderCircle v-if="emailSettingsSaving" class="spin" :size="16" />{{ emailSettingsSaving ? t('Salvando...') : t('Salvar configuração de e-mail') }}</button>
            </div>
          </section>
          <section v-else-if="emailTab === 'notifications'" id="emailNotificationsPanel" class="whatsapp-config-section" role="tabpanel" aria-labelledby="emailNotificationsTab">
            <div class="whatsapp-config-form">
              <MessageTemplateEditor id="emailOnlineMessage" v-model="emailNotificationDraft.onlineMessage" :label="t('Mensagem de e-mail ao normalizar')" :maxlength="1000" />
              <MessageTemplateEditor id="emailWarningMessage" v-model="emailNotificationDraft.warningMessage" :label="t('Mensagem de e-mail em atenção')" :maxlength="1000" />
              <MessageTemplateEditor id="emailOfflineMessage" v-model="emailNotificationDraft.offlineMessage" :label="t('Mensagem de e-mail offline')" :maxlength="1000" />
              <p class="settings-help">{{ t('Use &#123;&#123;laboratorio&#125;&#125;, &#123;&#123;aparelho&#125;&#125;, &#123;&#123;status&#125;&#125;, &#123;&#123;localizacao&#125;&#125; e &#123;&#123;identificador&#125;&#125; como campos dinâmicos.') }}</p>
              <div class="notification-preview-list email-notification-previews">
                <article v-for="preview in emailNotificationPreviews" :key="preview.id" class="email-notification-preview">
                  <h3>{{ t(preview.label) }}</h3>
                  <div class="email-preview-document">
                    <header><strong>{{ emailSmtpDraft.senderName || 'LAB/MONITOR' }}</strong><small>MONITORAMENTO AMBIENTAL</small></header>
                    <div class="email-preview-subject"><span>{{ t('Assunto') }}</span><strong>Alerta de monitoramento: Sensor de demonstração</strong></div>
                    <div class="email-preview-body" v-html="preview.html"></div>
                    <footer>{{ t('Notificação automática do sistema de monitoramento.') }}</footer>
                  </div>
                </article>
              </div>
              <p class="settings-help">{{ t('As mensagens são enviadas em HTML e texto simples.') }}</p>
              <p v-if="emailMessage" class="success-message" role="status">{{ t(emailMessage) }}</p>
              <button class="primary-button settings-save-button" type="button" :disabled="emailSettingsSaving" @click="saveEmailNotificationDraft"><LoaderCircle v-if="emailSettingsSaving" class="spin" :size="16" />{{ emailSettingsSaving ? t('Salvando...') : t('Salvar notificações') }}</button>
            </div>
          </section>
          <section v-else id="emailConnectionPanel" class="whatsapp-manager-section" role="tabpanel" aria-labelledby="emailConnectionTab">
            <div class="whatsapp-manager-copy">
              <div class="whatsapp-status-line"><span class="whatsapp-status-dot" :class="`whatsapp-status-${emailConnectionState === 'connected' ? 'connected' : emailConnectionState === 'error' ? 'qr' : 'disconnected'}`"></span><strong>{{ t(emailConnectionState === 'connected' ? 'Conexão SMTP ativa' : emailConnectionState === 'error' ? 'Falha na conexão SMTP' : 'Conexão SMTP não testada') }}</strong></div>
              <p class="whatsapp-manager-help">{{ emailSettings.smtpHost ? `${emailSettings.smtpHost}:${emailSettings.smtpPort}` : t('Servidor SMTP') }}</p>
              <p class="whatsapp-manager-help">{{ t('O teste valida autenticação SMTP sem enviar uma mensagem.') }}</p>
              <button class="primary-button whatsapp-action" type="button" :disabled="emailWorking || !emailSettings.passwordConfigured" @click="testEmailConnection"><LoaderCircle v-if="emailWorking" class="spin" :size="16" /><ShieldCheck v-else :size="16" />{{ t('Testar conexão SMTP') }}</button>
            </div>
            <div class="email-connection-mark"><Mail :size="36" /></div>
          </section>
        </div>
        <template v-else>
        <div class="page-heading">
          <div><p class="eyebrow">{{ reportDate.toLocaleUpperCase(dateLocale) }}</p><h1>{{ t('Visao geral') }}</h1><p class="heading-sub">{{ t('Acompanhe a saude dos aparelhos e as ultimas medicoes.') }}</p></div>
          <button class="secondary-button" :disabled="loading" @click="loadDevices"><RefreshCw :size="16" /> {{ t('Atualizar') }}</button>
        </div>

        <div v-if="pageError" class="notice-error" role="alert"><AlertTriangle :size="17" />{{ t(pageError) }}</div>

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
                  <span class="device-icon"><Bot v-if="device.canSimulate" :size="17" /><Cpu v-else :size="17" /></span>
                  <span class="device-identity-copy">{{ deviceDisplayName(device) }}</span>
                </span>
                <span class="status-badge" :class="device.status"><i></i>{{ deviceStatusLabel(device.status) }}</span>
                <span class="device-health-overview" :aria-label="t('Estado dos sensores')">
                  <span
                    v-for="sensor in latestSensorReadings(device.readings)"
                    :key="sensor.key"
                    class="device-health-item"
                    :class="sensor.reading ? (sensor.reading.alert ? 'health-warning' : device.status === 'offline' ? 'health-offline' : 'health-online') : 'health-missing'"
                    :title="`${sensor.name}: ${sensor.reading ? sensor.reading.alert ? t('Em atenção') : device.status === 'offline' ? deviceStatusLabel('offline') : deviceStatusLabel('online') : t('sem leitura recebida')}`"
                  >
                    <component :is="readingIcon(sensor.key)" :size="15" />
                    <span>{{ sensor.shortName }}</span>
                    <component :is="sensor.reading ? sensor.reading.alert ? AlertTriangle : deviceStatusIcon(device.status === 'offline' ? 'offline' : 'online') : CircleMinus" :size="15" />
                  </span>
                </span>
                <ChevronDown class="device-expand-icon" :class="{ expanded: isDeviceExpanded(device.id) }" :size="18" />
              </button>

              <div v-if="isDeviceExpanded(device.id)" :id="`device-details-${device.id}`" class="device-details">
                <div class="device-alias-row">
                  <div class="device-alias-copy">
                    <strong>{{ t('Nome na dashboard') }}</strong>
                    <input v-if="editingDeviceAliasId === device.id" v-model="deviceAliasDraft" class="settings-input" type="text" maxlength="80" :placeholder="device.name" :aria-label="t('Apelido do aparelho')" @keydown.enter.prevent="saveDeviceAlias(device)" @keydown.esc="cancelDeviceAliasEdit" />
                    <span v-else>{{ deviceDisplayName(device) }}</span>
                  </div>
                  <div v-if="device.canEditAlias" class="device-alias-actions">
                    <template v-if="editingDeviceAliasId === device.id">
                      <button class="icon-button" type="button" :disabled="deviceAliasSavingId === device.id" :title="t('Salvar apelido')" :aria-label="t('Salvar apelido')" @click="saveDeviceAlias(device)"><LoaderCircle v-if="deviceAliasSavingId === device.id" class="spin" :size="15" /><Check v-else :size="16" /></button>
                      <button class="icon-button" type="button" :disabled="deviceAliasSavingId === device.id" :title="t('Cancelar')" :aria-label="t('Cancelar')" @click="cancelDeviceAliasEdit"><X :size="16" /></button>
                    </template>
                    <button v-else class="icon-button" type="button" :title="t('Editar apelido')" :aria-label="t('Editar apelido')" @click="editDeviceAlias(device)"><Pencil :size="15" /></button>
                  </div>
                </div>
                <div class="device-meta">
                  <span><MapPin :size="14" /><strong>{{ t('Localizacao') }}</strong>{{ device.location || t('Nao informado') }}</span>
                  <span><Cpu :size="14" /><strong>{{ t('Identificador') }}</strong>{{ device.externalId }}</span>
                  <span><Clock3 :size="14" /><strong>{{ t('Ultimo contato') }}</strong>{{ formatTime(device.lastSeenAt) }}</span>
                </div>
                <div class="device-readings-detail">
                  <article v-for="sensor in latestSensorReadings(device.readings)" :key="sensor.key" class="sensor-detail-card">
                    <div class="sensor-detail-label"><component :is="readingIcon(sensor.key)" :size="15" />{{ sensor.name }}</div>
                    <strong :class="{ 'sensor-reading-alert': sensor.reading?.alert }">{{ sensor.reading ? `${sensor.reading.value} ${sensor.reading.unit}` : t('Sem leitura') }}</strong>
                    <span v-if="sensor.reading" class="sensor-reading-time">{{ formatTime(sensor.reading.recordedAt) }}</span>
                  </article>
                </div>
                <section v-if="device.canSimulate && simulationValues[device.id]" class="demo-simulation-panel" :aria-label="t('Simular leituras')">
                  <div class="demo-simulation-heading"><div><strong>{{ t('Simular leituras') }}</strong><small>{{ deviceDisplayName(device) }}</small></div><Cpu :size="17" /></div>
                  <div class="demo-simulation-fields">
                    <label><span>{{ t('Temperatura (°C)') }}</span><input v-model.number="simulationValues[device.id].temperature" class="settings-input" type="number" min="-50" max="150" step="0.1" /></label>
                    <label><span>{{ t('Umidade (%)') }}</span><input v-model.number="simulationValues[device.id].humidity" class="settings-input" type="number" min="0" max="100" step="0.1" /></label>
                    <label><span>{{ t('Gás (ppm)') }}</span><input v-model.number="simulationValues[device.id].gas" class="settings-input" type="number" min="0" max="100000" step="1" /></label>
                    <label><span>{{ t('Estado simulado') }}</span><select v-model="simulationValues[device.id].status" class="settings-input"><option value="online">{{ t('Online') }}</option><option value="warning">{{ t('Em atenção') }}</option><option value="offline">{{ t('Offline') }}</option></select></label>
                  </div>
                  <div class="demo-simulation-actions">
                    <p v-if="simulationMessages[device.id]" :class="simulationMessages[device.id].startsWith('Simulação aplicada') ? 'success-message' : 'error-message'" role="status">{{ t(simulationMessages[device.id]) }}</p>
                    <button class="primary-button" type="button" :disabled="simulationSavingId === device.id" @click="applyDeviceSimulation(device)"><LoaderCircle v-if="simulationSavingId === device.id" class="spin" :size="16" />{{ t('Aplicar simulação') }}</button>
                  </div>
                </section>
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
        </template>
      </main>
    </section>

    <nav class="mobile-nav" :aria-label="t('Navegacao principal')">
      <a class="mobile-nav-item" :class="{ active: managementTab === 'overview' && activeMobileTab === 'home' }" href="#inicio" :aria-current="activeMobileTab === 'home' ? 'page' : undefined" @click.prevent="navigateMobileSection('home')">
        <LayoutDashboard :size="20" /><span>{{ t('Inicio') }}</span>
      </a>
      <button class="mobile-nav-item" type="button" @click="mobileWorkspaceSelectorOpen = true">
        <Building2 :size="19" /><span>{{ t('Ambientes') }}</span>
      </button>
      <a class="mobile-nav-item" :class="{ active: managementTab === 'overview' && activeMobileTab === 'devices' }" href="#aparelhos" :aria-current="activeMobileTab === 'devices' ? 'page' : undefined" @click.prevent="navigateMobileSection('devices')">
        <Cpu :size="20" /><span>{{ t('Aparelhos') }}</span>
      </a>
      <button v-if="canManageActiveWorkspace" class="mobile-nav-item" :class="{ active: managementTab === 'users' }" type="button" @click="managementTab = 'users'; activeMobileTab = 'users'">
        <UsersRound :size="19" /><span>{{ t('Usuários') }}</span>
      </button>
      <button v-if="isWhatsAppDashboardAdmin" class="mobile-nav-item" :class="{ active: managementTab === 'whatsapp' }" type="button" @click="managementTab = 'whatsapp'; activeMobileTab = 'whatsapp'">
        <MessageCircle :size="19" /><span>{{ t('WhatsApp API') }}</span>
      </button>
      <button v-if="isWhatsAppDashboardAdmin" class="mobile-nav-item" :class="{ active: managementTab === 'email' }" type="button" @click="managementTab = 'email'; activeMobileTab = 'email'">
        <Mail :size="19" /><span>{{ t('E-mail API') }}</span>
      </button>
      <button class="mobile-nav-item" type="button" @click="logout">
        <LogOut :size="19" /><span>{{ t('Sair') }}</span>
      </button>
    </nav>

    <div v-if="mobileWorkspaceSelectorOpen" class="settings-overlay workspace-selector-overlay" @click.self="mobileWorkspaceSelectorOpen = false">
      <section class="settings-dialog workspace-selector-dialog" role="dialog" aria-modal="true" aria-labelledby="mobileWorkspaceTitle">
        <header class="settings-header">
          <div><p class="eyebrow">{{ t('AMBIENTES') }}</p><h2 id="mobileWorkspaceTitle">{{ t('Selecionar ambiente') }}</h2></div>
          <button class="icon-button" type="button" :aria-label="t('Fechar seleção de ambientes')" @click="mobileWorkspaceSelectorOpen = false"><X :size="19" /></button>
        </header>
        <div class="workspace-list workspace-selector-list">
          <button v-for="workspace in workspaces" :key="workspace.id" class="workspace-selector-option" type="button" :class="{ active: workspace.id === activeWorkspaceId }" @click="mobileWorkspaceSelectorOpen = false; changeWorkspace(workspace.id)">
            <span class="workspace-option-avatar"><img v-if="workspace.iconDataUrl" :src="workspace.iconDataUrl" alt="" /><span v-else>{{ workspace.name.slice(0, 1).toUpperCase() }}</span></span>
            <span class="workspace-selector-name">{{ workspace.name }}<small>{{ workspaceRoleLabel(workspace.role) }}</small></span>
            <Check v-if="workspace.id === activeWorkspaceId" :size="16" />
          </button>
        </div>
        <button class="workspace-manage-button workspace-selector-manage" type="button" @click="mobileWorkspaceSelectorOpen = false; openWorkspaceManager('create')"><Plus :size="15" /> {{ t('Adicionar/editar ambiente') }}</button>
      </section>
    </div>

    <div v-if="workspaceDialogOpen" class="settings-overlay workspace-manager-overlay" @click.self="workspaceDialogOpen = false">
      <section class="settings-dialog workspace-manager-dialog" role="dialog" aria-modal="true" aria-labelledby="workspaceManagerTitle">
        <header class="settings-header">
          <div><p class="eyebrow">{{ t('AMBIENTES') }}</p><h2 id="workspaceManagerTitle">{{ t('Adicionar/editar ambiente') }}</h2></div>
          <button class="icon-button" type="button" :aria-label="t('Fechar gerenciamento de ambientes')" @click="workspaceDialogOpen = false"><X :size="19" /></button>
        </header>

        <nav class="settings-tabs workspace-manager-tabs" role="tablist" :aria-label="t('Ações de ambiente')">
          <button class="settings-tab" :class="{ active: workspaceDialogAction === 'create' }" type="button" role="tab" :aria-selected="workspaceDialogAction === 'create'" @click="openWorkspaceManager('create')"><Plus :size="14" /> {{ t('Criar') }}</button>
          <button class="settings-tab" :class="{ active: workspaceDialogAction === 'edit' }" type="button" role="tab" :aria-selected="workspaceDialogAction === 'edit'" @click="openWorkspaceManager('edit')"><Pencil :size="14" /> {{ t('Editar') }}</button>
          <button class="settings-tab" :class="{ active: workspaceDialogAction === 'import' }" type="button" role="tab" :aria-selected="workspaceDialogAction === 'import'" @click="openWorkspaceManager('import')"><ArrowDownToLine :size="14" /> {{ t('Importar') }}</button>
          <button class="settings-tab" :class="{ active: workspaceDialogAction === 'devices' }" type="button" role="tab" :aria-selected="workspaceDialogAction === 'devices'" @click="openWorkspaceManager('devices')"><Cpu :size="14" /> {{ t('Aparelhos') }}</button>
          <button class="settings-tab" :class="{ active: workspaceDialogAction === 'share' }" type="button" role="tab" :aria-selected="workspaceDialogAction === 'share'" @click="openWorkspaceManager('share')"><Share2 :size="14" /> {{ t('Compartilhar') }}</button>
          <button v-if="canManageActiveWorkspace" class="settings-tab" :class="{ active: workspaceDialogAction === 'members' }" type="button" role="tab" :aria-selected="workspaceDialogAction === 'members'" @click="openWorkspaceManager('members')"><UsersRound :size="14" /> {{ t('Membros') }}</button>
        </nav>

        <div v-if="workspaceDialogAction === 'create' || workspaceDialogAction === 'edit'" class="settings-pane workspace-manager-pane">
          <template v-if="workspaceDialogAction === 'create' || canManageActiveWorkspace">
            <label for="workspaceName">{{ t('Nome do ambiente') }}</label>
            <input id="workspaceName" v-model="workspaceName" class="settings-input" type="text" maxlength="80" :placeholder="t('Ex.: Laboratório Central')" />
            <div class="workspace-icon-editor">
              <span class="workspace-icon-preview"><img v-if="workspaceIconDataUrl" :src="workspaceIconDataUrl" alt="Prévia do ícone" /><span v-else>{{ workspaceName.slice(0, 1).toUpperCase() || '?' }}</span></span>
              <div class="workspace-icon-copy"><strong>{{ t('Ícone do ambiente') }}</strong><small>{{ t('Imagem JPG, PNG ou WebP, até 8 MB') }}</small></div>
              <label class="secondary-button workspace-icon-upload" for="workspaceIconFile"><ImagePlus :size="15" /> {{ t('Escolher imagem') }}</label>
              <input id="workspaceIconFile" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" @change="selectWorkspaceIcon" />
            </div>
            <p v-if="workspaceIconError" class="error-message" role="alert">{{ t(workspaceIconError) }}</p>
            <button class="primary-button settings-save-button" type="button" :disabled="workspaceSaving || !workspaceName.trim()" @click="workspaceDialogAction === 'create' ? createWorkspace() : updateWorkspace()">
              {{ workspaceSaving ? t('Salvando...') : workspaceDialogAction === 'create' ? t('Criar ambiente') : t('Salvar alterações') }}
            </button>
          </template>
          <p v-else class="form-subtitle">{{ t('Você pode ver e compartilhar este ambiente, mas apenas um owner ou admin pode editar seu nome e ícone.') }}</p>
        </div>

        <div v-if="workspaceDialogAction === 'edit' && activeWorkspace" class="workspace-remove-panel">
          <div>
            <strong>{{ activeWorkspace.role === 'owner' ? t('Excluir ambiente') : t('Remover da minha lista') }}</strong>
            <small>{{ activeWorkspace.role === 'owner' ? t('Isso excluirá o ambiente e o removerá para todos os membros.') : t('Isso remove sua participação, mas mantém o ambiente para os outros membros.') }}</small>
          </div>
          <button class="danger-button" type="button" :disabled="workspaceSaving" @click="removeActiveWorkspace">
            {{ workspaceSaving ? t('Salvando...') : activeWorkspace.role === 'owner' ? t('Excluir ambiente') : t('Remover da minha lista') }}
          </button>
        </div>

        <div v-else-if="workspaceDialogAction === 'import'" class="settings-pane workspace-manager-pane">
          <p class="form-subtitle">{{ t('Insira o código compartilhado para adicionar o ambiente à sua lista.') }}</p>
          <label for="importWorkspaceCode">{{ t('Código do ambiente') }}</label>
          <input id="importWorkspaceCode" v-model="importWorkspaceCode" class="settings-input workspace-code-input" type="text" maxlength="24" placeholder="LAB-ABC123" @keydown.enter.prevent="joinWorkspaceByCode" />
          <button class="primary-button settings-save-button" type="button" :disabled="!importWorkspaceCode.trim()" @click="joinWorkspaceByCode">{{ t('Importar ambiente') }}</button>
        </div>

        <div v-else-if="workspaceDialogAction === 'members'" class="settings-pane workspace-manager-pane">
          <p class="form-subtitle">{{ t('Membros com acesso ao ambiente ativo.') }} {{ t('Remover alguém daqui não exclui a conta.') }}</p>
          <div v-if="workspaceMembers.length" class="member-list workspace-invited-members">
            <div v-for="member in workspaceMembers" :key="member.id" class="member-row">
              <div><strong>{{ member.displayName || member.email }}</strong><small>{{ member.email }}</small></div>
              <span v-if="member.isPlatformAdmin" class="protected-member-role"><LockKeyhole :size="14" />{{ t('Administrador da plataforma') }}</span>
              <span v-else class="member-role-label">{{ workspaceRoleLabel(member.role) }}</span>
              <button v-if="member.role !== 'owner' && !member.isPlatformAdmin && member.email !== user?.email" class="text-button workspace-member-remove" type="button" @click="removeMember(member.id, member.displayName || member.email)">{{ t('Remover acesso') }}</button>
            </div>
          </div>
          <div v-else class="workspace-device-empty">{{ t('Este ambiente ainda não tem membros convidados.') }}</div>
        </div>

        <div v-else-if="workspaceDialogAction === 'devices'" class="settings-pane workspace-manager-pane">
          <h3 class="workspace-devices-title">{{ t('Aparelhos de monitoramento vinculados à sua conta') }}</h3>
          <p class="form-subtitle">{{ t('Escolha o ambiente de destino para adicionar ou mover seus aparelhos vinculados.') }}</p>
          <label for="workspaceDeviceTarget">{{ t('Selecionar ambiente de destino') }}</label>
          <select id="workspaceDeviceTarget" v-model="workspaceDeviceTargetId" class="settings-input select-input">
            <option v-for="workspace in workspaces" :key="workspace.id" :value="workspace.id">{{ workspace.name }}</option>
          </select>
          <p v-if="accountDevicesMessage" class="success-message" role="status">{{ accountDevicesMessage }}</p>
          <p v-if="accountDevicesError" class="error-message" role="alert">{{ accountDevicesError }}</p>
          <div v-if="accountDevicesLoading" class="workspace-device-empty">{{ t('Carregando aparelhos...') }}</div>
          <div v-else-if="accountLinkedDevices.length" class="workspace-device-list">
            <article v-for="device in accountLinkedDevices" :key="device.id" class="workspace-device-row">
              <div class="workspace-device-summary">
                <span class="workspace-device-icon"><Cpu :size="17" /></span>
                <div><strong>{{ device.name }}</strong><small>{{ device.externalId }}<template v-if="device.location"> · {{ device.location }}</template></small></div>
              </div>
              <div class="workspace-device-assignment"><span>{{ t('Ambiente atual') }}</span><strong>{{ device.workspaceName || t('Sem ambiente') }}</strong></div>
              <button class="secondary-button workspace-device-action" type="button" :disabled="!workspaceDeviceTargetId || !device.canAssign || device.workspaceId === workspaceDeviceTargetId" @click="assignAccountDevice(device)">
                {{ !device.canAssign ? t('Sem permissão para mover este aparelho.') : device.workspaceId === workspaceDeviceTargetId ? t('Este aparelho já está neste ambiente') : device.workspaceId ? t('Mover para este ambiente') : t('Adicionar a este ambiente') }}
              </button>
            </article>
          </div>
          <div v-else class="workspace-device-empty">{{ t('Nenhum aparelho de monitoramento vinculado à sua conta.') }}</div>
          <p class="workspace-device-note">{{ t('O aparelho será associado ao ambiente selecionado acima.') }}</p>
        </div>

        <div v-else class="settings-pane workspace-manager-pane">
          <template v-if="activeWorkspace">
            <div class="workspace-share-card">
              <span class="workspace-icon-preview"><img v-if="activeWorkspace.iconDataUrl" :src="activeWorkspace.iconDataUrl" alt="" /><span v-else>{{ activeWorkspace.name.slice(0, 1).toUpperCase() }}</span></span>
              <div><strong>{{ activeWorkspace.name }}</strong><small>{{ t('Código de acesso para compartilhar') }}</small></div>
            </div>
            <label for="workspaceShareCode">{{ t('Código do ambiente') }}</label>
            <div class="workspace-share-code-field"><input id="workspaceShareCode" class="settings-input workspace-code-input" type="text" :value="activeWorkspaceCode" readonly /><button class="secondary-button" type="button" :title="t('Copiar código do ambiente')" :aria-label="t('Copiar código do ambiente')" @click="shareWorkspaceCode"><Copy :size="16" /></button></div>
            <p v-if="workspaceShareMessage" class="success-message" role="status">{{ workspaceShareMessage }}</p>
            <p class="form-subtitle">{{ t('Envie este código para outro usuário importar o ambiente e acompanhar os mesmos aparelhos.') }}</p>
          </template>
          <p v-else class="form-subtitle">{{ t('Selecione ou crie um ambiente antes de compartilhar.') }}</p>
        </div>
      </section>
    </div>

    <div v-if="userDeletionTarget" class="settings-overlay" @click.self="cancelUserDeletion">
      <section class="settings-dialog user-deletion-dialog" role="alertdialog" aria-modal="true" aria-labelledby="userDeletionTitle">
        <header class="settings-header">
          <div><p class="eyebrow">{{ t('AÇÃO IRREVERSÍVEL') }}</p><h2 id="userDeletionTitle">{{ t('Excluir usuário permanentemente') }}</h2></div>
          <button class="icon-button" type="button" :disabled="userDeletionSaving" :aria-label="t('Fechar')" @click="cancelUserDeletion"><X :size="19" /></button>
        </header>
        <p class="form-subtitle">{{ userDeletionTarget.displayName }} ({{ userDeletionTarget.email }}). {{ t('A conta será removida permanentemente.') }}</p>
        <p class="form-subtitle">{{ t('Dispositivos vinculados e leituras serão apagados. Workspaces compartilhados serão preservados e transferidos a outro membro quando necessário.') }}</p>
        <label for="userDeletionConfirmation">{{ t('Digite o e-mail do usuário para confirmar') }}</label>
        <input id="userDeletionConfirmation" v-model="userDeletionConfirmation" class="settings-input" type="email" autocomplete="off" />
        <p v-if="userDeletionError" class="error-message" role="alert">{{ userDeletionError }}</p>
        <div class="user-deletion-actions">
          <button class="secondary-button" type="button" :disabled="userDeletionSaving" @click="cancelUserDeletion">{{ t('Cancelar') }}</button>
          <button class="danger-button" type="button" :disabled="userDeletionSaving || userDeletionConfirmation.trim().toLowerCase() !== userDeletionTarget.email.toLowerCase()" @click="deleteUserPermanently">{{ userDeletionSaving ? t('Excluindo...') : t('Excluir conta e dados') }}</button>
        </div>
      </section>
    </div>

    <div v-if="accountEditTarget" class="settings-overlay" @click.self="cancelAdminUserEdit">
      <section class="settings-dialog user-deletion-dialog" role="dialog" aria-modal="true" aria-labelledby="accountEditTitle">
        <header class="settings-header">
          <div><p class="eyebrow">{{ t('GERENCIAMENTO') }}</p><h2 id="accountEditTitle">{{ t('Editar usuário') }}</h2></div>
          <button class="icon-button" type="button" :disabled="accountEditSaving" :aria-label="t('Fechar')" @click="cancelAdminUserEdit"><X :size="19" /></button>
        </header>
        <label for="accountEditName">{{ t('Nome') }}</label>
        <input id="accountEditName" v-model="accountEditName" class="settings-input" type="text" maxlength="80" autocomplete="off" required />
        <label for="accountEditEmail">{{ t('E-mail') }}</label>
        <input id="accountEditEmail" v-model="accountEditEmail" class="settings-input" type="email" maxlength="254" autocomplete="off" required />
        <p class="form-subtitle">{{ t('A senha não pode ser alterada por aqui. Use a ação de redefinição para exigir uma nova senha.') }}</p>
        <p v-if="accountEditError" class="error-message" role="alert">{{ accountEditError }}</p>
        <div class="user-deletion-actions">
          <button class="secondary-button" type="button" :disabled="accountEditSaving" @click="cancelAdminUserEdit">{{ t('Cancelar') }}</button>
          <button class="primary-button" type="button" :disabled="accountEditSaving || !accountEditName.trim() || !accountEditEmail.trim()" @click="saveAdminUserEdit">{{ accountEditSaving ? t('Salvando...') : t('Salvar alterações') }}</button>
        </div>
      </section>
    </div>

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
          <button class="settings-tab" :class="{ active: settingsTab === 'sounds' }" type="button" role="tab" :aria-selected="settingsTab === 'sounds'" @click="settingsTab = 'sounds'">{{ t('Sons') }}</button>
        </nav>

        <div v-if="settingsTab === 'preferences'" class="settings-pane">
          <label class="theme-setting">
            <span class="theme-setting-icon"><Moon v-if="!darkMode" :size="18" /><Sun v-else :size="18" /></span>
            <span class="theme-setting-copy"><strong>{{ t('Modo escuro') }}</strong><small>{{ t('Aparencia salva neste navegador') }}</small></span>
            <input class="theme-switch" type="checkbox" :checked="darkMode" @change="toggleDarkMode" />
          </label>
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

        <form v-else-if="settingsTab === 'notifications'" class="settings-pane account-settings-form" @submit.prevent="updateNotificationPreferences">
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
          <div class="whatsapp-phone-fields">
            <label for="profileWhatsappCountry">{{ t('País e código do WhatsApp') }}
              <select id="profileWhatsappCountry" v-model="profileWhatsappCountry" class="settings-input" autocomplete="country" @change="reformatWhatsappNumberForCountry">
                <option v-for="country in whatsappCountries" :key="country.country" :value="country.country">{{ country.name }} ({{ country.dialCode }})</option>
              </select>
            </label>
            <label for="profileWhatsappNumber">{{ t('Número do WhatsApp') }}
              <input id="profileWhatsappNumber" class="settings-input" type="tel" maxlength="24" autocomplete="tel-national" :placeholder="profileWhatsappCountry === 'BR' ? '(00) 00000-0000' : ''" :value="profileWhatsappNumber" @input="formatWhatsappNumberInput" />
            </label>
          </div>
          <p class="settings-help">{{ t('Digite o número local com DDD.') }} {{ t('O WhatsApp requer uma conta conectada pelo administrador.') }}</p>
          <section v-if="activeWorkspace" class="workspace-notification-settings">
            <div class="settings-section-heading"><h3>{{ t('Escopo dos alertas') }}</h3><span>{{ activeWorkspace.name }}</span></div>
            <label class="theme-setting">
              <span class="theme-setting-icon"><Bell :size="18" /></span>
              <span class="theme-setting-copy"><strong>{{ t('Receber alertas de todos os aparelhos') }}</strong><small>{{ t('Usa os canais de e-mail e WhatsApp ativados acima.') }}</small></span>
              <input class="theme-switch" type="checkbox" :checked="workspaceAlertPreferences.notifyAllDevices" :disabled="workspaceAlertPreferencesSaving" @change="toggleWorkspaceAlertMode" />
            </label>
            <div v-if="!workspaceAlertPreferences.notifyAllDevices" class="notification-device-list">
              <div v-for="device in workspaceAlertPreferences.devices" :key="device.deviceId" class="notification-device-row">
                <strong>{{ device.name }}</strong>
                <label><span>{{ t('E-mail') }}</span><input class="theme-switch" type="checkbox" :checked="device.emailEnabled" :disabled="workspaceAlertPreferencesSaving" @change="toggleDeviceAlertChannel(device.deviceId, 'emailEnabled', $event)" /></label>
                <label><span>{{ t('WhatsApp') }}</span><input class="theme-switch" type="checkbox" :checked="device.whatsappEnabled" :disabled="workspaceAlertPreferencesSaving" @change="toggleDeviceAlertChannel(device.deviceId, 'whatsappEnabled', $event)" /></label>
              </div>
              <div v-if="!workspaceAlertPreferences.devices.length" class="workspace-device-empty">{{ t('Nenhum aparelho neste ambiente.') }}</div>
            </div>
            <p v-if="workspaceAlertPreferencesError" class="error-message" role="alert">{{ t(workspaceAlertPreferencesError) }}</p>
            <p v-if="workspaceAlertPreferencesMessage" class="success-message" role="status">{{ t(workspaceAlertPreferencesMessage) }}</p>
            <p v-if="workspaceAlertPreferencesSaving" class="settings-help">{{ t('Salvando...') }}</p>
          </section>
          <p v-else class="settings-help">{{ t('Crie ou importe um ambiente para configurar alertas dos aparelhos.') }}</p>
          <label for="notificationCurrentPassword">{{ t('Senha atual') }}</label>
          <input id="notificationCurrentPassword" v-model="notificationCurrentPassword" class="settings-input" type="password" autocomplete="current-password" required />
          <div v-if="notificationError" class="error-message" role="alert">{{ t(notificationError) }}</div>
          <div v-if="notificationMessage" class="success-message" role="status">{{ t(notificationMessage) }}</div>
          <button class="primary-button settings-save-button" type="submit" :disabled="accountSaving">{{ accountSaving ? t('Salvando...') : t('Salvar notificações') }}</button>
        </form>

        <div v-else class="settings-pane">
          <section class="alert-sound-settings" aria-labelledby="alertSoundTitle">
            <div class="settings-section-heading"><h3 id="alertSoundTitle">{{ t('Sons de alerta') }}</h3></div>
            <p class="settings-help">{{ t('Escolha um som diferente para cada mudança de estado. Os arquivos enviados ficam disponíveis para todas as contas.') }}</p>
            <div class="alert-sound-assignment-grid">
              <label class="alert-sound-assignment">
                <span>{{ t('Retorno ao normal') }}</span>
                <select v-model="alertSoundDraftPreferences.online" class="settings-input select-input"><option v-if="!alertSounds.length" value="default">alert.mp3</option><option v-for="audio in alertSounds" :key="audio.id" :value="audio.id">{{ audio.name }}</option></select>
                <button class="secondary-button" type="button" :aria-label="t(alertSoundPreviewStatus === 'online' ? 'Parar som' : 'Tocar som')" :title="t(alertSoundPreviewStatus === 'online' ? 'Parar som' : 'Tocar som')" :aria-pressed="alertSoundPreviewStatus === 'online'" @click="toggleAlertSoundPreview('online')"><Square v-if="alertSoundPreviewStatus === 'online'" :size="14" fill="currentColor" /><Play v-else :size="14" />{{ t(alertSoundPreviewStatus === 'online' ? 'Parar som' : 'Tocar som') }}</button>
              </label>
              <label class="alert-sound-assignment">
                <span>{{ t('Atenção') }}</span>
                <select v-model="alertSoundDraftPreferences.warning" class="settings-input select-input"><option v-if="!alertSounds.length" value="default">alert.mp3</option><option v-for="audio in alertSounds" :key="audio.id" :value="audio.id">{{ audio.name }}</option></select>
                <button class="secondary-button" type="button" :aria-label="t(alertSoundPreviewStatus === 'warning' ? 'Parar som' : 'Tocar som')" :title="t(alertSoundPreviewStatus === 'warning' ? 'Parar som' : 'Tocar som')" :aria-pressed="alertSoundPreviewStatus === 'warning'" @click="toggleAlertSoundPreview('warning')"><Square v-if="alertSoundPreviewStatus === 'warning'" :size="14" fill="currentColor" /><Play v-else :size="14" />{{ t(alertSoundPreviewStatus === 'warning' ? 'Parar som' : 'Tocar som') }}</button>
              </label>
              <label class="alert-sound-assignment">
                <span>{{ t('Offline') }}</span>
                <select v-model="alertSoundDraftPreferences.offline" class="settings-input select-input"><option v-if="!alertSounds.length" value="default">alert.mp3</option><option v-for="audio in alertSounds" :key="audio.id" :value="audio.id">{{ audio.name }}</option></select>
                <button class="secondary-button" type="button" :aria-label="t(alertSoundPreviewStatus === 'offline' ? 'Parar som' : 'Tocar som')" :title="t(alertSoundPreviewStatus === 'offline' ? 'Parar som' : 'Tocar som')" :aria-pressed="alertSoundPreviewStatus === 'offline'" @click="toggleAlertSoundPreview('offline')"><Square v-if="alertSoundPreviewStatus === 'offline'" :size="14" fill="currentColor" /><Play v-else :size="14" />{{ t(alertSoundPreviewStatus === 'offline' ? 'Parar som' : 'Tocar som') }}</button>
              </label>
            </div>
            <button class="primary-button" type="button" :disabled="alertSoundSaving" @click="saveAlertSoundPreferences">{{ alertSoundSaving ? t('Salvando...') : t('Salvar sons por alerta') }}</button>
            <section v-if="alertAudioUploadEnabled" class="alert-sound-upload" aria-labelledby="alertSoundLibraryTitle">
              <div class="settings-section-heading"><h3 id="alertSoundLibraryTitle">{{ t('Biblioteca compartilhada') }}</h3><span>{{ alertSounds.length }}</span></div>
              <p class="settings-help">{{ t('Adicione um áudio para disponibilizá-lo a todas as contas.') }}</p>
              <label class="whatsapp-config-field" for="alertSoundName"><span>{{ t('Nome do áudio') }}</span><input id="alertSoundName" v-model="alertAudioUploadName" class="settings-input" type="text" maxlength="80" /></label>
              <div class="alert-sound-actions">
                <label class="secondary-button avatar-upload-button" for="alertSoundFile">{{ alertAudioUploadName || t('Escolher áudio') }}</label>
                <input id="alertSoundFile" class="visually-hidden" type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/webm" @change="selectAlertSoundFile" />
                <button class="primary-button" type="button" :disabled="alertAudioUploading || !alertAudioUploadDataUrl || !alertAudioUploadName.trim()" @click="uploadAlertSound">{{ alertAudioUploading ? t('Salvando...') : t('Adicionar à biblioteca') }}</button>
              </div>
            </section>
            <p v-if="alertSoundError" class="error-message" role="alert">{{ t(alertSoundError) }}</p>
            <p v-if="alertSoundMessage" class="success-message" role="status">{{ t(alertSoundMessage) }}</p>
          </section>
        </div>
      </section>
    </div>
  </div>
</template>
