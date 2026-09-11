import { PaywallEvent } from '@atlas/contracts';
const events: PaywallEvent[] = [];
export function recordPaywallEvent(value: PaywallEvent) {
  events.push(PaywallEvent.parse(value));
  if (events.length > 20) events.shift();
}
export function readPaywallEvents() {
  return events.map((event) => PaywallEvent.parse(event));
}
