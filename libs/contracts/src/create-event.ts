import { randomUUID } from 'node:crypto';
import { AnyEvent } from './events';

export interface EventMeta {
  correlationId: string;
  customerId: string;
  source: string;
}

export function createEvent<E extends AnyEvent>(
  eventType: E['eventType'],
  meta: EventMeta,
  payload: E['payload'],
): E {
  return {
    eventId: randomUUID(),
    eventType,
    version: 1,
    occurredAt: new Date().toISOString(),
    ...meta,
    payload,
  } as E;
}