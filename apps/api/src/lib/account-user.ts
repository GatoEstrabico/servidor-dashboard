export type AccountUserProfileInput = {
  id: string;
  email: string;
  displayName: string;
  avatarDataUrl: string | null;
  whatsappNumber: string | null;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  emailVerifiedAt: Date | string | null;
  isPlatformAdmin: boolean;
  isBootstrapAdmin: boolean;
};

export type AccountUserProfile = {
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
};

export function toAccountProfile(user: AccountUserProfileInput): AccountUserProfile {
  const emailVerifiedAt = user.emailVerifiedAt instanceof Date
    ? user.emailVerifiedAt.toISOString()
    : typeof user.emailVerifiedAt === 'string'
      ? user.emailVerifiedAt
      : null;

  const isBootstrapAdmin = Boolean(user.isBootstrapAdmin);

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarDataUrl: user.avatarDataUrl,
    whatsappNumber: user.whatsappNumber,
    emailNotifications: user.emailNotifications,
    whatsappNotifications: user.whatsappNotifications,
    emailVerifiedAt,
    isPlatformAdmin: Boolean(user.isPlatformAdmin || isBootstrapAdmin),
    isBootstrapAdmin
  };
}
