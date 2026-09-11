import {
  type UpdateProfileInput,
  type CurrentGoal,
  type Entitlement,
  type Feature,
  type ProfilePhoto,
  type UserProfile,
} from '@atlas/contracts';

export interface IdentityPort {
  getMe(): Promise<UserProfile>;
  updateProfile(input: UpdateProfileInput): Promise<UserProfile>;
  updateGoal(goal: CurrentGoal): Promise<UserProfile>;
  /** `null` remove a foto e devolve o perfil às iniciais. */
  updateProfilePhoto(photoUri: ProfilePhoto): Promise<UserProfile>;
  /** Fonte da verdade do paywall no client. Nunca inferir plano na tela. */
  listEntitlements(): Promise<Entitlement[]>;
  hasEntitlement(feature: Feature): Promise<boolean>;
}
