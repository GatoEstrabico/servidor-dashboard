import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import MessageTemplateEditor from './components/MessageTemplateEditor.vue';
import { Activity, AlertTriangle, ArrowDownToLine, Bell, Building2, Check, ChevronDown, EllipsisVertical, Bot, CircleAlert, CircleCheck, CircleMinus, Clock3, Copy, Cpu, Flame, ImagePlus, LayoutDashboard, LockKeyhole, List, LoaderCircle, LogOut, Mail, MapPin, MessageCircle, Moon, Pencil, Play, Plus, RefreshCw, Search, Trash2, Settings, Share2, ShieldCheck, Signal, Sun, Thermometer, UsersRound, Waves, X } from 'lucide-vue-next';
const user = ref(null);
const devices = ref([]);
const simulationValues = ref({});
const simulationSavingId = ref(null);
const simulationMessages = ref({});
const notifications = ref([]);
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
const loginMode = ref('login');
const workspaceName = ref('');
const workspaceIconDataUrl = ref(null);
const workspaceIconError = ref('');
const workspaceSaving = ref(false);
const editingDeviceAliasId = ref(null);
const deviceAliasDraft = ref('');
const deviceAliasSavingId = ref(null);
const importWorkspaceCode = ref('');
const workspaceShareMessage = ref('');
const workspaces = ref([]);
const accountLinkedDevices = ref([]);
const accountDevicesLoading = ref(false);
const accountDevicesError = ref('');
const accountDevicesMessage = ref('');
const workspaceDeviceTargetId = ref(null);
const activeWorkspaceId = ref(null);
const activeWorkspace = computed(() => workspaces.value.find((workspace) => workspace.id === activeWorkspaceId.value) ?? null);
const activeWorkspaceCode = computed(() => activeWorkspace.value?.accessCode ?? '');
const canManageActiveWorkspace = computed(() => ['owner', 'admin'].includes(activeWorkspace.value?.role ?? ''));
const workspaceMembers = ref([]);
const workspaceInvitations = ref([]);
const adminUsers = ref([]);
const adminUsersLoading = ref(false);
const adminUsersError = ref('');
const adminUsersMessage = ref('');
const adminUserActionId = ref(null);
const memberActionsOpenId = ref(null);
const editingMemberId = ref(null);
const editingMemberRole = ref('member');
const memberSavingId = ref(null);
const userDeletionTarget = ref(null);
const userDeletionConfirmation = ref('');
const userDeletionError = ref('');
const userDeletionSaving = ref(false);
const userDeletionMessage = ref('');
const accountEditTarget = ref(null);
const accountEditName = ref('');
const accountEditEmail = ref('');
const accountEditSaving = ref(false);
const accountEditError = ref('');
const registrationEnabled = ref(false);
const isWhatsAppDashboardAdmin = computed(() => Boolean(user.value?.isBootstrapAdmin));
const canManageUserAccounts = computed(() => Boolean(user.value?.isPlatformAdmin));
const managementTab = ref('overview');
const userManagementTab = ref('members');
const whatsappTab = ref('log');
const emailTab = ref('log');
const whatsappStatus = ref({ state: 'disconnected', qrDataUrl: null, phoneNumber: null });
const whatsappLogs = ref([]);
const whatsappSettings = ref({
    senderName: 'LAB/MONITOR',
    onlineMessage: '{{laboratorio}}: {{aparelho}} voltou ao normal. Localização: {{localizacao}}.',
    warningMessage: '{{laboratorio}}: {{aparelho}} está em atenção. Localização: {{localizacao}}.',
    offlineMessage: '{{laboratorio}}: {{aparelho}} está offline. Localização: {{localizacao}}.',
    onlineMediaType: 'sticker', warningMediaType: 'sticker', offlineMediaType: 'sticker',
    onlineMediaId: 'default-success', warningMediaId: 'default-alert', offlineMediaId: 'default-alert'
});
const whatsappSettingsSaving = ref(false);
const whatsappSettingsMessage = ref('');
const favoriteWhatsAppMedia = ref([]);
const favoriteWhatsAppMediaLoading = ref(false);
const favoriteWhatsAppMediaError = ref('');
const favoriteMediaName = ref('');
const favoriteMediaDataUrl = ref('');
const favoriteMediaSaving = ref(false);
const favoriteMediaDeletingId = ref(null);
const whatsappCloudSettings = ref({ connectionMode: 'cloud', phoneNumberId: '', apiVersion: 'v23.0', templateName: 'lab_monitor_alarm', templateLanguage: 'pt_BR', accessTokenConfigured: false });
const whatsappSavedConnectionMode = ref('cloud');
const whatsappCloudAccessToken = ref('');
const whatsappCloudClearAccessToken = ref(false);
const whatsappCloudSaving = ref(false);
const whatsappCloudMessage = ref('');
const whatsappCloudConnectivity = ref(null);
const whatsappCloudConnectivityError = ref('');
const whatsappCloudConnectivityTesting = ref(false);
const whatsappProfile = ref(null);
const whatsappProfileDraftName = ref('');
const whatsappProfileBaselineName = ref('');
const whatsappProfileDraftPhoto = ref(null);
const whatsappProfilePhotoError = ref('');
const whatsappProfileSaving = ref(false);
const whatsappProfileBaselineSaving = ref(false);
const whatsappProfileRestoringId = ref(null);
const whatsappProfileMessage = ref('');
const whatsappProfileError = ref('');
const whatsappPrivacySettings = ref({ lastSeen: 'contacts', online: 'match_last_seen', profilePhoto: 'contacts', status: 'contacts', readReceipts: 'all', groupsAdd: 'contacts' });
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
const emailSettings = ref({
    smtpHost: '', smtpPort: 587, smtpSecure: false, smtpUser: '', senderName: 'LAB/MONITOR', senderEmail: '',
    onlineMessage: '{{laboratorio}}: {{aparelho}} voltou ao normal. Localização: {{localizacao}}.',
    warningMessage: '{{laboratorio}}: {{aparelho}} está em atenção. Localização: {{localizacao}}.',
    offlineMessage: '{{laboratorio}}: {{aparelho}} está offline. Localização: {{localizacao}}.', passwordConfigured: false
});
const emailNotificationDraft = ref({
    onlineMessage: emailSettings.value.onlineMessage,
    warningMessage: emailSettings.value.warningMessage,
    offlineMessage: emailSettings.value.offlineMessage
});
const emailSmtpDraft = ref({
    smtpHost: '', smtpPort: 587, smtpSecure: false, smtpUser: '', senderName: 'LAB/MONITOR', senderEmail: '', passwordConfigured: false
});
const emailPassword = ref('');
const emailClearPassword = ref(false);
const emailLogs = ref([]);
const emailSettingsSaving = ref(false);
const emailWorking = ref(false);
const emailConnectionState = ref('idle');
const emailMessage = ref('');
const emailError = ref('');
let emailRefreshTimer;
const emailNotificationPreviews = computed(() => [
    { id: 'online', label: t('Mensagem de e-mail ao normalizar'), template: emailNotificationDraft.value.onlineMessage, status: 'normalizado' },
    { id: 'warning', label: t('Mensagem de e-mail em atenção'), template: emailNotificationDraft.value.warningMessage, status: 'em atenção' },
    { id: 'offline', label: t('Mensagem de e-mail offline'), template: emailNotificationDraft.value.offlineMessage, status: 'offline' }
].map((preview) => ({ ...preview, html: formatMessagePreview(interpolateNotificationTemplate(preview.template, emailSmtpDraft.value.senderName, preview.status)) })));
const whatsappWorking = ref(false);
const whatsappError = ref('');
let whatsappRefreshTimer;
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
const workspaceMenuOpen = ref(false);
const mobileWorkspaceSelectorOpen = ref(false);
const workspaceDialogOpen = ref(false);
const workspaceDialogAction = ref('create');
const language = ref('pt-BR');
const whatsappCountries = computed(() => {
    const displayNames = new Intl.DisplayNames([language.value === 'en' ? 'en' : 'pt-BR'], { type: 'region' });
    return getCountries().map((country) => ({
        country,
        name: displayNames.of(country) ?? country,
        dialCode: `+${getCountryCallingCode(country)}`
    })).sort((left, right) => left.name.localeCompare(right.name, language.value));
});
const darkMode = ref(false);
const alertSounds = ref([]);
const alertSoundPreferences = ref({ online: 'default', warning: 'default', offline: 'default' });
const alertSoundDraftPreferences = ref({ ...alertSoundPreferences.value });
const alertAudioUploadDataUrl = ref('');
const alertAudioUploadName = ref('');
const alertAudioUploadEnabled = ref(false);
const alertSoundSaving = ref(false);
const alertAudioUploading = ref(false);
const alertSoundError = ref('');
const alertSoundMessage = ref('');
const alertSoundPreviewStatus = ref(null);
let alertSoundPreviewAudio = null;
let alertSoundPlaybackQueue = Promise.resolve();
const currentPassword = ref('');
const newPassword = ref('');
const newPasswordConfirm = ref('');
const accountMessage = ref('');
const accountError = ref('');
const accountSaving = ref(false);
const profileName = ref('');
const profileEmail = ref('');
const profileAvatar = ref(null);
const profileWhatsappCountry = ref('BR');
const profileWhatsappNumber = ref('');
const profileEmailNotifications = ref(true);
const profileWhatsappNotifications = ref(false);
const notificationCurrentPassword = ref('');
const notificationMessage = ref('');
const notificationError = ref('');
const workspaceAlertPreferences = ref({ notifyAllDevices: true, devices: [] });
const workspaceAlertPreferencesSaving = ref(false);
const workspaceAlertPreferencesMessage = ref('');
const workspaceAlertPreferencesError = ref('');
const avatarError = ref('');
const refreshedAt = ref(new Date());
const activeMobileTab = ref('home');
const expandedDeviceIds = ref([]);
let refreshTimer;
let deviceEvents = null;
let deviceRefreshInProgress = false;
let deviceRefreshRequested = false;
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
function t(text) {
    return language.value === 'en' ? englishText[text] ?? text : text;
}
function interpolateNotificationTemplate(template, senderName, status) {
    const values = {
        laboratorio: senderName || 'LAB/MONITOR',
        aparelho: 'Sensor de demonstração',
        status,
        localizacao: 'Laboratório Central',
        identificador: 'sensor-01'
    };
    return template.replace(/\{\{([^{}]+)\}\}/g, (_placeholder, key) => values[key] ?? '');
}
function formatMessagePreview(message) {
    const replacements = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    const codeSegments = [];
    let formatted = message.replace(/[&<>"']/g, (character) => replacements[character] ?? character);
    formatted = formatted.replace(/```([\s\S]*?)```|`([^`\n]+)`/g, (_match, block, inline) => {
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
    return formatted.replace(/MESSAGEPREVIEWCODE(\d+)TOKEN/g, (_token, index) => codeSegments[Number(index)] ?? '');
}
function workspaceRoleLabel(role) {
    const labels = { owner: 'Proprietário', admin: 'Administrador', member: 'Membro' };
    return t(labels[role] ?? role);
}
const dateLocale = computed(() => language.value === 'en' ? 'en-GB' : 'pt-BR');
const reportDate = computed(() => new Intl.DateTimeFormat(dateLocale.value, {
    weekday: 'long', day: 'numeric', month: 'long'
}).format(new Date()));
function deviceDisplayName(device) {
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
    if (!user.value || !activeWorkspaceId.value) {
        if (!activeWorkspaceId.value)
            devices.value = [];
        return;
    }
    if (deviceRefreshInProgress) {
        deviceRefreshRequested = true;
        return;
    }
    deviceRefreshInProgress = true;
    try {
        const result = await api('/api/devices');
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
    }
    catch (error) {
        pageError.value = error instanceof Error ? error.message : 'Falha ao atualizar aparelhos.';
    }
    finally {
        deviceRefreshInProgress = false;
        if (deviceRefreshRequested) {
            deviceRefreshRequested = false;
            queueMicrotask(() => void loadDevices());
        }
    }
}
async function loadNotifications(playSoundsForNew = false) {
    if (!user.value || !activeWorkspaceId.value) {
        notifications.value = [];
        return;
    }
    const existingIds = new Set(notifications.value.map((notification) => notification.id));
    try {
        const result = await api('/api/notifications');
        notifications.value = result.notifications;
        if (playSoundsForNew) {
            for (const status of new Set(result.notifications.filter((notification) => !existingIds.has(notification.id)).map((notification) => notification.status))) {
                playAlertSound(alertSoundPreferences.value[status]);
            }
        }
    }
    catch {
        return;
    }
}
function connectDeviceEvents(workspaceId) {
    deviceEvents?.close();
    deviceEvents = null;
    if (!user.value || !workspaceId)
        return;
    const events = new EventSource('/api/events/devices');
    events.addEventListener('devices-updated', () => {
        void loadDevices();
        void loadNotifications(true);
    });
    deviceEvents = events;
}
function toggleNotificationPanel() {
    notificationOpen.value = !notificationOpen.value;
    if (notificationOpen.value)
        void markAllNotificationsRead();
}
async function markAllNotificationsRead() {
    if (!unreadNotificationCount.value)
        return;
    notifications.value = notifications.value.map((notification) => ({ ...notification, read: true }));
    try {
        await api('/api/notifications/read-all', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken.value } });
    }
    catch (error) {
        pageError.value = error instanceof Error ? error.message : 'Não foi possível marcar as notificações como lidas.';
        void loadNotifications();
    }
}
async function deleteAllNotifications() {
    if (!notifications.value.length || !window.confirm(t('Apagar todas as notificações deste ambiente?')))
        return;
    try {
        await api('/api/notifications', { method: 'DELETE', headers: { 'X-CSRF-Token': csrfToken.value } });
        notifications.value = [];
    }
    catch {
        pageError.value = t('Não foi possível apagar as notificações.');
    }
}
function openDeviceNotification(notification) {
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
async function loadWorkspaces() {
    if (!user.value) {
        workspaces.value = [];
        activeWorkspaceId.value = null;
        workspaceMembers.value = [];
        workspaceInvitations.value = [];
        return;
    }
    try {
        const result = await api('/api/workspaces');
        workspaces.value = result.workspaces;
        activeWorkspaceId.value = result.activeWorkspaceId;
        user.value = { ...user.value, activeWorkspaceId: result.activeWorkspaceId, workspaces: result.workspaces, isPlatformAdmin: result.isPlatformAdmin, isBootstrapAdmin: result.isBootstrapAdmin };
        if (result.activeWorkspaceId) {
            await loadWorkspaceMembers();
        }
        else {
            workspaceMembers.value = [];
            workspaceInvitations.value = [];
            if (result.workspaces.length)
                workspaceMenuOpen.value = true;
            else if (result.showWorkspaceSetupWhenEmpty)
                openWorkspaceManager('create');
        }
    }
    catch (error) {
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
            api('/api/workspaces/' + activeWorkspaceId.value + '/members'),
            api('/api/workspaces/' + activeWorkspaceId.value + '/invitations')
        ]);
        workspaceMembers.value = membersResult.members;
        workspaceInvitations.value = invitationsResult.invitations;
    }
    catch {
        workspaceMembers.value = [];
        workspaceInvitations.value = [];
    }
}
async function loadAdminUsers() {
    if (!canManageUserAccounts.value)
        return;
    adminUsersLoading.value = true;
    adminUsersError.value = '';
    try {
        const result = await api('/api/admin/users');
        adminUsers.value = result.users;
    }
    catch (error) {
        adminUsersError.value = error instanceof Error ? t(error.message) : t('Não foi possível carregar as contas cadastradas.');
    }
    finally {
        adminUsersLoading.value = false;
    }
}
function openUserManagement() {
    managementTab.value = 'users';
    userManagementTab.value = canManageUserAccounts.value ? 'accounts' : 'members';
    if (canManageUserAccounts.value)
        void loadAdminUsers();
}
async function loadAccountDevices() {
    accountDevicesLoading.value = true;
    accountDevicesError.value = '';
    try {
        const result = await api('/api/account/devices');
        accountLinkedDevices.value = result.devices;
    }
    catch (error) {
        accountDevicesError.value = error instanceof Error ? t(error.message) : t('Falha ao carregar aparelhos vinculados.');
    }
    finally {
        accountDevicesLoading.value = false;
    }
}
async function assignAccountDevice(device) {
    const targetWorkspaceId = workspaceDeviceTargetId.value;
    if (!targetWorkspaceId || device.workspaceId === targetWorkspaceId)
        return;
    if (device.workspaceId && !window.confirm(t('Mover este aparelho? Ele deixará de aparecer no ambiente atual.')))
        return;
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
    }
    catch (error) {
        accountDevicesError.value = error instanceof Error ? t(error.message) : t('Não foi possível adicionar o aparelho ao ambiente.');
    }
}
async function createWorkspace() {
    if (!workspaceName.value.trim())
        return;
    workspaceSaving.value = true;
    try {
        const result = await api('/api/workspaces', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ name: workspaceName.value.trim(), iconDataUrl: workspaceIconDataUrl.value })
        });
        activeWorkspaceId.value = result.activeWorkspaceId;
        workspaceName.value = '';
        workspaceIconDataUrl.value = null;
        workspaceDialogOpen.value = false;
        await loadWorkspaces();
    }
    catch (error) {
        pageError.value = error instanceof Error ? error.message : 'Nao foi possivel criar o ambiente.';
    }
    finally {
        workspaceSaving.value = false;
    }
}
function openWorkspaceManager(action = 'create') {
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
    if (action === 'members')
        void loadWorkspaceMembers();
    workspaceDialogOpen.value = true;
}
async function updateWorkspace() {
    if (!activeWorkspaceId.value || !workspaceName.value.trim() || !canManageActiveWorkspace.value)
        return;
    workspaceSaving.value = true;
    try {
        await api('/api/workspaces/' + activeWorkspaceId.value, {
            method: 'PATCH',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ name: workspaceName.value.trim(), iconDataUrl: workspaceIconDataUrl.value })
        });
        await loadWorkspaces();
        workspaceDialogOpen.value = false;
    }
    catch (error) {
        pageError.value = error instanceof Error ? error.message : 'Nao foi possivel atualizar o ambiente.';
    }
    finally {
        workspaceSaving.value = false;
    }
}
async function removeActiveWorkspace() {
    const workspace = activeWorkspace.value;
    if (!workspace || !activeWorkspaceId.value)
        return;
    const isOwner = workspace.role === 'owner';
    const confirmation = isOwner
        ? t('Excluir este ambiente para todos? Esta ação não pode ser desfeita.')
        : t('Remover este ambiente apenas da sua lista? Você poderá entrar novamente pelo código compartilhado.');
    if (!window.confirm(confirmation))
        return;
    workspaceSaving.value = true;
    pageError.value = '';
    try {
        await api('/api/workspaces/' + activeWorkspaceId.value, {
            method: 'DELETE',
            headers: { 'X-CSRF-Token': csrfToken.value }
        });
        workspaceDialogOpen.value = false;
        managementTab.value = 'overview';
        await loadWorkspaces();
        if (activeWorkspaceId.value) {
            await loadDevices();
        }
        else {
            devices.value = [];
            notifications.value = [];
        }
    }
    catch (error) {
        pageError.value = error instanceof Error ? t(error.message) : t('Nao foi possivel remover o ambiente.');
    }
    finally {
        workspaceSaving.value = false;
    }
}
async function selectWorkspaceIcon(event) {
    const input = event.target;
    const file = input.files?.[0];
    workspaceIconError.value = '';
    if (!file)
        return;
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
        if (!context)
            throw new Error('Canvas indisponível.');
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        workspaceIconDataUrl.value = canvas.toDataURL('image/webp', 0.78);
    }
    catch {
        workspaceIconError.value = 'Não foi possível processar essa imagem.';
    }
    finally {
        input.value = '';
    }
}
async function joinWorkspaceByCode() {
    const code = importWorkspaceCode.value.trim();
    if (!code)
        return;
    workspaceShareMessage.value = '';
    try {
        const result = await api('/api/workspaces/join', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ code })
        });
        importWorkspaceCode.value = '';
        activeWorkspaceId.value = result.activeWorkspaceId;
        workspaceMenuOpen.value = false;
        await loadWorkspaces();
        workspaceDialogOpen.value = false;
    }
    catch (error) {
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
        }
        else {
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
    }
    catch {
        workspaceShareMessage.value = t('Não foi possível copiar automaticamente. Copie manualmente: ') + code;
    }
}
async function toggleRegistrationSetting() {
    if (!isWhatsAppDashboardAdmin.value)
        return;
    try {
        const result = await api('/api/admin/registration-settings', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ enabled: !registrationEnabled.value })
        });
        registrationEnabled.value = result.enabled;
    }
    catch (error) {
        pageError.value = error instanceof Error ? error.message : 'Nao foi possivel alterar a abertura de cadastro.';
    }
}
async function loadWhatsAppStatus() {
    if (!isWhatsAppDashboardAdmin.value)
        return;
    try {
        whatsappStatus.value = await api('/api/admin/whatsapp');
        whatsappError.value = '';
    }
    catch (error) {
        whatsappError.value = error instanceof Error ? error.message : 'Falha ao consultar o estado do WhatsApp.';
    }
}
async function loadWhatsAppLogs() {
    if (!isWhatsAppDashboardAdmin.value)
        return;
    try {
        const result = await api('/api/admin/whatsapp/logs');
        whatsappLogs.value = result.logs;
        whatsappError.value = '';
    }
    catch (error) {
        whatsappError.value = error instanceof Error ? error.message : 'Falha ao carregar o log do WhatsApp.';
    }
}
async function loadWhatsAppSettings() {
    if (!isWhatsAppDashboardAdmin.value)
        return;
    try {
        const result = await api('/api/admin/whatsapp/settings');
        whatsappSettings.value = result.settings;
        whatsappSettingsMessage.value = '';
        whatsappError.value = '';
    }
    catch (error) {
        whatsappError.value = error instanceof Error ? error.message : 'Falha ao carregar as configurações do WhatsApp.';
    }
}
async function loadFavoriteWhatsAppMedia() {
    if (!isWhatsAppDashboardAdmin.value)
        return;
    favoriteWhatsAppMediaLoading.value = true;
    favoriteWhatsAppMediaError.value = '';
    try {
        const result = await api('/api/admin/whatsapp/media');
        favoriteWhatsAppMedia.value = result.media;
    }
    catch (error) {
        favoriteWhatsAppMediaError.value = error instanceof Error ? error.message : 'Não foi possível carregar a biblioteca de mídia.';
    }
    finally {
        favoriteWhatsAppMediaLoading.value = false;
    }
}
async function refreshWhatsAppNotifications() {
    await Promise.all([loadWhatsAppSettings(), loadFavoriteWhatsAppMedia(), loadWhatsAppCloudSettings()]);
}
async function selectFavoriteWhatsAppMedia(event) {
    const input = event.target;
    const file = input.files?.[0];
    favoriteWhatsAppMediaError.value = '';
    if (!file)
        return;
    if (!['image/gif', 'image/webp', 'image/png', 'image/jpeg'].includes(file.type) || file.size > 1024 * 1024) {
        favoriteWhatsAppMediaError.value = 'Escolha GIF, WebP, PNG ou JPEG de até 1 MB.';
        input.value = '';
        return;
    }
    try {
        favoriteMediaDataUrl.value = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Não foi possível ler o arquivo de mídia.'));
            reader.onerror = () => reject(new Error('Não foi possível ler o arquivo de mídia.'));
            reader.readAsDataURL(file);
        });
        if (favoriteMediaDataUrl.value.length > 1400000)
            throw new Error('A mídia excede o limite de upload.');
        favoriteMediaName.value = file.name.replace(/\.[^.]+$/, '').slice(0, 48);
    }
    catch (error) {
        favoriteWhatsAppMediaError.value = error instanceof Error ? error.message : 'Não foi possível ler o arquivo de mídia.';
    }
    finally {
        input.value = '';
    }
}
async function addFavoriteWhatsAppMedia() {
    if (!favoriteMediaName.value.trim() || !favoriteMediaDataUrl.value)
        return;
    favoriteMediaSaving.value = true;
    favoriteWhatsAppMediaError.value = '';
    try {
        const result = await api('/api/admin/whatsapp/media', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ name: favoriteMediaName.value, mediaDataUrl: favoriteMediaDataUrl.value })
        });
        favoriteWhatsAppMedia.value = result.media;
        favoriteMediaName.value = '';
        favoriteMediaDataUrl.value = '';
        whatsappSettingsMessage.value = 'Mídia adicionada aos favoritos.';
    }
    catch (error) {
        favoriteWhatsAppMediaError.value = error instanceof Error ? error.message : 'Não foi possível salvar a mídia favorita.';
    }
    finally {
        favoriteMediaSaving.value = false;
    }
}
async function removeFavoriteWhatsAppMedia(media) {
    if (favoriteMediaDeletingId.value)
        return;
    if (!window.confirm(`${t('Excluir a mídia')} "${media.name}"? ${t('Esta ação não pode ser desfeita.')}`))
        return;
    favoriteMediaDeletingId.value = media.id;
    favoriteWhatsAppMediaError.value = '';
    try {
        const result = await api(`/api/admin/whatsapp/media/${encodeURIComponent(media.id)}`, { method: 'DELETE', headers: { 'X-CSRF-Token': csrfToken.value } });
        favoriteWhatsAppMedia.value = result.media;
        whatsappSettings.value = result.settings;
        whatsappSettingsMessage.value = 'Mídia excluída da biblioteca.';
    }
    catch (error) {
        favoriteWhatsAppMediaError.value = error instanceof Error ? error.message : 'Não foi possível excluir a mídia.';
    }
    finally {
        favoriteMediaDeletingId.value = null;
    }
}
function setWhatsAppAlertMediaType(alert, event) {
    const mediaType = event.target.value;
    const firstMediaId = favoriteWhatsAppMedia.value[0]?.id ?? null;
    const settings = whatsappSettings.value;
    if (alert === 'online') {
        settings.onlineMediaType = mediaType;
        settings.onlineMediaId = mediaType === 'none' ? null : settings.onlineMediaId ?? firstMediaId;
    }
    else if (alert === 'warning') {
        settings.warningMediaType = mediaType;
        settings.warningMediaId = mediaType === 'none' ? null : settings.warningMediaId ?? firstMediaId;
    }
    else {
        settings.offlineMediaType = mediaType;
        settings.offlineMediaId = mediaType === 'none' ? null : settings.offlineMediaId ?? firstMediaId;
    }
}
function canSaveWhatsAppNotificationSettings() {
    return ['online', 'warning', 'offline'].every((alert) => whatsappSettings.value[`${alert}MediaType`] === 'none' || Boolean(whatsappSettings.value[`${alert}MediaId`]));
}
async function loadWhatsAppProfile() {
    if (!isWhatsAppDashboardAdmin.value)
        return;
    whatsappProfileError.value = '';
    try {
        const result = await api('/api/admin/whatsapp/profile');
        whatsappProfile.value = result.profile;
        whatsappProfileDraftName.value = result.profile.name;
        whatsappProfileDraftPhoto.value = result.profile.photoDataUrl;
        whatsappProfilePhotoError.value = '';
        whatsappProfileMessage.value = '';
        await loadWhatsAppPrivacySettings();
    }
    catch (error) {
        whatsappProfileError.value = error instanceof Error ? error.message : 'Não foi possível carregar o perfil da conta WhatsApp.';
    }
}
async function initializeWhatsAppProfileBaseline() {
    if (!whatsappProfileBaselineName.value.trim() || whatsappProfileBaselineSaving.value)
        return;
    whatsappProfileBaselineSaving.value = true;
    whatsappProfileError.value = '';
    whatsappProfileMessage.value = '';
    try {
        const result = await api('/api/admin/whatsapp/profile/initialize', {
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
    }
    catch (error) {
        whatsappProfileError.value = error instanceof Error ? error.message : 'Não foi possível salvar o perfil original.';
    }
    finally {
        whatsappProfileBaselineSaving.value = false;
    }
}
async function loadWhatsAppPrivacySettings() {
    try {
        const result = await api('/api/admin/whatsapp/profile/privacy');
        whatsappPrivacySettings.value = result.settings;
        whatsappPrivacyError.value = '';
        whatsappPrivacyMessage.value = '';
    }
    catch (error) {
        whatsappPrivacyError.value = error instanceof Error ? error.message : 'Não foi possível carregar as opções de privacidade.';
    }
}
async function saveWhatsAppPrivacySettings() {
    whatsappPrivacySaving.value = true;
    whatsappPrivacyError.value = '';
    whatsappPrivacyMessage.value = '';
    try {
        const result = await api('/api/admin/whatsapp/profile/privacy', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify(whatsappPrivacySettings.value)
        });
        whatsappPrivacySettings.value = result.settings;
        whatsappPrivacyMessage.value = 'Privacidade do WhatsApp atualizada.';
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível salvar as opções de privacidade.';
        await loadWhatsAppPrivacySettings();
        whatsappPrivacyError.value = message;
    }
    finally {
        whatsappPrivacySaving.value = false;
    }
}
async function saveWhatsAppProfile() {
    whatsappProfileSaving.value = true;
    whatsappProfileError.value = '';
    whatsappProfileMessage.value = '';
    try {
        const result = await api('/api/admin/whatsapp/profile', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ name: whatsappProfileDraftName.value, photoDataUrl: whatsappProfileDraftPhoto.value })
        });
        whatsappProfile.value = result.profile;
        whatsappProfileDraftName.value = result.profile.name;
        whatsappProfileDraftPhoto.value = result.profile.photoDataUrl;
        whatsappProfileMessage.value = 'Perfil WhatsApp atualizado e guardado no histórico.';
    }
    catch (error) {
        whatsappProfileError.value = error instanceof Error ? error.message : 'Não foi possível atualizar o perfil WhatsApp.';
    }
    finally {
        whatsappProfileSaving.value = false;
    }
}
async function restoreWhatsAppProfileSnapshot(snapshot) {
    if (whatsappProfileRestoringId.value)
        return;
    whatsappProfileRestoringId.value = snapshot.id;
    whatsappProfileError.value = '';
    whatsappProfileMessage.value = '';
    try {
        const result = await api('/api/admin/whatsapp/profile/restore', {
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
    }
    catch (error) {
        whatsappProfileError.value = error instanceof Error ? error.message : 'Não foi possível restaurar essa versão do perfil.';
    }
    finally {
        whatsappProfileRestoringId.value = null;
    }
}
async function selectWhatsAppProfilePhoto(event) {
    const input = event.target;
    const file = input.files?.[0];
    whatsappProfilePhotoError.value = '';
    if (!file)
        return;
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
        if (!context)
            throw new Error('Canvas indisponível.');
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        whatsappProfileDraftPhoto.value = canvas.toDataURL('image/webp', 0.72);
    }
    catch {
        whatsappProfilePhotoError.value = 'Não foi possível processar essa imagem.';
    }
    finally {
        input.value = '';
    }
}
async function saveWhatsAppSettings() {
    whatsappSettingsSaving.value = true;
    whatsappSettingsMessage.value = '';
    whatsappError.value = '';
    try {
        const result = await api('/api/admin/whatsapp/settings', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify(whatsappSettings.value)
        });
        whatsappSettings.value = result.settings;
        whatsappSettingsMessage.value = 'Modelos de notificação salvos.';
    }
    catch (error) {
        whatsappError.value = error instanceof Error ? error.message : 'Não foi possível salvar as configurações do WhatsApp.';
    }
    finally {
        whatsappSettingsSaving.value = false;
    }
}
async function loadWhatsAppCloudSettings() {
    if (!isWhatsAppDashboardAdmin.value)
        return;
    try {
        const result = await api('/api/admin/whatsapp/cloud-settings');
        whatsappCloudSettings.value = result.settings;
        whatsappSavedConnectionMode.value = result.settings.connectionMode;
        whatsappCloudAccessToken.value = '';
        whatsappCloudClearAccessToken.value = false;
        whatsappCloudMessage.value = '';
        whatsappCloudConnectivity.value = null;
        whatsappCloudConnectivityError.value = '';
        whatsappError.value = '';
    }
    catch (error) {
        whatsappError.value = error instanceof Error ? error.message : 'Falha ao carregar a configuração da Cloud API.';
    }
}
async function saveWhatsAppCloudSettings() {
    whatsappCloudSaving.value = true;
    whatsappCloudMessage.value = '';
    whatsappError.value = '';
    try {
        const { accessTokenConfigured: _accessTokenConfigured, ...settings } = whatsappCloudSettings.value;
        const result = await api('/api/admin/whatsapp/cloud-settings', {
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
    }
    catch (error) {
        whatsappError.value = error instanceof Error ? error.message : 'Não foi possível salvar a configuração da Cloud API.';
    }
    finally {
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
        whatsappCloudConnectivity.value = await api('/api/admin/whatsapp/test-connection', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value }
        });
    }
    catch (error) {
        whatsappCloudConnectivityError.value = error instanceof Error ? error.message : 'Não foi possível testar a conexão com a Cloud API.';
    }
    finally {
        whatsappCloudConnectivityTesting.value = false;
    }
}
async function clearWhatsAppLogs() {
    if (!isWhatsAppDashboardAdmin.value || !whatsappLogs.value.length)
        return;
    if (!window.confirm(t('Tem certeza que deseja apagar todo o log do WhatsApp?')))
        return;
    whatsappWorking.value = true;
    whatsappError.value = '';
    try {
        await api('/api/admin/whatsapp/logs/clear', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value }
        });
        whatsappLogs.value = [];
    }
    catch (error) {
        whatsappError.value = error instanceof Error ? error.message : 'Não foi possível apagar o log do WhatsApp.';
    }
    finally {
        whatsappWorking.value = false;
    }
}
async function connectWhatsApp() {
    whatsappWorking.value = true;
    whatsappError.value = '';
    try {
        whatsappStatus.value = await api('/api/admin/whatsapp/connect', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value }
        });
    }
    catch (error) {
        whatsappError.value = error instanceof Error ? error.message : 'Não foi possível iniciar a conexão.';
    }
    finally {
        whatsappWorking.value = false;
    }
}
async function disconnectWhatsApp() {
    whatsappWorking.value = true;
    whatsappError.value = '';
    try {
        whatsappStatus.value = await api('/api/admin/whatsapp/disconnect', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value }
        });
    }
    catch (error) {
        whatsappError.value = error instanceof Error ? error.message : 'Não foi possível desconectar o WhatsApp.';
    }
    finally {
        whatsappWorking.value = false;
    }
}
async function applyDeviceSimulation(device) {
    const values = simulationValues.value[device.id];
    if (!device.canSimulate || !values)
        return;
    simulationSavingId.value = device.id;
    simulationMessages.value = { ...simulationMessages.value, [device.id]: '' };
    try {
        await api(`/api/devices/${device.id}/simulation`, {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify(values)
        });
        simulationMessages.value = { ...simulationMessages.value, [device.id]: 'Simulação aplicada. Alertas são disparados quando o estado muda.' };
        await loadDevices();
    }
    catch (error) {
        simulationMessages.value = {
            ...simulationMessages.value,
            [device.id]: error instanceof Error ? error.message : 'Não foi possível aplicar a simulação.'
        };
    }
    finally {
        simulationSavingId.value = null;
    }
}
async function loadEmailSettings() {
    if (!isWhatsAppDashboardAdmin.value)
        return;
    try {
        const result = await api('/api/admin/email/settings');
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
    }
    catch (error) {
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
        const result = await api('/api/admin/email/settings', {
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
    }
    catch (error) {
        emailError.value = error instanceof Error ? error.message : 'Não foi possível salvar a configuração de e-mail.';
    }
    finally {
        emailSettingsSaving.value = false;
    }
}
async function saveEmailNotificationDraft() {
    emailSettingsSaving.value = true;
    emailMessage.value = '';
    emailError.value = '';
    try {
        const { passwordConfigured: _passwordConfigured, ...savedSettings } = emailSettings.value;
        const result = await api('/api/admin/email/settings', {
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
    }
    catch (error) {
        emailError.value = error instanceof Error ? error.message : 'Não foi possível salvar os modelos de notificação.';
    }
    finally {
        emailSettingsSaving.value = false;
    }
}
async function loadEmailLogs() {
    if (!isWhatsAppDashboardAdmin.value)
        return;
    try {
        const result = await api('/api/admin/email/logs');
        emailLogs.value = result.logs;
        emailError.value = '';
    }
    catch (error) {
        emailError.value = error instanceof Error ? error.message : 'Falha ao carregar o log de e-mail.';
    }
}
async function clearEmailLogs() {
    if (!emailLogs.value.length || !window.confirm(t('Tem certeza que deseja apagar todo o log de e-mail?')))
        return;
    emailWorking.value = true;
    try {
        await api('/api/admin/email/logs/clear', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken.value } });
        emailLogs.value = [];
    }
    catch (error) {
        emailError.value = error instanceof Error ? error.message : 'Não foi possível apagar o log de e-mail.';
    }
    finally {
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
    }
    catch (error) {
        emailConnectionState.value = 'error';
        emailError.value = error instanceof Error ? error.message : 'Falha na conexão SMTP.';
    }
    finally {
        emailWorking.value = false;
    }
}
async function changeWorkspace(workspaceId) {
    try {
        await api('/api/workspaces/active', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ workspaceId })
        });
        activeWorkspaceId.value = workspaceId;
        if (user.value)
            user.value.activeWorkspaceId = workspaceId;
        managementTab.value = 'overview';
        activeMobileTab.value = 'home';
        await loadDevices();
        await loadWorkspaceMembers();
        await nextTick();
        document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    catch (error) {
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
        const result = await api('/api/auth/register', {
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
    }
    catch (error) {
        registerError.value = error instanceof Error ? error.message : 'Nao foi possivel criar a conta.';
    }
    finally {
        submitting.value = false;
    }
}
async function activateAccount(token) {
    try {
        const result = await api('/api/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
        activationMessage.value = result.message;
        email.value = result.user.email;
    }
    catch (error) {
        activationError.value = error instanceof Error ? error.message : 'Link de ativação inválido ou expirado.';
    }
    finally {
        loading.value = false;
    }
}
async function prepareInvitation(token) {
    invitationToken.value = token;
    try {
        const invitation = await api(`/api/auth/invitations/${encodeURIComponent(token)}`);
        registerEmail.value = invitation.email;
        invitationWorkspaceName.value = invitation.workspaceName;
        loginMode.value = 'register';
    }
    catch (error) {
        invitationError.value = error instanceof Error ? error.message : 'Convite inválido ou expirado.';
    }
    finally {
        loading.value = false;
    }
}
async function loadAlertSoundPreference() {
    try {
        const result = await api('/api/account/alert-sounds');
        alertSounds.value = result.audios;
        alertAudioUploadEnabled.value = result.uploadEnabled;
        alertSoundPreferences.value = result.preferences;
        alertSoundDraftPreferences.value = { ...result.preferences };
        alertSoundError.value = '';
    }
    catch {
        alertSoundError.value = 'Não foi possível carregar sons.';
    }
}
function playAlertSound(audioId, reportFailure = false) {
    const source = alertSounds.value.find((audio) => audio.id === audioId)?.url ?? '/audio/alert.mp3';
    alertSoundPlaybackQueue = alertSoundPlaybackQueue.then(() => new Promise((resolve) => {
        const audio = new Audio(source);
        audio.volume = 0.7;
        audio.addEventListener('ended', () => resolve(), { once: true });
        audio.addEventListener('error', () => resolve(), { once: true });
        void audio.play().catch(() => {
            if (reportFailure)
                alertSoundError.value = 'O navegador bloqueou a reprodução do áudio.';
            resolve();
        });
    }));
}
function stopAlertSoundPreview() {
    const audio = alertSoundPreviewAudio;
    alertSoundPreviewAudio = null;
    alertSoundPreviewStatus.value = null;
    if (!audio)
        return;
    audio.pause();
    audio.currentTime = 0;
}
function toggleAlertSoundPreview(status) {
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
        if (alertSoundPreviewAudio !== audio)
            return;
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
async function selectAlertSoundFile(event) {
    const input = event.target;
    const file = input.files?.[0];
    alertSoundError.value = '';
    if (!file)
        return;
    if (!['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm'].includes(file.type) || file.size > 1024 * 1024) {
        alertSoundError.value = 'Escolha um áudio MP3, WAV, OGG ou WebM de até 1 MB.';
        input.value = '';
        return;
    }
    try {
        alertAudioUploadDataUrl.value = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Não foi possível ler o arquivo de áudio.'));
            reader.onerror = () => reject(new Error('Não foi possível ler o arquivo de áudio.'));
            reader.readAsDataURL(file);
        });
        alertAudioUploadName.value = file.name.replace(/\.[^.]+$/, '').slice(0, 80);
    }
    catch {
        alertSoundError.value = 'Não foi possível ler o arquivo de áudio.';
    }
    finally {
        input.value = '';
    }
}
async function uploadAlertSound() {
    if (!alertAudioUploadEnabled.value || alertAudioUploading.value || !alertAudioUploadDataUrl.value || !alertAudioUploadName.value.trim())
        return;
    alertAudioUploading.value = true;
    alertSoundError.value = '';
    alertSoundMessage.value = '';
    try {
        const result = await api('/api/account/alert-sounds', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ audioDataUrl: alertAudioUploadDataUrl.value, audioName: alertAudioUploadName.value })
        });
        alertSounds.value = result.audios;
        alertAudioUploadDataUrl.value = '';
        alertAudioUploadName.value = '';
        alertSoundMessage.value = 'Áudio adicionado à biblioteca compartilhada.';
    }
    catch (error) {
        alertSoundError.value = error instanceof Error ? error.message : 'Não foi possível adicionar o áudio.';
    }
    finally {
        alertAudioUploading.value = false;
    }
}
async function saveAlertSoundPreferences() {
    if (alertSoundSaving.value)
        return;
    alertSoundSaving.value = true;
    alertSoundError.value = '';
    alertSoundMessage.value = '';
    try {
        const result = await api('/api/account/alert-sound-preferences', {
            method: 'PUT',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify(alertSoundDraftPreferences.value)
        });
        alertSoundPreferences.value = result.preferences;
        alertSoundDraftPreferences.value = { ...result.preferences };
        alertSoundMessage.value = 'Sons por alerta salvos.';
    }
    catch (error) {
        alertSoundError.value = error instanceof Error ? error.message : 'Não foi possível salvar os sons por alerta.';
    }
    finally {
        alertSoundSaving.value = false;
    }
}
async function checkSession() {
    try {
        const [meResult, settingsResult] = await Promise.all([
            api('/api/auth/me'),
            api('/api/auth/registration-settings')
        ]);
        user.value = meResult.user;
        csrfToken.value = meResult.csrfToken;
        registrationEnabled.value = settingsResult.enabled;
        syncProfileForm();
        await loadWorkspaces();
        await loadAlertSoundPreference();
        await loadDevices();
        await loadNotifications();
    }
    catch {
        user.value = null;
        try {
            const settingsResult = await api('/api/auth/registration-settings');
            registrationEnabled.value = settingsResult.enabled;
        }
        catch {
            registrationEnabled.value = false;
        }
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
        await loadWorkspaces();
        await loadAlertSoundPreference();
        await loadDevices();
        await loadNotifications();
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
    const savedWhatsappNumber = user.value.whatsappNumber;
    const parsedWhatsappNumber = savedWhatsappNumber ? parsePhoneNumberFromString(savedWhatsappNumber) : undefined;
    profileWhatsappCountry.value = parsedWhatsappNumber?.country ?? 'BR';
    profileWhatsappNumber.value = parsedWhatsappNumber?.formatNational() ?? '';
    profileEmailNotifications.value = user.value.emailNotifications;
    profileWhatsappNotifications.value = user.value.whatsappNotifications;
}
function formatWhatsappNumberInput(event) {
    const input = event.target;
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
        const result = await api('/api/account/profile', {
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
    }
    catch (error) {
        notificationError.value = error instanceof Error ? t(error.message) : t('Nao foi possivel atualizar o perfil.');
    }
    finally {
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
        workspaceAlertPreferences.value = await api(`/api/workspaces/${activeWorkspaceId.value}/notification-preferences`);
    }
    catch (error) {
        workspaceAlertPreferencesError.value = error instanceof Error ? t(error.message) : t('Não foi possível carregar as preferências deste ambiente.');
    }
}
async function saveWorkspaceAlertPreferences() {
    if (!activeWorkspaceId.value)
        return;
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
    }
    catch (error) {
        workspaceAlertPreferencesError.value = error instanceof Error ? t(error.message) : t('Não foi possível salvar as preferências deste ambiente.');
    }
    finally {
        workspaceAlertPreferencesSaving.value = false;
    }
}
function toggleWorkspaceAlertMode(event) {
    workspaceAlertPreferences.value.notifyAllDevices = event.target.checked;
    void saveWorkspaceAlertPreferences();
}
function toggleDeviceAlertChannel(deviceId, channel, event) {
    const preference = workspaceAlertPreferences.value.devices.find((device) => device.deviceId === deviceId);
    if (!preference)
        return;
    preference[channel] = event.target.checked;
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
async function inviteUser() {
    if (!activeWorkspaceId.value || !inviteEmail.value.trim())
        return;
    inviteError.value = '';
    inviteMessage.value = '';
    try {
        const result = await api('/api/workspaces/' + activeWorkspaceId.value + '/invitations', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ email: inviteEmail.value.trim(), role: inviteRole.value })
        });
        inviteMessage.value = result.message;
        inviteEmail.value = '';
        inviteRole.value = 'member';
        await loadWorkspaceMembers();
    }
    catch (error) {
        inviteError.value = error instanceof Error ? error.message : 'Nao foi possivel enviar o convite.';
    }
}
function toggleMemberActions(memberId) {
    memberActionsOpenId.value = memberActionsOpenId.value === memberId ? null : memberId;
}
function editMemberRole(member) {
    editingMemberId.value = member.id;
    editingMemberRole.value = member.role;
    memberActionsOpenId.value = null;
}
function cancelMemberRoleEdit() {
    editingMemberId.value = null;
}
async function updateMemberRole(memberId) {
    if (!activeWorkspaceId.value)
        return;
    if (editingMemberRole.value !== 'admin' && editingMemberRole.value !== 'member')
        return;
    memberSavingId.value = memberId;
    try {
        await api('/api/workspaces/' + activeWorkspaceId.value + '/members', {
            method: 'PATCH',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ userId: memberId, role: editingMemberRole.value })
        });
        editingMemberId.value = null;
        await loadWorkspaceMembers();
    }
    catch (error) {
        pageError.value = error instanceof Error ? error.message : 'Nao foi possivel atualizar o papel do usuário.';
    }
    finally {
        memberSavingId.value = null;
    }
}
async function removeMember(memberId, displayName) {
    if (!activeWorkspaceId.value)
        return;
    if (!window.confirm(`Remover ${displayName} do ambiente ativo?`))
        return;
    memberActionsOpenId.value = null;
    try {
        await api('/api/workspaces/' + activeWorkspaceId.value + '/members/' + memberId, {
            method: 'DELETE',
            headers: { 'X-CSRF-Token': csrfToken.value }
        });
        await loadWorkspaceMembers();
    }
    catch (error) {
        pageError.value = error instanceof Error ? error.message : 'Nao foi possivel remover o usuário.';
    }
}
function requestUserDeletion(member) {
    if (!canManageUserAccounts.value || member.isPlatformAdmin || member.email === user.value?.email)
        return;
    memberActionsOpenId.value = null;
    userDeletionTarget.value = member;
    userDeletionConfirmation.value = '';
    userDeletionError.value = '';
}
function cancelUserDeletion() {
    if (userDeletionSaving.value)
        return;
    userDeletionTarget.value = null;
    userDeletionConfirmation.value = '';
    userDeletionError.value = '';
}
async function deleteUserPermanently() {
    const target = userDeletionTarget.value;
    if (!target || !canManageUserAccounts.value || userDeletionConfirmation.value.trim().toLowerCase() !== target.email.toLowerCase())
        return;
    userDeletionSaving.value = true;
    userDeletionError.value = '';
    userDeletionMessage.value = '';
    try {
        const result = await api(`/api/admin/users/${target.id}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-Token': csrfToken.value }
        });
        userDeletionTarget.value = null;
        userDeletionConfirmation.value = '';
        userDeletionMessage.value = `Conta excluída definitivamente. ${result.deletedDevices} aparelho(s) vinculado(s) removido(s).`;
        await loadAdminUsers();
        await loadWorkspaces();
        await loadDevices();
    }
    catch (error) {
        userDeletionError.value = error instanceof Error ? error.message : 'Não foi possível excluir a conta.';
    }
    finally {
        userDeletionSaving.value = false;
    }
}
async function requireUserPasswordReset(account) {
    if (!canManageUserAccounts.value || account.isPlatformAdmin || account.email === user.value?.email)
        return;
    if (!window.confirm(`Remover a senha de ${account.displayName || account.email} e exigir uma nova? As sessões ativas serão encerradas.`))
        return;
    adminUserActionId.value = account.id;
    adminUsersError.value = '';
    adminUsersMessage.value = '';
    try {
        const result = await api(`/api/admin/users/${account.id}/require-password-reset`, {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value }
        });
        adminUsersMessage.value = result.message;
        await loadAdminUsers();
    }
    catch (error) {
        adminUsersError.value = error instanceof Error ? t(error.message) : t('Não foi possível exigir a redefinição de senha.');
    }
    finally {
        adminUserActionId.value = null;
    }
}
function editAdminUser(account) {
    if (!canManageUserAccounts.value || account.isPlatformAdmin || account.email === user.value?.email)
        return;
    memberActionsOpenId.value = null;
    accountEditTarget.value = account;
    accountEditName.value = account.displayName;
    accountEditEmail.value = account.email;
    accountEditError.value = '';
}
function cancelAdminUserEdit() {
    if (accountEditSaving.value)
        return;
    accountEditTarget.value = null;
    accountEditError.value = '';
}
async function saveAdminUserEdit() {
    const target = accountEditTarget.value;
    if (!target || !canManageUserAccounts.value)
        return;
    accountEditSaving.value = true;
    accountEditError.value = '';
    adminUsersMessage.value = '';
    try {
        const result = await api(`/api/admin/users/${target.id}`, {
            method: 'PATCH',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ displayName: accountEditName.value, email: accountEditEmail.value })
        });
        accountEditTarget.value = null;
        adminUsersMessage.value = result.emailChanged
            ? 'Usuário atualizado. O e-mail de acesso foi alterado.'
            : 'Usuário atualizado.';
        await loadAdminUsers();
    }
    catch (error) {
        accountEditError.value = error instanceof Error ? t(error.message) : t('Não foi possível atualizar o usuário.');
    }
    finally {
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
function editDeviceAlias(device) {
    if (!device.canEditAlias)
        return;
    editingDeviceAliasId.value = device.id;
    deviceAliasDraft.value = device.alias ?? '';
    pageError.value = '';
}
function cancelDeviceAliasEdit() {
    editingDeviceAliasId.value = null;
    deviceAliasDraft.value = '';
}
async function saveDeviceAlias(device) {
    if (!device.canEditAlias || !activeWorkspaceId.value || deviceAliasDraft.value.length > 80)
        return;
    deviceAliasSavingId.value = device.id;
    pageError.value = '';
    try {
        const result = await api(`/api/devices/${device.id}/alias`, {
            method: 'PATCH',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ alias: deviceAliasDraft.value.trim() || null })
        });
        devices.value = devices.value.map((current) => current.id === device.id ? { ...current, alias: result.device.alias } : current);
        cancelDeviceAliasEdit();
    }
    catch (error) {
        pageError.value = error instanceof Error ? error.message : 'Não foi possível salvar o apelido do aparelho.';
    }
    finally {
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
    if (managementTab.value === 'users') {
        activeMobileTab.value = 'users';
        return;
    }
    const devicesSection = document.getElementById('aparelhos');
    if (devicesSection)
        activeMobileTab.value = devicesSection.getBoundingClientRect().top <= window.innerHeight * 0.45 ? 'devices' : 'home';
}
async function navigateMobileSection(section) {
    managementTab.value = 'overview';
    activeMobileTab.value = section;
    await nextTick();
    const sectionId = section === 'devices' ? 'aparelhos' : 'inicio';
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState({}, '', `#${sectionId}`);
}
watch([managementTab, whatsappTab], ([tab, subtab]) => {
    if (whatsappRefreshTimer)
        clearInterval(whatsappRefreshTimer);
    whatsappRefreshTimer = undefined;
    if (tab === 'whatsapp' && isWhatsAppDashboardAdmin.value) {
        if (subtab === 'configuration') {
            void loadWhatsAppConfiguration();
            whatsappRefreshTimer = setInterval(() => void loadWhatsAppStatus(), 2000);
        }
        else if (subtab === 'notifications') {
            void refreshWhatsAppNotifications();
        }
        else if (subtab === 'connection') {
            void Promise.all([loadWhatsAppCloudSettings(), loadWhatsAppStatus()]);
        }
        else if (subtab === 'profile') {
            void (async () => {
                await loadWhatsAppStatus();
                if (whatsappStatus.value.state === 'connected')
                    await loadWhatsAppProfile();
                else {
                    whatsappProfile.value = null;
                    whatsappProfileError.value = '';
                }
            })();
        }
        else if (subtab === 'log') {
            void loadWhatsAppLogs();
            whatsappRefreshTimer = setInterval(() => void loadWhatsAppLogs(), 2000);
        }
    }
});
watch([activeWorkspaceId, settingsTab], ([, tab]) => {
    if (tab === 'notifications')
        void loadWorkspaceAlertPreferences();
});
watch(activeWorkspaceId, (workspaceId) => {
    connectDeviceEvents(workspaceId);
    void loadNotifications();
});
watch([managementTab, emailTab], ([tab, subtab], [previousTab]) => {
    if (emailRefreshTimer)
        clearInterval(emailRefreshTimer);
    emailRefreshTimer = undefined;
    if (tab !== 'email' || !isWhatsAppDashboardAdmin.value)
        return;
    if (previousTab !== 'email') {
        void loadEmailSettings();
        void loadEmailLogs();
    }
    else if (subtab === 'log') {
        void loadEmailLogs();
    }
    if (subtab === 'log')
        emailRefreshTimer = setInterval(() => void loadEmailLogs(), 3000);
});
onMounted(() => {
    darkMode.value = localStorage.getItem('lab-monitor-dark-mode') === 'true';
    document.documentElement.classList.toggle('dark-mode', darkMode.value);
    language.value = localStorage.getItem('lab-monitor-language') === 'en' ? 'en' : 'pt-BR';
    const query = new URLSearchParams(window.location.search);
    resetToken.value = query.get('resetToken') ?? '';
    const activationToken = query.get('activationToken');
    const rawInvitationToken = query.get('invitationToken');
    if (activationToken || rawInvitationToken)
        window.history.replaceState({}, '', window.location.pathname);
    if (resetToken.value) {
        loginMode.value = 'reset';
        loading.value = false;
    }
    else if (activationToken) {
        void activateAccount(activationToken);
    }
    else if (rawInvitationToken) {
        void prepareInvitation(rawInvitationToken);
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
    deviceEvents?.close();
    if (refreshTimer)
        clearInterval(refreshTimer);
    if (whatsappRefreshTimer)
        clearInterval(whatsappRefreshTimer);
    if (emailRefreshTimer)
        clearInterval(emailRefreshTimer);
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
        if (__VLS_ctx.activationMessage) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "success-message" },
                role: "status",
            });
            (__VLS_ctx.activationMessage);
        }
        if (__VLS_ctx.activationError || __VLS_ctx.invitationError) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "error-message" },
                role: "alert",
            });
            (__VLS_ctx.activationError || __VLS_ctx.invitationError);
        }
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
        if (__VLS_ctx.registrationEnabled) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(!__VLS_ctx.user))
                            return;
                        if (!(__VLS_ctx.loginMode === 'login'))
                            return;
                        if (!(__VLS_ctx.registrationEnabled))
                            return;
                        __VLS_ctx.loginMode = 'register';
                    } },
                ...{ class: "secondary-button login-button" },
                type: "button",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
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
    else if (__VLS_ctx.loginMode === 'register') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.loginMode === 'login'))
                        return;
                    if (!(__VLS_ctx.loginMode === 'register'))
                        return;
                    __VLS_ctx.loginMode = 'login';
                    __VLS_ctx.registerError = '';
                    __VLS_ctx.registerMessage = '';
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
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "form-subtitle" },
        });
        (__VLS_ctx.invitationToken ? `Convite para ${__VLS_ctx.invitationWorkspaceName}. O ambiente aparecerá na sua lista após a confirmação do e-mail.` : 'Crie sua conta; depois você poderá criar ou importar um ambiente.');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "registerName",
        });
        (__VLS_ctx.t('Nome'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "registerName",
            value: (__VLS_ctx.registerName),
            type: "text",
            maxlength: "80",
            autocomplete: "name",
            placeholder: "Seu nome",
            required: true,
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "registerEmail",
        });
        (__VLS_ctx.t('E-mail'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "registerEmail",
            type: "email",
            autocomplete: "email",
            placeholder: "voce@laboratorio.com",
            readonly: (!!__VLS_ctx.invitationToken),
            required: true,
        });
        (__VLS_ctx.registerEmail);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "registerPassword",
        });
        (__VLS_ctx.t('Senha'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "registerPassword",
            type: "password",
            minlength: "12",
            autocomplete: "new-password",
            placeholder: "Pelo menos 12 caracteres",
            required: true,
        });
        (__VLS_ctx.registerPassword);
        if (__VLS_ctx.registerError) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "error-message" },
                role: "alert",
            });
            (__VLS_ctx.registerError);
        }
        if (__VLS_ctx.registerMessage) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "success-message" },
                role: "status",
            });
            (__VLS_ctx.registerMessage);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.registerAccount) },
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
        (__VLS_ctx.submitting ? 'Criando conta...' : 'Criar conta');
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
                    if (!!(__VLS_ctx.loginMode === 'register'))
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
        const __VLS_20 = {}.ChevronDown;
        /** @type {[typeof __VLS_components.ChevronDown, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
            size: (16),
        }));
        const __VLS_22 = __VLS_21({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
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
            const __VLS_24 = {}.LoaderCircle;
            /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
            // @ts-ignore
            const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
                ...{ class: "spin" },
                size: (17),
            }));
            const __VLS_26 = __VLS_25({
                ...{ class: "spin" },
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_25));
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
            const __VLS_28 = {}.LoaderCircle;
            /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
            // @ts-ignore
            const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
                ...{ class: "spin" },
                size: (17),
            }));
            const __VLS_30 = __VLS_29({
                ...{ class: "spin" },
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_29));
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
                        if (!!(__VLS_ctx.loginMode === 'register'))
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
        ...{ class: ({ 'app-shell-whatsapp-admin': __VLS_ctx.isWhatsAppDashboardAdmin }) },
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
    const __VLS_32 = {}.Activity;
    /** @type {[typeof __VLS_components.Activity, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        size: (18),
    }));
    const __VLS_34 = __VLS_33({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "brand-light" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "workspace-label" },
    });
    (__VLS_ctx.t('AMBIENTE'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(!__VLS_ctx.user))
                    return;
                __VLS_ctx.workspaceMenuOpen = !__VLS_ctx.workspaceMenuOpen;
            } },
        ...{ class: "workspace-switch" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "workspace-avatar" },
    });
    if (__VLS_ctx.activeWorkspace?.iconDataUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (__VLS_ctx.activeWorkspace.iconDataUrl),
            alt: (''),
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.activeWorkspace?.name.slice(0, 1).toUpperCase() || 'L');
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "workspace-name" },
    });
    (__VLS_ctx.activeWorkspace?.name || __VLS_ctx.t('Nenhum ambiente selecionado'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    (__VLS_ctx.activeWorkspace ? __VLS_ctx.t('Plano operacional') : __VLS_ctx.t('Crie ou importe um ambiente'));
    const __VLS_36 = {}.ChevronDown;
    /** @type {[typeof __VLS_components.ChevronDown, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        size: (15),
    }));
    const __VLS_38 = __VLS_37({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    if (__VLS_ctx.workspaceMenuOpen) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "workspace-dropdown" },
        });
        if (__VLS_ctx.workspaces.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "workspace-list" },
            });
            for (const [workspace] of __VLS_getVForSourceType((__VLS_ctx.workspaces))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(!__VLS_ctx.user))
                                return;
                            if (!(__VLS_ctx.workspaceMenuOpen))
                                return;
                            if (!(__VLS_ctx.workspaces.length))
                                return;
                            __VLS_ctx.workspaceMenuOpen = false;
                            __VLS_ctx.changeWorkspace(workspace.id);
                        } },
                    key: (workspace.id),
                    ...{ class: "workspace-option" },
                    type: "button",
                    ...{ class: ({ active: workspace.id === __VLS_ctx.activeWorkspaceId }) },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "workspace-option-main" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "workspace-option-avatar" },
                });
                if (workspace.iconDataUrl) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                        src: (workspace.iconDataUrl),
                        alt: "",
                    });
                }
                else {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (workspace.name.slice(0, 1).toUpperCase());
                }
                (workspace.name);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                (__VLS_ctx.workspaceRoleLabel(workspace.role));
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.workspaceMenuOpen))
                        return;
                    __VLS_ctx.workspaceMenuOpen = false;
                    __VLS_ctx.openWorkspaceManager('create');
                } },
            ...{ class: "workspace-manage-button" },
            type: "button",
        });
        const __VLS_40 = {}.Plus;
        /** @type {[typeof __VLS_components.Plus, ]} */ ;
        // @ts-ignore
        const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
            size: (15),
        }));
        const __VLS_42 = __VLS_41({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_41));
        (__VLS_ctx.t('Adicionar/editar ambiente'));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "nav-label" },
    });
    (__VLS_ctx.t('GERENCIAMENTO'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(!__VLS_ctx.user))
                    return;
                __VLS_ctx.managementTab = 'overview';
            } },
        ...{ class: "nav-link" },
        ...{ class: ({ active: __VLS_ctx.managementTab === 'overview' }) },
        href: "#inicio",
    });
    const __VLS_44 = {}.LayoutDashboard;
    /** @type {[typeof __VLS_components.LayoutDashboard, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        size: (17),
    }));
    const __VLS_46 = __VLS_45({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Visao geral'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "nav-count" },
    });
    (__VLS_ctx.devices.length);
    if (__VLS_ctx.canManageActiveWorkspace) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.openUserManagement) },
            ...{ class: "nav-link" },
            ...{ class: ({ active: __VLS_ctx.managementTab === 'users' }) },
            type: "button",
        });
        const __VLS_48 = {}.Settings;
        /** @type {[typeof __VLS_components.Settings, ]} */ ;
        // @ts-ignore
        const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
            size: (17),
        }));
        const __VLS_50 = __VLS_49({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_49));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('Usuários'));
    }
    if (__VLS_ctx.isWhatsAppDashboardAdmin) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.managementTab = 'whatsapp';
                } },
            ...{ class: "nav-link" },
            ...{ class: ({ active: __VLS_ctx.managementTab === 'whatsapp' }) },
            type: "button",
        });
        const __VLS_52 = {}.MessageCircle;
        /** @type {[typeof __VLS_components.MessageCircle, ]} */ ;
        // @ts-ignore
        const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
            size: (17),
        }));
        const __VLS_54 = __VLS_53({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_53));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('WhatsApp API'));
    }
    if (__VLS_ctx.isWhatsAppDashboardAdmin) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.managementTab = 'email';
                } },
            ...{ class: "nav-link" },
            ...{ class: ({ active: __VLS_ctx.managementTab === 'email' }) },
            type: "button",
        });
        const __VLS_56 = {}.Mail;
        /** @type {[typeof __VLS_components.Mail, ]} */ ;
        // @ts-ignore
        const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
            size: (17),
        }));
        const __VLS_58 = __VLS_57({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_57));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('E-mail API'));
    }
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
    const __VLS_60 = {}.LogOut;
    /** @type {[typeof __VLS_components.LogOut, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        size: (17),
    }));
    const __VLS_62 = __VLS_61({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
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
    (__VLS_ctx.t(__VLS_ctx.managementTab === 'users' ? 'Usuários' : __VLS_ctx.managementTab === 'whatsapp' ? 'WhatsApp API' : __VLS_ctx.managementTab === 'email' ? 'E-mail API' : 'Visao geral'));
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
        ...{ onClick: (__VLS_ctx.toggleNotificationPanel) },
        ...{ class: "icon-button notification-button" },
        type: "button",
        title: (`${__VLS_ctx.t('Notificações')}${__VLS_ctx.unreadNotificationCount ? `: ${__VLS_ctx.unreadNotificationCount} ${__VLS_ctx.t('não lidas')}` : ''}`),
        'aria-label': (`${__VLS_ctx.t('Notificações')}${__VLS_ctx.unreadNotificationCount ? `, ${__VLS_ctx.unreadNotificationCount} ${__VLS_ctx.t('não lidas')}` : ''}`),
        'aria-expanded': (__VLS_ctx.notificationOpen),
        'aria-haspopup': "dialog",
    });
    const __VLS_64 = {}.Bell;
    /** @type {[typeof __VLS_components.Bell, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        size: (18),
    }));
    const __VLS_66 = __VLS_65({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
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
        if (__VLS_ctx.notifications.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.deleteAllNotifications) },
                ...{ class: "notification-read-all" },
                type: "button",
            });
            (__VLS_ctx.t('Apagar notificações'));
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
                    const __VLS_68 = {}.CircleCheck;
                    /** @type {[typeof __VLS_components.CircleCheck, ]} */ ;
                    // @ts-ignore
                    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
                        size: (17),
                    }));
                    const __VLS_70 = __VLS_69({
                        size: (17),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
                }
                else {
                    const __VLS_72 = {}.AlertTriangle;
                    /** @type {[typeof __VLS_components.AlertTriangle, ]} */ ;
                    // @ts-ignore
                    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
                        size: (17),
                    }));
                    const __VLS_74 = __VLS_73({
                        size: (17),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
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
            const __VLS_76 = {}.Bell;
            /** @type {[typeof __VLS_components.Bell, ]} */ ;
            // @ts-ignore
            const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
                size: (22),
            }));
            const __VLS_78 = __VLS_77({
                size: (22),
            }, ...__VLS_functionalComponentArgsRest(__VLS_77));
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
    if (__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "user-management-panel" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "page-heading" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "eyebrow" },
        });
        (__VLS_ctx.t('GERENCIAMENTO'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
        (__VLS_ctx.t('Usuários'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "heading-sub" },
        });
        (__VLS_ctx.t('Gerencie membros, papéis e convites do ambiente ativo.'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                        return;
                    __VLS_ctx.managementTab = 'overview';
                } },
            ...{ class: "secondary-button" },
            type: "button",
        });
        (__VLS_ctx.t('Voltar'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
            ...{ class: "settings-tabs whatsapp-tabs user-management-tabs" },
            role: "tablist",
            'aria-label': (__VLS_ctx.t('Usuários')),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                        return;
                    __VLS_ctx.userManagementTab = 'members';
                } },
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.userManagementTab === 'members' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.userManagementTab === 'members'),
        });
        const __VLS_80 = {}.UsersRound;
        /** @type {[typeof __VLS_components.UsersRound, ]} */ ;
        // @ts-ignore
        const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
            size: (15),
        }));
        const __VLS_82 = __VLS_81({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_81));
        (__VLS_ctx.t('Membros'));
        if (__VLS_ctx.canManageUserAccounts) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(!__VLS_ctx.user))
                            return;
                        if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                            return;
                        if (!(__VLS_ctx.canManageUserAccounts))
                            return;
                        __VLS_ctx.userManagementTab = 'accounts';
                        void __VLS_ctx.loadAdminUsers();
                    } },
                ...{ class: "settings-tab" },
                ...{ class: ({ active: __VLS_ctx.userManagementTab === 'accounts' }) },
                type: "button",
                role: "tab",
                'aria-selected': (__VLS_ctx.userManagementTab === 'accounts'),
            });
            const __VLS_84 = {}.UsersRound;
            /** @type {[typeof __VLS_components.UsersRound, ]} */ ;
            // @ts-ignore
            const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
                size: (15),
            }));
            const __VLS_86 = __VLS_85({
                size: (15),
            }, ...__VLS_functionalComponentArgsRest(__VLS_85));
            (__VLS_ctx.t('Usuários cadastrados'));
        }
        if (__VLS_ctx.isWhatsAppDashboardAdmin) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(!__VLS_ctx.user))
                            return;
                        if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                            return;
                        if (!(__VLS_ctx.isWhatsAppDashboardAdmin))
                            return;
                        __VLS_ctx.userManagementTab = 'registration';
                    } },
                ...{ class: "settings-tab" },
                ...{ class: ({ active: __VLS_ctx.userManagementTab === 'registration' }) },
                type: "button",
                role: "tab",
                'aria-selected': (__VLS_ctx.userManagementTab === 'registration'),
            });
            const __VLS_88 = {}.ShieldCheck;
            /** @type {[typeof __VLS_components.ShieldCheck, ]} */ ;
            // @ts-ignore
            const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
                size: (15),
            }));
            const __VLS_90 = __VLS_89({
                size: (15),
            }, ...__VLS_functionalComponentArgsRest(__VLS_89));
            (__VLS_ctx.t('Cadastro público'));
        }
        if (__VLS_ctx.userManagementTab === 'registration' && __VLS_ctx.isWhatsAppDashboardAdmin) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: "settings-pane user-management-card" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-section-heading" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            (__VLS_ctx.t('Cadastro público'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "theme-setting" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "theme-setting-icon" },
            });
            const __VLS_92 = {}.ShieldCheck;
            /** @type {[typeof __VLS_components.ShieldCheck, ]} */ ;
            // @ts-ignore
            const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
                size: (18),
            }));
            const __VLS_94 = __VLS_93({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_93));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "theme-setting-copy" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.t('Permitir criação de contas'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.registrationEnabled ? __VLS_ctx.t('Habilitado na tela de login') : __VLS_ctx.t('Desabilitado'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (__VLS_ctx.toggleRegistrationSetting) },
                ...{ class: "theme-switch" },
                type: "checkbox",
                checked: (__VLS_ctx.registrationEnabled),
            });
        }
        else if (__VLS_ctx.userManagementTab === 'accounts' && __VLS_ctx.canManageUserAccounts) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: "settings-pane user-management-card" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-section-heading" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            (__VLS_ctx.t('Contas cadastradas'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.adminUsers.length);
            (__VLS_ctx.t('contas'));
            if (__VLS_ctx.adminUsersMessage) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "success-message" },
                    role: "status",
                });
                (__VLS_ctx.t(__VLS_ctx.adminUsersMessage));
            }
            if (__VLS_ctx.adminUsersError) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "error-message" },
                    role: "alert",
                });
                (__VLS_ctx.t(__VLS_ctx.adminUsersError));
            }
            if (__VLS_ctx.userDeletionMessage) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "success-message" },
                    role: "status",
                });
                (__VLS_ctx.userDeletionMessage);
            }
            if (__VLS_ctx.adminUsersLoading) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "workspace-device-empty" },
                });
                (__VLS_ctx.t('Carregando contas...'));
            }
            else if (__VLS_ctx.adminUsers.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "member-list admin-account-list" },
                });
                for (const [account] of __VLS_getVForSourceType((__VLS_ctx.adminUsers))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        key: (account.id),
                        ...{ class: "member-row admin-account-row" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "admin-account-identity" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (account.displayName || account.email);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                    (account.email);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                    (account.workspaces.length ? account.workspaces.map((workspace) => workspace.name).join(', ') : __VLS_ctx.t('Sem ambiente'));
                    if (account.isPlatformAdmin) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: "protected-member-role" },
                        });
                        const __VLS_96 = {}.LockKeyhole;
                        /** @type {[typeof __VLS_components.LockKeyhole, ]} */ ;
                        // @ts-ignore
                        const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
                            size: (14),
                        }));
                        const __VLS_98 = __VLS_97({
                            size: (14),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_97));
                        (__VLS_ctx.t('Administrador da plataforma'));
                    }
                    else {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: "admin-account-status" },
                        });
                        (account.passwordResetRequired ? __VLS_ctx.t('Redefinição de senha exigida') : account.emailVerifiedAt ? __VLS_ctx.t('Conta ativa') : __VLS_ctx.t('E-mail pendente'));
                    }
                    if (!account.isPlatformAdmin && account.email !== __VLS_ctx.user?.email) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: "member-actions" },
                        });
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (...[$event]) => {
                                    if (!!(__VLS_ctx.loading))
                                        return;
                                    if (!!(!__VLS_ctx.user))
                                        return;
                                    if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                        return;
                                    if (!!(__VLS_ctx.userManagementTab === 'registration' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                        return;
                                    if (!(__VLS_ctx.userManagementTab === 'accounts' && __VLS_ctx.canManageUserAccounts))
                                        return;
                                    if (!!(__VLS_ctx.adminUsersLoading))
                                        return;
                                    if (!(__VLS_ctx.adminUsers.length))
                                        return;
                                    if (!(!account.isPlatformAdmin && account.email !== __VLS_ctx.user?.email))
                                        return;
                                    __VLS_ctx.toggleMemberActions(`account-${account.id}`);
                                } },
                            ...{ class: "icon-button member-actions-button" },
                            type: "button",
                            'aria-label': (__VLS_ctx.t('Abrir ações da conta')),
                            'aria-expanded': (__VLS_ctx.memberActionsOpenId === `account-${account.id}`),
                            title: (__VLS_ctx.t('Ações')),
                        });
                        const __VLS_100 = {}.EllipsisVertical;
                        /** @type {[typeof __VLS_components.EllipsisVertical, ]} */ ;
                        // @ts-ignore
                        const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
                            size: (18),
                        }));
                        const __VLS_102 = __VLS_101({
                            size: (18),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_101));
                        if (__VLS_ctx.memberActionsOpenId === `account-${account.id}`) {
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                                ...{ class: "member-actions-menu admin-account-actions" },
                                role: "menu",
                            });
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                                ...{ onClick: (...[$event]) => {
                                        if (!!(__VLS_ctx.loading))
                                            return;
                                        if (!!(!__VLS_ctx.user))
                                            return;
                                        if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                            return;
                                        if (!!(__VLS_ctx.userManagementTab === 'registration' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                            return;
                                        if (!(__VLS_ctx.userManagementTab === 'accounts' && __VLS_ctx.canManageUserAccounts))
                                            return;
                                        if (!!(__VLS_ctx.adminUsersLoading))
                                            return;
                                        if (!(__VLS_ctx.adminUsers.length))
                                            return;
                                        if (!(!account.isPlatformAdmin && account.email !== __VLS_ctx.user?.email))
                                            return;
                                        if (!(__VLS_ctx.memberActionsOpenId === `account-${account.id}`))
                                            return;
                                        __VLS_ctx.editAdminUser(account);
                                    } },
                                type: "button",
                                role: "menuitem",
                            });
                            const __VLS_104 = {}.Pencil;
                            /** @type {[typeof __VLS_components.Pencil, ]} */ ;
                            // @ts-ignore
                            const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
                                size: (14),
                            }));
                            const __VLS_106 = __VLS_105({
                                size: (14),
                            }, ...__VLS_functionalComponentArgsRest(__VLS_105));
                            (__VLS_ctx.t('Editar usuário'));
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                                ...{ onClick: (...[$event]) => {
                                        if (!!(__VLS_ctx.loading))
                                            return;
                                        if (!!(!__VLS_ctx.user))
                                            return;
                                        if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                            return;
                                        if (!!(__VLS_ctx.userManagementTab === 'registration' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                            return;
                                        if (!(__VLS_ctx.userManagementTab === 'accounts' && __VLS_ctx.canManageUserAccounts))
                                            return;
                                        if (!!(__VLS_ctx.adminUsersLoading))
                                            return;
                                        if (!(__VLS_ctx.adminUsers.length))
                                            return;
                                        if (!(!account.isPlatformAdmin && account.email !== __VLS_ctx.user?.email))
                                            return;
                                        if (!(__VLS_ctx.memberActionsOpenId === `account-${account.id}`))
                                            return;
                                        __VLS_ctx.memberActionsOpenId = null;
                                        __VLS_ctx.requireUserPasswordReset(account);
                                    } },
                                type: "button",
                                role: "menuitem",
                                disabled: (__VLS_ctx.adminUserActionId === account.id || account.passwordResetRequired),
                            });
                            const __VLS_108 = {}.LockKeyhole;
                            /** @type {[typeof __VLS_components.LockKeyhole, ]} */ ;
                            // @ts-ignore
                            const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
                                size: (14),
                            }));
                            const __VLS_110 = __VLS_109({
                                size: (14),
                            }, ...__VLS_functionalComponentArgsRest(__VLS_109));
                            (account.passwordResetRequired ? __VLS_ctx.t('Redefinição já exigida') : __VLS_ctx.t('Remover senha e exigir nova senha'));
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                                ...{ onClick: (...[$event]) => {
                                        if (!!(__VLS_ctx.loading))
                                            return;
                                        if (!!(!__VLS_ctx.user))
                                            return;
                                        if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                            return;
                                        if (!!(__VLS_ctx.userManagementTab === 'registration' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                            return;
                                        if (!(__VLS_ctx.userManagementTab === 'accounts' && __VLS_ctx.canManageUserAccounts))
                                            return;
                                        if (!!(__VLS_ctx.adminUsersLoading))
                                            return;
                                        if (!(__VLS_ctx.adminUsers.length))
                                            return;
                                        if (!(!account.isPlatformAdmin && account.email !== __VLS_ctx.user?.email))
                                            return;
                                        if (!(__VLS_ctx.memberActionsOpenId === `account-${account.id}`))
                                            return;
                                        __VLS_ctx.requestUserDeletion(account);
                                    } },
                                ...{ class: "member-remove-action" },
                                type: "button",
                                role: "menuitem",
                            });
                            const __VLS_112 = {}.Trash2;
                            /** @type {[typeof __VLS_components.Trash2, ]} */ ;
                            // @ts-ignore
                            const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
                                size: (14),
                            }));
                            const __VLS_114 = __VLS_113({
                                size: (14),
                            }, ...__VLS_functionalComponentArgsRest(__VLS_113));
                            (__VLS_ctx.t('Excluir usuário permanentemente'));
                        }
                    }
                }
            }
            else if (!__VLS_ctx.adminUsersError) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "workspace-device-empty" },
                });
                (__VLS_ctx.t('Nenhuma conta cadastrada.'));
            }
        }
        else if (__VLS_ctx.userManagementTab === 'members') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: "settings-pane user-management-card" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-section-heading" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            (__VLS_ctx.t('Convidar usuário'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "invite-form" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "settings-input" },
                type: "email",
                placeholder: (__VLS_ctx.t('usuario@empresa.com')),
            });
            (__VLS_ctx.inviteEmail);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: (__VLS_ctx.inviteRole),
                ...{ class: "settings-input select-input" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "member",
            });
            (__VLS_ctx.t('Membro'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "admin",
            });
            (__VLS_ctx.t('Administrador'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.inviteUser) },
                ...{ class: "primary-button" },
                type: "button",
            });
            (__VLS_ctx.t('Convidar'));
            if (__VLS_ctx.inviteMessage) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "success-message" },
                    role: "status",
                });
                (__VLS_ctx.t(__VLS_ctx.inviteMessage));
            }
            if (__VLS_ctx.inviteError) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "error-message" },
                    role: "alert",
                });
                (__VLS_ctx.t(__VLS_ctx.inviteError));
            }
            if (__VLS_ctx.userDeletionMessage) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "success-message" },
                    role: "status",
                });
                (__VLS_ctx.userDeletionMessage);
            }
            if (__VLS_ctx.workspaceMembers.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "member-list" },
                });
                for (const [member] of __VLS_getVForSourceType((__VLS_ctx.workspaceMembers))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        key: (member.id),
                        ...{ class: "member-row" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (member.displayName || member.email);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                    (member.email);
                    if (member.isPlatformAdmin) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: "protected-member-role" },
                            title: (__VLS_ctx.t('O papel deste administrador da plataforma não pode ser alterado.')),
                            'aria-label': (__VLS_ctx.t('Administrador da plataforma')),
                        });
                        const __VLS_116 = {}.LockKeyhole;
                        /** @type {[typeof __VLS_components.LockKeyhole, ]} */ ;
                        // @ts-ignore
                        const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
                            size: (14),
                        }));
                        const __VLS_118 = __VLS_117({
                            size: (14),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_117));
                        (__VLS_ctx.t('Administrador da plataforma'));
                    }
                    else if (__VLS_ctx.editingMemberId === member.id) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: "member-edit-controls" },
                        });
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                            value: (__VLS_ctx.editingMemberRole),
                            ...{ class: "settings-input select-input small" },
                            'aria-label': (`${__VLS_ctx.t('Papel de')} ${member.displayName || member.email}`),
                        });
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                            value: "member",
                        });
                        (__VLS_ctx.t('Membro'));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                            value: "admin",
                        });
                        (__VLS_ctx.t('Administrador'));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                            value: "owner",
                            disabled: true,
                        });
                        (__VLS_ctx.t('Proprietário'));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (...[$event]) => {
                                    if (!!(__VLS_ctx.loading))
                                        return;
                                    if (!!(!__VLS_ctx.user))
                                        return;
                                    if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                        return;
                                    if (!!(__VLS_ctx.userManagementTab === 'registration' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                        return;
                                    if (!!(__VLS_ctx.userManagementTab === 'accounts' && __VLS_ctx.canManageUserAccounts))
                                        return;
                                    if (!(__VLS_ctx.userManagementTab === 'members'))
                                        return;
                                    if (!(__VLS_ctx.workspaceMembers.length))
                                        return;
                                    if (!!(member.isPlatformAdmin))
                                        return;
                                    if (!(__VLS_ctx.editingMemberId === member.id))
                                        return;
                                    __VLS_ctx.updateMemberRole(member.id);
                                } },
                            ...{ class: "icon-button member-save-button" },
                            type: "button",
                            disabled: (__VLS_ctx.memberSavingId === member.id || __VLS_ctx.editingMemberRole === 'owner'),
                            title: (__VLS_ctx.t('Salvar')),
                            'aria-label': (__VLS_ctx.t('Salvar')),
                        });
                        const __VLS_120 = {}.Check;
                        /** @type {[typeof __VLS_components.Check, ]} */ ;
                        // @ts-ignore
                        const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
                            size: (16),
                        }));
                        const __VLS_122 = __VLS_121({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_121));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (__VLS_ctx.cancelMemberRoleEdit) },
                            ...{ class: "icon-button member-cancel-button" },
                            type: "button",
                            disabled: (__VLS_ctx.memberSavingId === member.id),
                            title: (__VLS_ctx.t('Cancelar')),
                            'aria-label': (__VLS_ctx.t('Cancelar')),
                        });
                        const __VLS_124 = {}.X;
                        /** @type {[typeof __VLS_components.X, ]} */ ;
                        // @ts-ignore
                        const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
                            size: (16),
                        }));
                        const __VLS_126 = __VLS_125({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_125));
                    }
                    else {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: "member-role-label" },
                        });
                        (__VLS_ctx.workspaceRoleLabel(member.role));
                    }
                    if (!member.isPlatformAdmin && member.email !== __VLS_ctx.user?.email && __VLS_ctx.editingMemberId !== member.id) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: "member-actions" },
                        });
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (...[$event]) => {
                                    if (!!(__VLS_ctx.loading))
                                        return;
                                    if (!!(!__VLS_ctx.user))
                                        return;
                                    if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                        return;
                                    if (!!(__VLS_ctx.userManagementTab === 'registration' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                        return;
                                    if (!!(__VLS_ctx.userManagementTab === 'accounts' && __VLS_ctx.canManageUserAccounts))
                                        return;
                                    if (!(__VLS_ctx.userManagementTab === 'members'))
                                        return;
                                    if (!(__VLS_ctx.workspaceMembers.length))
                                        return;
                                    if (!(!member.isPlatformAdmin && member.email !== __VLS_ctx.user?.email && __VLS_ctx.editingMemberId !== member.id))
                                        return;
                                    __VLS_ctx.toggleMemberActions(member.id);
                                } },
                            ...{ class: "icon-button member-actions-button" },
                            type: "button",
                            'aria-label': (__VLS_ctx.t('Abrir ações do membro')),
                            'aria-expanded': (__VLS_ctx.memberActionsOpenId === member.id),
                            title: (__VLS_ctx.t('Ações')),
                        });
                        const __VLS_128 = {}.EllipsisVertical;
                        /** @type {[typeof __VLS_components.EllipsisVertical, ]} */ ;
                        // @ts-ignore
                        const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
                            size: (18),
                        }));
                        const __VLS_130 = __VLS_129({
                            size: (18),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_129));
                        if (__VLS_ctx.memberActionsOpenId === member.id) {
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                                ...{ class: "member-actions-menu" },
                                role: "menu",
                            });
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                                ...{ onClick: (...[$event]) => {
                                        if (!!(__VLS_ctx.loading))
                                            return;
                                        if (!!(!__VLS_ctx.user))
                                            return;
                                        if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                            return;
                                        if (!!(__VLS_ctx.userManagementTab === 'registration' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                            return;
                                        if (!!(__VLS_ctx.userManagementTab === 'accounts' && __VLS_ctx.canManageUserAccounts))
                                            return;
                                        if (!(__VLS_ctx.userManagementTab === 'members'))
                                            return;
                                        if (!(__VLS_ctx.workspaceMembers.length))
                                            return;
                                        if (!(!member.isPlatformAdmin && member.email !== __VLS_ctx.user?.email && __VLS_ctx.editingMemberId !== member.id))
                                            return;
                                        if (!(__VLS_ctx.memberActionsOpenId === member.id))
                                            return;
                                        __VLS_ctx.editMemberRole(member);
                                    } },
                                type: "button",
                                role: "menuitem",
                            });
                            const __VLS_132 = {}.Pencil;
                            /** @type {[typeof __VLS_components.Pencil, ]} */ ;
                            // @ts-ignore
                            const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
                                size: (14),
                            }));
                            const __VLS_134 = __VLS_133({
                                size: (14),
                            }, ...__VLS_functionalComponentArgsRest(__VLS_133));
                            (__VLS_ctx.t('Editar papel'));
                            if (__VLS_ctx.isWhatsAppDashboardAdmin) {
                                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                                    ...{ onClick: (...[$event]) => {
                                            if (!!(__VLS_ctx.loading))
                                                return;
                                            if (!!(!__VLS_ctx.user))
                                                return;
                                            if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                                return;
                                            if (!!(__VLS_ctx.userManagementTab === 'registration' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                                return;
                                            if (!!(__VLS_ctx.userManagementTab === 'accounts' && __VLS_ctx.canManageUserAccounts))
                                                return;
                                            if (!(__VLS_ctx.userManagementTab === 'members'))
                                                return;
                                            if (!(__VLS_ctx.workspaceMembers.length))
                                                return;
                                            if (!(!member.isPlatformAdmin && member.email !== __VLS_ctx.user?.email && __VLS_ctx.editingMemberId !== member.id))
                                                return;
                                            if (!(__VLS_ctx.memberActionsOpenId === member.id))
                                                return;
                                            if (!(__VLS_ctx.isWhatsAppDashboardAdmin))
                                                return;
                                            __VLS_ctx.requestUserDeletion(member);
                                        } },
                                    ...{ class: "member-remove-action" },
                                    type: "button",
                                    role: "menuitem",
                                });
                                const __VLS_136 = {}.Trash2;
                                /** @type {[typeof __VLS_components.Trash2, ]} */ ;
                                // @ts-ignore
                                const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
                                    size: (14),
                                }));
                                const __VLS_138 = __VLS_137({
                                    size: (14),
                                }, ...__VLS_functionalComponentArgsRest(__VLS_137));
                                (__VLS_ctx.t('Excluir usuário permanentemente'));
                            }
                        }
                    }
                }
            }
            if (__VLS_ctx.workspaceInvitations.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "member-list" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "settings-section-heading" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
                (__VLS_ctx.t('Convites pendentes'));
                for (const [invitation] of __VLS_getVForSourceType((__VLS_ctx.workspaceInvitations))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        key: (invitation.id),
                        ...{ class: "member-row invitation-row" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (invitation.email);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                    (__VLS_ctx.workspaceRoleLabel(invitation.role));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (new Date(invitation.expiresAt).toLocaleDateString('pt-BR'));
                }
            }
        }
    }
    else if (__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "whatsapp-management-panel" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "page-heading" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "eyebrow" },
        });
        (__VLS_ctx.t('GERENCIAMENTO'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
        (__VLS_ctx.t('WhatsApp API'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "heading-sub" },
        });
        (__VLS_ctx.t(__VLS_ctx.whatsappTab === 'log' ? 'Log de eventos' : __VLS_ctx.whatsappTab === 'configuration' ? 'Configuração da Cloud API' : __VLS_ctx.whatsappTab === 'notifications' ? 'Notificações' : __VLS_ctx.whatsappTab === 'profile' ? 'Perfil da conta WhatsApp' : 'Teste de conectividade do canal ativo'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                        return;
                    if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.whatsappTab === 'log' ? __VLS_ctx.loadWhatsAppLogs() : __VLS_ctx.whatsappTab === 'configuration' ? __VLS_ctx.loadWhatsAppConfiguration() : __VLS_ctx.whatsappTab === 'notifications' ? __VLS_ctx.refreshWhatsAppNotifications() : __VLS_ctx.whatsappTab === 'profile' ? __VLS_ctx.loadWhatsAppProfile() : __VLS_ctx.testWhatsAppCloudConnection();
                } },
            ...{ class: "secondary-button" },
            type: "button",
            disabled: (__VLS_ctx.whatsappWorking || __VLS_ctx.whatsappCloudSaving || __VLS_ctx.whatsappCloudConnectivityTesting || __VLS_ctx.whatsappProfileSaving || __VLS_ctx.favoriteMediaSaving),
            'aria-label': (__VLS_ctx.t('Atualizar')),
            title: (__VLS_ctx.t('Atualizar')),
        });
        const __VLS_140 = {}.RefreshCw;
        /** @type {[typeof __VLS_components.RefreshCw, ]} */ ;
        // @ts-ignore
        const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
            size: (16),
        }));
        const __VLS_142 = __VLS_141({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_141));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
            ...{ class: "settings-tabs whatsapp-tabs" },
            role: "tablist",
            'aria-label': (__VLS_ctx.t('WhatsApp API')),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                        return;
                    if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.whatsappTab = 'log';
                } },
            id: "whatsappLogTab",
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.whatsappTab === 'log' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.whatsappTab === 'log'),
            'aria-controls': "whatsappLogPanel",
        });
        const __VLS_144 = {}.List;
        /** @type {[typeof __VLS_components.List, ]} */ ;
        // @ts-ignore
        const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
            size: (15),
        }));
        const __VLS_146 = __VLS_145({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_145));
        (__VLS_ctx.t('Log'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                        return;
                    if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.whatsappTab = 'configuration';
                } },
            id: "whatsappConfigurationTab",
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.whatsappTab === 'configuration' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.whatsappTab === 'configuration'),
            'aria-controls': "whatsappConfigurationPanel",
        });
        const __VLS_148 = {}.Settings;
        /** @type {[typeof __VLS_components.Settings, ]} */ ;
        // @ts-ignore
        const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
            size: (15),
        }));
        const __VLS_150 = __VLS_149({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_149));
        (__VLS_ctx.t('Configuração'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                        return;
                    if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.whatsappTab = 'notifications';
                } },
            id: "whatsappNotificationsTab",
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.whatsappTab === 'notifications' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.whatsappTab === 'notifications'),
            'aria-controls': "whatsappNotificationsPanel",
        });
        const __VLS_152 = {}.Bell;
        /** @type {[typeof __VLS_components.Bell, ]} */ ;
        // @ts-ignore
        const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
            size: (15),
        }));
        const __VLS_154 = __VLS_153({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_153));
        (__VLS_ctx.t('Notificações'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                        return;
                    if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.whatsappTab = 'profile';
                } },
            id: "whatsappProfileTab",
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.whatsappTab === 'profile' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.whatsappTab === 'profile'),
            'aria-controls': "whatsappProfilePanel",
        });
        const __VLS_156 = {}.Pencil;
        /** @type {[typeof __VLS_components.Pencil, ]} */ ;
        // @ts-ignore
        const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
            size: (15),
        }));
        const __VLS_158 = __VLS_157({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_157));
        (__VLS_ctx.t('Perfil'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                        return;
                    if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.whatsappTab = 'connection';
                } },
            id: "whatsappConnectionTab",
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.whatsappTab === 'connection' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.whatsappTab === 'connection'),
            'aria-controls': "whatsappConnectionPanel",
        });
        const __VLS_160 = {}.MessageCircle;
        /** @type {[typeof __VLS_components.MessageCircle, ]} */ ;
        // @ts-ignore
        const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
            size: (15),
        }));
        const __VLS_162 = __VLS_161({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_161));
        (__VLS_ctx.t('Conexão'));
        if (__VLS_ctx.whatsappError) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "notice-error" },
                role: "alert",
            });
            const __VLS_164 = {}.AlertTriangle;
            /** @type {[typeof __VLS_components.AlertTriangle, ]} */ ;
            // @ts-ignore
            const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
                size: (17),
            }));
            const __VLS_166 = __VLS_165({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_165));
            (__VLS_ctx.t(__VLS_ctx.whatsappError));
        }
        if (__VLS_ctx.whatsappTab === 'log') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                id: "whatsappLogPanel",
                ...{ class: "whatsapp-log-section" },
                role: "tabpanel",
                'aria-labelledby': "whatsappLogTab",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-log-heading" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-log-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.whatsappLogs.length);
            (__VLS_ctx.t('eventos'));
            if (__VLS_ctx.whatsappLogs.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.clearWhatsAppLogs) },
                    ...{ class: "danger-button whatsapp-log-clear" },
                    type: "button",
                    disabled: (__VLS_ctx.whatsappWorking),
                });
                const __VLS_168 = {}.Trash2;
                /** @type {[typeof __VLS_components.Trash2, ]} */ ;
                // @ts-ignore
                const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
                    size: (14),
                }));
                const __VLS_170 = __VLS_169({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_169));
                (__VLS_ctx.t('Apagar log'));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Últimos 100 eventos em memória; o histórico é limpo quando a API reinicia.'));
            if (__VLS_ctx.whatsappLogs.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-log-list" },
                    role: "list",
                });
                for (const [entry] of __VLS_getVForSourceType((__VLS_ctx.whatsappLogs))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                        key: (entry.id),
                        ...{ class: "whatsapp-log-row" },
                        ...{ class: (`whatsapp-log-${entry.level}`) },
                        role: "listitem",
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: "whatsapp-log-icon" },
                    });
                    if (entry.level === 'success') {
                        const __VLS_172 = {}.CircleCheck;
                        /** @type {[typeof __VLS_components.CircleCheck, ]} */ ;
                        // @ts-ignore
                        const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
                            size: (16),
                        }));
                        const __VLS_174 = __VLS_173({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_173));
                    }
                    else if (entry.level === 'error') {
                        const __VLS_176 = {}.CircleAlert;
                        /** @type {[typeof __VLS_components.CircleAlert, ]} */ ;
                        // @ts-ignore
                        const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
                            size: (16),
                        }));
                        const __VLS_178 = __VLS_177({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_177));
                    }
                    else {
                        const __VLS_180 = {}.Activity;
                        /** @type {[typeof __VLS_components.Activity, ]} */ ;
                        // @ts-ignore
                        const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
                            size: (16),
                        }));
                        const __VLS_182 = __VLS_181({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_181));
                    }
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: "whatsapp-log-copy" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (entry.event);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                    (entry.details);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.time, __VLS_intrinsicElements.time)({
                        datetime: (entry.createdAt),
                    });
                    (new Date(entry.createdAt).toLocaleString(__VLS_ctx.dateLocale));
                }
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-log-empty" },
                });
                const __VLS_184 = {}.List;
                /** @type {[typeof __VLS_components.List, ]} */ ;
                // @ts-ignore
                const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
                    size: (20),
                }));
                const __VLS_186 = __VLS_185({
                    size: (20),
                }, ...__VLS_functionalComponentArgsRest(__VLS_185));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.t('Nenhum evento registrado.'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('O log não armazena o conteúdo das mensagens nem números completos.'));
            }
        }
        else if (__VLS_ctx.whatsappTab === 'configuration') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                id: "whatsappConfigurationPanel",
                ...{ class: "whatsapp-config-section" },
                role: "tabpanel",
                'aria-labelledby': "whatsappConfigurationTab",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.fieldset, __VLS_intrinsicElements.fieldset)({
                ...{ class: "whatsapp-channel-choice" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.legend, __VLS_intrinsicElements.legend)({});
            (__VLS_ctx.t('Canal ativo para notificações'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-channel-options" },
                role: "radiogroup",
                'aria-label': (__VLS_ctx.t('Canal ativo para notificações')),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-channel-option" },
                ...{ class: ({ selected: __VLS_ctx.whatsappCloudSettings.connectionMode === 'qr' }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (__VLS_ctx.clearWhatsAppConnectivityTest) },
                type: "radio",
                name: "whatsappConnectionMode",
                value: "qr",
            });
            (__VLS_ctx.whatsappCloudSettings.connectionMode);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.t('WhatsApp Web via QR (API particular)'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.t('Usa a sessão vinculada por QR para enviar os alertas.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-channel-option" },
                ...{ class: ({ selected: __VLS_ctx.whatsappCloudSettings.connectionMode === 'cloud' }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (__VLS_ctx.clearWhatsAppConnectivityTest) },
                type: "radio",
                name: "whatsappConnectionMode",
                value: "cloud",
            });
            (__VLS_ctx.whatsappCloudSettings.connectionMode);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.t('WhatsApp Cloud API'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.t('Usa o token e o número configurados na Meta.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "settings-help" },
            });
            (__VLS_ctx.t('Somente o canal selecionado e salvo será usado para enviar notificações. O outro canal não fará fallback.'));
            if (__VLS_ctx.whatsappCloudSettings.connectionMode !== __VLS_ctx.whatsappSavedConnectionMode) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "whatsapp-manager-warning" },
                    role: "status",
                });
                (__VLS_ctx.t('Seleção pendente. Salve a configuração para ativar este canal.'));
            }
            if (__VLS_ctx.whatsappCloudSettings.connectionMode === 'cloud') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-config-form" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-status-line" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "whatsapp-status-dot" },
                    ...{ class: (__VLS_ctx.whatsappCloudSettings.accessTokenConfigured ? 'whatsapp-status-connected' : 'whatsapp-status-disconnected') },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.t(__VLS_ctx.whatsappCloudSettings.accessTokenConfigured ? 'Cloud API configurada' : 'Cloud API não configurada'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                    for: "whatsappCloudAccessToken",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Token de acesso da Meta'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ onInput: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(!__VLS_ctx.user))
                                return;
                            if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                return;
                            if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                return;
                            if (!!(__VLS_ctx.whatsappTab === 'log'))
                                return;
                            if (!(__VLS_ctx.whatsappTab === 'configuration'))
                                return;
                            if (!(__VLS_ctx.whatsappCloudSettings.connectionMode === 'cloud'))
                                return;
                            __VLS_ctx.whatsappCloudClearAccessToken = false;
                        } },
                    id: "whatsappCloudAccessToken",
                    ...{ class: "settings-input" },
                    type: "password",
                    autocomplete: "new-password",
                    disabled: (__VLS_ctx.whatsappCloudClearAccessToken),
                    placeholder: (__VLS_ctx.whatsappCloudSettings.accessTokenConfigured ? __VLS_ctx.t('Deixe em branco para manter o token salvo.') : ''),
                });
                (__VLS_ctx.whatsappCloudAccessToken);
                if (__VLS_ctx.whatsappCloudSettings.accessTokenConfigured) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                        ...{ class: "theme-setting email-secure-toggle" },
                        for: "whatsappCloudClearToken",
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: "theme-setting-icon" },
                    });
                    const __VLS_188 = {}.LockKeyhole;
                    /** @type {[typeof __VLS_components.LockKeyhole, ]} */ ;
                    // @ts-ignore
                    const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
                        size: (17),
                    }));
                    const __VLS_190 = __VLS_189({
                        size: (17),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_189));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: "theme-setting-copy" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (__VLS_ctx.t('Remover token salvo'));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                    (__VLS_ctx.t('Desativa o envio pela Cloud API; a conexão QR continua independente.'));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                        ...{ onChange: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!!(!__VLS_ctx.user))
                                    return;
                                if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                    return;
                                if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                    return;
                                if (!!(__VLS_ctx.whatsappTab === 'log'))
                                    return;
                                if (!(__VLS_ctx.whatsappTab === 'configuration'))
                                    return;
                                if (!(__VLS_ctx.whatsappCloudSettings.connectionMode === 'cloud'))
                                    return;
                                if (!(__VLS_ctx.whatsappCloudSettings.accessTokenConfigured))
                                    return;
                                __VLS_ctx.whatsappCloudAccessToken = '';
                            } },
                        id: "whatsappCloudClearToken",
                        ...{ class: "theme-switch" },
                        type: "checkbox",
                    });
                    (__VLS_ctx.whatsappCloudClearAccessToken);
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                    for: "whatsappPhoneNumberId",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('ID do número WhatsApp'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    id: "whatsappPhoneNumberId",
                    value: (__VLS_ctx.whatsappCloudSettings.phoneNumberId),
                    ...{ class: "settings-input" },
                    type: "text",
                    inputmode: "numeric",
                    autocomplete: "off",
                    placeholder: "123456789012345",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "email-config-grid whatsapp-cloud-config-grid" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                    for: "whatsappGraphApiVersion",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Versão da API Graph'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    id: "whatsappGraphApiVersion",
                    value: (__VLS_ctx.whatsappCloudSettings.apiVersion),
                    ...{ class: "settings-input" },
                    type: "text",
                    placeholder: "v23.0",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                    for: "whatsappTemplateLanguage",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Idioma do modelo'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    id: "whatsappTemplateLanguage",
                    value: (__VLS_ctx.whatsappCloudSettings.templateLanguage),
                    ...{ class: "settings-input" },
                    type: "text",
                    placeholder: "pt_BR",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                    for: "whatsappTemplateName",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Nome do modelo aprovado'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    id: "whatsappTemplateName",
                    value: (__VLS_ctx.whatsappCloudSettings.templateName),
                    ...{ class: "settings-input" },
                    type: "text",
                    autocomplete: "off",
                    placeholder: "lab_monitor_alarm",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "settings-help" },
                });
                (__VLS_ctx.t('Use o nome e idioma de um modelo aprovado no WhatsApp Manager. Para modelos diferentes de hello_world, o servidor envia três parâmetros: aparelho, estado e localização.'));
                if (__VLS_ctx.whatsappCloudMessage) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "success-message" },
                        role: "status",
                    });
                    (__VLS_ctx.t(__VLS_ctx.whatsappCloudMessage));
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.saveWhatsAppCloudSettings) },
                    ...{ class: "primary-button settings-save-button" },
                    type: "button",
                    disabled: (__VLS_ctx.whatsappCloudSaving),
                });
                if (__VLS_ctx.whatsappCloudSaving) {
                    const __VLS_192 = {}.LoaderCircle;
                    /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                    // @ts-ignore
                    const __VLS_193 = __VLS_asFunctionalComponent(__VLS_192, new __VLS_192({
                        ...{ class: "spin" },
                        size: (16),
                    }));
                    const __VLS_194 = __VLS_193({
                        ...{ class: "spin" },
                        size: (16),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_193));
                }
                (__VLS_ctx.whatsappCloudSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Salvar configuração'));
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-config-form whatsapp-qr-configuration" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "settings-section-heading" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
                (__VLS_ctx.t('Conexão via QR code'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-status-line" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "whatsapp-status-dot" },
                    ...{ class: (`whatsapp-status-${__VLS_ctx.whatsappStatus.state}`) },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.t(__VLS_ctx.whatsappStatus.state === 'connected' ? 'Conectado' : __VLS_ctx.whatsappStatus.state === 'qr' ? 'Aguardando leitura do QR code' : __VLS_ctx.whatsappStatus.state === 'connecting' ? 'Conectando' : 'Desconectado'));
                if (__VLS_ctx.whatsappStatus.state === 'connected' && __VLS_ctx.whatsappStatus.phoneNumber) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "whatsapp-phone" },
                    });
                    (__VLS_ctx.whatsappStatus.phoneNumber);
                }
                if (__VLS_ctx.whatsappStatus.state === 'qr') {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "whatsapp-manager-help" },
                    });
                    (__VLS_ctx.t('Escaneie o QR code com o WhatsApp da conta que enviará os alertas.'));
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "whatsapp-manager-help" },
                });
                (__VLS_ctx.t('Os alertas serão enviados somente a usuários que ativaram WhatsApp no perfil.'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "whatsapp-manager-warning" },
                });
                (__VLS_ctx.t('Este conector não é oficial. O WhatsApp pode desconectar ou bloquear contas que automatizam mensagens.'));
                if (__VLS_ctx.whatsappStatus.state === 'disconnected') {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (__VLS_ctx.connectWhatsApp) },
                        ...{ class: "primary-button whatsapp-action" },
                        type: "button",
                        disabled: (__VLS_ctx.whatsappWorking || __VLS_ctx.whatsappCloudSettings.connectionMode !== __VLS_ctx.whatsappSavedConnectionMode),
                    });
                    if (__VLS_ctx.whatsappWorking) {
                        const __VLS_196 = {}.LoaderCircle;
                        /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                        // @ts-ignore
                        const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
                            ...{ class: "spin" },
                            size: (16),
                        }));
                        const __VLS_198 = __VLS_197({
                            ...{ class: "spin" },
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_197));
                    }
                    else {
                        const __VLS_200 = {}.MessageCircle;
                        /** @type {[typeof __VLS_components.MessageCircle, ]} */ ;
                        // @ts-ignore
                        const __VLS_201 = __VLS_asFunctionalComponent(__VLS_200, new __VLS_200({
                            size: (16),
                        }));
                        const __VLS_202 = __VLS_201({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_201));
                    }
                    (__VLS_ctx.t('Iniciar conexão'));
                }
                else {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (__VLS_ctx.disconnectWhatsApp) },
                        ...{ class: "secondary-button whatsapp-action" },
                        type: "button",
                        disabled: (__VLS_ctx.whatsappWorking),
                    });
                    if (__VLS_ctx.whatsappWorking) {
                        const __VLS_204 = {}.LoaderCircle;
                        /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                        // @ts-ignore
                        const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
                            ...{ class: "spin" },
                            size: (16),
                        }));
                        const __VLS_206 = __VLS_205({
                            ...{ class: "spin" },
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_205));
                    }
                    else {
                        const __VLS_208 = {}.X;
                        /** @type {[typeof __VLS_components.X, ]} */ ;
                        // @ts-ignore
                        const __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208({
                            size: (16),
                        }));
                        const __VLS_210 = __VLS_209({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_209));
                    }
                    (__VLS_ctx.t('Desconectar conta'));
                }
                if (__VLS_ctx.whatsappStatus.state === 'qr') {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "whatsapp-qr-panel" },
                    });
                    if (__VLS_ctx.whatsappStatus.qrDataUrl) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                            ...{ class: "whatsapp-qr-image" },
                            src: (__VLS_ctx.whatsappStatus.qrDataUrl),
                            alt: (__VLS_ctx.t('Escaneie o QR code com o WhatsApp da conta que enviará os alertas.')),
                        });
                    }
                    else {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: "whatsapp-qr-placeholder" },
                        });
                        const __VLS_212 = {}.LoaderCircle;
                        /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                        // @ts-ignore
                        const __VLS_213 = __VLS_asFunctionalComponent(__VLS_212, new __VLS_212({
                            ...{ class: "spin" },
                            size: (24),
                        }));
                        const __VLS_214 = __VLS_213({
                            ...{ class: "spin" },
                            size: (24),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_213));
                    }
                }
                else if (__VLS_ctx.whatsappStatus.state === 'connecting') {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "whatsapp-qr-placeholder" },
                    });
                    const __VLS_216 = {}.LoaderCircle;
                    /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                    // @ts-ignore
                    const __VLS_217 = __VLS_asFunctionalComponent(__VLS_216, new __VLS_216({
                        ...{ class: "spin" },
                        size: (24),
                    }));
                    const __VLS_218 = __VLS_217({
                        ...{ class: "spin" },
                        size: (24),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_217));
                }
                if (__VLS_ctx.whatsappCloudSettings.connectionMode !== __VLS_ctx.whatsappSavedConnectionMode) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "success-message" },
                        role: "status",
                    });
                    (__VLS_ctx.t('Salve a seleção para ativar este canal.'));
                }
                if (__VLS_ctx.whatsappCloudSettings.connectionMode !== __VLS_ctx.whatsappSavedConnectionMode) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (__VLS_ctx.saveWhatsAppCloudSettings) },
                        ...{ class: "primary-button settings-save-button" },
                        type: "button",
                        disabled: (__VLS_ctx.whatsappCloudSaving),
                    });
                    if (__VLS_ctx.whatsappCloudSaving) {
                        const __VLS_220 = {}.LoaderCircle;
                        /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                        // @ts-ignore
                        const __VLS_221 = __VLS_asFunctionalComponent(__VLS_220, new __VLS_220({
                            ...{ class: "spin" },
                            size: (16),
                        }));
                        const __VLS_222 = __VLS_221({
                            ...{ class: "spin" },
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_221));
                    }
                    (__VLS_ctx.whatsappCloudSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Salvar seleção do canal'));
                }
            }
        }
        else if (__VLS_ctx.whatsappTab === 'notifications') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                id: "whatsappNotificationsPanel",
                ...{ class: "whatsapp-config-section" },
                role: "tabpanel",
                'aria-labelledby': "whatsappNotificationsTab",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-config-form" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-config-field" },
                for: "whatsappSenderName",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Nome exibido nas mensagens'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "whatsappSenderName",
                value: (__VLS_ctx.whatsappSettings.senderName),
                ...{ class: "settings-input" },
                type: "text",
                maxlength: "80",
            });
            /** @type {[typeof MessageTemplateEditor, ]} */ ;
            // @ts-ignore
            const __VLS_224 = __VLS_asFunctionalComponent(MessageTemplateEditor, new MessageTemplateEditor({
                id: "whatsappOnlineMessage",
                modelValue: (__VLS_ctx.whatsappSettings.onlineMessage),
                label: (__VLS_ctx.t('Mensagem ao normalizar')),
                maxlength: (500),
            }));
            const __VLS_225 = __VLS_224({
                id: "whatsappOnlineMessage",
                modelValue: (__VLS_ctx.whatsappSettings.onlineMessage),
                label: (__VLS_ctx.t('Mensagem ao normalizar')),
                maxlength: (500),
            }, ...__VLS_functionalComponentArgsRest(__VLS_224));
            /** @type {[typeof MessageTemplateEditor, ]} */ ;
            // @ts-ignore
            const __VLS_227 = __VLS_asFunctionalComponent(MessageTemplateEditor, new MessageTemplateEditor({
                id: "whatsappWarningMessage",
                modelValue: (__VLS_ctx.whatsappSettings.warningMessage),
                label: (__VLS_ctx.t('Mensagem em atenção')),
                maxlength: (500),
            }));
            const __VLS_228 = __VLS_227({
                id: "whatsappWarningMessage",
                modelValue: (__VLS_ctx.whatsappSettings.warningMessage),
                label: (__VLS_ctx.t('Mensagem em atenção')),
                maxlength: (500),
            }, ...__VLS_functionalComponentArgsRest(__VLS_227));
            /** @type {[typeof MessageTemplateEditor, ]} */ ;
            // @ts-ignore
            const __VLS_230 = __VLS_asFunctionalComponent(MessageTemplateEditor, new MessageTemplateEditor({
                id: "whatsappOfflineMessage",
                modelValue: (__VLS_ctx.whatsappSettings.offlineMessage),
                label: (__VLS_ctx.t('Mensagem offline')),
                maxlength: (500),
            }));
            const __VLS_231 = __VLS_230({
                id: "whatsappOfflineMessage",
                modelValue: (__VLS_ctx.whatsappSettings.offlineMessage),
                label: (__VLS_ctx.t('Mensagem offline')),
                maxlength: (500),
            }, ...__VLS_functionalComponentArgsRest(__VLS_230));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.fieldset, __VLS_intrinsicElements.fieldset)({
                ...{ class: "whatsapp-sticker-assignments" },
                disabled: (__VLS_ctx.whatsappSavedConnectionMode !== 'qr'),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.legend, __VLS_intrinsicElements.legend)({});
            (__VLS_ctx.t('Mídia de cada alerta'));
            if (__VLS_ctx.whatsappSavedConnectionMode !== 'qr') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "whatsapp-manager-warning" },
                });
                (__VLS_ctx.t('Imagem e figurinha são enviadas pelo WhatsApp Web via QR; a Cloud API deste projeto usa modelos aprovados.'));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-alert-media-grid" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-alert-media-setting" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-config-field" },
                for: "onlineAlertMediaType",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Mídia'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                ...{ onChange: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(!__VLS_ctx.user))
                            return;
                        if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                            return;
                        if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                            return;
                        if (!!(__VLS_ctx.whatsappTab === 'log'))
                            return;
                        if (!!(__VLS_ctx.whatsappTab === 'configuration'))
                            return;
                        if (!(__VLS_ctx.whatsappTab === 'notifications'))
                            return;
                        __VLS_ctx.setWhatsAppAlertMediaType('online', $event);
                    } },
                id: "onlineAlertMediaType",
                value: (__VLS_ctx.whatsappSettings.onlineMediaType),
                ...{ class: "settings-input select-input" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "none",
            });
            (__VLS_ctx.t('Somente texto'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "image",
            });
            (__VLS_ctx.t('Imagem com mensagem'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "sticker",
            });
            (__VLS_ctx.t('Figurinha'));
            if (__VLS_ctx.whatsappSettings.onlineMediaType !== 'none') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Mídia favorita'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    value: (__VLS_ctx.whatsappSettings.onlineMediaId),
                    ...{ class: "settings-input select-input" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: (null),
                });
                (__VLS_ctx.t('Selecione uma mídia'));
                for (const [media] of __VLS_getVForSourceType((__VLS_ctx.favoriteWhatsAppMedia))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                        key: (media.id),
                        value: (media.id),
                    });
                    (media.name);
                    (media.animated ? ` (${__VLS_ctx.t('Animada')})` : '');
                }
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-alert-media-setting" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-config-field" },
                for: "warningAlertMediaType",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Mídia'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                ...{ onChange: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(!__VLS_ctx.user))
                            return;
                        if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                            return;
                        if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                            return;
                        if (!!(__VLS_ctx.whatsappTab === 'log'))
                            return;
                        if (!!(__VLS_ctx.whatsappTab === 'configuration'))
                            return;
                        if (!(__VLS_ctx.whatsappTab === 'notifications'))
                            return;
                        __VLS_ctx.setWhatsAppAlertMediaType('warning', $event);
                    } },
                id: "warningAlertMediaType",
                value: (__VLS_ctx.whatsappSettings.warningMediaType),
                ...{ class: "settings-input select-input" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "none",
            });
            (__VLS_ctx.t('Somente texto'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "image",
            });
            (__VLS_ctx.t('Imagem com mensagem'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "sticker",
            });
            (__VLS_ctx.t('Figurinha'));
            if (__VLS_ctx.whatsappSettings.warningMediaType !== 'none') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Mídia favorita'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    value: (__VLS_ctx.whatsappSettings.warningMediaId),
                    ...{ class: "settings-input select-input" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: (null),
                });
                (__VLS_ctx.t('Selecione uma mídia'));
                for (const [media] of __VLS_getVForSourceType((__VLS_ctx.favoriteWhatsAppMedia))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                        key: (media.id),
                        value: (media.id),
                    });
                    (media.name);
                    (media.animated ? ` (${__VLS_ctx.t('Animada')})` : '');
                }
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-alert-media-setting" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-config-field" },
                for: "offlineAlertMediaType",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Mídia'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                ...{ onChange: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(!__VLS_ctx.user))
                            return;
                        if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                            return;
                        if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                            return;
                        if (!!(__VLS_ctx.whatsappTab === 'log'))
                            return;
                        if (!!(__VLS_ctx.whatsappTab === 'configuration'))
                            return;
                        if (!(__VLS_ctx.whatsappTab === 'notifications'))
                            return;
                        __VLS_ctx.setWhatsAppAlertMediaType('offline', $event);
                    } },
                id: "offlineAlertMediaType",
                value: (__VLS_ctx.whatsappSettings.offlineMediaType),
                ...{ class: "settings-input select-input" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "none",
            });
            (__VLS_ctx.t('Somente texto'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "image",
            });
            (__VLS_ctx.t('Imagem com mensagem'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "sticker",
            });
            (__VLS_ctx.t('Figurinha'));
            if (__VLS_ctx.whatsappSettings.offlineMediaType !== 'none') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Mídia favorita'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    value: (__VLS_ctx.whatsappSettings.offlineMediaId),
                    ...{ class: "settings-input select-input" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: (null),
                });
                (__VLS_ctx.t('Selecione uma mídia'));
                for (const [media] of __VLS_getVForSourceType((__VLS_ctx.favoriteWhatsAppMedia))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                        key: (media.id),
                        value: (media.id),
                    });
                    (media.name);
                    (media.animated ? ` (${__VLS_ctx.t('Animada')})` : '');
                }
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: "whatsapp-sticker-library" },
                'aria-labelledby': "whatsappMediaLibraryTitle",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-section-heading" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                id: "whatsappMediaLibraryTitle",
            });
            (__VLS_ctx.t('Biblioteca de mídia'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.favoriteWhatsAppMedia.length);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "settings-help" },
            });
            (__VLS_ctx.t('Adicione GIF, WebP, PNG ou JPEG. GIFs e WebPs animados são detectados automaticamente e aparecem em movimento na prévia.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-sticker-import" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-config-field" },
                for: "favoriteMediaName",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Nome da mídia'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "favoriteMediaName",
                value: (__VLS_ctx.favoriteMediaName),
                ...{ class: "settings-input" },
                type: "text",
                maxlength: "48",
                placeholder: (__VLS_ctx.t('Ex.: Alerta do sensor')),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "secondary-button whatsapp-sticker-file" },
                for: "favoriteMediaFile",
            });
            const __VLS_233 = {}.ImagePlus;
            /** @type {[typeof __VLS_components.ImagePlus, ]} */ ;
            // @ts-ignore
            const __VLS_234 = __VLS_asFunctionalComponent(__VLS_233, new __VLS_233({
                size: (15),
            }));
            const __VLS_235 = __VLS_234({
                size: (15),
            }, ...__VLS_functionalComponentArgsRest(__VLS_234));
            (__VLS_ctx.favoriteMediaDataUrl ? __VLS_ctx.t('Mídia selecionada') : __VLS_ctx.t('Escolher mídia'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (__VLS_ctx.selectFavoriteWhatsAppMedia) },
                id: "favoriteMediaFile",
                ...{ class: "visually-hidden" },
                type: "file",
                accept: "image/gif,image/webp,image/png,image/jpeg",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.addFavoriteWhatsAppMedia) },
                ...{ class: "primary-button" },
                type: "button",
                disabled: (__VLS_ctx.favoriteMediaSaving || !__VLS_ctx.favoriteMediaName.trim() || !__VLS_ctx.favoriteMediaDataUrl),
            });
            if (__VLS_ctx.favoriteMediaSaving) {
                const __VLS_237 = {}.LoaderCircle;
                /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                // @ts-ignore
                const __VLS_238 = __VLS_asFunctionalComponent(__VLS_237, new __VLS_237({
                    ...{ class: "spin" },
                    size: (15),
                }));
                const __VLS_239 = __VLS_238({
                    ...{ class: "spin" },
                    size: (15),
                }, ...__VLS_functionalComponentArgsRest(__VLS_238));
            }
            else {
                const __VLS_241 = {}.Plus;
                /** @type {[typeof __VLS_components.Plus, ]} */ ;
                // @ts-ignore
                const __VLS_242 = __VLS_asFunctionalComponent(__VLS_241, new __VLS_241({
                    size: (15),
                }));
                const __VLS_243 = __VLS_242({
                    size: (15),
                }, ...__VLS_functionalComponentArgsRest(__VLS_242));
            }
            (__VLS_ctx.favoriteMediaSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Adicionar aos favoritos'));
            if (__VLS_ctx.favoriteMediaDataUrl) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                    ...{ class: "whatsapp-selected-media-preview" },
                    src: (__VLS_ctx.favoriteMediaDataUrl),
                    alt: (__VLS_ctx.favoriteMediaName),
                });
            }
            if (__VLS_ctx.favoriteWhatsAppMediaError) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "error-message" },
                    role: "alert",
                });
                (__VLS_ctx.t(__VLS_ctx.favoriteWhatsAppMediaError));
            }
            if (__VLS_ctx.favoriteWhatsAppMediaLoading) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "workspace-device-empty" },
                });
                (__VLS_ctx.t('Carregando mídias...'));
            }
            else if (__VLS_ctx.favoriteWhatsAppMedia.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-sticker-library-grid" },
                });
                for (const [media] of __VLS_getVForSourceType((__VLS_ctx.favoriteWhatsAppMedia))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                        key: (media.id),
                        ...{ class: "whatsapp-sticker-favorite" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                        src: (media.previewUrl),
                        alt: (media.name),
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (media.name);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                    (media.animated ? __VLS_ctx.t('Animada') : __VLS_ctx.t('Estática'));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!!(!__VLS_ctx.user))
                                    return;
                                if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                    return;
                                if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                    return;
                                if (!!(__VLS_ctx.whatsappTab === 'log'))
                                    return;
                                if (!!(__VLS_ctx.whatsappTab === 'configuration'))
                                    return;
                                if (!(__VLS_ctx.whatsappTab === 'notifications'))
                                    return;
                                if (!!(__VLS_ctx.favoriteWhatsAppMediaLoading))
                                    return;
                                if (!(__VLS_ctx.favoriteWhatsAppMedia.length))
                                    return;
                                __VLS_ctx.removeFavoriteWhatsAppMedia(media);
                            } },
                        ...{ class: "whatsapp-media-delete" },
                        type: "button",
                        disabled: (__VLS_ctx.favoriteMediaDeletingId !== null),
                        'aria-label': (`${__VLS_ctx.t('Excluir a mídia')} ${media.name}`),
                        title: (__VLS_ctx.t('Excluir a mídia')),
                    });
                    const __VLS_245 = {}.Trash2;
                    /** @type {[typeof __VLS_components.Trash2, ]} */ ;
                    // @ts-ignore
                    const __VLS_246 = __VLS_asFunctionalComponent(__VLS_245, new __VLS_245({
                        size: (14),
                    }));
                    const __VLS_247 = __VLS_246({
                        size: (14),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_246));
                }
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "workspace-device-empty" },
                });
                (__VLS_ctx.t('Nenhuma mídia favorita.'));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "settings-help" },
            });
            (__VLS_ctx.t('Use &#123;&#123;laboratorio&#125;&#125;, &#123;&#123;aparelho&#125;&#125;, &#123;&#123;status&#125;&#125;, &#123;&#123;localizacao&#125;&#125; e &#123;&#123;identificador&#125;&#125; como campos dinâmicos.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "notification-preview-list whatsapp-notification-previews" },
            });
            for (const [preview] of __VLS_getVForSourceType((__VLS_ctx.whatsappNotificationPreviews))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                    key: (preview.id),
                    ...{ class: "whatsapp-notification-preview" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
                (__VLS_ctx.t(preview.label));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-chat-preview" },
                });
                if (preview.media && preview.mediaType === 'sticker') {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                        ...{ class: "whatsapp-message-sticker-preview" },
                        src: (preview.media.previewUrl),
                        alt: (preview.media.name),
                    });
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-preview-bubble" },
                });
                if (preview.media && preview.mediaType === 'image') {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                        ...{ class: "whatsapp-message-image-preview" },
                        src: (preview.media.previewUrl),
                        alt: (preview.media.name),
                    });
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (preview.html) }, null, null);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                (__VLS_ctx.t('agora'));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "settings-help" },
            });
            (__VLS_ctx.t('Estas mensagens são usadas pela conexão via QR. O nome não altera o perfil da conta WhatsApp.'));
            if (__VLS_ctx.whatsappSettingsMessage) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "success-message" },
                    role: "status",
                });
                (__VLS_ctx.t(__VLS_ctx.whatsappSettingsMessage));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.saveWhatsAppSettings) },
                ...{ class: "primary-button settings-save-button" },
                type: "button",
                disabled: (__VLS_ctx.whatsappSettingsSaving || !__VLS_ctx.canSaveWhatsAppNotificationSettings()),
            });
            if (__VLS_ctx.whatsappSettingsSaving) {
                const __VLS_249 = {}.LoaderCircle;
                /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                // @ts-ignore
                const __VLS_250 = __VLS_asFunctionalComponent(__VLS_249, new __VLS_249({
                    ...{ class: "spin" },
                    size: (16),
                }));
                const __VLS_251 = __VLS_250({
                    ...{ class: "spin" },
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_250));
            }
            (__VLS_ctx.whatsappSettingsSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Salvar notificações'));
        }
        else if (__VLS_ctx.whatsappTab === 'profile') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                id: "whatsappProfilePanel",
                ...{ class: "whatsapp-config-section whatsapp-profile-panel" },
                role: "tabpanel",
                'aria-labelledby': "whatsappProfileTab",
            });
            if (__VLS_ctx.whatsappStatus.state === 'connected' && __VLS_ctx.whatsappProfile) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-config-form" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "settings-help" },
                });
                (__VLS_ctx.t('O perfil original será restaurado automaticamente ao desconectar a conta.'));
                (__VLS_ctx.t('As fotos e nomes salvos continuam disponíveis para restauração.'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                    for: "whatsappProfileName",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Nome do perfil WhatsApp'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    id: "whatsappProfileName",
                    value: (__VLS_ctx.whatsappProfileDraftName),
                    ...{ class: "settings-input" },
                    type: "text",
                    maxlength: "80",
                    autocomplete: "off",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-profile-photo-editor" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "whatsapp-profile-photo-preview" },
                });
                if (__VLS_ctx.whatsappProfileDraftPhoto) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                        src: (__VLS_ctx.whatsappProfileDraftPhoto),
                        alt: (__VLS_ctx.t('Foto do perfil WhatsApp')),
                    });
                }
                else {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (__VLS_ctx.whatsappProfileDraftName.slice(0, 1).toUpperCase() || '?');
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-profile-photo-actions" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.t('Foto do perfil WhatsApp'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-profile-photo-buttons" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "secondary-button" },
                    for: "whatsappProfilePhotoFile",
                });
                const __VLS_253 = {}.ImagePlus;
                /** @type {[typeof __VLS_components.ImagePlus, ]} */ ;
                // @ts-ignore
                const __VLS_254 = __VLS_asFunctionalComponent(__VLS_253, new __VLS_253({
                    size: (15),
                }));
                const __VLS_255 = __VLS_254({
                    size: (15),
                }, ...__VLS_functionalComponentArgsRest(__VLS_254));
                (__VLS_ctx.t('Escolher foto'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ onChange: (__VLS_ctx.selectWhatsAppProfilePhoto) },
                    id: "whatsappProfilePhotoFile",
                    ...{ class: "visually-hidden" },
                    type: "file",
                    accept: "image/jpeg,image/png,image/webp",
                });
                if (__VLS_ctx.whatsappProfileDraftPhoto) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!!(!__VLS_ctx.user))
                                    return;
                                if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                    return;
                                if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                    return;
                                if (!!(__VLS_ctx.whatsappTab === 'log'))
                                    return;
                                if (!!(__VLS_ctx.whatsappTab === 'configuration'))
                                    return;
                                if (!!(__VLS_ctx.whatsappTab === 'notifications'))
                                    return;
                                if (!(__VLS_ctx.whatsappTab === 'profile'))
                                    return;
                                if (!(__VLS_ctx.whatsappStatus.state === 'connected' && __VLS_ctx.whatsappProfile))
                                    return;
                                if (!(__VLS_ctx.whatsappProfileDraftPhoto))
                                    return;
                                __VLS_ctx.whatsappProfileDraftPhoto = null;
                            } },
                        ...{ class: "text-button" },
                        type: "button",
                    });
                    (__VLS_ctx.t('Remover foto atual'));
                }
                if (__VLS_ctx.whatsappProfilePhotoError) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "error-message" },
                        role: "alert",
                    });
                    (__VLS_ctx.t(__VLS_ctx.whatsappProfilePhotoError));
                }
                if (__VLS_ctx.whatsappProfileError) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "error-message" },
                        role: "alert",
                    });
                    (__VLS_ctx.t(__VLS_ctx.whatsappProfileError));
                }
                if (__VLS_ctx.whatsappProfileMessage) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "success-message" },
                        role: "status",
                    });
                    (__VLS_ctx.t(__VLS_ctx.whatsappProfileMessage));
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.saveWhatsAppProfile) },
                    ...{ class: "primary-button settings-save-button" },
                    type: "button",
                    disabled: (__VLS_ctx.whatsappProfileSaving || !__VLS_ctx.whatsappProfileDraftName.trim()),
                });
                if (__VLS_ctx.whatsappProfileSaving) {
                    const __VLS_257 = {}.LoaderCircle;
                    /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                    // @ts-ignore
                    const __VLS_258 = __VLS_asFunctionalComponent(__VLS_257, new __VLS_257({
                        ...{ class: "spin" },
                        size: (16),
                    }));
                    const __VLS_259 = __VLS_258({
                        ...{ class: "spin" },
                        size: (16),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_258));
                }
                (__VLS_ctx.whatsappProfileSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Salvar perfil'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-privacy-settings" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "settings-section-heading" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
                (__VLS_ctx.t('Privacidade da conta'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "settings-help" },
                });
                (__VLS_ctx.t('As alterações de privacidade são aplicadas diretamente à conta WhatsApp e permanecem mesmo depois de desconectar o Baileys.'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "settings-help" },
                });
                (__VLS_ctx.t('A regra de exceções pode ser selecionada aqui, mas a lista de pessoas excluídas é gerenciada no próprio WhatsApp.'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                    for: "whatsappPrivacyLastSeen",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Quem pode ver meu visto por último'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    id: "whatsappPrivacyLastSeen",
                    value: (__VLS_ctx.whatsappPrivacySettings.lastSeen),
                    ...{ class: "settings-input select-input" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "all",
                });
                (__VLS_ctx.t('Todos'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "contacts",
                });
                (__VLS_ctx.t('Meus contatos'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "contact_blacklist",
                });
                (__VLS_ctx.t('Meus contatos, exceto...'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "none",
                });
                (__VLS_ctx.t('Ninguém'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                    for: "whatsappPrivacyOnline",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Quem pode ver quando estou online'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    id: "whatsappPrivacyOnline",
                    value: (__VLS_ctx.whatsappPrivacySettings.online),
                    ...{ class: "settings-input select-input" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "all",
                });
                (__VLS_ctx.t('Todos'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "match_last_seen",
                });
                (__VLS_ctx.t('Igual ao visto por último'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                    for: "whatsappPrivacyPhoto",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Quem pode ver minha foto'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    id: "whatsappPrivacyPhoto",
                    value: (__VLS_ctx.whatsappPrivacySettings.profilePhoto),
                    ...{ class: "settings-input select-input" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "all",
                });
                (__VLS_ctx.t('Todos'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "contacts",
                });
                (__VLS_ctx.t('Meus contatos'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "contact_blacklist",
                });
                (__VLS_ctx.t('Meus contatos, exceto...'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "none",
                });
                (__VLS_ctx.t('Ninguém'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                    for: "whatsappPrivacyStatus",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Quem pode ver minhas atualizações de Status'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    id: "whatsappPrivacyStatus",
                    value: (__VLS_ctx.whatsappPrivacySettings.status),
                    ...{ class: "settings-input select-input" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "all",
                });
                (__VLS_ctx.t('Todos'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "contacts",
                });
                (__VLS_ctx.t('Meus contatos'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "contact_blacklist",
                });
                (__VLS_ctx.t('Meus contatos, exceto...'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "none",
                });
                (__VLS_ctx.t('Ninguém'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                    for: "whatsappPrivacyReadReceipts",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Confirmações de leitura'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    id: "whatsappPrivacyReadReceipts",
                    value: (__VLS_ctx.whatsappPrivacySettings.readReceipts),
                    ...{ class: "settings-input select-input" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "all",
                });
                (__VLS_ctx.t('Ativadas'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "none",
                });
                (__VLS_ctx.t('Desativadas'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                    for: "whatsappPrivacyGroups",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Quem pode me adicionar em grupos'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    id: "whatsappPrivacyGroups",
                    value: (__VLS_ctx.whatsappPrivacySettings.groupsAdd),
                    ...{ class: "settings-input select-input" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "all",
                });
                (__VLS_ctx.t('Todos'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "contacts",
                });
                (__VLS_ctx.t('Meus contatos'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "contact_blacklist",
                });
                (__VLS_ctx.t('Meus contatos, exceto...'));
                if (__VLS_ctx.whatsappPrivacyError) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "error-message" },
                        role: "alert",
                    });
                    (__VLS_ctx.t(__VLS_ctx.whatsappPrivacyError));
                }
                if (__VLS_ctx.whatsappPrivacyMessage) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "success-message" },
                        role: "status",
                    });
                    (__VLS_ctx.t(__VLS_ctx.whatsappPrivacyMessage));
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.saveWhatsAppPrivacySettings) },
                    ...{ class: "primary-button settings-save-button" },
                    type: "button",
                    disabled: (__VLS_ctx.whatsappPrivacySaving),
                });
                if (__VLS_ctx.whatsappPrivacySaving) {
                    const __VLS_261 = {}.LoaderCircle;
                    /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                    // @ts-ignore
                    const __VLS_262 = __VLS_asFunctionalComponent(__VLS_261, new __VLS_261({
                        ...{ class: "spin" },
                        size: (16),
                    }));
                    const __VLS_263 = __VLS_262({
                        ...{ class: "spin" },
                        size: (16),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_262));
                }
                (__VLS_ctx.whatsappPrivacySaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Salvar privacidade'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-profile-history" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "settings-section-heading" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
                (__VLS_ctx.t('Histórico de perfis'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.whatsappProfile.history.length);
                for (const [snapshot] of __VLS_getVForSourceType((__VLS_ctx.whatsappProfile.history))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                        key: (snapshot.id),
                        ...{ class: "whatsapp-profile-snapshot" },
                    });
                    if (snapshot.photoDataUrl) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                            ...{ class: "whatsapp-profile-snapshot-photo" },
                            src: (snapshot.photoDataUrl),
                            alt: (''),
                        });
                    }
                    else {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: "whatsapp-profile-snapshot-photo whatsapp-profile-snapshot-fallback" },
                        });
                        (snapshot.name.slice(0, 1).toUpperCase());
                    }
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "whatsapp-profile-snapshot-copy" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (snapshot.name);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                    (snapshot.isOriginal ? __VLS_ctx.t('Perfil original') : __VLS_ctx.t('Versão salva'));
                    (new Date(snapshot.createdAt).toLocaleString(__VLS_ctx.dateLocale));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!!(!__VLS_ctx.user))
                                    return;
                                if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                    return;
                                if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                    return;
                                if (!!(__VLS_ctx.whatsappTab === 'log'))
                                    return;
                                if (!!(__VLS_ctx.whatsappTab === 'configuration'))
                                    return;
                                if (!!(__VLS_ctx.whatsappTab === 'notifications'))
                                    return;
                                if (!(__VLS_ctx.whatsappTab === 'profile'))
                                    return;
                                if (!(__VLS_ctx.whatsappStatus.state === 'connected' && __VLS_ctx.whatsappProfile))
                                    return;
                                __VLS_ctx.restoreWhatsAppProfileSnapshot(snapshot);
                            } },
                        ...{ class: "secondary-button whatsapp-profile-restore" },
                        type: "button",
                        disabled: (__VLS_ctx.whatsappProfileRestoringId !== null || snapshot.id === __VLS_ctx.whatsappProfile.history[0]?.id),
                    });
                    if (__VLS_ctx.whatsappProfileRestoringId === snapshot.id) {
                        const __VLS_265 = {}.LoaderCircle;
                        /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                        // @ts-ignore
                        const __VLS_266 = __VLS_asFunctionalComponent(__VLS_265, new __VLS_265({
                            ...{ class: "spin" },
                            size: (14),
                        }));
                        const __VLS_267 = __VLS_266({
                            ...{ class: "spin" },
                            size: (14),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_266));
                    }
                    else {
                        const __VLS_269 = {}.RefreshCw;
                        /** @type {[typeof __VLS_components.RefreshCw, ]} */ ;
                        // @ts-ignore
                        const __VLS_270 = __VLS_asFunctionalComponent(__VLS_269, new __VLS_269({
                            size: (14),
                        }));
                        const __VLS_271 = __VLS_270({
                            size: (14),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_270));
                    }
                    (__VLS_ctx.t('Restaurar esta versão'));
                }
            }
            else if (__VLS_ctx.whatsappStatus.state === 'connected' && __VLS_ctx.whatsappProfileError.includes('Não foi possível ler o nome original do perfil WhatsApp.')) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
                    ...{ onSubmit: (__VLS_ctx.initializeWhatsAppProfileBaseline) },
                    ...{ class: "whatsapp-config-form whatsapp-profile-recovery" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "settings-section-heading" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
                (__VLS_ctx.t('Recuperar ponto de restauração'));
                if (__VLS_ctx.whatsappProfileError) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "error-message" },
                        role: "alert",
                    });
                    (__VLS_ctx.t(__VLS_ctx.whatsappProfileError));
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "settings-help" },
                });
                (__VLS_ctx.t('O WhatsApp não forneceu o nome do perfil. Confira no aplicativo do celular e informe abaixo o nome que está usando agora. O servidor salvará esse nome e a foto atual como referência antes de liberar as edições.'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                    for: "whatsappProfileBaselineName",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Nome atual exibido no WhatsApp'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    id: "whatsappProfileBaselineName",
                    value: (__VLS_ctx.whatsappProfileBaselineName),
                    ...{ class: "settings-input" },
                    type: "text",
                    maxlength: "80",
                    autocomplete: "off",
                    required: true,
                });
                if (__VLS_ctx.whatsappProfileMessage) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "success-message" },
                        role: "status",
                    });
                    (__VLS_ctx.t(__VLS_ctx.whatsappProfileMessage));
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ class: "primary-button settings-save-button" },
                    type: "submit",
                    disabled: (__VLS_ctx.whatsappProfileBaselineSaving || !__VLS_ctx.whatsappProfileBaselineName.trim()),
                });
                if (__VLS_ctx.whatsappProfileBaselineSaving) {
                    const __VLS_273 = {}.LoaderCircle;
                    /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                    // @ts-ignore
                    const __VLS_274 = __VLS_asFunctionalComponent(__VLS_273, new __VLS_273({
                        ...{ class: "spin" },
                        size: (16),
                    }));
                    const __VLS_275 = __VLS_274({
                        ...{ class: "spin" },
                        size: (16),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_274));
                }
                (__VLS_ctx.whatsappProfileBaselineSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Salvar referência e abrir editor'));
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-log-empty" },
                });
                const __VLS_277 = {}.MessageCircle;
                /** @type {[typeof __VLS_components.MessageCircle, ]} */ ;
                // @ts-ignore
                const __VLS_278 = __VLS_asFunctionalComponent(__VLS_277, new __VLS_277({
                    size: (22),
                }));
                const __VLS_279 = __VLS_278({
                    size: (22),
                }, ...__VLS_functionalComponentArgsRest(__VLS_278));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.t('Conecte a conta via QR para editar o perfil.'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Conecte a conta WhatsApp via QR para gerenciar o perfil.'));
            }
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                id: "whatsappConnectionPanel",
                ...{ class: "whatsapp-manager-section" },
                role: "tabpanel",
                'aria-labelledby': "whatsappConnectionTab",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-manager-copy" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-status-line" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "whatsapp-status-dot" },
                ...{ class: (__VLS_ctx.whatsappCloudConnectivity ? 'whatsapp-status-connected' : __VLS_ctx.whatsappCloudConnectivityError ? 'whatsapp-status-qr' : 'whatsapp-status-disconnected') },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.t(__VLS_ctx.whatsappCloudConnectivity ? __VLS_ctx.whatsappCloudConnectivity.connectionMode === 'qr' ? 'WhatsApp Web conectado' : 'Cloud API operacional' : __VLS_ctx.whatsappCloudConnectivityError ? 'Falha no teste de conexão' : __VLS_ctx.whatsappCloudSettings.connectionMode === 'qr' ? 'Sessão QR não testada' : 'Cloud API não testada'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "whatsapp-manager-help" },
            });
            (__VLS_ctx.t(__VLS_ctx.whatsappCloudSettings.connectionMode === 'qr' ? 'O teste verifica se a sessão vinculada via QR está conectada.' : 'O teste consulta os dados do número na Meta Graph API sem enviar mensagens.'));
            if (__VLS_ctx.whatsappCloudConnectivity?.verifiedName) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "whatsapp-phone" },
                });
                (__VLS_ctx.whatsappCloudConnectivity.verifiedName);
            }
            if (__VLS_ctx.whatsappCloudConnectivity?.displayPhoneNumber) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "whatsapp-manager-help" },
                });
                (__VLS_ctx.whatsappCloudConnectivity.displayPhoneNumber);
            }
            if (__VLS_ctx.whatsappCloudConnectivityError) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "error-message" },
                    role: "alert",
                });
                (__VLS_ctx.t(__VLS_ctx.whatsappCloudConnectivityError));
            }
            if (__VLS_ctx.whatsappCloudSettings.connectionMode !== __VLS_ctx.whatsappSavedConnectionMode) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "whatsapp-manager-warning" },
                });
                (__VLS_ctx.t('Salve o canal selecionado na aba Configuração antes de testar.'));
            }
            else if (__VLS_ctx.whatsappCloudSettings.connectionMode === 'cloud' && (!__VLS_ctx.whatsappCloudSettings.accessTokenConfigured || !__VLS_ctx.whatsappCloudSettings.phoneNumberId)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "whatsapp-manager-warning" },
                });
                (__VLS_ctx.t('Configure e salve o token e o ID do número antes de testar.'));
            }
            else if (__VLS_ctx.whatsappCloudSettings.connectionMode === 'qr' && __VLS_ctx.whatsappStatus.state !== 'connected') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "whatsapp-manager-warning" },
                });
                (__VLS_ctx.t('Conecte o WhatsApp via QR code na aba Configuração antes de testar.'));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.testWhatsAppCloudConnection) },
                ...{ class: "primary-button whatsapp-action" },
                type: "button",
                disabled: (__VLS_ctx.whatsappCloudConnectivityTesting || __VLS_ctx.whatsappCloudSettings.connectionMode !== __VLS_ctx.whatsappSavedConnectionMode || (__VLS_ctx.whatsappCloudSettings.connectionMode === 'cloud' && (!__VLS_ctx.whatsappCloudSettings.accessTokenConfigured || !__VLS_ctx.whatsappCloudSettings.phoneNumberId)) || (__VLS_ctx.whatsappCloudSettings.connectionMode === 'qr' && __VLS_ctx.whatsappStatus.state !== 'connected')),
            });
            if (__VLS_ctx.whatsappCloudConnectivityTesting) {
                const __VLS_281 = {}.LoaderCircle;
                /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                // @ts-ignore
                const __VLS_282 = __VLS_asFunctionalComponent(__VLS_281, new __VLS_281({
                    ...{ class: "spin" },
                    size: (16),
                }));
                const __VLS_283 = __VLS_282({
                    ...{ class: "spin" },
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_282));
            }
            else {
                const __VLS_285 = {}.RefreshCw;
                /** @type {[typeof __VLS_components.RefreshCw, ]} */ ;
                // @ts-ignore
                const __VLS_286 = __VLS_asFunctionalComponent(__VLS_285, new __VLS_285({
                    size: (16),
                }));
                const __VLS_287 = __VLS_286({
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_286));
            }
            (__VLS_ctx.whatsappCloudConnectivityTesting ? __VLS_ctx.t('Testando conexão...') : __VLS_ctx.t('Testar conexão'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "email-connection-mark" },
            });
            const __VLS_289 = {}.MessageCircle;
            /** @type {[typeof __VLS_components.MessageCircle, ]} */ ;
            // @ts-ignore
            const __VLS_290 = __VLS_asFunctionalComponent(__VLS_289, new __VLS_289({
                size: (36),
            }));
            const __VLS_291 = __VLS_290({
                size: (36),
            }, ...__VLS_functionalComponentArgsRest(__VLS_290));
        }
    }
    else if (__VLS_ctx.managementTab === 'email' && __VLS_ctx.isWhatsAppDashboardAdmin) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "whatsapp-management-panel email-management-panel" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "page-heading" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "eyebrow" },
        });
        (__VLS_ctx.t('GERENCIAMENTO'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
        (__VLS_ctx.t('E-mail API'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "heading-sub" },
        });
        (__VLS_ctx.t(__VLS_ctx.emailTab === 'log' ? 'Log de eventos' : __VLS_ctx.emailTab === 'configuration' ? 'Configuração de e-mail' : __VLS_ctx.emailTab === 'notifications' ? 'Notificações' : 'Conexão SMTP'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    if (!(__VLS_ctx.managementTab === 'email' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.emailTab === 'log' ? __VLS_ctx.loadEmailLogs() : __VLS_ctx.loadEmailSettings();
                } },
            ...{ class: "secondary-button" },
            type: "button",
            disabled: (__VLS_ctx.emailWorking || __VLS_ctx.emailSettingsSaving),
            'aria-label': (__VLS_ctx.t('Atualizar')),
            title: (__VLS_ctx.t('Atualizar')),
        });
        const __VLS_293 = {}.RefreshCw;
        /** @type {[typeof __VLS_components.RefreshCw, ]} */ ;
        // @ts-ignore
        const __VLS_294 = __VLS_asFunctionalComponent(__VLS_293, new __VLS_293({
            size: (16),
        }));
        const __VLS_295 = __VLS_294({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_294));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
            ...{ class: "settings-tabs whatsapp-tabs" },
            role: "tablist",
            'aria-label': (__VLS_ctx.t('E-mail API')),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    if (!(__VLS_ctx.managementTab === 'email' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.emailTab = 'log';
                } },
            id: "emailLogTab",
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.emailTab === 'log' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.emailTab === 'log'),
            'aria-controls': "emailLogPanel",
        });
        const __VLS_297 = {}.List;
        /** @type {[typeof __VLS_components.List, ]} */ ;
        // @ts-ignore
        const __VLS_298 = __VLS_asFunctionalComponent(__VLS_297, new __VLS_297({
            size: (15),
        }));
        const __VLS_299 = __VLS_298({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_298));
        (__VLS_ctx.t('Log'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    if (!(__VLS_ctx.managementTab === 'email' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.emailTab = 'configuration';
                } },
            id: "emailConfigurationTab",
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.emailTab === 'configuration' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.emailTab === 'configuration'),
            'aria-controls': "emailConfigurationPanel",
        });
        const __VLS_301 = {}.Settings;
        /** @type {[typeof __VLS_components.Settings, ]} */ ;
        // @ts-ignore
        const __VLS_302 = __VLS_asFunctionalComponent(__VLS_301, new __VLS_301({
            size: (15),
        }));
        const __VLS_303 = __VLS_302({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_302));
        (__VLS_ctx.t('Configuração'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    if (!(__VLS_ctx.managementTab === 'email' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.emailTab = 'notifications';
                } },
            id: "emailNotificationsTab",
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.emailTab === 'notifications' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.emailTab === 'notifications'),
            'aria-controls': "emailNotificationsPanel",
        });
        const __VLS_305 = {}.Bell;
        /** @type {[typeof __VLS_components.Bell, ]} */ ;
        // @ts-ignore
        const __VLS_306 = __VLS_asFunctionalComponent(__VLS_305, new __VLS_305({
            size: (15),
        }));
        const __VLS_307 = __VLS_306({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_306));
        (__VLS_ctx.t('Notificações'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    if (!(__VLS_ctx.managementTab === 'email' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.emailTab = 'connection';
                } },
            id: "emailConnectionTab",
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.emailTab === 'connection' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.emailTab === 'connection'),
            'aria-controls': "emailConnectionPanel",
        });
        const __VLS_309 = {}.Mail;
        /** @type {[typeof __VLS_components.Mail, ]} */ ;
        // @ts-ignore
        const __VLS_310 = __VLS_asFunctionalComponent(__VLS_309, new __VLS_309({
            size: (15),
        }));
        const __VLS_311 = __VLS_310({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_310));
        (__VLS_ctx.t('Conexão'));
        if (__VLS_ctx.emailError) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "notice-error" },
                role: "alert",
            });
            const __VLS_313 = {}.AlertTriangle;
            /** @type {[typeof __VLS_components.AlertTriangle, ]} */ ;
            // @ts-ignore
            const __VLS_314 = __VLS_asFunctionalComponent(__VLS_313, new __VLS_313({
                size: (17),
            }));
            const __VLS_315 = __VLS_314({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_314));
            (__VLS_ctx.t(__VLS_ctx.emailError));
        }
        if (__VLS_ctx.emailMessage) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "success-message" },
                role: "status",
            });
            (__VLS_ctx.t(__VLS_ctx.emailMessage));
        }
        if (__VLS_ctx.emailTab === 'log') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                id: "emailLogPanel",
                ...{ class: "whatsapp-log-section" },
                role: "tabpanel",
                'aria-labelledby': "emailLogTab",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-log-heading" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-log-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.emailLogs.length);
            (__VLS_ctx.t('eventos'));
            if (__VLS_ctx.emailLogs.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.clearEmailLogs) },
                    ...{ class: "danger-button whatsapp-log-clear" },
                    type: "button",
                    disabled: (__VLS_ctx.emailWorking),
                });
                const __VLS_317 = {}.Trash2;
                /** @type {[typeof __VLS_components.Trash2, ]} */ ;
                // @ts-ignore
                const __VLS_318 = __VLS_asFunctionalComponent(__VLS_317, new __VLS_317({
                    size: (14),
                }));
                const __VLS_319 = __VLS_318({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_318));
                (__VLS_ctx.t('Apagar log de e-mail'));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Últimos 100 eventos em memória; o histórico é limpo quando a API reinicia.'));
            if (__VLS_ctx.emailLogs.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-log-list" },
                    role: "list",
                });
                for (const [entry] of __VLS_getVForSourceType((__VLS_ctx.emailLogs))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                        key: (entry.id),
                        ...{ class: "whatsapp-log-row" },
                        ...{ class: (`whatsapp-log-${entry.level}`) },
                        role: "listitem",
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: "whatsapp-log-icon" },
                    });
                    if (entry.level === 'success') {
                        const __VLS_321 = {}.CircleCheck;
                        /** @type {[typeof __VLS_components.CircleCheck, ]} */ ;
                        // @ts-ignore
                        const __VLS_322 = __VLS_asFunctionalComponent(__VLS_321, new __VLS_321({
                            size: (16),
                        }));
                        const __VLS_323 = __VLS_322({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_322));
                    }
                    else if (entry.level === 'error') {
                        const __VLS_325 = {}.CircleAlert;
                        /** @type {[typeof __VLS_components.CircleAlert, ]} */ ;
                        // @ts-ignore
                        const __VLS_326 = __VLS_asFunctionalComponent(__VLS_325, new __VLS_325({
                            size: (16),
                        }));
                        const __VLS_327 = __VLS_326({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_326));
                    }
                    else {
                        const __VLS_329 = {}.Activity;
                        /** @type {[typeof __VLS_components.Activity, ]} */ ;
                        // @ts-ignore
                        const __VLS_330 = __VLS_asFunctionalComponent(__VLS_329, new __VLS_329({
                            size: (16),
                        }));
                        const __VLS_331 = __VLS_330({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_330));
                    }
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: "whatsapp-log-copy" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (entry.event);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                    (entry.details);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.time, __VLS_intrinsicElements.time)({
                        datetime: (entry.createdAt),
                    });
                    (new Date(entry.createdAt).toLocaleString(__VLS_ctx.dateLocale));
                }
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-log-empty" },
                });
                const __VLS_333 = {}.List;
                /** @type {[typeof __VLS_components.List, ]} */ ;
                // @ts-ignore
                const __VLS_334 = __VLS_asFunctionalComponent(__VLS_333, new __VLS_333({
                    size: (20),
                }));
                const __VLS_335 = __VLS_334({
                    size: (20),
                }, ...__VLS_functionalComponentArgsRest(__VLS_334));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.t('Nenhum e-mail enviado.'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('O log guarda resultados e destinatários mascarados, nunca o conteúdo.'));
            }
        }
        else if (__VLS_ctx.emailTab === 'configuration') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                id: "emailConfigurationPanel",
                ...{ class: "whatsapp-config-section" },
                role: "tabpanel",
                'aria-labelledby': "emailConfigurationTab",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-config-form" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "email-config-grid" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-config-field" },
                for: "emailSmtpHost",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Servidor SMTP'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "emailSmtpHost",
                value: (__VLS_ctx.emailSmtpDraft.smtpHost),
                ...{ class: "settings-input" },
                type: "text",
                autocomplete: "off",
                placeholder: "smtp.example.com",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-config-field" },
                for: "emailSmtpPort",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Porta SMTP'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "emailSmtpPort",
                ...{ class: "settings-input" },
                type: "number",
                min: "1",
                max: "65535",
            });
            (__VLS_ctx.emailSmtpDraft.smtpPort);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-config-field" },
                for: "emailSmtpUser",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Usuário SMTP'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "emailSmtpUser",
                value: (__VLS_ctx.emailSmtpDraft.smtpUser),
                ...{ class: "settings-input" },
                type: "text",
                autocomplete: "username",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-config-field" },
                for: "emailSenderAddress",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('E-mail do remetente'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "emailSenderAddress",
                ...{ class: "settings-input" },
                type: "email",
                autocomplete: "email",
            });
            (__VLS_ctx.emailSmtpDraft.senderEmail);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-config-field" },
                for: "emailSenderName",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Nome do remetente'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "emailSenderName",
                value: (__VLS_ctx.emailSmtpDraft.senderName),
                ...{ class: "settings-input" },
                type: "text",
                maxlength: "80",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-config-field" },
                for: "emailSmtpPassword",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Senha SMTP'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "emailSmtpPassword",
                ...{ class: "settings-input" },
                type: "password",
                autocomplete: "new-password",
                placeholder: (__VLS_ctx.emailSettings.passwordConfigured ? __VLS_ctx.t('Deixe em branco para manter a senha salva.') : ''),
            });
            (__VLS_ctx.emailPassword);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "theme-setting email-secure-toggle" },
                for: "emailSmtpSecure",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "theme-setting-icon" },
            });
            const __VLS_337 = {}.ShieldCheck;
            /** @type {[typeof __VLS_components.ShieldCheck, ]} */ ;
            // @ts-ignore
            const __VLS_338 = __VLS_asFunctionalComponent(__VLS_337, new __VLS_337({
                size: (17),
            }));
            const __VLS_339 = __VLS_338({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_338));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "theme-setting-copy" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.t('Conexão segura (TLS)'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.t('Ative para SMTP com TLS implícito, geralmente na porta 465.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "emailSmtpSecure",
                ...{ class: "theme-switch" },
                type: "checkbox",
            });
            (__VLS_ctx.emailSmtpDraft.smtpSecure);
            if (__VLS_ctx.emailSettings.passwordConfigured) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "theme-setting email-secure-toggle" },
                    for: "emailClearPassword",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "theme-setting-icon" },
                });
                const __VLS_341 = {}.LockKeyhole;
                /** @type {[typeof __VLS_components.LockKeyhole, ]} */ ;
                // @ts-ignore
                const __VLS_342 = __VLS_asFunctionalComponent(__VLS_341, new __VLS_341({
                    size: (17),
                }));
                const __VLS_343 = __VLS_342({
                    size: (17),
                }, ...__VLS_functionalComponentArgsRest(__VLS_342));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "theme-setting-copy" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.t('Apagar senha salva'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                (__VLS_ctx.t('Remova a senha cifrada do servidor.'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    id: "emailClearPassword",
                    ...{ class: "theme-switch" },
                    type: "checkbox",
                });
                (__VLS_ctx.emailClearPassword);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "settings-help" },
            });
            (__VLS_ctx.t('A senha SMTP é cifrada no servidor.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.saveEmailSettings) },
                ...{ class: "primary-button settings-save-button" },
                type: "button",
                disabled: (__VLS_ctx.emailSettingsSaving),
            });
            if (__VLS_ctx.emailSettingsSaving) {
                const __VLS_345 = {}.LoaderCircle;
                /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                // @ts-ignore
                const __VLS_346 = __VLS_asFunctionalComponent(__VLS_345, new __VLS_345({
                    ...{ class: "spin" },
                    size: (16),
                }));
                const __VLS_347 = __VLS_346({
                    ...{ class: "spin" },
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_346));
            }
            (__VLS_ctx.emailSettingsSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Salvar configuração de e-mail'));
        }
        else if (__VLS_ctx.emailTab === 'notifications') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                id: "emailNotificationsPanel",
                ...{ class: "whatsapp-config-section" },
                role: "tabpanel",
                'aria-labelledby': "emailNotificationsTab",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-config-form" },
            });
            /** @type {[typeof MessageTemplateEditor, ]} */ ;
            // @ts-ignore
            const __VLS_349 = __VLS_asFunctionalComponent(MessageTemplateEditor, new MessageTemplateEditor({
                id: "emailOnlineMessage",
                modelValue: (__VLS_ctx.emailNotificationDraft.onlineMessage),
                label: (__VLS_ctx.t('Mensagem de e-mail ao normalizar')),
                maxlength: (1000),
            }));
            const __VLS_350 = __VLS_349({
                id: "emailOnlineMessage",
                modelValue: (__VLS_ctx.emailNotificationDraft.onlineMessage),
                label: (__VLS_ctx.t('Mensagem de e-mail ao normalizar')),
                maxlength: (1000),
            }, ...__VLS_functionalComponentArgsRest(__VLS_349));
            /** @type {[typeof MessageTemplateEditor, ]} */ ;
            // @ts-ignore
            const __VLS_352 = __VLS_asFunctionalComponent(MessageTemplateEditor, new MessageTemplateEditor({
                id: "emailWarningMessage",
                modelValue: (__VLS_ctx.emailNotificationDraft.warningMessage),
                label: (__VLS_ctx.t('Mensagem de e-mail em atenção')),
                maxlength: (1000),
            }));
            const __VLS_353 = __VLS_352({
                id: "emailWarningMessage",
                modelValue: (__VLS_ctx.emailNotificationDraft.warningMessage),
                label: (__VLS_ctx.t('Mensagem de e-mail em atenção')),
                maxlength: (1000),
            }, ...__VLS_functionalComponentArgsRest(__VLS_352));
            /** @type {[typeof MessageTemplateEditor, ]} */ ;
            // @ts-ignore
            const __VLS_355 = __VLS_asFunctionalComponent(MessageTemplateEditor, new MessageTemplateEditor({
                id: "emailOfflineMessage",
                modelValue: (__VLS_ctx.emailNotificationDraft.offlineMessage),
                label: (__VLS_ctx.t('Mensagem de e-mail offline')),
                maxlength: (1000),
            }));
            const __VLS_356 = __VLS_355({
                id: "emailOfflineMessage",
                modelValue: (__VLS_ctx.emailNotificationDraft.offlineMessage),
                label: (__VLS_ctx.t('Mensagem de e-mail offline')),
                maxlength: (1000),
            }, ...__VLS_functionalComponentArgsRest(__VLS_355));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "settings-help" },
            });
            (__VLS_ctx.t('Use &#123;&#123;laboratorio&#125;&#125;, &#123;&#123;aparelho&#125;&#125;, &#123;&#123;status&#125;&#125;, &#123;&#123;localizacao&#125;&#125; e &#123;&#123;identificador&#125;&#125; como campos dinâmicos.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "notification-preview-list email-notification-previews" },
            });
            for (const [preview] of __VLS_getVForSourceType((__VLS_ctx.emailNotificationPreviews))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                    key: (preview.id),
                    ...{ class: "email-notification-preview" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
                (__VLS_ctx.t(preview.label));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "email-preview-document" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.emailSmtpDraft.senderName || 'LAB/MONITOR');
                __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "email-preview-subject" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Assunto'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "email-preview-body" },
                });
                __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (preview.html) }, null, null);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({});
                (__VLS_ctx.t('Notificação automática do sistema de monitoramento.'));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "settings-help" },
            });
            (__VLS_ctx.t('As mensagens são enviadas em HTML e texto simples.'));
            if (__VLS_ctx.emailMessage) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "success-message" },
                    role: "status",
                });
                (__VLS_ctx.t(__VLS_ctx.emailMessage));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.saveEmailNotificationDraft) },
                ...{ class: "primary-button settings-save-button" },
                type: "button",
                disabled: (__VLS_ctx.emailSettingsSaving),
            });
            if (__VLS_ctx.emailSettingsSaving) {
                const __VLS_358 = {}.LoaderCircle;
                /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                // @ts-ignore
                const __VLS_359 = __VLS_asFunctionalComponent(__VLS_358, new __VLS_358({
                    ...{ class: "spin" },
                    size: (16),
                }));
                const __VLS_360 = __VLS_359({
                    ...{ class: "spin" },
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_359));
            }
            (__VLS_ctx.emailSettingsSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Salvar notificações'));
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                id: "emailConnectionPanel",
                ...{ class: "whatsapp-manager-section" },
                role: "tabpanel",
                'aria-labelledby': "emailConnectionTab",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-manager-copy" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-status-line" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "whatsapp-status-dot" },
                ...{ class: (`whatsapp-status-${__VLS_ctx.emailConnectionState === 'connected' ? 'connected' : __VLS_ctx.emailConnectionState === 'error' ? 'qr' : 'disconnected'}`) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.t(__VLS_ctx.emailConnectionState === 'connected' ? 'Conexão SMTP ativa' : __VLS_ctx.emailConnectionState === 'error' ? 'Falha na conexão SMTP' : 'Conexão SMTP não testada'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "whatsapp-manager-help" },
            });
            (__VLS_ctx.emailSettings.smtpHost ? `${__VLS_ctx.emailSettings.smtpHost}:${__VLS_ctx.emailSettings.smtpPort}` : __VLS_ctx.t('Servidor SMTP'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "whatsapp-manager-help" },
            });
            (__VLS_ctx.t('O teste valida autenticação SMTP sem enviar uma mensagem.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.testEmailConnection) },
                ...{ class: "primary-button whatsapp-action" },
                type: "button",
                disabled: (__VLS_ctx.emailWorking || !__VLS_ctx.emailSettings.passwordConfigured),
            });
            if (__VLS_ctx.emailWorking) {
                const __VLS_362 = {}.LoaderCircle;
                /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                // @ts-ignore
                const __VLS_363 = __VLS_asFunctionalComponent(__VLS_362, new __VLS_362({
                    ...{ class: "spin" },
                    size: (16),
                }));
                const __VLS_364 = __VLS_363({
                    ...{ class: "spin" },
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_363));
            }
            else {
                const __VLS_366 = {}.ShieldCheck;
                /** @type {[typeof __VLS_components.ShieldCheck, ]} */ ;
                // @ts-ignore
                const __VLS_367 = __VLS_asFunctionalComponent(__VLS_366, new __VLS_366({
                    size: (16),
                }));
                const __VLS_368 = __VLS_367({
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_367));
            }
            (__VLS_ctx.t('Testar conexão SMTP'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "email-connection-mark" },
            });
            const __VLS_370 = {}.Mail;
            /** @type {[typeof __VLS_components.Mail, ]} */ ;
            // @ts-ignore
            const __VLS_371 = __VLS_asFunctionalComponent(__VLS_370, new __VLS_370({
                size: (36),
            }));
            const __VLS_372 = __VLS_371({
                size: (36),
            }, ...__VLS_functionalComponentArgsRest(__VLS_371));
        }
    }
    else {
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
        const __VLS_374 = {}.RefreshCw;
        /** @type {[typeof __VLS_components.RefreshCw, ]} */ ;
        // @ts-ignore
        const __VLS_375 = __VLS_asFunctionalComponent(__VLS_374, new __VLS_374({
            size: (16),
        }));
        const __VLS_376 = __VLS_375({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_375));
        (__VLS_ctx.t('Atualizar'));
        if (__VLS_ctx.pageError) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "notice-error" },
                role: "alert",
            });
            const __VLS_378 = {}.AlertTriangle;
            /** @type {[typeof __VLS_components.AlertTriangle, ]} */ ;
            // @ts-ignore
            const __VLS_379 = __VLS_asFunctionalComponent(__VLS_378, new __VLS_378({
                size: (17),
            }));
            const __VLS_380 = __VLS_379({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_379));
            (__VLS_ctx.t(__VLS_ctx.pageError));
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
        const __VLS_382 = {}.Cpu;
        /** @type {[typeof __VLS_components.Cpu, ]} */ ;
        // @ts-ignore
        const __VLS_383 = __VLS_asFunctionalComponent(__VLS_382, new __VLS_382({
            size: (17),
        }));
        const __VLS_384 = __VLS_383({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_383));
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
        const __VLS_386 = {}.Signal;
        /** @type {[typeof __VLS_components.Signal, ]} */ ;
        // @ts-ignore
        const __VLS_387 = __VLS_asFunctionalComponent(__VLS_386, new __VLS_386({
            size: (17),
        }));
        const __VLS_388 = __VLS_387({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_387));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "metric-value" },
        });
        (__VLS_ctx.onlineCount);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('aparelhos'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "metric-foot positive" },
        });
        const __VLS_390 = {}.Check;
        /** @type {[typeof __VLS_components.Check, ]} */ ;
        // @ts-ignore
        const __VLS_391 = __VLS_asFunctionalComponent(__VLS_390, new __VLS_390({
            size: (13),
        }));
        const __VLS_392 = __VLS_391({
            size: (13),
        }, ...__VLS_functionalComponentArgsRest(__VLS_391));
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
        const __VLS_394 = {}.AlertTriangle;
        /** @type {[typeof __VLS_components.AlertTriangle, ]} */ ;
        // @ts-ignore
        const __VLS_395 = __VLS_asFunctionalComponent(__VLS_394, new __VLS_394({
            size: (17),
        }));
        const __VLS_396 = __VLS_395({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_395));
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
        const __VLS_398 = {}.Activity;
        /** @type {[typeof __VLS_components.Activity, ]} */ ;
        // @ts-ignore
        const __VLS_399 = __VLS_asFunctionalComponent(__VLS_398, new __VLS_398({
            size: (17),
        }));
        const __VLS_400 = __VLS_399({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_399));
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
        const __VLS_402 = {}.ArrowDownToLine;
        /** @type {[typeof __VLS_components.ArrowDownToLine, ]} */ ;
        // @ts-ignore
        const __VLS_403 = __VLS_asFunctionalComponent(__VLS_402, new __VLS_402({
            size: (16),
        }));
        const __VLS_404 = __VLS_403({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_403));
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
        const __VLS_406 = {}.Search;
        /** @type {[typeof __VLS_components.Search, ]} */ ;
        // @ts-ignore
        const __VLS_407 = __VLS_asFunctionalComponent(__VLS_406, new __VLS_406({
            size: (16),
        }));
        const __VLS_408 = __VLS_407({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_407));
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
                            if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                return;
                            if (!!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                return;
                            if (!!(__VLS_ctx.managementTab === 'email' && __VLS_ctx.isWhatsAppDashboardAdmin))
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
                if (device.canSimulate) {
                    const __VLS_410 = {}.Bot;
                    /** @type {[typeof __VLS_components.Bot, ]} */ ;
                    // @ts-ignore
                    const __VLS_411 = __VLS_asFunctionalComponent(__VLS_410, new __VLS_410({
                        size: (17),
                    }));
                    const __VLS_412 = __VLS_411({
                        size: (17),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_411));
                }
                else {
                    const __VLS_414 = {}.Cpu;
                    /** @type {[typeof __VLS_components.Cpu, ]} */ ;
                    // @ts-ignore
                    const __VLS_415 = __VLS_asFunctionalComponent(__VLS_414, new __VLS_414({
                        size: (17),
                    }));
                    const __VLS_416 = __VLS_415({
                        size: (17),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_415));
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "device-identity-copy" },
                });
                (__VLS_ctx.deviceDisplayName(device));
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
                        ...{ class: (sensor.reading ? (sensor.reading.alert ? 'health-warning' : device.status === 'offline' ? 'health-offline' : 'health-online') : 'health-missing') },
                        title: (`${sensor.name}: ${sensor.reading ? sensor.reading.alert ? __VLS_ctx.t('Em atenção') : device.status === 'offline' ? __VLS_ctx.deviceStatusLabel('offline') : __VLS_ctx.deviceStatusLabel('online') : __VLS_ctx.t('sem leitura recebida')}`),
                    });
                    const __VLS_418 = ((__VLS_ctx.readingIcon(sensor.key)));
                    // @ts-ignore
                    const __VLS_419 = __VLS_asFunctionalComponent(__VLS_418, new __VLS_418({
                        size: (15),
                    }));
                    const __VLS_420 = __VLS_419({
                        size: (15),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_419));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (sensor.shortName);
                    const __VLS_422 = ((sensor.reading ? sensor.reading.alert ? __VLS_ctx.AlertTriangle : __VLS_ctx.deviceStatusIcon(device.status === 'offline' ? 'offline' : 'online') : __VLS_ctx.CircleMinus));
                    // @ts-ignore
                    const __VLS_423 = __VLS_asFunctionalComponent(__VLS_422, new __VLS_422({
                        size: (15),
                    }));
                    const __VLS_424 = __VLS_423({
                        size: (15),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_423));
                }
                const __VLS_426 = {}.ChevronDown;
                /** @type {[typeof __VLS_components.ChevronDown, ]} */ ;
                // @ts-ignore
                const __VLS_427 = __VLS_asFunctionalComponent(__VLS_426, new __VLS_426({
                    ...{ class: "device-expand-icon" },
                    ...{ class: ({ expanded: __VLS_ctx.isDeviceExpanded(device.id) }) },
                    size: (18),
                }));
                const __VLS_428 = __VLS_427({
                    ...{ class: "device-expand-icon" },
                    ...{ class: ({ expanded: __VLS_ctx.isDeviceExpanded(device.id) }) },
                    size: (18),
                }, ...__VLS_functionalComponentArgsRest(__VLS_427));
                if (__VLS_ctx.isDeviceExpanded(device.id)) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        id: (`device-details-${device.id}`),
                        ...{ class: "device-details" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "device-alias-row" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "device-alias-copy" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (__VLS_ctx.t('Nome na dashboard'));
                    if (__VLS_ctx.editingDeviceAliasId === device.id) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                            ...{ onKeydown: (...[$event]) => {
                                    if (!!(__VLS_ctx.loading))
                                        return;
                                    if (!!(!__VLS_ctx.user))
                                        return;
                                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                        return;
                                    if (!!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                        return;
                                    if (!!(__VLS_ctx.managementTab === 'email' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                        return;
                                    if (!(__VLS_ctx.filteredDevices.length))
                                        return;
                                    if (!(__VLS_ctx.isDeviceExpanded(device.id)))
                                        return;
                                    if (!(__VLS_ctx.editingDeviceAliasId === device.id))
                                        return;
                                    __VLS_ctx.saveDeviceAlias(device);
                                } },
                            ...{ onKeydown: (__VLS_ctx.cancelDeviceAliasEdit) },
                            value: (__VLS_ctx.deviceAliasDraft),
                            ...{ class: "settings-input" },
                            type: "text",
                            maxlength: "80",
                            placeholder: (device.name),
                            'aria-label': (__VLS_ctx.t('Apelido do aparelho')),
                        });
                    }
                    else {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                        (__VLS_ctx.deviceDisplayName(device));
                    }
                    if (device.canEditAlias) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: "device-alias-actions" },
                        });
                        if (__VLS_ctx.editingDeviceAliasId === device.id) {
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                                ...{ onClick: (...[$event]) => {
                                        if (!!(__VLS_ctx.loading))
                                            return;
                                        if (!!(!__VLS_ctx.user))
                                            return;
                                        if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                            return;
                                        if (!!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                            return;
                                        if (!!(__VLS_ctx.managementTab === 'email' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                            return;
                                        if (!(__VLS_ctx.filteredDevices.length))
                                            return;
                                        if (!(__VLS_ctx.isDeviceExpanded(device.id)))
                                            return;
                                        if (!(device.canEditAlias))
                                            return;
                                        if (!(__VLS_ctx.editingDeviceAliasId === device.id))
                                            return;
                                        __VLS_ctx.saveDeviceAlias(device);
                                    } },
                                ...{ class: "icon-button" },
                                type: "button",
                                disabled: (__VLS_ctx.deviceAliasSavingId === device.id),
                                title: (__VLS_ctx.t('Salvar apelido')),
                                'aria-label': (__VLS_ctx.t('Salvar apelido')),
                            });
                            if (__VLS_ctx.deviceAliasSavingId === device.id) {
                                const __VLS_430 = {}.LoaderCircle;
                                /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                                // @ts-ignore
                                const __VLS_431 = __VLS_asFunctionalComponent(__VLS_430, new __VLS_430({
                                    ...{ class: "spin" },
                                    size: (15),
                                }));
                                const __VLS_432 = __VLS_431({
                                    ...{ class: "spin" },
                                    size: (15),
                                }, ...__VLS_functionalComponentArgsRest(__VLS_431));
                            }
                            else {
                                const __VLS_434 = {}.Check;
                                /** @type {[typeof __VLS_components.Check, ]} */ ;
                                // @ts-ignore
                                const __VLS_435 = __VLS_asFunctionalComponent(__VLS_434, new __VLS_434({
                                    size: (16),
                                }));
                                const __VLS_436 = __VLS_435({
                                    size: (16),
                                }, ...__VLS_functionalComponentArgsRest(__VLS_435));
                            }
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                                ...{ onClick: (__VLS_ctx.cancelDeviceAliasEdit) },
                                ...{ class: "icon-button" },
                                type: "button",
                                disabled: (__VLS_ctx.deviceAliasSavingId === device.id),
                                title: (__VLS_ctx.t('Cancelar')),
                                'aria-label': (__VLS_ctx.t('Cancelar')),
                            });
                            const __VLS_438 = {}.X;
                            /** @type {[typeof __VLS_components.X, ]} */ ;
                            // @ts-ignore
                            const __VLS_439 = __VLS_asFunctionalComponent(__VLS_438, new __VLS_438({
                                size: (16),
                            }));
                            const __VLS_440 = __VLS_439({
                                size: (16),
                            }, ...__VLS_functionalComponentArgsRest(__VLS_439));
                        }
                        else {
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                                ...{ onClick: (...[$event]) => {
                                        if (!!(__VLS_ctx.loading))
                                            return;
                                        if (!!(!__VLS_ctx.user))
                                            return;
                                        if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                            return;
                                        if (!!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                            return;
                                        if (!!(__VLS_ctx.managementTab === 'email' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                            return;
                                        if (!(__VLS_ctx.filteredDevices.length))
                                            return;
                                        if (!(__VLS_ctx.isDeviceExpanded(device.id)))
                                            return;
                                        if (!(device.canEditAlias))
                                            return;
                                        if (!!(__VLS_ctx.editingDeviceAliasId === device.id))
                                            return;
                                        __VLS_ctx.editDeviceAlias(device);
                                    } },
                                ...{ class: "icon-button" },
                                type: "button",
                                title: (__VLS_ctx.t('Editar apelido')),
                                'aria-label': (__VLS_ctx.t('Editar apelido')),
                            });
                            const __VLS_442 = {}.Pencil;
                            /** @type {[typeof __VLS_components.Pencil, ]} */ ;
                            // @ts-ignore
                            const __VLS_443 = __VLS_asFunctionalComponent(__VLS_442, new __VLS_442({
                                size: (15),
                            }));
                            const __VLS_444 = __VLS_443({
                                size: (15),
                            }, ...__VLS_functionalComponentArgsRest(__VLS_443));
                        }
                    }
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "device-meta" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    const __VLS_446 = {}.MapPin;
                    /** @type {[typeof __VLS_components.MapPin, ]} */ ;
                    // @ts-ignore
                    const __VLS_447 = __VLS_asFunctionalComponent(__VLS_446, new __VLS_446({
                        size: (14),
                    }));
                    const __VLS_448 = __VLS_447({
                        size: (14),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_447));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (__VLS_ctx.t('Localizacao'));
                    (device.location || __VLS_ctx.t('Nao informado'));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    const __VLS_450 = {}.Cpu;
                    /** @type {[typeof __VLS_components.Cpu, ]} */ ;
                    // @ts-ignore
                    const __VLS_451 = __VLS_asFunctionalComponent(__VLS_450, new __VLS_450({
                        size: (14),
                    }));
                    const __VLS_452 = __VLS_451({
                        size: (14),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_451));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (__VLS_ctx.t('Identificador'));
                    (device.externalId);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    const __VLS_454 = {}.Clock3;
                    /** @type {[typeof __VLS_components.Clock3, ]} */ ;
                    // @ts-ignore
                    const __VLS_455 = __VLS_asFunctionalComponent(__VLS_454, new __VLS_454({
                        size: (14),
                    }));
                    const __VLS_456 = __VLS_455({
                        size: (14),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_455));
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
                        const __VLS_458 = ((__VLS_ctx.readingIcon(sensor.key)));
                        // @ts-ignore
                        const __VLS_459 = __VLS_asFunctionalComponent(__VLS_458, new __VLS_458({
                            size: (15),
                        }));
                        const __VLS_460 = __VLS_459({
                            size: (15),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_459));
                        (sensor.name);
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({
                            ...{ class: ({ 'sensor-reading-alert': sensor.reading?.alert }) },
                        });
                        (sensor.reading ? `${sensor.reading.value} ${sensor.reading.unit}` : __VLS_ctx.t('Sem leitura'));
                        if (sensor.reading) {
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                                ...{ class: "sensor-reading-time" },
                            });
                            (__VLS_ctx.formatTime(sensor.reading.recordedAt));
                        }
                    }
                    if (device.canSimulate && __VLS_ctx.simulationValues[device.id]) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                            ...{ class: "demo-simulation-panel" },
                            'aria-label': (__VLS_ctx.t('Simular leituras')),
                        });
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: "demo-simulation-heading" },
                        });
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                        (__VLS_ctx.t('Simular leituras'));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                        (__VLS_ctx.deviceDisplayName(device));
                        const __VLS_462 = {}.Cpu;
                        /** @type {[typeof __VLS_components.Cpu, ]} */ ;
                        // @ts-ignore
                        const __VLS_463 = __VLS_asFunctionalComponent(__VLS_462, new __VLS_462({
                            size: (17),
                        }));
                        const __VLS_464 = __VLS_463({
                            size: (17),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_463));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: "demo-simulation-fields" },
                        });
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                        (__VLS_ctx.t('Temperatura (°C)'));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                            ...{ class: "settings-input" },
                            type: "number",
                            min: "-50",
                            max: "150",
                            step: "0.1",
                        });
                        (__VLS_ctx.simulationValues[device.id].temperature);
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                        (__VLS_ctx.t('Umidade (%)'));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                            ...{ class: "settings-input" },
                            type: "number",
                            min: "0",
                            max: "100",
                            step: "0.1",
                        });
                        (__VLS_ctx.simulationValues[device.id].humidity);
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                        (__VLS_ctx.t('Gás (ppm)'));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                            ...{ class: "settings-input" },
                            type: "number",
                            min: "0",
                            max: "100000",
                            step: "1",
                        });
                        (__VLS_ctx.simulationValues[device.id].gas);
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                        (__VLS_ctx.t('Estado simulado'));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                            value: (__VLS_ctx.simulationValues[device.id].status),
                            ...{ class: "settings-input" },
                        });
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                            value: "online",
                        });
                        (__VLS_ctx.t('Online'));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                            value: "warning",
                        });
                        (__VLS_ctx.t('Em atenção'));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                            value: "offline",
                        });
                        (__VLS_ctx.t('Offline'));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: "demo-simulation-actions" },
                        });
                        if (__VLS_ctx.simulationMessages[device.id]) {
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                                ...{ class: (__VLS_ctx.simulationMessages[device.id].startsWith('Simulação aplicada') ? 'success-message' : 'error-message') },
                                role: "status",
                            });
                            (__VLS_ctx.t(__VLS_ctx.simulationMessages[device.id]));
                        }
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (...[$event]) => {
                                    if (!!(__VLS_ctx.loading))
                                        return;
                                    if (!!(!__VLS_ctx.user))
                                        return;
                                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.canManageActiveWorkspace))
                                        return;
                                    if (!!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                        return;
                                    if (!!(__VLS_ctx.managementTab === 'email' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                        return;
                                    if (!(__VLS_ctx.filteredDevices.length))
                                        return;
                                    if (!(__VLS_ctx.isDeviceExpanded(device.id)))
                                        return;
                                    if (!(device.canSimulate && __VLS_ctx.simulationValues[device.id]))
                                        return;
                                    __VLS_ctx.applyDeviceSimulation(device);
                                } },
                            ...{ class: "primary-button" },
                            type: "button",
                            disabled: (__VLS_ctx.simulationSavingId === device.id),
                        });
                        if (__VLS_ctx.simulationSavingId === device.id) {
                            const __VLS_466 = {}.LoaderCircle;
                            /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                            // @ts-ignore
                            const __VLS_467 = __VLS_asFunctionalComponent(__VLS_466, new __VLS_466({
                                ...{ class: "spin" },
                                size: (16),
                            }));
                            const __VLS_468 = __VLS_467({
                                ...{ class: "spin" },
                                size: (16),
                            }, ...__VLS_functionalComponentArgsRest(__VLS_467));
                        }
                        (__VLS_ctx.t('Aplicar simulação'));
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
            const __VLS_470 = {}.Cpu;
            /** @type {[typeof __VLS_components.Cpu, ]} */ ;
            // @ts-ignore
            const __VLS_471 = __VLS_asFunctionalComponent(__VLS_470, new __VLS_470({
                size: (22),
            }));
            const __VLS_472 = __VLS_471({
                size: (22),
            }, ...__VLS_functionalComponentArgsRest(__VLS_471));
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
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
        ...{ class: "mobile-nav" },
        'aria-label': (__VLS_ctx.t('Navegacao principal')),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(!__VLS_ctx.user))
                    return;
                __VLS_ctx.navigateMobileSection('home');
            } },
        ...{ class: "mobile-nav-item" },
        ...{ class: ({ active: __VLS_ctx.managementTab === 'overview' && __VLS_ctx.activeMobileTab === 'home' }) },
        href: "#inicio",
        'aria-current': (__VLS_ctx.activeMobileTab === 'home' ? 'page' : undefined),
    });
    const __VLS_474 = {}.LayoutDashboard;
    /** @type {[typeof __VLS_components.LayoutDashboard, ]} */ ;
    // @ts-ignore
    const __VLS_475 = __VLS_asFunctionalComponent(__VLS_474, new __VLS_474({
        size: (20),
    }));
    const __VLS_476 = __VLS_475({
        size: (20),
    }, ...__VLS_functionalComponentArgsRest(__VLS_475));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Inicio'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(!__VLS_ctx.user))
                    return;
                __VLS_ctx.mobileWorkspaceSelectorOpen = true;
            } },
        ...{ class: "mobile-nav-item" },
        type: "button",
    });
    const __VLS_478 = {}.Building2;
    /** @type {[typeof __VLS_components.Building2, ]} */ ;
    // @ts-ignore
    const __VLS_479 = __VLS_asFunctionalComponent(__VLS_478, new __VLS_478({
        size: (19),
    }));
    const __VLS_480 = __VLS_479({
        size: (19),
    }, ...__VLS_functionalComponentArgsRest(__VLS_479));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Ambientes'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(!__VLS_ctx.user))
                    return;
                __VLS_ctx.navigateMobileSection('devices');
            } },
        ...{ class: "mobile-nav-item" },
        ...{ class: ({ active: __VLS_ctx.managementTab === 'overview' && __VLS_ctx.activeMobileTab === 'devices' }) },
        href: "#aparelhos",
        'aria-current': (__VLS_ctx.activeMobileTab === 'devices' ? 'page' : undefined),
    });
    const __VLS_482 = {}.Cpu;
    /** @type {[typeof __VLS_components.Cpu, ]} */ ;
    // @ts-ignore
    const __VLS_483 = __VLS_asFunctionalComponent(__VLS_482, new __VLS_482({
        size: (20),
    }));
    const __VLS_484 = __VLS_483({
        size: (20),
    }, ...__VLS_functionalComponentArgsRest(__VLS_483));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Aparelhos'));
    if (__VLS_ctx.canManageActiveWorkspace) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.canManageActiveWorkspace))
                        return;
                    __VLS_ctx.managementTab = 'users';
                    __VLS_ctx.activeMobileTab = 'users';
                } },
            ...{ class: "mobile-nav-item" },
            ...{ class: ({ active: __VLS_ctx.managementTab === 'users' }) },
            type: "button",
        });
        const __VLS_486 = {}.UsersRound;
        /** @type {[typeof __VLS_components.UsersRound, ]} */ ;
        // @ts-ignore
        const __VLS_487 = __VLS_asFunctionalComponent(__VLS_486, new __VLS_486({
            size: (19),
        }));
        const __VLS_488 = __VLS_487({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_487));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('Usuários'));
    }
    if (__VLS_ctx.isWhatsAppDashboardAdmin) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.managementTab = 'whatsapp';
                    __VLS_ctx.activeMobileTab = 'whatsapp';
                } },
            ...{ class: "mobile-nav-item" },
            ...{ class: ({ active: __VLS_ctx.managementTab === 'whatsapp' }) },
            type: "button",
        });
        const __VLS_490 = {}.MessageCircle;
        /** @type {[typeof __VLS_components.MessageCircle, ]} */ ;
        // @ts-ignore
        const __VLS_491 = __VLS_asFunctionalComponent(__VLS_490, new __VLS_490({
            size: (19),
        }));
        const __VLS_492 = __VLS_491({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_491));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('WhatsApp API'));
    }
    if (__VLS_ctx.isWhatsAppDashboardAdmin) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.managementTab = 'email';
                    __VLS_ctx.activeMobileTab = 'email';
                } },
            ...{ class: "mobile-nav-item" },
            ...{ class: ({ active: __VLS_ctx.managementTab === 'email' }) },
            type: "button",
        });
        const __VLS_494 = {}.Mail;
        /** @type {[typeof __VLS_components.Mail, ]} */ ;
        // @ts-ignore
        const __VLS_495 = __VLS_asFunctionalComponent(__VLS_494, new __VLS_494({
            size: (19),
        }));
        const __VLS_496 = __VLS_495({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_495));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('E-mail API'));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.logout) },
        ...{ class: "mobile-nav-item" },
        type: "button",
    });
    const __VLS_498 = {}.LogOut;
    /** @type {[typeof __VLS_components.LogOut, ]} */ ;
    // @ts-ignore
    const __VLS_499 = __VLS_asFunctionalComponent(__VLS_498, new __VLS_498({
        size: (19),
    }));
    const __VLS_500 = __VLS_499({
        size: (19),
    }, ...__VLS_functionalComponentArgsRest(__VLS_499));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Sair'));
    if (__VLS_ctx.mobileWorkspaceSelectorOpen) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.mobileWorkspaceSelectorOpen))
                        return;
                    __VLS_ctx.mobileWorkspaceSelectorOpen = false;
                } },
            ...{ class: "settings-overlay workspace-selector-overlay" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "settings-dialog workspace-selector-dialog" },
            role: "dialog",
            'aria-modal': "true",
            'aria-labelledby': "mobileWorkspaceTitle",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
            ...{ class: "settings-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "eyebrow" },
        });
        (__VLS_ctx.t('AMBIENTES'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            id: "mobileWorkspaceTitle",
        });
        (__VLS_ctx.t('Selecionar ambiente'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.mobileWorkspaceSelectorOpen))
                        return;
                    __VLS_ctx.mobileWorkspaceSelectorOpen = false;
                } },
            ...{ class: "icon-button" },
            type: "button",
            'aria-label': (__VLS_ctx.t('Fechar seleção de ambientes')),
        });
        const __VLS_502 = {}.X;
        /** @type {[typeof __VLS_components.X, ]} */ ;
        // @ts-ignore
        const __VLS_503 = __VLS_asFunctionalComponent(__VLS_502, new __VLS_502({
            size: (19),
        }));
        const __VLS_504 = __VLS_503({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_503));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "workspace-list workspace-selector-list" },
        });
        for (const [workspace] of __VLS_getVForSourceType((__VLS_ctx.workspaces))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(!__VLS_ctx.user))
                            return;
                        if (!(__VLS_ctx.mobileWorkspaceSelectorOpen))
                            return;
                        __VLS_ctx.mobileWorkspaceSelectorOpen = false;
                        __VLS_ctx.changeWorkspace(workspace.id);
                    } },
                key: (workspace.id),
                ...{ class: "workspace-selector-option" },
                type: "button",
                ...{ class: ({ active: workspace.id === __VLS_ctx.activeWorkspaceId }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "workspace-option-avatar" },
            });
            if (workspace.iconDataUrl) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                    src: (workspace.iconDataUrl),
                    alt: "",
                });
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (workspace.name.slice(0, 1).toUpperCase());
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "workspace-selector-name" },
            });
            (workspace.name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.workspaceRoleLabel(workspace.role));
            if (workspace.id === __VLS_ctx.activeWorkspaceId) {
                const __VLS_506 = {}.Check;
                /** @type {[typeof __VLS_components.Check, ]} */ ;
                // @ts-ignore
                const __VLS_507 = __VLS_asFunctionalComponent(__VLS_506, new __VLS_506({
                    size: (16),
                }));
                const __VLS_508 = __VLS_507({
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_507));
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.mobileWorkspaceSelectorOpen))
                        return;
                    __VLS_ctx.mobileWorkspaceSelectorOpen = false;
                    __VLS_ctx.openWorkspaceManager('create');
                } },
            ...{ class: "workspace-manage-button workspace-selector-manage" },
            type: "button",
        });
        const __VLS_510 = {}.Plus;
        /** @type {[typeof __VLS_components.Plus, ]} */ ;
        // @ts-ignore
        const __VLS_511 = __VLS_asFunctionalComponent(__VLS_510, new __VLS_510({
            size: (15),
        }));
        const __VLS_512 = __VLS_511({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_511));
        (__VLS_ctx.t('Adicionar/editar ambiente'));
    }
    if (__VLS_ctx.workspaceDialogOpen) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.workspaceDialogOpen))
                        return;
                    __VLS_ctx.workspaceDialogOpen = false;
                } },
            ...{ class: "settings-overlay workspace-manager-overlay" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "settings-dialog workspace-manager-dialog" },
            role: "dialog",
            'aria-modal': "true",
            'aria-labelledby': "workspaceManagerTitle",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
            ...{ class: "settings-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "eyebrow" },
        });
        (__VLS_ctx.t('AMBIENTES'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            id: "workspaceManagerTitle",
        });
        (__VLS_ctx.t('Adicionar/editar ambiente'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.workspaceDialogOpen))
                        return;
                    __VLS_ctx.workspaceDialogOpen = false;
                } },
            ...{ class: "icon-button" },
            type: "button",
            'aria-label': (__VLS_ctx.t('Fechar gerenciamento de ambientes')),
        });
        const __VLS_514 = {}.X;
        /** @type {[typeof __VLS_components.X, ]} */ ;
        // @ts-ignore
        const __VLS_515 = __VLS_asFunctionalComponent(__VLS_514, new __VLS_514({
            size: (19),
        }));
        const __VLS_516 = __VLS_515({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_515));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
            ...{ class: "settings-tabs workspace-manager-tabs" },
            role: "tablist",
            'aria-label': (__VLS_ctx.t('Ações de ambiente')),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.workspaceDialogOpen))
                        return;
                    __VLS_ctx.openWorkspaceManager('create');
                } },
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.workspaceDialogAction === 'create' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.workspaceDialogAction === 'create'),
        });
        const __VLS_518 = {}.Plus;
        /** @type {[typeof __VLS_components.Plus, ]} */ ;
        // @ts-ignore
        const __VLS_519 = __VLS_asFunctionalComponent(__VLS_518, new __VLS_518({
            size: (14),
        }));
        const __VLS_520 = __VLS_519({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_519));
        (__VLS_ctx.t('Criar'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.workspaceDialogOpen))
                        return;
                    __VLS_ctx.openWorkspaceManager('edit');
                } },
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.workspaceDialogAction === 'edit' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.workspaceDialogAction === 'edit'),
        });
        const __VLS_522 = {}.Pencil;
        /** @type {[typeof __VLS_components.Pencil, ]} */ ;
        // @ts-ignore
        const __VLS_523 = __VLS_asFunctionalComponent(__VLS_522, new __VLS_522({
            size: (14),
        }));
        const __VLS_524 = __VLS_523({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_523));
        (__VLS_ctx.t('Editar'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.workspaceDialogOpen))
                        return;
                    __VLS_ctx.openWorkspaceManager('import');
                } },
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.workspaceDialogAction === 'import' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.workspaceDialogAction === 'import'),
        });
        const __VLS_526 = {}.ArrowDownToLine;
        /** @type {[typeof __VLS_components.ArrowDownToLine, ]} */ ;
        // @ts-ignore
        const __VLS_527 = __VLS_asFunctionalComponent(__VLS_526, new __VLS_526({
            size: (14),
        }));
        const __VLS_528 = __VLS_527({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_527));
        (__VLS_ctx.t('Importar'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.workspaceDialogOpen))
                        return;
                    __VLS_ctx.openWorkspaceManager('devices');
                } },
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.workspaceDialogAction === 'devices' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.workspaceDialogAction === 'devices'),
        });
        const __VLS_530 = {}.Cpu;
        /** @type {[typeof __VLS_components.Cpu, ]} */ ;
        // @ts-ignore
        const __VLS_531 = __VLS_asFunctionalComponent(__VLS_530, new __VLS_530({
            size: (14),
        }));
        const __VLS_532 = __VLS_531({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_531));
        (__VLS_ctx.t('Aparelhos'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.workspaceDialogOpen))
                        return;
                    __VLS_ctx.openWorkspaceManager('share');
                } },
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.workspaceDialogAction === 'share' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.workspaceDialogAction === 'share'),
        });
        const __VLS_534 = {}.Share2;
        /** @type {[typeof __VLS_components.Share2, ]} */ ;
        // @ts-ignore
        const __VLS_535 = __VLS_asFunctionalComponent(__VLS_534, new __VLS_534({
            size: (14),
        }));
        const __VLS_536 = __VLS_535({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_535));
        (__VLS_ctx.t('Compartilhar'));
        if (__VLS_ctx.canManageActiveWorkspace) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(!__VLS_ctx.user))
                            return;
                        if (!(__VLS_ctx.workspaceDialogOpen))
                            return;
                        if (!(__VLS_ctx.canManageActiveWorkspace))
                            return;
                        __VLS_ctx.openWorkspaceManager('members');
                    } },
                ...{ class: "settings-tab" },
                ...{ class: ({ active: __VLS_ctx.workspaceDialogAction === 'members' }) },
                type: "button",
                role: "tab",
                'aria-selected': (__VLS_ctx.workspaceDialogAction === 'members'),
            });
            const __VLS_538 = {}.UsersRound;
            /** @type {[typeof __VLS_components.UsersRound, ]} */ ;
            // @ts-ignore
            const __VLS_539 = __VLS_asFunctionalComponent(__VLS_538, new __VLS_538({
                size: (14),
            }));
            const __VLS_540 = __VLS_539({
                size: (14),
            }, ...__VLS_functionalComponentArgsRest(__VLS_539));
            (__VLS_ctx.t('Membros'));
        }
        if (__VLS_ctx.workspaceDialogAction === 'create' || __VLS_ctx.workspaceDialogAction === 'edit') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-pane workspace-manager-pane" },
            });
            if (__VLS_ctx.workspaceDialogAction === 'create' || __VLS_ctx.canManageActiveWorkspace) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    for: "workspaceName",
                });
                (__VLS_ctx.t('Nome do ambiente'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    id: "workspaceName",
                    value: (__VLS_ctx.workspaceName),
                    ...{ class: "settings-input" },
                    type: "text",
                    maxlength: "80",
                    placeholder: (__VLS_ctx.t('Ex.: Laboratório Central')),
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "workspace-icon-editor" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "workspace-icon-preview" },
                });
                if (__VLS_ctx.workspaceIconDataUrl) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                        src: (__VLS_ctx.workspaceIconDataUrl),
                        alt: "Prévia do ícone",
                    });
                }
                else {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (__VLS_ctx.workspaceName.slice(0, 1).toUpperCase() || '?');
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "workspace-icon-copy" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.t('Ícone do ambiente'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                (__VLS_ctx.t('Imagem JPG, PNG ou WebP, até 8 MB'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "secondary-button workspace-icon-upload" },
                    for: "workspaceIconFile",
                });
                const __VLS_542 = {}.ImagePlus;
                /** @type {[typeof __VLS_components.ImagePlus, ]} */ ;
                // @ts-ignore
                const __VLS_543 = __VLS_asFunctionalComponent(__VLS_542, new __VLS_542({
                    size: (15),
                }));
                const __VLS_544 = __VLS_543({
                    size: (15),
                }, ...__VLS_functionalComponentArgsRest(__VLS_543));
                (__VLS_ctx.t('Escolher imagem'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ onChange: (__VLS_ctx.selectWorkspaceIcon) },
                    id: "workspaceIconFile",
                    ...{ class: "visually-hidden" },
                    type: "file",
                    accept: "image/jpeg,image/png,image/webp",
                });
                if (__VLS_ctx.workspaceIconError) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "error-message" },
                        role: "alert",
                    });
                    (__VLS_ctx.t(__VLS_ctx.workspaceIconError));
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(!__VLS_ctx.user))
                                return;
                            if (!(__VLS_ctx.workspaceDialogOpen))
                                return;
                            if (!(__VLS_ctx.workspaceDialogAction === 'create' || __VLS_ctx.workspaceDialogAction === 'edit'))
                                return;
                            if (!(__VLS_ctx.workspaceDialogAction === 'create' || __VLS_ctx.canManageActiveWorkspace))
                                return;
                            __VLS_ctx.workspaceDialogAction === 'create' ? __VLS_ctx.createWorkspace() : __VLS_ctx.updateWorkspace();
                        } },
                    ...{ class: "primary-button settings-save-button" },
                    type: "button",
                    disabled: (__VLS_ctx.workspaceSaving || !__VLS_ctx.workspaceName.trim()),
                });
                (__VLS_ctx.workspaceSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.workspaceDialogAction === 'create' ? __VLS_ctx.t('Criar ambiente') : __VLS_ctx.t('Salvar alterações'));
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "form-subtitle" },
                });
                (__VLS_ctx.t('Você pode ver e compartilhar este ambiente, mas apenas um owner ou admin pode editar seu nome e ícone.'));
            }
        }
        if (__VLS_ctx.workspaceDialogAction === 'edit' && __VLS_ctx.activeWorkspace) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "workspace-remove-panel" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.activeWorkspace.role === 'owner' ? __VLS_ctx.t('Excluir ambiente') : __VLS_ctx.t('Remover da minha lista'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.activeWorkspace.role === 'owner' ? __VLS_ctx.t('Isso excluirá o ambiente e o removerá para todos os membros.') : __VLS_ctx.t('Isso remove sua participação, mas mantém o ambiente para os outros membros.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.removeActiveWorkspace) },
                ...{ class: "danger-button" },
                type: "button",
                disabled: (__VLS_ctx.workspaceSaving),
            });
            (__VLS_ctx.workspaceSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.activeWorkspace.role === 'owner' ? __VLS_ctx.t('Excluir ambiente') : __VLS_ctx.t('Remover da minha lista'));
        }
        else if (__VLS_ctx.workspaceDialogAction === 'import') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-pane workspace-manager-pane" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "form-subtitle" },
            });
            (__VLS_ctx.t('Insira o código compartilhado para adicionar o ambiente à sua lista.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                for: "importWorkspaceCode",
            });
            (__VLS_ctx.t('Código do ambiente'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onKeydown: (__VLS_ctx.joinWorkspaceByCode) },
                id: "importWorkspaceCode",
                value: (__VLS_ctx.importWorkspaceCode),
                ...{ class: "settings-input workspace-code-input" },
                type: "text",
                maxlength: "24",
                placeholder: "LAB-ABC123",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.joinWorkspaceByCode) },
                ...{ class: "primary-button settings-save-button" },
                type: "button",
                disabled: (!__VLS_ctx.importWorkspaceCode.trim()),
            });
            (__VLS_ctx.t('Importar ambiente'));
        }
        else if (__VLS_ctx.workspaceDialogAction === 'members') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-pane workspace-manager-pane" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "form-subtitle" },
            });
            (__VLS_ctx.t('Membros com acesso ao ambiente ativo.'));
            (__VLS_ctx.t('Remover alguém daqui não exclui a conta.'));
            if (__VLS_ctx.workspaceMembers.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "member-list workspace-invited-members" },
                });
                for (const [member] of __VLS_getVForSourceType((__VLS_ctx.workspaceMembers))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        key: (member.id),
                        ...{ class: "member-row" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (member.displayName || member.email);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                    (member.email);
                    if (member.isPlatformAdmin) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: "protected-member-role" },
                        });
                        const __VLS_546 = {}.LockKeyhole;
                        /** @type {[typeof __VLS_components.LockKeyhole, ]} */ ;
                        // @ts-ignore
                        const __VLS_547 = __VLS_asFunctionalComponent(__VLS_546, new __VLS_546({
                            size: (14),
                        }));
                        const __VLS_548 = __VLS_547({
                            size: (14),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_547));
                        (__VLS_ctx.t('Administrador da plataforma'));
                    }
                    else {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: "member-role-label" },
                        });
                        (__VLS_ctx.workspaceRoleLabel(member.role));
                    }
                    if (member.role !== 'owner' && !member.isPlatformAdmin && member.email !== __VLS_ctx.user?.email) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (...[$event]) => {
                                    if (!!(__VLS_ctx.loading))
                                        return;
                                    if (!!(!__VLS_ctx.user))
                                        return;
                                    if (!(__VLS_ctx.workspaceDialogOpen))
                                        return;
                                    if (!!(__VLS_ctx.workspaceDialogAction === 'edit' && __VLS_ctx.activeWorkspace))
                                        return;
                                    if (!!(__VLS_ctx.workspaceDialogAction === 'import'))
                                        return;
                                    if (!(__VLS_ctx.workspaceDialogAction === 'members'))
                                        return;
                                    if (!(__VLS_ctx.workspaceMembers.length))
                                        return;
                                    if (!(member.role !== 'owner' && !member.isPlatformAdmin && member.email !== __VLS_ctx.user?.email))
                                        return;
                                    __VLS_ctx.removeMember(member.id, member.displayName || member.email);
                                } },
                            ...{ class: "text-button workspace-member-remove" },
                            type: "button",
                        });
                        (__VLS_ctx.t('Remover acesso'));
                    }
                }
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "workspace-device-empty" },
                });
                (__VLS_ctx.t('Este ambiente ainda não tem membros convidados.'));
            }
        }
        else if (__VLS_ctx.workspaceDialogAction === 'devices') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-pane workspace-manager-pane" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                ...{ class: "workspace-devices-title" },
            });
            (__VLS_ctx.t('Aparelhos de monitoramento vinculados à sua conta'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "form-subtitle" },
            });
            (__VLS_ctx.t('Escolha o ambiente de destino para adicionar ou mover seus aparelhos vinculados.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                for: "workspaceDeviceTarget",
            });
            (__VLS_ctx.t('Selecionar ambiente de destino'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                id: "workspaceDeviceTarget",
                value: (__VLS_ctx.workspaceDeviceTargetId),
                ...{ class: "settings-input select-input" },
            });
            for (const [workspace] of __VLS_getVForSourceType((__VLS_ctx.workspaces))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (workspace.id),
                    value: (workspace.id),
                });
                (workspace.name);
            }
            if (__VLS_ctx.accountDevicesMessage) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "success-message" },
                    role: "status",
                });
                (__VLS_ctx.accountDevicesMessage);
            }
            if (__VLS_ctx.accountDevicesError) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "error-message" },
                    role: "alert",
                });
                (__VLS_ctx.accountDevicesError);
            }
            if (__VLS_ctx.accountDevicesLoading) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "workspace-device-empty" },
                });
                (__VLS_ctx.t('Carregando aparelhos...'));
            }
            else if (__VLS_ctx.accountLinkedDevices.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "workspace-device-list" },
                });
                for (const [device] of __VLS_getVForSourceType((__VLS_ctx.accountLinkedDevices))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                        key: (device.id),
                        ...{ class: "workspace-device-row" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "workspace-device-summary" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: "workspace-device-icon" },
                    });
                    const __VLS_550 = {}.Cpu;
                    /** @type {[typeof __VLS_components.Cpu, ]} */ ;
                    // @ts-ignore
                    const __VLS_551 = __VLS_asFunctionalComponent(__VLS_550, new __VLS_550({
                        size: (17),
                    }));
                    const __VLS_552 = __VLS_551({
                        size: (17),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_551));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (device.name);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                    (device.externalId);
                    if (device.location) {
                        (device.location);
                    }
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "workspace-device-assignment" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (__VLS_ctx.t('Ambiente atual'));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (device.workspaceName || __VLS_ctx.t('Sem ambiente'));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!!(!__VLS_ctx.user))
                                    return;
                                if (!(__VLS_ctx.workspaceDialogOpen))
                                    return;
                                if (!!(__VLS_ctx.workspaceDialogAction === 'edit' && __VLS_ctx.activeWorkspace))
                                    return;
                                if (!!(__VLS_ctx.workspaceDialogAction === 'import'))
                                    return;
                                if (!!(__VLS_ctx.workspaceDialogAction === 'members'))
                                    return;
                                if (!(__VLS_ctx.workspaceDialogAction === 'devices'))
                                    return;
                                if (!!(__VLS_ctx.accountDevicesLoading))
                                    return;
                                if (!(__VLS_ctx.accountLinkedDevices.length))
                                    return;
                                __VLS_ctx.assignAccountDevice(device);
                            } },
                        ...{ class: "secondary-button workspace-device-action" },
                        type: "button",
                        disabled: (!__VLS_ctx.workspaceDeviceTargetId || !device.canAssign || device.workspaceId === __VLS_ctx.workspaceDeviceTargetId),
                    });
                    (!device.canAssign ? __VLS_ctx.t('Sem permissão para mover este aparelho.') : device.workspaceId === __VLS_ctx.workspaceDeviceTargetId ? __VLS_ctx.t('Este aparelho já está neste ambiente') : device.workspaceId ? __VLS_ctx.t('Mover para este ambiente') : __VLS_ctx.t('Adicionar a este ambiente'));
                }
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "workspace-device-empty" },
                });
                (__VLS_ctx.t('Nenhum aparelho de monitoramento vinculado à sua conta.'));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "workspace-device-note" },
            });
            (__VLS_ctx.t('O aparelho será associado ao ambiente selecionado acima.'));
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-pane workspace-manager-pane" },
            });
            if (__VLS_ctx.activeWorkspace) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "workspace-share-card" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "workspace-icon-preview" },
                });
                if (__VLS_ctx.activeWorkspace.iconDataUrl) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                        src: (__VLS_ctx.activeWorkspace.iconDataUrl),
                        alt: "",
                    });
                }
                else {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (__VLS_ctx.activeWorkspace.name.slice(0, 1).toUpperCase());
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.activeWorkspace.name);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                (__VLS_ctx.t('Código de acesso para compartilhar'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    for: "workspaceShareCode",
                });
                (__VLS_ctx.t('Código do ambiente'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "workspace-share-code-field" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    id: "workspaceShareCode",
                    ...{ class: "settings-input workspace-code-input" },
                    type: "text",
                    value: (__VLS_ctx.activeWorkspaceCode),
                    readonly: true,
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.shareWorkspaceCode) },
                    ...{ class: "secondary-button" },
                    type: "button",
                    title: (__VLS_ctx.t('Copiar código do ambiente')),
                    'aria-label': (__VLS_ctx.t('Copiar código do ambiente')),
                });
                const __VLS_554 = {}.Copy;
                /** @type {[typeof __VLS_components.Copy, ]} */ ;
                // @ts-ignore
                const __VLS_555 = __VLS_asFunctionalComponent(__VLS_554, new __VLS_554({
                    size: (16),
                }));
                const __VLS_556 = __VLS_555({
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_555));
                if (__VLS_ctx.workspaceShareMessage) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "success-message" },
                        role: "status",
                    });
                    (__VLS_ctx.workspaceShareMessage);
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "form-subtitle" },
                });
                (__VLS_ctx.t('Envie este código para outro usuário importar o ambiente e acompanhar os mesmos aparelhos.'));
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "form-subtitle" },
                });
                (__VLS_ctx.t('Selecione ou crie um ambiente antes de compartilhar.'));
            }
        }
    }
    if (__VLS_ctx.userDeletionTarget) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (__VLS_ctx.cancelUserDeletion) },
            ...{ class: "settings-overlay" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "settings-dialog user-deletion-dialog" },
            role: "alertdialog",
            'aria-modal': "true",
            'aria-labelledby': "userDeletionTitle",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
            ...{ class: "settings-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "eyebrow" },
        });
        (__VLS_ctx.t('AÇÃO IRREVERSÍVEL'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            id: "userDeletionTitle",
        });
        (__VLS_ctx.t('Excluir usuário permanentemente'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.cancelUserDeletion) },
            ...{ class: "icon-button" },
            type: "button",
            disabled: (__VLS_ctx.userDeletionSaving),
            'aria-label': (__VLS_ctx.t('Fechar')),
        });
        const __VLS_558 = {}.X;
        /** @type {[typeof __VLS_components.X, ]} */ ;
        // @ts-ignore
        const __VLS_559 = __VLS_asFunctionalComponent(__VLS_558, new __VLS_558({
            size: (19),
        }));
        const __VLS_560 = __VLS_559({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_559));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "form-subtitle" },
        });
        (__VLS_ctx.userDeletionTarget.displayName);
        (__VLS_ctx.userDeletionTarget.email);
        (__VLS_ctx.t('A conta será removida permanentemente.'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "form-subtitle" },
        });
        (__VLS_ctx.t('Dispositivos vinculados e leituras serão apagados. Workspaces compartilhados serão preservados e transferidos a outro membro quando necessário.'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "userDeletionConfirmation",
        });
        (__VLS_ctx.t('Digite o e-mail do usuário para confirmar'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "userDeletionConfirmation",
            ...{ class: "settings-input" },
            type: "email",
            autocomplete: "off",
        });
        (__VLS_ctx.userDeletionConfirmation);
        if (__VLS_ctx.userDeletionError) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "error-message" },
                role: "alert",
            });
            (__VLS_ctx.userDeletionError);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "user-deletion-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.cancelUserDeletion) },
            ...{ class: "secondary-button" },
            type: "button",
            disabled: (__VLS_ctx.userDeletionSaving),
        });
        (__VLS_ctx.t('Cancelar'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.deleteUserPermanently) },
            ...{ class: "danger-button" },
            type: "button",
            disabled: (__VLS_ctx.userDeletionSaving || __VLS_ctx.userDeletionConfirmation.trim().toLowerCase() !== __VLS_ctx.userDeletionTarget.email.toLowerCase()),
        });
        (__VLS_ctx.userDeletionSaving ? __VLS_ctx.t('Excluindo...') : __VLS_ctx.t('Excluir conta e dados'));
    }
    if (__VLS_ctx.accountEditTarget) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (__VLS_ctx.cancelAdminUserEdit) },
            ...{ class: "settings-overlay" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "settings-dialog user-deletion-dialog" },
            role: "dialog",
            'aria-modal': "true",
            'aria-labelledby': "accountEditTitle",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
            ...{ class: "settings-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "eyebrow" },
        });
        (__VLS_ctx.t('GERENCIAMENTO'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            id: "accountEditTitle",
        });
        (__VLS_ctx.t('Editar usuário'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.cancelAdminUserEdit) },
            ...{ class: "icon-button" },
            type: "button",
            disabled: (__VLS_ctx.accountEditSaving),
            'aria-label': (__VLS_ctx.t('Fechar')),
        });
        const __VLS_562 = {}.X;
        /** @type {[typeof __VLS_components.X, ]} */ ;
        // @ts-ignore
        const __VLS_563 = __VLS_asFunctionalComponent(__VLS_562, new __VLS_562({
            size: (19),
        }));
        const __VLS_564 = __VLS_563({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_563));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "accountEditName",
        });
        (__VLS_ctx.t('Nome'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "accountEditName",
            value: (__VLS_ctx.accountEditName),
            ...{ class: "settings-input" },
            type: "text",
            maxlength: "80",
            autocomplete: "off",
            required: true,
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "accountEditEmail",
        });
        (__VLS_ctx.t('E-mail'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "accountEditEmail",
            ...{ class: "settings-input" },
            type: "email",
            maxlength: "254",
            autocomplete: "off",
            required: true,
        });
        (__VLS_ctx.accountEditEmail);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "form-subtitle" },
        });
        (__VLS_ctx.t('A senha não pode ser alterada por aqui. Use a ação de redefinição para exigir uma nova senha.'));
        if (__VLS_ctx.accountEditError) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "error-message" },
                role: "alert",
            });
            (__VLS_ctx.accountEditError);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "user-deletion-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.cancelAdminUserEdit) },
            ...{ class: "secondary-button" },
            type: "button",
            disabled: (__VLS_ctx.accountEditSaving),
        });
        (__VLS_ctx.t('Cancelar'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.saveAdminUserEdit) },
            ...{ class: "primary-button" },
            type: "button",
            disabled: (__VLS_ctx.accountEditSaving || !__VLS_ctx.accountEditName.trim() || !__VLS_ctx.accountEditEmail.trim()),
        });
        (__VLS_ctx.accountEditSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Salvar alterações'));
    }
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
        const __VLS_566 = {}.X;
        /** @type {[typeof __VLS_components.X, ]} */ ;
        // @ts-ignore
        const __VLS_567 = __VLS_asFunctionalComponent(__VLS_566, new __VLS_566({
            size: (19),
        }));
        const __VLS_568 = __VLS_567({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_567));
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
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.settingsOpen))
                        return;
                    __VLS_ctx.settingsTab = 'sounds';
                } },
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.settingsTab === 'sounds' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.settingsTab === 'sounds'),
        });
        (__VLS_ctx.t('Sons'));
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
                const __VLS_570 = {}.Moon;
                /** @type {[typeof __VLS_components.Moon, ]} */ ;
                // @ts-ignore
                const __VLS_571 = __VLS_asFunctionalComponent(__VLS_570, new __VLS_570({
                    size: (18),
                }));
                const __VLS_572 = __VLS_571({
                    size: (18),
                }, ...__VLS_functionalComponentArgsRest(__VLS_571));
            }
            else {
                const __VLS_574 = {}.Sun;
                /** @type {[typeof __VLS_components.Sun, ]} */ ;
                // @ts-ignore
                const __VLS_575 = __VLS_asFunctionalComponent(__VLS_574, new __VLS_574({
                    size: (18),
                }));
                const __VLS_576 = __VLS_575({
                    size: (18),
                }, ...__VLS_functionalComponentArgsRest(__VLS_575));
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
        else if (__VLS_ctx.settingsTab === 'notifications') {
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
            const __VLS_578 = {}.Mail;
            /** @type {[typeof __VLS_components.Mail, ]} */ ;
            // @ts-ignore
            const __VLS_579 = __VLS_asFunctionalComponent(__VLS_578, new __VLS_578({
                size: (18),
            }));
            const __VLS_580 = __VLS_579({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_579));
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
            const __VLS_582 = {}.MessageCircle;
            /** @type {[typeof __VLS_components.MessageCircle, ]} */ ;
            // @ts-ignore
            const __VLS_583 = __VLS_asFunctionalComponent(__VLS_582, new __VLS_582({
                size: (18),
            }));
            const __VLS_584 = __VLS_583({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_583));
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
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "whatsapp-phone-fields" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                for: "profileWhatsappCountry",
            });
            (__VLS_ctx.t('País e código do WhatsApp'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                ...{ onChange: (__VLS_ctx.reformatWhatsappNumberForCountry) },
                id: "profileWhatsappCountry",
                value: (__VLS_ctx.profileWhatsappCountry),
                ...{ class: "settings-input" },
                autocomplete: "country",
            });
            for (const [country] of __VLS_getVForSourceType((__VLS_ctx.whatsappCountries))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (country.country),
                    value: (country.country),
                });
                (country.name);
                (country.dialCode);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                for: "profileWhatsappNumber",
            });
            (__VLS_ctx.t('Número do WhatsApp'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onInput: (__VLS_ctx.formatWhatsappNumberInput) },
                id: "profileWhatsappNumber",
                ...{ class: "settings-input" },
                type: "tel",
                maxlength: "24",
                autocomplete: "tel-national",
                placeholder: (__VLS_ctx.profileWhatsappCountry === 'BR' ? '(00) 00000-0000' : ''),
                value: (__VLS_ctx.profileWhatsappNumber),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "settings-help" },
            });
            (__VLS_ctx.t('Digite o número local com DDD.'));
            (__VLS_ctx.t('O WhatsApp requer uma conta conectada pelo administrador.'));
            if (__VLS_ctx.activeWorkspace) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                    ...{ class: "workspace-notification-settings" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "settings-section-heading" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
                (__VLS_ctx.t('Escopo dos alertas'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.activeWorkspace.name);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "theme-setting" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "theme-setting-icon" },
                });
                const __VLS_586 = {}.Bell;
                /** @type {[typeof __VLS_components.Bell, ]} */ ;
                // @ts-ignore
                const __VLS_587 = __VLS_asFunctionalComponent(__VLS_586, new __VLS_586({
                    size: (18),
                }));
                const __VLS_588 = __VLS_587({
                    size: (18),
                }, ...__VLS_functionalComponentArgsRest(__VLS_587));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "theme-setting-copy" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.t('Receber alertas de todos os aparelhos'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                (__VLS_ctx.t('Usa os canais de e-mail e WhatsApp ativados acima.'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ onChange: (__VLS_ctx.toggleWorkspaceAlertMode) },
                    ...{ class: "theme-switch" },
                    type: "checkbox",
                    checked: (__VLS_ctx.workspaceAlertPreferences.notifyAllDevices),
                    disabled: (__VLS_ctx.workspaceAlertPreferencesSaving),
                });
                if (!__VLS_ctx.workspaceAlertPreferences.notifyAllDevices) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "notification-device-list" },
                    });
                    for (const [device] of __VLS_getVForSourceType((__VLS_ctx.workspaceAlertPreferences.devices))) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            key: (device.deviceId),
                            ...{ class: "notification-device-row" },
                        });
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                        (device.name);
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                        (__VLS_ctx.t('E-mail'));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                            ...{ onChange: (...[$event]) => {
                                    if (!!(__VLS_ctx.loading))
                                        return;
                                    if (!!(!__VLS_ctx.user))
                                        return;
                                    if (!(__VLS_ctx.settingsOpen))
                                        return;
                                    if (!!(__VLS_ctx.settingsTab === 'preferences'))
                                        return;
                                    if (!!(__VLS_ctx.settingsTab === 'account'))
                                        return;
                                    if (!(__VLS_ctx.settingsTab === 'notifications'))
                                        return;
                                    if (!(__VLS_ctx.activeWorkspace))
                                        return;
                                    if (!(!__VLS_ctx.workspaceAlertPreferences.notifyAllDevices))
                                        return;
                                    __VLS_ctx.toggleDeviceAlertChannel(device.deviceId, 'emailEnabled', $event);
                                } },
                            ...{ class: "theme-switch" },
                            type: "checkbox",
                            checked: (device.emailEnabled),
                            disabled: (__VLS_ctx.workspaceAlertPreferencesSaving),
                        });
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                        (__VLS_ctx.t('WhatsApp'));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                            ...{ onChange: (...[$event]) => {
                                    if (!!(__VLS_ctx.loading))
                                        return;
                                    if (!!(!__VLS_ctx.user))
                                        return;
                                    if (!(__VLS_ctx.settingsOpen))
                                        return;
                                    if (!!(__VLS_ctx.settingsTab === 'preferences'))
                                        return;
                                    if (!!(__VLS_ctx.settingsTab === 'account'))
                                        return;
                                    if (!(__VLS_ctx.settingsTab === 'notifications'))
                                        return;
                                    if (!(__VLS_ctx.activeWorkspace))
                                        return;
                                    if (!(!__VLS_ctx.workspaceAlertPreferences.notifyAllDevices))
                                        return;
                                    __VLS_ctx.toggleDeviceAlertChannel(device.deviceId, 'whatsappEnabled', $event);
                                } },
                            ...{ class: "theme-switch" },
                            type: "checkbox",
                            checked: (device.whatsappEnabled),
                            disabled: (__VLS_ctx.workspaceAlertPreferencesSaving),
                        });
                    }
                    if (!__VLS_ctx.workspaceAlertPreferences.devices.length) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: "workspace-device-empty" },
                        });
                        (__VLS_ctx.t('Nenhum aparelho neste ambiente.'));
                    }
                }
                if (__VLS_ctx.workspaceAlertPreferencesError) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "error-message" },
                        role: "alert",
                    });
                    (__VLS_ctx.t(__VLS_ctx.workspaceAlertPreferencesError));
                }
                if (__VLS_ctx.workspaceAlertPreferencesMessage) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "success-message" },
                        role: "status",
                    });
                    (__VLS_ctx.t(__VLS_ctx.workspaceAlertPreferencesMessage));
                }
                if (__VLS_ctx.workspaceAlertPreferencesSaving) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "settings-help" },
                    });
                    (__VLS_ctx.t('Salvando...'));
                }
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "settings-help" },
                });
                (__VLS_ctx.t('Crie ou importe um ambiente para configurar alertas dos aparelhos.'));
            }
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
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-pane" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: "alert-sound-settings" },
                'aria-labelledby': "alertSoundTitle",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "settings-section-heading" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                id: "alertSoundTitle",
            });
            (__VLS_ctx.t('Sons de alerta'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "settings-help" },
            });
            (__VLS_ctx.t('Escolha um som diferente para cada mudança de estado. Os arquivos enviados ficam disponíveis para todas as contas.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "alert-sound-assignment-grid" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "alert-sound-assignment" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Retorno ao normal'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: (__VLS_ctx.alertSoundDraftPreferences.online),
                ...{ class: "settings-input select-input" },
            });
            if (!__VLS_ctx.alertSounds.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "default",
                });
            }
            for (const [audio] of __VLS_getVForSourceType((__VLS_ctx.alertSounds))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (audio.id),
                    value: (audio.id),
                });
                (audio.name);
            }
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
                        if (!!(__VLS_ctx.settingsTab === 'account'))
                            return;
                        if (!!(__VLS_ctx.settingsTab === 'notifications'))
                            return;
                        __VLS_ctx.toggleAlertSoundPreview('online');
                    } },
                ...{ class: "secondary-button" },
                type: "button",
                'aria-label': (__VLS_ctx.t(__VLS_ctx.alertSoundPreviewStatus === 'online' ? 'Parar som' : 'Tocar som')),
                title: (__VLS_ctx.t(__VLS_ctx.alertSoundPreviewStatus === 'online' ? 'Parar som' : 'Tocar som')),
                'aria-pressed': (__VLS_ctx.alertSoundPreviewStatus === 'online'),
            });
            if (__VLS_ctx.alertSoundPreviewStatus === 'online') {
                const __VLS_590 = {}.Square;
                /** @type {[typeof __VLS_components.Square, ]} */ ;
                // @ts-ignore
                const __VLS_591 = __VLS_asFunctionalComponent(__VLS_590, new __VLS_590({
                    size: (14),
                    fill: "currentColor",
                }));
                const __VLS_592 = __VLS_591({
                    size: (14),
                    fill: "currentColor",
                }, ...__VLS_functionalComponentArgsRest(__VLS_591));
            }
            else {
                const __VLS_594 = {}.Play;
                /** @type {[typeof __VLS_components.Play, ]} */ ;
                // @ts-ignore
                const __VLS_595 = __VLS_asFunctionalComponent(__VLS_594, new __VLS_594({
                    size: (14),
                }));
                const __VLS_596 = __VLS_595({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_595));
            }
            (__VLS_ctx.t(__VLS_ctx.alertSoundPreviewStatus === 'online' ? 'Parar som' : 'Tocar som'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "alert-sound-assignment" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Atenção'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: (__VLS_ctx.alertSoundDraftPreferences.warning),
                ...{ class: "settings-input select-input" },
            });
            if (!__VLS_ctx.alertSounds.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "default",
                });
            }
            for (const [audio] of __VLS_getVForSourceType((__VLS_ctx.alertSounds))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (audio.id),
                    value: (audio.id),
                });
                (audio.name);
            }
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
                        if (!!(__VLS_ctx.settingsTab === 'account'))
                            return;
                        if (!!(__VLS_ctx.settingsTab === 'notifications'))
                            return;
                        __VLS_ctx.toggleAlertSoundPreview('warning');
                    } },
                ...{ class: "secondary-button" },
                type: "button",
                'aria-label': (__VLS_ctx.t(__VLS_ctx.alertSoundPreviewStatus === 'warning' ? 'Parar som' : 'Tocar som')),
                title: (__VLS_ctx.t(__VLS_ctx.alertSoundPreviewStatus === 'warning' ? 'Parar som' : 'Tocar som')),
                'aria-pressed': (__VLS_ctx.alertSoundPreviewStatus === 'warning'),
            });
            if (__VLS_ctx.alertSoundPreviewStatus === 'warning') {
                const __VLS_598 = {}.Square;
                /** @type {[typeof __VLS_components.Square, ]} */ ;
                // @ts-ignore
                const __VLS_599 = __VLS_asFunctionalComponent(__VLS_598, new __VLS_598({
                    size: (14),
                    fill: "currentColor",
                }));
                const __VLS_600 = __VLS_599({
                    size: (14),
                    fill: "currentColor",
                }, ...__VLS_functionalComponentArgsRest(__VLS_599));
            }
            else {
                const __VLS_602 = {}.Play;
                /** @type {[typeof __VLS_components.Play, ]} */ ;
                // @ts-ignore
                const __VLS_603 = __VLS_asFunctionalComponent(__VLS_602, new __VLS_602({
                    size: (14),
                }));
                const __VLS_604 = __VLS_603({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_603));
            }
            (__VLS_ctx.t(__VLS_ctx.alertSoundPreviewStatus === 'warning' ? 'Parar som' : 'Tocar som'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "alert-sound-assignment" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Offline'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: (__VLS_ctx.alertSoundDraftPreferences.offline),
                ...{ class: "settings-input select-input" },
            });
            if (!__VLS_ctx.alertSounds.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "default",
                });
            }
            for (const [audio] of __VLS_getVForSourceType((__VLS_ctx.alertSounds))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (audio.id),
                    value: (audio.id),
                });
                (audio.name);
            }
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
                        if (!!(__VLS_ctx.settingsTab === 'account'))
                            return;
                        if (!!(__VLS_ctx.settingsTab === 'notifications'))
                            return;
                        __VLS_ctx.toggleAlertSoundPreview('offline');
                    } },
                ...{ class: "secondary-button" },
                type: "button",
                'aria-label': (__VLS_ctx.t(__VLS_ctx.alertSoundPreviewStatus === 'offline' ? 'Parar som' : 'Tocar som')),
                title: (__VLS_ctx.t(__VLS_ctx.alertSoundPreviewStatus === 'offline' ? 'Parar som' : 'Tocar som')),
                'aria-pressed': (__VLS_ctx.alertSoundPreviewStatus === 'offline'),
            });
            if (__VLS_ctx.alertSoundPreviewStatus === 'offline') {
                const __VLS_606 = {}.Square;
                /** @type {[typeof __VLS_components.Square, ]} */ ;
                // @ts-ignore
                const __VLS_607 = __VLS_asFunctionalComponent(__VLS_606, new __VLS_606({
                    size: (14),
                    fill: "currentColor",
                }));
                const __VLS_608 = __VLS_607({
                    size: (14),
                    fill: "currentColor",
                }, ...__VLS_functionalComponentArgsRest(__VLS_607));
            }
            else {
                const __VLS_610 = {}.Play;
                /** @type {[typeof __VLS_components.Play, ]} */ ;
                // @ts-ignore
                const __VLS_611 = __VLS_asFunctionalComponent(__VLS_610, new __VLS_610({
                    size: (14),
                }));
                const __VLS_612 = __VLS_611({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_611));
            }
            (__VLS_ctx.t(__VLS_ctx.alertSoundPreviewStatus === 'offline' ? 'Parar som' : 'Tocar som'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.saveAlertSoundPreferences) },
                ...{ class: "primary-button" },
                type: "button",
                disabled: (__VLS_ctx.alertSoundSaving),
            });
            (__VLS_ctx.alertSoundSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Salvar sons por alerta'));
            if (__VLS_ctx.alertAudioUploadEnabled) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                    ...{ class: "alert-sound-upload" },
                    'aria-labelledby': "alertSoundLibraryTitle",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "settings-section-heading" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                    id: "alertSoundLibraryTitle",
                });
                (__VLS_ctx.t('Biblioteca compartilhada'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.alertSounds.length);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "settings-help" },
                });
                (__VLS_ctx.t('Adicione um áudio para disponibilizá-lo a todas as contas.'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "whatsapp-config-field" },
                    for: "alertSoundName",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.t('Nome do áudio'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    id: "alertSoundName",
                    value: (__VLS_ctx.alertAudioUploadName),
                    ...{ class: "settings-input" },
                    type: "text",
                    maxlength: "80",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "alert-sound-actions" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "secondary-button avatar-upload-button" },
                    for: "alertSoundFile",
                });
                (__VLS_ctx.alertAudioUploadName || __VLS_ctx.t('Escolher áudio'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ onChange: (__VLS_ctx.selectAlertSoundFile) },
                    id: "alertSoundFile",
                    ...{ class: "visually-hidden" },
                    type: "file",
                    accept: "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/webm",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.uploadAlertSound) },
                    ...{ class: "primary-button" },
                    type: "button",
                    disabled: (__VLS_ctx.alertAudioUploading || !__VLS_ctx.alertAudioUploadDataUrl || !__VLS_ctx.alertAudioUploadName.trim()),
                });
                (__VLS_ctx.alertAudioUploading ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Adicionar à biblioteca'));
            }
            if (__VLS_ctx.alertSoundError) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "error-message" },
                    role: "alert",
                });
                (__VLS_ctx.t(__VLS_ctx.alertSoundError));
            }
            if (__VLS_ctx.alertSoundMessage) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "success-message" },
                    role: "status",
                });
                (__VLS_ctx.t(__VLS_ctx.alertSoundMessage));
            }
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
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['forgot-link']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['login-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['login-button']} */ ;
/** @type {__VLS_StyleScopedClasses['secure-note']} */ ;
/** @type {__VLS_StyleScopedClasses['back-link']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['form-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['login-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
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
/** @type {__VLS_StyleScopedClasses['workspace-dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-list']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-option']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-option-main']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-option-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-manage-button']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-label']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-link']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-count']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-link']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-link']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-link']} */ ;
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
/** @type {__VLS_StyleScopedClasses['user-management-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['page-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['heading-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['user-management-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['user-management-card']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['user-management-card']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['member-list']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-account-list']} */ ;
/** @type {__VLS_StyleScopedClasses['member-row']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-account-row']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-account-identity']} */ ;
/** @type {__VLS_StyleScopedClasses['protected-member-role']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-account-status']} */ ;
/** @type {__VLS_StyleScopedClasses['member-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['member-actions-button']} */ ;
/** @type {__VLS_StyleScopedClasses['member-actions-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-account-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['member-remove-action']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['user-management-card']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['invite-form']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['member-list']} */ ;
/** @type {__VLS_StyleScopedClasses['member-row']} */ ;
/** @type {__VLS_StyleScopedClasses['protected-member-role']} */ ;
/** @type {__VLS_StyleScopedClasses['member-edit-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['small']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['member-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['member-cancel-button']} */ ;
/** @type {__VLS_StyleScopedClasses['member-role-label']} */ ;
/** @type {__VLS_StyleScopedClasses['member-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['member-actions-button']} */ ;
/** @type {__VLS_StyleScopedClasses['member-actions-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['member-remove-action']} */ ;
/** @type {__VLS_StyleScopedClasses['member-list']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['member-row']} */ ;
/** @type {__VLS_StyleScopedClasses['invitation-row']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-management-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['page-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['heading-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['notice-error']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-section']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['danger-button']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-clear']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-list']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-row']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-section']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-channel-choice']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-channel-options']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-channel-option']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-channel-option']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-form']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-status-line']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting']} */ ;
/** @type {__VLS_StyleScopedClasses['email-secure-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['email-config-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-cloud-config-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-form']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-qr-configuration']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-status-line']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-phone']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-help']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-help']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-action']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-action']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-qr-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-qr-image']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-qr-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-qr-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-section']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-form']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-sticker-assignments']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-alert-media-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-alert-media-setting']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-alert-media-setting']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-alert-media-setting']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-sticker-library']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-sticker-import']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-sticker-file']} */ ;
/** @type {__VLS_StyleScopedClasses['visually-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-selected-media-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-sticker-library-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-sticker-favorite']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-media-delete']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-preview-list']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-notification-previews']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-notification-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-chat-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-message-sticker-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-preview-bubble']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-message-image-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-section']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-profile-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-form']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-profile-photo-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-profile-photo-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-profile-photo-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-profile-photo-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['visually-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-privacy-settings']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-profile-history']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-profile-snapshot']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-profile-snapshot-photo']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-profile-snapshot-photo']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-profile-snapshot-fallback']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-profile-snapshot-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-profile-restore']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-form']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-profile-recovery']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-section']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-status-line']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-help']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-phone']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-help']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-action']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['email-connection-mark']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-management-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['email-management-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['page-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['heading-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['notice-error']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-section']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['danger-button']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-clear']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-list']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-row']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-log-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-section']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-form']} */ ;
/** @type {__VLS_StyleScopedClasses['email-config-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting']} */ ;
/** @type {__VLS_StyleScopedClasses['email-secure-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting']} */ ;
/** @type {__VLS_StyleScopedClasses['email-secure-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-section']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-form']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-preview-list']} */ ;
/** @type {__VLS_StyleScopedClasses['email-notification-previews']} */ ;
/** @type {__VLS_StyleScopedClasses['email-notification-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['email-preview-document']} */ ;
/** @type {__VLS_StyleScopedClasses['email-preview-subject']} */ ;
/** @type {__VLS_StyleScopedClasses['email-preview-body']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-section']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-status-line']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-help']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-help']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-action']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['email-connection-mark']} */ ;
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
/** @type {__VLS_StyleScopedClasses['device-alias-row']} */ ;
/** @type {__VLS_StyleScopedClasses['device-alias-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['device-alias-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['device-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['device-readings-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['sensor-detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['sensor-detail-label']} */ ;
/** @type {__VLS_StyleScopedClasses['sensor-reading-time']} */ ;
/** @type {__VLS_StyleScopedClasses['demo-simulation-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['demo-simulation-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['demo-simulation-fields']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['demo-simulation-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
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
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-selector-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-selector-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-header']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-list']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-selector-list']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-selector-option']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-option-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-selector-name']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-manage-button']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-selector-manage']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-manager-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-manager-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-header']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-manager-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-manager-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-icon-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-icon-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-icon-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-icon-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['visually-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['form-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-remove-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['danger-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-manager-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['form-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-code-input']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-manager-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['form-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['member-list']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-invited-members']} */ ;
/** @type {__VLS_StyleScopedClasses['member-row']} */ ;
/** @type {__VLS_StyleScopedClasses['protected-member-role']} */ ;
/** @type {__VLS_StyleScopedClasses['member-role-label']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-member-remove']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-manager-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-devices-title']} */ ;
/** @type {__VLS_StyleScopedClasses['form-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-list']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-row']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-assignment']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-action']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-note']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-manager-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-share-card']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-icon-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-share-code-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-code-input']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['form-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['form-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['user-deletion-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-header']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['form-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['form-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['user-deletion-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['user-deletion-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-header']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['user-deletion-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-header']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-switch']} */ ;
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
/** @type {__VLS_StyleScopedClasses['whatsapp-phone-fields']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-notification-settings']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-setting-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-device-list']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-device-row']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['theme-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-device-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-sound-settings']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-sound-assignment-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-sound-assignment']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-sound-assignment']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-sound-assignment']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-sound-upload']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-sound-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-upload-button']} */ ;
/** @type {__VLS_StyleScopedClasses['visually-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            MessageTemplateEditor: MessageTemplateEditor,
            Activity: Activity,
            AlertTriangle: AlertTriangle,
            ArrowDownToLine: ArrowDownToLine,
            Bell: Bell,
            Building2: Building2,
            Check: Check,
            ChevronDown: ChevronDown,
            EllipsisVertical: EllipsisVertical,
            Bot: Bot,
            CircleAlert: CircleAlert,
            CircleCheck: CircleCheck,
            CircleMinus: CircleMinus,
            Clock3: Clock3,
            Copy: Copy,
            Cpu: Cpu,
            ImagePlus: ImagePlus,
            LayoutDashboard: LayoutDashboard,
            LockKeyhole: LockKeyhole,
            List: List,
            LoaderCircle: LoaderCircle,
            LogOut: LogOut,
            Mail: Mail,
            MapPin: MapPin,
            MessageCircle: MessageCircle,
            Moon: Moon,
            Pencil: Pencil,
            Play: Play,
            Plus: Plus,
            RefreshCw: RefreshCw,
            Search: Search,
            Trash2: Trash2,
            Settings: Settings,
            Share2: Share2,
            ShieldCheck: ShieldCheck,
            Signal: Signal,
            Sun: Sun,
            UsersRound: UsersRound,
            X: X,
            user: user,
            devices: devices,
            simulationValues: simulationValues,
            simulationSavingId: simulationSavingId,
            simulationMessages: simulationMessages,
            notifications: notifications,
            notificationOpen: notificationOpen,
            email: email,
            password: password,
            registerName: registerName,
            registerEmail: registerEmail,
            registerPassword: registerPassword,
            registerMessage: registerMessage,
            registerError: registerError,
            invitationToken: invitationToken,
            invitationWorkspaceName: invitationWorkspaceName,
            invitationError: invitationError,
            activationMessage: activationMessage,
            activationError: activationError,
            inviteEmail: inviteEmail,
            inviteRole: inviteRole,
            inviteError: inviteError,
            inviteMessage: inviteMessage,
            search: search,
            loginError: loginError,
            pageError: pageError,
            loading: loading,
            submitting: submitting,
            loginMode: loginMode,
            workspaceName: workspaceName,
            workspaceIconDataUrl: workspaceIconDataUrl,
            workspaceIconError: workspaceIconError,
            workspaceSaving: workspaceSaving,
            editingDeviceAliasId: editingDeviceAliasId,
            deviceAliasDraft: deviceAliasDraft,
            deviceAliasSavingId: deviceAliasSavingId,
            importWorkspaceCode: importWorkspaceCode,
            workspaceShareMessage: workspaceShareMessage,
            workspaces: workspaces,
            accountLinkedDevices: accountLinkedDevices,
            accountDevicesLoading: accountDevicesLoading,
            accountDevicesError: accountDevicesError,
            accountDevicesMessage: accountDevicesMessage,
            workspaceDeviceTargetId: workspaceDeviceTargetId,
            activeWorkspaceId: activeWorkspaceId,
            activeWorkspace: activeWorkspace,
            activeWorkspaceCode: activeWorkspaceCode,
            canManageActiveWorkspace: canManageActiveWorkspace,
            workspaceMembers: workspaceMembers,
            workspaceInvitations: workspaceInvitations,
            adminUsers: adminUsers,
            adminUsersLoading: adminUsersLoading,
            adminUsersError: adminUsersError,
            adminUsersMessage: adminUsersMessage,
            adminUserActionId: adminUserActionId,
            memberActionsOpenId: memberActionsOpenId,
            editingMemberId: editingMemberId,
            editingMemberRole: editingMemberRole,
            memberSavingId: memberSavingId,
            userDeletionTarget: userDeletionTarget,
            userDeletionConfirmation: userDeletionConfirmation,
            userDeletionError: userDeletionError,
            userDeletionSaving: userDeletionSaving,
            userDeletionMessage: userDeletionMessage,
            accountEditTarget: accountEditTarget,
            accountEditName: accountEditName,
            accountEditEmail: accountEditEmail,
            accountEditSaving: accountEditSaving,
            accountEditError: accountEditError,
            registrationEnabled: registrationEnabled,
            isWhatsAppDashboardAdmin: isWhatsAppDashboardAdmin,
            canManageUserAccounts: canManageUserAccounts,
            managementTab: managementTab,
            userManagementTab: userManagementTab,
            whatsappTab: whatsappTab,
            emailTab: emailTab,
            whatsappStatus: whatsappStatus,
            whatsappLogs: whatsappLogs,
            whatsappSettings: whatsappSettings,
            whatsappSettingsSaving: whatsappSettingsSaving,
            whatsappSettingsMessage: whatsappSettingsMessage,
            favoriteWhatsAppMedia: favoriteWhatsAppMedia,
            favoriteWhatsAppMediaLoading: favoriteWhatsAppMediaLoading,
            favoriteWhatsAppMediaError: favoriteWhatsAppMediaError,
            favoriteMediaName: favoriteMediaName,
            favoriteMediaDataUrl: favoriteMediaDataUrl,
            favoriteMediaSaving: favoriteMediaSaving,
            favoriteMediaDeletingId: favoriteMediaDeletingId,
            whatsappCloudSettings: whatsappCloudSettings,
            whatsappSavedConnectionMode: whatsappSavedConnectionMode,
            whatsappCloudAccessToken: whatsappCloudAccessToken,
            whatsappCloudClearAccessToken: whatsappCloudClearAccessToken,
            whatsappCloudSaving: whatsappCloudSaving,
            whatsappCloudMessage: whatsappCloudMessage,
            whatsappCloudConnectivity: whatsappCloudConnectivity,
            whatsappCloudConnectivityError: whatsappCloudConnectivityError,
            whatsappCloudConnectivityTesting: whatsappCloudConnectivityTesting,
            whatsappProfile: whatsappProfile,
            whatsappProfileDraftName: whatsappProfileDraftName,
            whatsappProfileBaselineName: whatsappProfileBaselineName,
            whatsappProfileDraftPhoto: whatsappProfileDraftPhoto,
            whatsappProfilePhotoError: whatsappProfilePhotoError,
            whatsappProfileSaving: whatsappProfileSaving,
            whatsappProfileBaselineSaving: whatsappProfileBaselineSaving,
            whatsappProfileRestoringId: whatsappProfileRestoringId,
            whatsappProfileMessage: whatsappProfileMessage,
            whatsappProfileError: whatsappProfileError,
            whatsappPrivacySettings: whatsappPrivacySettings,
            whatsappPrivacySaving: whatsappPrivacySaving,
            whatsappPrivacyMessage: whatsappPrivacyMessage,
            whatsappPrivacyError: whatsappPrivacyError,
            whatsappNotificationPreviews: whatsappNotificationPreviews,
            emailSettings: emailSettings,
            emailNotificationDraft: emailNotificationDraft,
            emailSmtpDraft: emailSmtpDraft,
            emailPassword: emailPassword,
            emailClearPassword: emailClearPassword,
            emailLogs: emailLogs,
            emailSettingsSaving: emailSettingsSaving,
            emailWorking: emailWorking,
            emailConnectionState: emailConnectionState,
            emailMessage: emailMessage,
            emailError: emailError,
            emailNotificationPreviews: emailNotificationPreviews,
            whatsappWorking: whatsappWorking,
            whatsappError: whatsappError,
            forgotEmail: forgotEmail,
            forgotMessage: forgotMessage,
            forgotError: forgotError,
            resetPasswordValue: resetPasswordValue,
            resetPasswordConfirm: resetPasswordConfirm,
            resetMessage: resetMessage,
            resetError: resetError,
            settingsOpen: settingsOpen,
            settingsTab: settingsTab,
            workspaceMenuOpen: workspaceMenuOpen,
            mobileWorkspaceSelectorOpen: mobileWorkspaceSelectorOpen,
            workspaceDialogOpen: workspaceDialogOpen,
            workspaceDialogAction: workspaceDialogAction,
            language: language,
            whatsappCountries: whatsappCountries,
            darkMode: darkMode,
            alertSounds: alertSounds,
            alertSoundDraftPreferences: alertSoundDraftPreferences,
            alertAudioUploadDataUrl: alertAudioUploadDataUrl,
            alertAudioUploadName: alertAudioUploadName,
            alertAudioUploadEnabled: alertAudioUploadEnabled,
            alertSoundSaving: alertSoundSaving,
            alertAudioUploading: alertAudioUploading,
            alertSoundError: alertSoundError,
            alertSoundMessage: alertSoundMessage,
            alertSoundPreviewStatus: alertSoundPreviewStatus,
            currentPassword: currentPassword,
            newPassword: newPassword,
            newPasswordConfirm: newPasswordConfirm,
            accountMessage: accountMessage,
            accountError: accountError,
            accountSaving: accountSaving,
            profileName: profileName,
            profileEmail: profileEmail,
            profileAvatar: profileAvatar,
            profileWhatsappCountry: profileWhatsappCountry,
            profileWhatsappNumber: profileWhatsappNumber,
            profileEmailNotifications: profileEmailNotifications,
            profileWhatsappNotifications: profileWhatsappNotifications,
            notificationCurrentPassword: notificationCurrentPassword,
            notificationMessage: notificationMessage,
            notificationError: notificationError,
            workspaceAlertPreferences: workspaceAlertPreferences,
            workspaceAlertPreferencesSaving: workspaceAlertPreferencesSaving,
            workspaceAlertPreferencesMessage: workspaceAlertPreferencesMessage,
            workspaceAlertPreferencesError: workspaceAlertPreferencesError,
            avatarError: avatarError,
            activeMobileTab: activeMobileTab,
            t: t,
            workspaceRoleLabel: workspaceRoleLabel,
            dateLocale: dateLocale,
            reportDate: reportDate,
            deviceDisplayName: deviceDisplayName,
            filteredDevices: filteredDevices,
            onlineCount: onlineCount,
            warningCount: warningCount,
            offlineCount: offlineCount,
            latestReadings: latestReadings,
            unreadNotificationCount: unreadNotificationCount,
            loadDevices: loadDevices,
            toggleNotificationPanel: toggleNotificationPanel,
            deleteAllNotifications: deleteAllNotifications,
            openDeviceNotification: openDeviceNotification,
            notificationMessageInEnglish: notificationMessageInEnglish,
            loadAdminUsers: loadAdminUsers,
            openUserManagement: openUserManagement,
            assignAccountDevice: assignAccountDevice,
            createWorkspace: createWorkspace,
            openWorkspaceManager: openWorkspaceManager,
            updateWorkspace: updateWorkspace,
            removeActiveWorkspace: removeActiveWorkspace,
            selectWorkspaceIcon: selectWorkspaceIcon,
            joinWorkspaceByCode: joinWorkspaceByCode,
            shareWorkspaceCode: shareWorkspaceCode,
            toggleRegistrationSetting: toggleRegistrationSetting,
            loadWhatsAppLogs: loadWhatsAppLogs,
            refreshWhatsAppNotifications: refreshWhatsAppNotifications,
            selectFavoriteWhatsAppMedia: selectFavoriteWhatsAppMedia,
            addFavoriteWhatsAppMedia: addFavoriteWhatsAppMedia,
            removeFavoriteWhatsAppMedia: removeFavoriteWhatsAppMedia,
            setWhatsAppAlertMediaType: setWhatsAppAlertMediaType,
            canSaveWhatsAppNotificationSettings: canSaveWhatsAppNotificationSettings,
            loadWhatsAppProfile: loadWhatsAppProfile,
            initializeWhatsAppProfileBaseline: initializeWhatsAppProfileBaseline,
            saveWhatsAppPrivacySettings: saveWhatsAppPrivacySettings,
            saveWhatsAppProfile: saveWhatsAppProfile,
            restoreWhatsAppProfileSnapshot: restoreWhatsAppProfileSnapshot,
            selectWhatsAppProfilePhoto: selectWhatsAppProfilePhoto,
            saveWhatsAppSettings: saveWhatsAppSettings,
            saveWhatsAppCloudSettings: saveWhatsAppCloudSettings,
            loadWhatsAppConfiguration: loadWhatsAppConfiguration,
            clearWhatsAppConnectivityTest: clearWhatsAppConnectivityTest,
            testWhatsAppCloudConnection: testWhatsAppCloudConnection,
            clearWhatsAppLogs: clearWhatsAppLogs,
            connectWhatsApp: connectWhatsApp,
            disconnectWhatsApp: disconnectWhatsApp,
            applyDeviceSimulation: applyDeviceSimulation,
            loadEmailSettings: loadEmailSettings,
            saveEmailSettings: saveEmailSettings,
            saveEmailNotificationDraft: saveEmailNotificationDraft,
            loadEmailLogs: loadEmailLogs,
            clearEmailLogs: clearEmailLogs,
            testEmailConnection: testEmailConnection,
            changeWorkspace: changeWorkspace,
            registerAccount: registerAccount,
            toggleAlertSoundPreview: toggleAlertSoundPreview,
            selectAlertSoundFile: selectAlertSoundFile,
            uploadAlertSound: uploadAlertSound,
            saveAlertSoundPreferences: saveAlertSoundPreferences,
            login: login,
            requestPasswordReset: requestPasswordReset,
            submitPasswordReset: submitPasswordReset,
            formatWhatsappNumberInput: formatWhatsappNumberInput,
            reformatWhatsappNumberForCountry: reformatWhatsappNumberForCountry,
            openSettings: openSettings,
            updateProfile: updateProfile,
            updateNotificationPreferences: updateNotificationPreferences,
            toggleWorkspaceAlertMode: toggleWorkspaceAlertMode,
            toggleDeviceAlertChannel: toggleDeviceAlertChannel,
            updatePassword: updatePassword,
            selectAvatar: selectAvatar,
            toggleDarkMode: toggleDarkMode,
            setLanguage: setLanguage,
            inviteUser: inviteUser,
            toggleMemberActions: toggleMemberActions,
            editMemberRole: editMemberRole,
            cancelMemberRoleEdit: cancelMemberRoleEdit,
            updateMemberRole: updateMemberRole,
            removeMember: removeMember,
            requestUserDeletion: requestUserDeletion,
            cancelUserDeletion: cancelUserDeletion,
            deleteUserPermanently: deleteUserPermanently,
            requireUserPasswordReset: requireUserPasswordReset,
            editAdminUser: editAdminUser,
            cancelAdminUserEdit: cancelAdminUserEdit,
            saveAdminUserEdit: saveAdminUserEdit,
            logout: logout,
            formatTime: formatTime,
            formatRefreshTime: formatRefreshTime,
            editDeviceAlias: editDeviceAlias,
            cancelDeviceAliasEdit: cancelDeviceAliasEdit,
            saveDeviceAlias: saveDeviceAlias,
            exportList: exportList,
            readingIcon: readingIcon,
            latestSensorReadings: latestSensorReadings,
            isDeviceExpanded: isDeviceExpanded,
            toggleDevice: toggleDevice,
            deviceStatusIcon: deviceStatusIcon,
            deviceStatusLabel: deviceStatusLabel,
            navigateMobileSection: navigateMobileSection,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
