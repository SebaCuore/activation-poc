export interface EventEnvelope<TType extends string, TPayload> {
  eventId: string;
  eventType: TType;
  version: number;
  occurredAt: string;
  correlationId: string;
  customerId: string;
  source: string;
  payload: TPayload;
}