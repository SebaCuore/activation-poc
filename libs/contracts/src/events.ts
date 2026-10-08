import { EventEnvelope } from './envelope';

export type SimulateFailure = 'none' | 'billing' | 'provisioning';

// --- Pedido de activación ---
export type ActivationRequested = EventEnvelope<'ActivationRequested', {
  planId: string;
  channel: string;
  simulateFailure: SimulateFailure;
}>;

// --- Resultados de billing ---
export type BillingAccountCreated = EventEnvelope<'BillingAccountCreated', {
  billingAccountId: string;
}>;
export type BillingFailed = EventEnvelope<'BillingFailed', {
  reason: string;
}>;
export type BillingAccountCancelled = EventEnvelope<'BillingAccountCancelled', {
  billingAccountId: string;
}>;

// --- Resultados de provisioning ---
export type ProvisioningCompleted = EventEnvelope<'ProvisioningCompleted', {
  provisioningOrderId: string;
}>;
export type ProvisioningFailed = EventEnvelope<'ProvisioningFailed', {
  reason: string;
}>;

// --- Resultado final de la activación ---
export type ActivationCompleted = EventEnvelope<'ActivationCompleted', {
  planId: string;
}>;
export type ActivationFailed = EventEnvelope<'ActivationFailed', {
  reason: string;
  failedStep: 'billing' | 'provisioning';
}>;

// --- Agrupaciones: qué eventos pueden llegar por cada topic ---
export type BillingEvent = BillingAccountCreated | BillingFailed | BillingAccountCancelled;
export type ProvisioningEvent = ProvisioningCompleted | ProvisioningFailed;
export type ActivationOutcomeEvent = ActivationCompleted | ActivationFailed;

export type AnyEvent =
  | ActivationRequested
  | BillingEvent
  | ProvisioningEvent
  | ActivationOutcomeEvent;