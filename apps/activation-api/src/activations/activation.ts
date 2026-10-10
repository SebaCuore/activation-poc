import { SimulateFailure } from '@poc/contracts';

export type ActivationStatus = 'PENDING' | 'IN_PROGRESS' | 'ACTIVE' | 'FAILED';

export interface CreateActivationDto {
  customerId: string;
  planId: string;
  simulateFailure?: SimulateFailure;
}