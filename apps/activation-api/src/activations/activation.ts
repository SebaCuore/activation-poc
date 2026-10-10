import { SimulateFailure } from '@poc/contracts';

export type ActivationStatus = 'PENDING' | 'IN_PROGRESS' | 'ACTIVE' | 'FAILED';

export type Step = 'billing' | 'provisioning';

export interface StepResult {
  status: 'OK' | 'FAILED';
  at: string;
}

export interface HistoryEntry {
  eventType: string;
  at: string;
}

export interface CreateActivationDto {
  customerId: string;
  planId: string;
  simulateFailure?: SimulateFailure;
}