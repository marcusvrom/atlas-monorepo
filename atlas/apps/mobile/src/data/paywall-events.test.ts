import {it,expect} from 'vitest';
import {PaywallEvent} from '@atlas/contracts';
import {readPaywallEvents,recordPaywallEvent} from './paywall-events';
it('registra somente feature e plano, rejeitando dados extras',()=>{expect(PaywallEvent.safeParse({feature:'interactiveAnatomy',plan:'free',weightKg:70}).success).toBe(false);recordPaywallEvent({feature:'interactiveAnatomy',plan:'free'});expect(Object.keys(readPaywallEvents().at(-1)!)).toEqual(['feature','plan']);});
