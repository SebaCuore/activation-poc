export const TOPICS = {
  ACTIVATION_REQUESTED: 'activation.requested',
  BILLING_EVENTS: 'billing.events',
  PROVISIONING_EVENTS: 'provisioning.events',
  ACTIVATION_EVENTS: 'activation.events',
} as const;

export type TopicName = (typeof TOPICS)[keyof typeof TOPICS];

export function dlqOf(topic: TopicName): string {
  return `${topic}.dlq`;
}