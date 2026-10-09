import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import MessageTemplateEditor from './components/MessageTemplateEditor.vue';
import { Activity, AlertTriangle, ArrowDownToLine, Bell, Building2, Check, ChevronDown, CircleAlert, CircleCheck, CircleMinus, Clock3, Copy, Cpu, Flame, ImagePlus, LayoutDashboard, LockKeyhole, List, LoaderCircle, LogOut, Mail, MapPin, MessageCircle, Moon, Pencil, Plus, RefreshCw, Search, Trash2, Settings, Share2, ShieldCheck, Signal, Sun, Thermometer, UsersRound, Waves, X } from 'lucide-vue-next';
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
const registerWorkspaceName = ref('');
const registerMessage = ref('');
const registerError = ref('');
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
const registrationEnabled = ref(false);
const isWhatsAppDashboardAdmin = computed(() => Boolean(user.value?.isBootstrapAdmin));
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
    offlineMessage: '{{laboratorio}}: {{aparelho}} está offline. Localização: {{localizacao}}.'
});
const whatsappSettingsSaving = ref(false);
const whatsappSettingsMessage = ref('');
const whatsappPreviewMessage = computed(() => whatsappSettings.value.warningMessage.replace(/\{\{([^{}]+)\}\}/g, (_placeholder, key) => ({
    laboratorio: whatsappSettings.value.senderName,
    aparelho: 'Sensor de demonstração',
    status: 'em atenção',
    localizacao: 'Laboratório Central',
    identificador: 'sensor-01'
}[key] ?? '')));
const emailSettings = ref({
    smtpHost: '', smtpPort: 587, smtpSecure: false, smtpUser: '', senderName: 'LAB/MONITOR', senderEmail: '',
    onlineMessage: '{{laboratorio}}: {{aparelho}} voltou ao normal. Localização: {{localizacao}}.',
    warningMessage: '{{laboratorio}}: {{aparelho}} está em atenção. Localização: {{localizacao}}.',
    offlineMessage: '{{laboratorio}}: {{aparelho}} está offline. Localização: {{localizacao}}.', passwordConfigured: false
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
const emailPreviewMessage = computed(() => emailSettings.value.warningMessage.replace(/\{\{([^{}]+)\}\}/g, (_placeholder, key) => ({
    laboratorio: emailSettings.value.senderName,
    aparelho: 'Sensor de demonstração',
    status: 'em atenção',
    localizacao: 'Laboratório Central',
    identificador: 'sensor-01'
}[key] ?? '')));
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
    'WhatsApp API': 'WhatsApp API',
    'E-mail API': 'Email API',
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
    'Use {{laboratorio}}, {{aparelho}}, {{status}}, {{localizacao}} e {{identificador}} como campos dinâmicos.': 'Use {{laboratorio}}, {{aparelho}}, {{status}}, {{localizacao}} and {{identificador}} as dynamic fields.',
    'Estas mensagens são usadas pela conexão via QR. O nome não altera o perfil da conta WhatsApp.': 'These messages are used by the QR connection. The name does not change the WhatsApp account profile.',
    'Apagar log': 'Clear log',
    'Tem certeza que deseja apagar todo o log do WhatsApp?': 'Are you sure you want to clear the entire WhatsApp log?',
    'Log': 'Log',
    'Conexão': 'Connection',
    'Últimos 100 eventos em memória; o histórico é limpo quando a API reinicia.': 'Latest 100 in-memory events; history clears when the API restarts.',
    'Nenhum evento registrado.': 'No events recorded.',
    'O log não armazena o conteúdo das mensagens nem números completos.': 'The log does not store message content or full phone numbers.',
    'Conexão WhatsApp Web': 'WhatsApp Web connection',
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
    'usuario@empresa.com': 'user@company.com'
};
function t(text) {
    return language.value === 'en' ? englishText[text] ?? text : text;
}
function workspaceRoleLabel(role) {
    const labels = { owner: 'Proprietário', admin: 'Administrador', member: 'Membro' };
    return t(labels[role] ?? role);
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
        }
    }
    catch (error) {
        pageError.value = error instanceof Error ? error.message : 'Nao foi possivel carregar os ambientes.';
    }
}
async function loadWorkspaceMembers() {
    if (!user.value || !activeWorkspaceId.value || !isWhatsAppDashboardAdmin.value) {
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
            knownDeviceStatuses = undefined;
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
        whatsappSettingsMessage.value = 'Configuração salva.';
    }
    catch (error) {
        whatsappError.value = error instanceof Error ? error.message : 'Não foi possível salvar as configurações do WhatsApp.';
    }
    finally {
        whatsappSettingsSaving.value = false;
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
        const { passwordConfigured: _passwordConfigured, ...settings } = emailSettings.value;
        const result = await api('/api/admin/email/settings', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ ...settings, smtpPassword: emailPassword.value, clearSmtpPassword: emailClearPassword.value })
        });
        emailSettings.value = result.settings;
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
                workspaceName: registerWorkspaceName.value.trim() || undefined
            })
        });
        registerMessage.value = result.message;
        registerName.value = '';
        registerEmail.value = '';
        registerPassword.value = '';
        registerWorkspaceName.value = '';
        loginMode.value = 'login';
    }
    catch (error) {
        registerError.value = error instanceof Error ? error.message : 'Nao foi possivel criar a conta.';
    }
    finally {
        submitting.value = false;
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
        await loadDevices();
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
async function updateMemberRole(memberId, newRole) {
    if (!activeWorkspaceId.value)
        return;
    try {
        await api('/api/workspaces/' + activeWorkspaceId.value + '/members', {
            method: 'PATCH',
            headers: { 'X-CSRF-Token': csrfToken.value },
            body: JSON.stringify({ userId: memberId, role: newRole })
        });
        await loadWorkspaceMembers();
    }
    catch (error) {
        pageError.value = error instanceof Error ? error.message : 'Nao foi possivel atualizar o papel do usuário.';
    }
}
async function removeMember(memberId) {
    if (!activeWorkspaceId.value)
        return;
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
        void loadWhatsAppStatus();
        void loadWhatsAppLogs();
        if (subtab === 'configuration')
            void loadWhatsAppSettings();
        else
            whatsappRefreshTimer = setInterval(() => {
                if (subtab === 'connection')
                    void loadWhatsAppStatus();
                else
                    void loadWhatsAppLogs();
            }, 2000);
    }
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
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "registerWorkspaceName",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "registerWorkspaceName",
            value: (__VLS_ctx.registerWorkspaceName),
            type: "text",
            maxlength: "80",
            placeholder: "Laboratório Central",
        });
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
    (__VLS_ctx.activeWorkspace?.name || __VLS_ctx.t('Laboratorio Central'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    (__VLS_ctx.t('Plano operacional'));
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
    if (__VLS_ctx.isWhatsAppDashboardAdmin) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.managementTab = 'users';
                } },
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
    if (__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin) {
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
                    if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
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
                    if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
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
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.userManagementTab = 'registration';
                } },
            ...{ class: "settings-tab" },
            ...{ class: ({ active: __VLS_ctx.userManagementTab === 'registration' }) },
            type: "button",
            role: "tab",
            'aria-selected': (__VLS_ctx.userManagementTab === 'registration'),
        });
        const __VLS_84 = {}.ShieldCheck;
        /** @type {[typeof __VLS_components.ShieldCheck, ]} */ ;
        // @ts-ignore
        const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
            size: (15),
        }));
        const __VLS_86 = __VLS_85({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_85));
        (__VLS_ctx.t('Cadastro público'));
        if (__VLS_ctx.userManagementTab === 'registration') {
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
            const __VLS_88 = {}.ShieldCheck;
            /** @type {[typeof __VLS_components.ShieldCheck, ]} */ ;
            // @ts-ignore
            const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
                size: (18),
            }));
            const __VLS_90 = __VLS_89({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_89));
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
        else {
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
                        const __VLS_92 = {}.LockKeyhole;
                        /** @type {[typeof __VLS_components.LockKeyhole, ]} */ ;
                        // @ts-ignore
                        const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
                            size: (14),
                        }));
                        const __VLS_94 = __VLS_93({
                            size: (14),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_93));
                        (__VLS_ctx.t('Administrador da plataforma'));
                    }
                    else {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                            ...{ onChange: (...[$event]) => {
                                    if (!!(__VLS_ctx.loading))
                                        return;
                                    if (!!(!__VLS_ctx.user))
                                        return;
                                    if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                        return;
                                    if (!!(__VLS_ctx.userManagementTab === 'registration'))
                                        return;
                                    if (!(__VLS_ctx.workspaceMembers.length))
                                        return;
                                    if (!!(member.isPlatformAdmin))
                                        return;
                                    __VLS_ctx.updateMemberRole(member.id, $event.target.value);
                                } },
                            value: (member.role),
                            ...{ class: "settings-input select-input small" },
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
                            disabled: (member.email === __VLS_ctx.user?.email),
                        });
                        (__VLS_ctx.t('Proprietário'));
                    }
                    if (member.email !== __VLS_ctx.user?.email) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (...[$event]) => {
                                    if (!!(__VLS_ctx.loading))
                                        return;
                                    if (!!(!__VLS_ctx.user))
                                        return;
                                    if (!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
                                        return;
                                    if (!!(__VLS_ctx.userManagementTab === 'registration'))
                                        return;
                                    if (!(__VLS_ctx.workspaceMembers.length))
                                        return;
                                    if (!(member.email !== __VLS_ctx.user?.email))
                                        return;
                                    __VLS_ctx.removeMember(member.id);
                                } },
                            ...{ class: "text-button" },
                            type: "button",
                        });
                        (__VLS_ctx.t('Remover'));
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
        (__VLS_ctx.t(__VLS_ctx.whatsappTab === 'log' ? 'Log de eventos' : __VLS_ctx.whatsappTab === 'configuration' ? 'Configuração' : 'Conexão WhatsApp Web'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    if (!(__VLS_ctx.managementTab === 'whatsapp' && __VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.whatsappTab === 'log' ? __VLS_ctx.loadWhatsAppLogs() : __VLS_ctx.loadWhatsAppStatus();
                } },
            ...{ class: "secondary-button" },
            type: "button",
            disabled: (__VLS_ctx.whatsappWorking),
            'aria-label': (__VLS_ctx.t('Atualizar')),
            title: (__VLS_ctx.t('Atualizar')),
        });
        const __VLS_96 = {}.RefreshCw;
        /** @type {[typeof __VLS_components.RefreshCw, ]} */ ;
        // @ts-ignore
        const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
            size: (16),
        }));
        const __VLS_98 = __VLS_97({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_97));
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
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
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
        const __VLS_100 = {}.List;
        /** @type {[typeof __VLS_components.List, ]} */ ;
        // @ts-ignore
        const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
            size: (15),
        }));
        const __VLS_102 = __VLS_101({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_101));
        (__VLS_ctx.t('Log'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
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
        const __VLS_104 = {}.Settings;
        /** @type {[typeof __VLS_components.Settings, ]} */ ;
        // @ts-ignore
        const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
            size: (15),
        }));
        const __VLS_106 = __VLS_105({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_105));
        (__VLS_ctx.t('Configuração'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
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
        const __VLS_108 = {}.MessageCircle;
        /** @type {[typeof __VLS_components.MessageCircle, ]} */ ;
        // @ts-ignore
        const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
            size: (15),
        }));
        const __VLS_110 = __VLS_109({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_109));
        (__VLS_ctx.t('Conexão'));
        if (__VLS_ctx.whatsappError) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "notice-error" },
                role: "alert",
            });
            const __VLS_112 = {}.AlertTriangle;
            /** @type {[typeof __VLS_components.AlertTriangle, ]} */ ;
            // @ts-ignore
            const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
                size: (17),
            }));
            const __VLS_114 = __VLS_113({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_113));
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
                const __VLS_116 = {}.Trash2;
                /** @type {[typeof __VLS_components.Trash2, ]} */ ;
                // @ts-ignore
                const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
                    size: (14),
                }));
                const __VLS_118 = __VLS_117({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_117));
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
                        const __VLS_120 = {}.CircleCheck;
                        /** @type {[typeof __VLS_components.CircleCheck, ]} */ ;
                        // @ts-ignore
                        const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
                            size: (16),
                        }));
                        const __VLS_122 = __VLS_121({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_121));
                    }
                    else if (entry.level === 'error') {
                        const __VLS_124 = {}.CircleAlert;
                        /** @type {[typeof __VLS_components.CircleAlert, ]} */ ;
                        // @ts-ignore
                        const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
                            size: (16),
                        }));
                        const __VLS_126 = __VLS_125({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_125));
                    }
                    else {
                        const __VLS_128 = {}.Activity;
                        /** @type {[typeof __VLS_components.Activity, ]} */ ;
                        // @ts-ignore
                        const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
                            size: (16),
                        }));
                        const __VLS_130 = __VLS_129({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_129));
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
                const __VLS_132 = {}.List;
                /** @type {[typeof __VLS_components.List, ]} */ ;
                // @ts-ignore
                const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
                    size: (20),
                }));
                const __VLS_134 = __VLS_133({
                    size: (20),
                }, ...__VLS_functionalComponentArgsRest(__VLS_133));
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
            const __VLS_136 = __VLS_asFunctionalComponent(MessageTemplateEditor, new MessageTemplateEditor({
                id: "whatsappOnlineMessage",
                modelValue: (__VLS_ctx.whatsappSettings.onlineMessage),
                label: (__VLS_ctx.t('Mensagem ao normalizar')),
                maxlength: (500),
            }));
            const __VLS_137 = __VLS_136({
                id: "whatsappOnlineMessage",
                modelValue: (__VLS_ctx.whatsappSettings.onlineMessage),
                label: (__VLS_ctx.t('Mensagem ao normalizar')),
                maxlength: (500),
            }, ...__VLS_functionalComponentArgsRest(__VLS_136));
            /** @type {[typeof MessageTemplateEditor, ]} */ ;
            // @ts-ignore
            const __VLS_139 = __VLS_asFunctionalComponent(MessageTemplateEditor, new MessageTemplateEditor({
                id: "whatsappWarningMessage",
                modelValue: (__VLS_ctx.whatsappSettings.warningMessage),
                label: (__VLS_ctx.t('Mensagem em atenção')),
                maxlength: (500),
            }));
            const __VLS_140 = __VLS_139({
                id: "whatsappWarningMessage",
                modelValue: (__VLS_ctx.whatsappSettings.warningMessage),
                label: (__VLS_ctx.t('Mensagem em atenção')),
                maxlength: (500),
            }, ...__VLS_functionalComponentArgsRest(__VLS_139));
            /** @type {[typeof MessageTemplateEditor, ]} */ ;
            // @ts-ignore
            const __VLS_142 = __VLS_asFunctionalComponent(MessageTemplateEditor, new MessageTemplateEditor({
                id: "whatsappOfflineMessage",
                modelValue: (__VLS_ctx.whatsappSettings.offlineMessage),
                label: (__VLS_ctx.t('Mensagem offline')),
                maxlength: (500),
            }));
            const __VLS_143 = __VLS_142({
                id: "whatsappOfflineMessage",
                modelValue: (__VLS_ctx.whatsappSettings.offlineMessage),
                label: (__VLS_ctx.t('Mensagem offline')),
                maxlength: (500),
            }, ...__VLS_functionalComponentArgsRest(__VLS_142));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "settings-help" },
            });
            (__VLS_ctx.t('Use &#123;&#123;laboratorio&#125;&#125;, &#123;&#123;aparelho&#125;&#125;, &#123;&#123;status&#125;&#125;, &#123;&#123;localizacao&#125;&#125; e &#123;&#123;identificador&#125;&#125; como campos dinâmicos.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
                ...{ class: "whatsapp-message-preview" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.t('Prévia da mensagem em atenção'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.whatsappPreviewMessage);
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
                disabled: (__VLS_ctx.whatsappSettingsSaving),
            });
            if (__VLS_ctx.whatsappSettingsSaving) {
                const __VLS_145 = {}.LoaderCircle;
                /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                // @ts-ignore
                const __VLS_146 = __VLS_asFunctionalComponent(__VLS_145, new __VLS_145({
                    ...{ class: "spin" },
                    size: (16),
                }));
                const __VLS_147 = __VLS_146({
                    ...{ class: "spin" },
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_146));
            }
            (__VLS_ctx.whatsappSettingsSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Salvar configuração'));
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
                    disabled: (__VLS_ctx.whatsappWorking),
                });
                if (__VLS_ctx.whatsappWorking) {
                    const __VLS_149 = {}.LoaderCircle;
                    /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                    // @ts-ignore
                    const __VLS_150 = __VLS_asFunctionalComponent(__VLS_149, new __VLS_149({
                        ...{ class: "spin" },
                        size: (16),
                    }));
                    const __VLS_151 = __VLS_150({
                        ...{ class: "spin" },
                        size: (16),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_150));
                }
                else {
                    const __VLS_153 = {}.MessageCircle;
                    /** @type {[typeof __VLS_components.MessageCircle, ]} */ ;
                    // @ts-ignore
                    const __VLS_154 = __VLS_asFunctionalComponent(__VLS_153, new __VLS_153({
                        size: (16),
                    }));
                    const __VLS_155 = __VLS_154({
                        size: (16),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_154));
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
                    const __VLS_157 = {}.LoaderCircle;
                    /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                    // @ts-ignore
                    const __VLS_158 = __VLS_asFunctionalComponent(__VLS_157, new __VLS_157({
                        ...{ class: "spin" },
                        size: (16),
                    }));
                    const __VLS_159 = __VLS_158({
                        ...{ class: "spin" },
                        size: (16),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_158));
                }
                else {
                    const __VLS_161 = {}.X;
                    /** @type {[typeof __VLS_components.X, ]} */ ;
                    // @ts-ignore
                    const __VLS_162 = __VLS_asFunctionalComponent(__VLS_161, new __VLS_161({
                        size: (16),
                    }));
                    const __VLS_163 = __VLS_162({
                        size: (16),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_162));
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
                    const __VLS_165 = {}.LoaderCircle;
                    /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                    // @ts-ignore
                    const __VLS_166 = __VLS_asFunctionalComponent(__VLS_165, new __VLS_165({
                        ...{ class: "spin" },
                        size: (24),
                    }));
                    const __VLS_167 = __VLS_166({
                        ...{ class: "spin" },
                        size: (24),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_166));
                }
            }
            else if (__VLS_ctx.whatsappStatus.state === 'connecting') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "whatsapp-qr-placeholder" },
                });
                const __VLS_169 = {}.LoaderCircle;
                /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                // @ts-ignore
                const __VLS_170 = __VLS_asFunctionalComponent(__VLS_169, new __VLS_169({
                    ...{ class: "spin" },
                    size: (24),
                }));
                const __VLS_171 = __VLS_170({
                    ...{ class: "spin" },
                    size: (24),
                }, ...__VLS_functionalComponentArgsRest(__VLS_170));
            }
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
        (__VLS_ctx.t(__VLS_ctx.emailTab === 'log' ? 'Log de eventos' : __VLS_ctx.emailTab === 'configuration' ? 'Configuração de e-mail' : 'Conexão SMTP'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
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
        const __VLS_173 = {}.RefreshCw;
        /** @type {[typeof __VLS_components.RefreshCw, ]} */ ;
        // @ts-ignore
        const __VLS_174 = __VLS_asFunctionalComponent(__VLS_173, new __VLS_173({
            size: (16),
        }));
        const __VLS_175 = __VLS_174({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_174));
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
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
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
        const __VLS_177 = {}.List;
        /** @type {[typeof __VLS_components.List, ]} */ ;
        // @ts-ignore
        const __VLS_178 = __VLS_asFunctionalComponent(__VLS_177, new __VLS_177({
            size: (15),
        }));
        const __VLS_179 = __VLS_178({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_178));
        (__VLS_ctx.t('Log'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
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
        const __VLS_181 = {}.Settings;
        /** @type {[typeof __VLS_components.Settings, ]} */ ;
        // @ts-ignore
        const __VLS_182 = __VLS_asFunctionalComponent(__VLS_181, new __VLS_181({
            size: (15),
        }));
        const __VLS_183 = __VLS_182({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_182));
        (__VLS_ctx.t('Configuração'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
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
        const __VLS_185 = {}.Mail;
        /** @type {[typeof __VLS_components.Mail, ]} */ ;
        // @ts-ignore
        const __VLS_186 = __VLS_asFunctionalComponent(__VLS_185, new __VLS_185({
            size: (15),
        }));
        const __VLS_187 = __VLS_186({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_186));
        (__VLS_ctx.t('Conexão'));
        if (__VLS_ctx.emailError) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "notice-error" },
                role: "alert",
            });
            const __VLS_189 = {}.AlertTriangle;
            /** @type {[typeof __VLS_components.AlertTriangle, ]} */ ;
            // @ts-ignore
            const __VLS_190 = __VLS_asFunctionalComponent(__VLS_189, new __VLS_189({
                size: (17),
            }));
            const __VLS_191 = __VLS_190({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_190));
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
                const __VLS_193 = {}.Trash2;
                /** @type {[typeof __VLS_components.Trash2, ]} */ ;
                // @ts-ignore
                const __VLS_194 = __VLS_asFunctionalComponent(__VLS_193, new __VLS_193({
                    size: (14),
                }));
                const __VLS_195 = __VLS_194({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_194));
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
                        const __VLS_197 = {}.CircleCheck;
                        /** @type {[typeof __VLS_components.CircleCheck, ]} */ ;
                        // @ts-ignore
                        const __VLS_198 = __VLS_asFunctionalComponent(__VLS_197, new __VLS_197({
                            size: (16),
                        }));
                        const __VLS_199 = __VLS_198({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_198));
                    }
                    else if (entry.level === 'error') {
                        const __VLS_201 = {}.CircleAlert;
                        /** @type {[typeof __VLS_components.CircleAlert, ]} */ ;
                        // @ts-ignore
                        const __VLS_202 = __VLS_asFunctionalComponent(__VLS_201, new __VLS_201({
                            size: (16),
                        }));
                        const __VLS_203 = __VLS_202({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_202));
                    }
                    else {
                        const __VLS_205 = {}.Activity;
                        /** @type {[typeof __VLS_components.Activity, ]} */ ;
                        // @ts-ignore
                        const __VLS_206 = __VLS_asFunctionalComponent(__VLS_205, new __VLS_205({
                            size: (16),
                        }));
                        const __VLS_207 = __VLS_206({
                            size: (16),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_206));
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
                const __VLS_209 = {}.List;
                /** @type {[typeof __VLS_components.List, ]} */ ;
                // @ts-ignore
                const __VLS_210 = __VLS_asFunctionalComponent(__VLS_209, new __VLS_209({
                    size: (20),
                }));
                const __VLS_211 = __VLS_210({
                    size: (20),
                }, ...__VLS_functionalComponentArgsRest(__VLS_210));
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
                value: (__VLS_ctx.emailSettings.smtpHost),
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
            (__VLS_ctx.emailSettings.smtpPort);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-config-field" },
                for: "emailSmtpUser",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Usuário SMTP'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "emailSmtpUser",
                value: (__VLS_ctx.emailSettings.smtpUser),
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
            (__VLS_ctx.emailSettings.senderEmail);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "whatsapp-config-field" },
                for: "emailSenderName",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('Nome do remetente'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                id: "emailSenderName",
                value: (__VLS_ctx.emailSettings.senderName),
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
            const __VLS_213 = {}.ShieldCheck;
            /** @type {[typeof __VLS_components.ShieldCheck, ]} */ ;
            // @ts-ignore
            const __VLS_214 = __VLS_asFunctionalComponent(__VLS_213, new __VLS_213({
                size: (17),
            }));
            const __VLS_215 = __VLS_214({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_214));
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
            (__VLS_ctx.emailSettings.smtpSecure);
            if (__VLS_ctx.emailSettings.passwordConfigured) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "theme-setting email-secure-toggle" },
                    for: "emailClearPassword",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "theme-setting-icon" },
                });
                const __VLS_217 = {}.LockKeyhole;
                /** @type {[typeof __VLS_components.LockKeyhole, ]} */ ;
                // @ts-ignore
                const __VLS_218 = __VLS_asFunctionalComponent(__VLS_217, new __VLS_217({
                    size: (17),
                }));
                const __VLS_219 = __VLS_218({
                    size: (17),
                }, ...__VLS_functionalComponentArgsRest(__VLS_218));
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
            /** @type {[typeof MessageTemplateEditor, ]} */ ;
            // @ts-ignore
            const __VLS_221 = __VLS_asFunctionalComponent(MessageTemplateEditor, new MessageTemplateEditor({
                id: "emailOnlineMessage",
                modelValue: (__VLS_ctx.emailSettings.onlineMessage),
                label: (__VLS_ctx.t('Mensagem de e-mail ao normalizar')),
                maxlength: (1000),
            }));
            const __VLS_222 = __VLS_221({
                id: "emailOnlineMessage",
                modelValue: (__VLS_ctx.emailSettings.onlineMessage),
                label: (__VLS_ctx.t('Mensagem de e-mail ao normalizar')),
                maxlength: (1000),
            }, ...__VLS_functionalComponentArgsRest(__VLS_221));
            /** @type {[typeof MessageTemplateEditor, ]} */ ;
            // @ts-ignore
            const __VLS_224 = __VLS_asFunctionalComponent(MessageTemplateEditor, new MessageTemplateEditor({
                id: "emailWarningMessage",
                modelValue: (__VLS_ctx.emailSettings.warningMessage),
                label: (__VLS_ctx.t('Mensagem de e-mail em atenção')),
                maxlength: (1000),
            }));
            const __VLS_225 = __VLS_224({
                id: "emailWarningMessage",
                modelValue: (__VLS_ctx.emailSettings.warningMessage),
                label: (__VLS_ctx.t('Mensagem de e-mail em atenção')),
                maxlength: (1000),
            }, ...__VLS_functionalComponentArgsRest(__VLS_224));
            /** @type {[typeof MessageTemplateEditor, ]} */ ;
            // @ts-ignore
            const __VLS_227 = __VLS_asFunctionalComponent(MessageTemplateEditor, new MessageTemplateEditor({
                id: "emailOfflineMessage",
                modelValue: (__VLS_ctx.emailSettings.offlineMessage),
                label: (__VLS_ctx.t('Mensagem de e-mail offline')),
                maxlength: (1000),
            }));
            const __VLS_228 = __VLS_227({
                id: "emailOfflineMessage",
                modelValue: (__VLS_ctx.emailSettings.offlineMessage),
                label: (__VLS_ctx.t('Mensagem de e-mail offline')),
                maxlength: (1000),
            }, ...__VLS_functionalComponentArgsRest(__VLS_227));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "settings-help" },
            });
            (__VLS_ctx.t('Use &#123;&#123;laboratorio&#125;&#125;, &#123;&#123;aparelho&#125;&#125;, &#123;&#123;status&#125;&#125;, &#123;&#123;localizacao&#125;&#125; e &#123;&#123;identificador&#125;&#125; como campos dinâmicos.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
                ...{ class: "whatsapp-message-preview" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.t('Prévia do e-mail em atenção'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.emailPreviewMessage);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "settings-help" },
            });
            (__VLS_ctx.t('As mensagens são enviadas em HTML e texto simples. A senha SMTP é cifrada no servidor.'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.saveEmailSettings) },
                ...{ class: "primary-button settings-save-button" },
                type: "button",
                disabled: (__VLS_ctx.emailSettingsSaving),
            });
            if (__VLS_ctx.emailSettingsSaving) {
                const __VLS_230 = {}.LoaderCircle;
                /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                // @ts-ignore
                const __VLS_231 = __VLS_asFunctionalComponent(__VLS_230, new __VLS_230({
                    ...{ class: "spin" },
                    size: (16),
                }));
                const __VLS_232 = __VLS_231({
                    ...{ class: "spin" },
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_231));
            }
            (__VLS_ctx.emailSettingsSaving ? __VLS_ctx.t('Salvando...') : __VLS_ctx.t('Salvar configuração de e-mail'));
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
                const __VLS_234 = {}.LoaderCircle;
                /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                // @ts-ignore
                const __VLS_235 = __VLS_asFunctionalComponent(__VLS_234, new __VLS_234({
                    ...{ class: "spin" },
                    size: (16),
                }));
                const __VLS_236 = __VLS_235({
                    ...{ class: "spin" },
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_235));
            }
            else {
                const __VLS_238 = {}.ShieldCheck;
                /** @type {[typeof __VLS_components.ShieldCheck, ]} */ ;
                // @ts-ignore
                const __VLS_239 = __VLS_asFunctionalComponent(__VLS_238, new __VLS_238({
                    size: (16),
                }));
                const __VLS_240 = __VLS_239({
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_239));
            }
            (__VLS_ctx.t('Testar conexão SMTP'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "email-connection-mark" },
            });
            const __VLS_242 = {}.Mail;
            /** @type {[typeof __VLS_components.Mail, ]} */ ;
            // @ts-ignore
            const __VLS_243 = __VLS_asFunctionalComponent(__VLS_242, new __VLS_242({
                size: (36),
            }));
            const __VLS_244 = __VLS_243({
                size: (36),
            }, ...__VLS_functionalComponentArgsRest(__VLS_243));
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
        const __VLS_246 = {}.RefreshCw;
        /** @type {[typeof __VLS_components.RefreshCw, ]} */ ;
        // @ts-ignore
        const __VLS_247 = __VLS_asFunctionalComponent(__VLS_246, new __VLS_246({
            size: (16),
        }));
        const __VLS_248 = __VLS_247({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_247));
        (__VLS_ctx.t('Atualizar'));
        if (__VLS_ctx.pageError) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "notice-error" },
                role: "alert",
            });
            const __VLS_250 = {}.AlertTriangle;
            /** @type {[typeof __VLS_components.AlertTriangle, ]} */ ;
            // @ts-ignore
            const __VLS_251 = __VLS_asFunctionalComponent(__VLS_250, new __VLS_250({
                size: (17),
            }));
            const __VLS_252 = __VLS_251({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_251));
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
        const __VLS_254 = {}.Cpu;
        /** @type {[typeof __VLS_components.Cpu, ]} */ ;
        // @ts-ignore
        const __VLS_255 = __VLS_asFunctionalComponent(__VLS_254, new __VLS_254({
            size: (17),
        }));
        const __VLS_256 = __VLS_255({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_255));
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
        const __VLS_258 = {}.Signal;
        /** @type {[typeof __VLS_components.Signal, ]} */ ;
        // @ts-ignore
        const __VLS_259 = __VLS_asFunctionalComponent(__VLS_258, new __VLS_258({
            size: (17),
        }));
        const __VLS_260 = __VLS_259({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_259));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "metric-value" },
        });
        (__VLS_ctx.onlineCount);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('aparelhos'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "metric-foot positive" },
        });
        const __VLS_262 = {}.Check;
        /** @type {[typeof __VLS_components.Check, ]} */ ;
        // @ts-ignore
        const __VLS_263 = __VLS_asFunctionalComponent(__VLS_262, new __VLS_262({
            size: (13),
        }));
        const __VLS_264 = __VLS_263({
            size: (13),
        }, ...__VLS_functionalComponentArgsRest(__VLS_263));
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
        const __VLS_266 = {}.AlertTriangle;
        /** @type {[typeof __VLS_components.AlertTriangle, ]} */ ;
        // @ts-ignore
        const __VLS_267 = __VLS_asFunctionalComponent(__VLS_266, new __VLS_266({
            size: (17),
        }));
        const __VLS_268 = __VLS_267({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_267));
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
        const __VLS_270 = {}.Activity;
        /** @type {[typeof __VLS_components.Activity, ]} */ ;
        // @ts-ignore
        const __VLS_271 = __VLS_asFunctionalComponent(__VLS_270, new __VLS_270({
            size: (17),
        }));
        const __VLS_272 = __VLS_271({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_271));
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
        const __VLS_274 = {}.ArrowDownToLine;
        /** @type {[typeof __VLS_components.ArrowDownToLine, ]} */ ;
        // @ts-ignore
        const __VLS_275 = __VLS_asFunctionalComponent(__VLS_274, new __VLS_274({
            size: (16),
        }));
        const __VLS_276 = __VLS_275({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_275));
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
        const __VLS_278 = {}.Search;
        /** @type {[typeof __VLS_components.Search, ]} */ ;
        // @ts-ignore
        const __VLS_279 = __VLS_asFunctionalComponent(__VLS_278, new __VLS_278({
            size: (16),
        }));
        const __VLS_280 = __VLS_279({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_279));
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
                            if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
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
                const __VLS_282 = {}.Cpu;
                /** @type {[typeof __VLS_components.Cpu, ]} */ ;
                // @ts-ignore
                const __VLS_283 = __VLS_asFunctionalComponent(__VLS_282, new __VLS_282({
                    size: (17),
                }));
                const __VLS_284 = __VLS_283({
                    size: (17),
                }, ...__VLS_functionalComponentArgsRest(__VLS_283));
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
                    const __VLS_286 = ((__VLS_ctx.readingIcon(sensor.key)));
                    // @ts-ignore
                    const __VLS_287 = __VLS_asFunctionalComponent(__VLS_286, new __VLS_286({
                        size: (15),
                    }));
                    const __VLS_288 = __VLS_287({
                        size: (15),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_287));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (sensor.shortName);
                    const __VLS_290 = ((sensor.reading ? __VLS_ctx.deviceStatusIcon(device.status) : __VLS_ctx.CircleMinus));
                    // @ts-ignore
                    const __VLS_291 = __VLS_asFunctionalComponent(__VLS_290, new __VLS_290({
                        size: (15),
                    }));
                    const __VLS_292 = __VLS_291({
                        size: (15),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_291));
                }
                const __VLS_294 = {}.ChevronDown;
                /** @type {[typeof __VLS_components.ChevronDown, ]} */ ;
                // @ts-ignore
                const __VLS_295 = __VLS_asFunctionalComponent(__VLS_294, new __VLS_294({
                    ...{ class: "device-expand-icon" },
                    ...{ class: ({ expanded: __VLS_ctx.isDeviceExpanded(device.id) }) },
                    size: (18),
                }));
                const __VLS_296 = __VLS_295({
                    ...{ class: "device-expand-icon" },
                    ...{ class: ({ expanded: __VLS_ctx.isDeviceExpanded(device.id) }) },
                    size: (18),
                }, ...__VLS_functionalComponentArgsRest(__VLS_295));
                if (__VLS_ctx.isDeviceExpanded(device.id)) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        id: (`device-details-${device.id}`),
                        ...{ class: "device-details" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "device-meta" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    const __VLS_298 = {}.MapPin;
                    /** @type {[typeof __VLS_components.MapPin, ]} */ ;
                    // @ts-ignore
                    const __VLS_299 = __VLS_asFunctionalComponent(__VLS_298, new __VLS_298({
                        size: (14),
                    }));
                    const __VLS_300 = __VLS_299({
                        size: (14),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_299));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (__VLS_ctx.t('Localizacao'));
                    (device.location || __VLS_ctx.t('Nao informado'));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    const __VLS_302 = {}.Cpu;
                    /** @type {[typeof __VLS_components.Cpu, ]} */ ;
                    // @ts-ignore
                    const __VLS_303 = __VLS_asFunctionalComponent(__VLS_302, new __VLS_302({
                        size: (14),
                    }));
                    const __VLS_304 = __VLS_303({
                        size: (14),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_303));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (__VLS_ctx.t('Identificador'));
                    (device.externalId);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    const __VLS_306 = {}.Clock3;
                    /** @type {[typeof __VLS_components.Clock3, ]} */ ;
                    // @ts-ignore
                    const __VLS_307 = __VLS_asFunctionalComponent(__VLS_306, new __VLS_306({
                        size: (14),
                    }));
                    const __VLS_308 = __VLS_307({
                        size: (14),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_307));
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
                        const __VLS_310 = ((__VLS_ctx.readingIcon(sensor.key)));
                        // @ts-ignore
                        const __VLS_311 = __VLS_asFunctionalComponent(__VLS_310, new __VLS_310({
                            size: (15),
                        }));
                        const __VLS_312 = __VLS_311({
                            size: (15),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_311));
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
                        (device.name);
                        const __VLS_314 = {}.Cpu;
                        /** @type {[typeof __VLS_components.Cpu, ]} */ ;
                        // @ts-ignore
                        const __VLS_315 = __VLS_asFunctionalComponent(__VLS_314, new __VLS_314({
                            size: (17),
                        }));
                        const __VLS_316 = __VLS_315({
                            size: (17),
                        }, ...__VLS_functionalComponentArgsRest(__VLS_315));
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
                                    if (!!(__VLS_ctx.managementTab === 'users' && __VLS_ctx.isWhatsAppDashboardAdmin))
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
                            const __VLS_318 = {}.LoaderCircle;
                            /** @type {[typeof __VLS_components.LoaderCircle, ]} */ ;
                            // @ts-ignore
                            const __VLS_319 = __VLS_asFunctionalComponent(__VLS_318, new __VLS_318({
                                ...{ class: "spin" },
                                size: (16),
                            }));
                            const __VLS_320 = __VLS_319({
                                ...{ class: "spin" },
                                size: (16),
                            }, ...__VLS_functionalComponentArgsRest(__VLS_319));
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
            const __VLS_322 = {}.Cpu;
            /** @type {[typeof __VLS_components.Cpu, ]} */ ;
            // @ts-ignore
            const __VLS_323 = __VLS_asFunctionalComponent(__VLS_322, new __VLS_322({
                size: (22),
            }));
            const __VLS_324 = __VLS_323({
                size: (22),
            }, ...__VLS_functionalComponentArgsRest(__VLS_323));
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
    const __VLS_326 = {}.LayoutDashboard;
    /** @type {[typeof __VLS_components.LayoutDashboard, ]} */ ;
    // @ts-ignore
    const __VLS_327 = __VLS_asFunctionalComponent(__VLS_326, new __VLS_326({
        size: (20),
    }));
    const __VLS_328 = __VLS_327({
        size: (20),
    }, ...__VLS_functionalComponentArgsRest(__VLS_327));
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
    const __VLS_330 = {}.Building2;
    /** @type {[typeof __VLS_components.Building2, ]} */ ;
    // @ts-ignore
    const __VLS_331 = __VLS_asFunctionalComponent(__VLS_330, new __VLS_330({
        size: (19),
    }));
    const __VLS_332 = __VLS_331({
        size: (19),
    }, ...__VLS_functionalComponentArgsRest(__VLS_331));
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
    const __VLS_334 = {}.Cpu;
    /** @type {[typeof __VLS_components.Cpu, ]} */ ;
    // @ts-ignore
    const __VLS_335 = __VLS_asFunctionalComponent(__VLS_334, new __VLS_334({
        size: (20),
    }));
    const __VLS_336 = __VLS_335({
        size: (20),
    }, ...__VLS_functionalComponentArgsRest(__VLS_335));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('Aparelhos'));
    if (__VLS_ctx.isWhatsAppDashboardAdmin) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.isWhatsAppDashboardAdmin))
                        return;
                    __VLS_ctx.managementTab = 'users';
                    __VLS_ctx.activeMobileTab = 'users';
                } },
            ...{ class: "mobile-nav-item" },
            ...{ class: ({ active: __VLS_ctx.managementTab === 'users' }) },
            type: "button",
        });
        const __VLS_338 = {}.UsersRound;
        /** @type {[typeof __VLS_components.UsersRound, ]} */ ;
        // @ts-ignore
        const __VLS_339 = __VLS_asFunctionalComponent(__VLS_338, new __VLS_338({
            size: (19),
        }));
        const __VLS_340 = __VLS_339({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_339));
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
        const __VLS_342 = {}.MessageCircle;
        /** @type {[typeof __VLS_components.MessageCircle, ]} */ ;
        // @ts-ignore
        const __VLS_343 = __VLS_asFunctionalComponent(__VLS_342, new __VLS_342({
            size: (19),
        }));
        const __VLS_344 = __VLS_343({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_343));
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
        const __VLS_346 = {}.Mail;
        /** @type {[typeof __VLS_components.Mail, ]} */ ;
        // @ts-ignore
        const __VLS_347 = __VLS_asFunctionalComponent(__VLS_346, new __VLS_346({
            size: (19),
        }));
        const __VLS_348 = __VLS_347({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_347));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('E-mail API'));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.logout) },
        ...{ class: "mobile-nav-item" },
        type: "button",
    });
    const __VLS_350 = {}.LogOut;
    /** @type {[typeof __VLS_components.LogOut, ]} */ ;
    // @ts-ignore
    const __VLS_351 = __VLS_asFunctionalComponent(__VLS_350, new __VLS_350({
        size: (19),
    }));
    const __VLS_352 = __VLS_351({
        size: (19),
    }, ...__VLS_functionalComponentArgsRest(__VLS_351));
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
        const __VLS_354 = {}.X;
        /** @type {[typeof __VLS_components.X, ]} */ ;
        // @ts-ignore
        const __VLS_355 = __VLS_asFunctionalComponent(__VLS_354, new __VLS_354({
            size: (19),
        }));
        const __VLS_356 = __VLS_355({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_355));
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
                const __VLS_358 = {}.Check;
                /** @type {[typeof __VLS_components.Check, ]} */ ;
                // @ts-ignore
                const __VLS_359 = __VLS_asFunctionalComponent(__VLS_358, new __VLS_358({
                    size: (16),
                }));
                const __VLS_360 = __VLS_359({
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_359));
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
        const __VLS_362 = {}.Plus;
        /** @type {[typeof __VLS_components.Plus, ]} */ ;
        // @ts-ignore
        const __VLS_363 = __VLS_asFunctionalComponent(__VLS_362, new __VLS_362({
            size: (15),
        }));
        const __VLS_364 = __VLS_363({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_363));
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
        const __VLS_366 = {}.X;
        /** @type {[typeof __VLS_components.X, ]} */ ;
        // @ts-ignore
        const __VLS_367 = __VLS_asFunctionalComponent(__VLS_366, new __VLS_366({
            size: (19),
        }));
        const __VLS_368 = __VLS_367({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_367));
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
        const __VLS_370 = {}.Plus;
        /** @type {[typeof __VLS_components.Plus, ]} */ ;
        // @ts-ignore
        const __VLS_371 = __VLS_asFunctionalComponent(__VLS_370, new __VLS_370({
            size: (14),
        }));
        const __VLS_372 = __VLS_371({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_371));
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
        const __VLS_374 = {}.Pencil;
        /** @type {[typeof __VLS_components.Pencil, ]} */ ;
        // @ts-ignore
        const __VLS_375 = __VLS_asFunctionalComponent(__VLS_374, new __VLS_374({
            size: (14),
        }));
        const __VLS_376 = __VLS_375({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_375));
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
        const __VLS_378 = {}.ArrowDownToLine;
        /** @type {[typeof __VLS_components.ArrowDownToLine, ]} */ ;
        // @ts-ignore
        const __VLS_379 = __VLS_asFunctionalComponent(__VLS_378, new __VLS_378({
            size: (14),
        }));
        const __VLS_380 = __VLS_379({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_379));
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
        const __VLS_382 = {}.Cpu;
        /** @type {[typeof __VLS_components.Cpu, ]} */ ;
        // @ts-ignore
        const __VLS_383 = __VLS_asFunctionalComponent(__VLS_382, new __VLS_382({
            size: (14),
        }));
        const __VLS_384 = __VLS_383({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_383));
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
        const __VLS_386 = {}.Share2;
        /** @type {[typeof __VLS_components.Share2, ]} */ ;
        // @ts-ignore
        const __VLS_387 = __VLS_asFunctionalComponent(__VLS_386, new __VLS_386({
            size: (14),
        }));
        const __VLS_388 = __VLS_387({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_387));
        (__VLS_ctx.t('Compartilhar'));
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
                const __VLS_390 = {}.ImagePlus;
                /** @type {[typeof __VLS_components.ImagePlus, ]} */ ;
                // @ts-ignore
                const __VLS_391 = __VLS_asFunctionalComponent(__VLS_390, new __VLS_390({
                    size: (15),
                }));
                const __VLS_392 = __VLS_391({
                    size: (15),
                }, ...__VLS_functionalComponentArgsRest(__VLS_391));
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
                    const __VLS_394 = {}.Cpu;
                    /** @type {[typeof __VLS_components.Cpu, ]} */ ;
                    // @ts-ignore
                    const __VLS_395 = __VLS_asFunctionalComponent(__VLS_394, new __VLS_394({
                        size: (17),
                    }));
                    const __VLS_396 = __VLS_395({
                        size: (17),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_395));
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
                const __VLS_398 = {}.Copy;
                /** @type {[typeof __VLS_components.Copy, ]} */ ;
                // @ts-ignore
                const __VLS_399 = __VLS_asFunctionalComponent(__VLS_398, new __VLS_398({
                    size: (16),
                }));
                const __VLS_400 = __VLS_399({
                    size: (16),
                }, ...__VLS_functionalComponentArgsRest(__VLS_399));
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
        const __VLS_402 = {}.X;
        /** @type {[typeof __VLS_components.X, ]} */ ;
        // @ts-ignore
        const __VLS_403 = __VLS_asFunctionalComponent(__VLS_402, new __VLS_402({
            size: (19),
        }));
        const __VLS_404 = __VLS_403({
            size: (19),
        }, ...__VLS_functionalComponentArgsRest(__VLS_403));
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
                const __VLS_406 = {}.Moon;
                /** @type {[typeof __VLS_components.Moon, ]} */ ;
                // @ts-ignore
                const __VLS_407 = __VLS_asFunctionalComponent(__VLS_406, new __VLS_406({
                    size: (18),
                }));
                const __VLS_408 = __VLS_407({
                    size: (18),
                }, ...__VLS_functionalComponentArgsRest(__VLS_407));
            }
            else {
                const __VLS_410 = {}.Sun;
                /** @type {[typeof __VLS_components.Sun, ]} */ ;
                // @ts-ignore
                const __VLS_411 = __VLS_asFunctionalComponent(__VLS_410, new __VLS_410({
                    size: (18),
                }));
                const __VLS_412 = __VLS_411({
                    size: (18),
                }, ...__VLS_functionalComponentArgsRest(__VLS_411));
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
            const __VLS_414 = {}.Mail;
            /** @type {[typeof __VLS_components.Mail, ]} */ ;
            // @ts-ignore
            const __VLS_415 = __VLS_asFunctionalComponent(__VLS_414, new __VLS_414({
                size: (18),
            }));
            const __VLS_416 = __VLS_415({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_415));
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
            const __VLS_418 = {}.MessageCircle;
            /** @type {[typeof __VLS_components.MessageCircle, ]} */ ;
            // @ts-ignore
            const __VLS_419 = __VLS_asFunctionalComponent(__VLS_418, new __VLS_418({
                size: (18),
            }));
            const __VLS_420 = __VLS_419({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_419));
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
/** @type {__VLS_StyleScopedClasses['invite-form']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['member-list']} */ ;
/** @type {__VLS_StyleScopedClasses['member-row']} */ ;
/** @type {__VLS_StyleScopedClasses['protected-member-role']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['small']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
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
/** @type {__VLS_StyleScopedClasses['whatsapp-config-form']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-config-field']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-message-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['spin']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-section']} */ ;
/** @type {__VLS_StyleScopedClasses['whatsapp-manager-copy']} */ ;
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
/** @type {__VLS_StyleScopedClasses['whatsapp-message-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-help']} */ ;
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
/** @type {__VLS_StyleScopedClasses['whatsapp-phone-fields']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-input']} */ ;
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
            MessageTemplateEditor: MessageTemplateEditor,
            Activity: Activity,
            AlertTriangle: AlertTriangle,
            ArrowDownToLine: ArrowDownToLine,
            Bell: Bell,
            Building2: Building2,
            Check: Check,
            ChevronDown: ChevronDown,
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
            registerWorkspaceName: registerWorkspaceName,
            registerMessage: registerMessage,
            registerError: registerError,
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
            registrationEnabled: registrationEnabled,
            isWhatsAppDashboardAdmin: isWhatsAppDashboardAdmin,
            managementTab: managementTab,
            userManagementTab: userManagementTab,
            whatsappTab: whatsappTab,
            emailTab: emailTab,
            whatsappStatus: whatsappStatus,
            whatsappLogs: whatsappLogs,
            whatsappSettings: whatsappSettings,
            whatsappSettingsSaving: whatsappSettingsSaving,
            whatsappSettingsMessage: whatsappSettingsMessage,
            whatsappPreviewMessage: whatsappPreviewMessage,
            emailSettings: emailSettings,
            emailPassword: emailPassword,
            emailClearPassword: emailClearPassword,
            emailLogs: emailLogs,
            emailSettingsSaving: emailSettingsSaving,
            emailWorking: emailWorking,
            emailConnectionState: emailConnectionState,
            emailMessage: emailMessage,
            emailError: emailError,
            emailPreviewMessage: emailPreviewMessage,
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
            avatarError: avatarError,
            activeMobileTab: activeMobileTab,
            t: t,
            workspaceRoleLabel: workspaceRoleLabel,
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
            assignAccountDevice: assignAccountDevice,
            createWorkspace: createWorkspace,
            openWorkspaceManager: openWorkspaceManager,
            updateWorkspace: updateWorkspace,
            removeActiveWorkspace: removeActiveWorkspace,
            selectWorkspaceIcon: selectWorkspaceIcon,
            joinWorkspaceByCode: joinWorkspaceByCode,
            shareWorkspaceCode: shareWorkspaceCode,
            toggleRegistrationSetting: toggleRegistrationSetting,
            loadWhatsAppStatus: loadWhatsAppStatus,
            loadWhatsAppLogs: loadWhatsAppLogs,
            saveWhatsAppSettings: saveWhatsAppSettings,
            clearWhatsAppLogs: clearWhatsAppLogs,
            connectWhatsApp: connectWhatsApp,
            disconnectWhatsApp: disconnectWhatsApp,
            applyDeviceSimulation: applyDeviceSimulation,
            loadEmailSettings: loadEmailSettings,
            saveEmailSettings: saveEmailSettings,
            loadEmailLogs: loadEmailLogs,
            clearEmailLogs: clearEmailLogs,
            testEmailConnection: testEmailConnection,
            changeWorkspace: changeWorkspace,
            registerAccount: registerAccount,
            login: login,
            requestPasswordReset: requestPasswordReset,
            submitPasswordReset: submitPasswordReset,
            formatWhatsappNumberInput: formatWhatsappNumberInput,
            reformatWhatsappNumberForCountry: reformatWhatsappNumberForCountry,
            openSettings: openSettings,
            updateProfile: updateProfile,
            updateNotificationPreferences: updateNotificationPreferences,
            updatePassword: updatePassword,
            selectAvatar: selectAvatar,
            toggleDarkMode: toggleDarkMode,
            setLanguage: setLanguage,
            inviteUser: inviteUser,
            updateMemberRole: updateMemberRole,
            removeMember: removeMember,
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
