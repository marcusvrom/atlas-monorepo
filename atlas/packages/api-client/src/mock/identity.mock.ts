import { mockEntitlements } from './entitlements.js';
import {
  UserProfile as ProfileSchema,
  UpdateProfileInput as ProfileInputSchema,
  CurrentGoal as GoalSchema,
  AvatarConfig as AvatarSchema,
  Entitlement as EntitlementSchema,
  type UpdateProfileInput,
  type AvatarConfig,
  type CurrentGoal,
  type Entitlement,
  type Feature,
  type UserProfile,
} from '@atlas/contracts';
import type { IdentityPort } from '../ports/identity.port.js';
import { simulate } from './runtime.js';
import type { MockStore } from './store.js';

export class MockIdentityAdapter implements IdentityPort {
  constructor(private readonly store: MockStore) {}

  async updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    return simulate(this.store.config, () => {
      this.store.me = ProfileSchema.parse({ ...this.store.me, ...ProfileInputSchema.parse(input) });
      return ProfileSchema.parse({
        ...this.store.me,
        planKey: this.store.config.plan ?? this.store.me.planKey,
        entitlements: mockEntitlements(this.store),
        roles: this.store.config.role ? [this.store.config.role] : this.store.me.roles,
      });
    });
  }

  private profile(){return ProfileSchema.parse({...this.store.me,planKey:this.store.config.plan??this.store.me.planKey,entitlements:mockEntitlements(this.store),roles:this.store.config.role?[this.store.config.role]:this.store.me.roles});}
  async getMe(): Promise<UserProfile> {
    return simulate(this.store.config, () => this.profile());
  }

  async updateGoal(goal: CurrentGoal): Promise<UserProfile> {
    return simulate(this.store.config, () => {
      this.store.me = { ...this.store.me, goal: GoalSchema.parse(goal) };
      return this.profile();
    });
  }

  async updateAvatar(avatar: AvatarConfig): Promise<UserProfile> {
    return simulate(this.store.config, () => {
      this.store.me = { ...this.store.me, avatar: AvatarSchema.parse(avatar) };
      return this.profile();
    });
  }

  async listEntitlements(): Promise<Entitlement[]> {
    return simulate(this.store.config, () =>
      mockEntitlements(this.store).map((item) => EntitlementSchema.parse(item)),
    );
  }

  async hasEntitlement(feature: Feature): Promise<boolean> {
    return simulate(this.store.config, () => {
      const found = mockEntitlements(this.store).find((e) => e.feature === feature);
      if (!found) return false;
      if (found.limit === null) return true;
      return found.used < found.limit;
    });
  }
}
