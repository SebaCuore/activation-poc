import { SimulateFailure } from '@poc/contracts';

export type ActivationStatus = 'PENDING' | 'IN_PROGRESS' | 'ACTIVE' | 'FAILED';

export interface Activation {
  activationId: string;
  customerId: string;
  planId: string;
  simulateFailure: SimulateFailure;
  status: ActivationStatus;
  createdAt: string;
}

// Lo que llega en el body del POST (el DTO de entrada)
export interface CreateActivationDto {
  customerId: string;
  planId: string;
  simulateFailure?: SimulateFailure;
}