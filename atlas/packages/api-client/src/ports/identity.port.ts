import {
  type UpdateProfileInput,
  type AvatarConfig,
  type CurrentGoal,
  type Entitlement,
  type Feature,
  type UserProfile,
} from '@atlas/contracts';

export interface IdentityPort {
  getMe(): Promise<UserProfile>;
  updateProfile(input: UpdateProfileInput): Promise<UserProfile>;
  updateGoal(goal: CurrentGoal): Promise<UserProfile>;
  updateAvatar(avatar: AvatarConfig): Promise<UserProfile>;
  /** Fonte da verdade do paywall no client. Nunca inferir plano na tela. */
  listEntitlements(): Promise<Entitlement[]>;
  hasEntitlement(feature: Feature): Promise<boolean>;
}
